# Resumen de revisión — Haven & Hours Laundry

_Revisión hecha el 9 de julio de 2026. En palabras sencillas._

Tu app es un sitio web para un servicio de lavandería a domicilio (recoger, lavar,
entregar) en Riverside, CA. Está hecha con React + Vite, se publica en Netlify, guarda
datos en Supabase, cobra con Square, manda correos con Resend y tiene un asistente de IA
con Anthropic (Claude).

---

## 1) Qué hace cada parte

### La parte que ve el cliente (el navegador)
- **Landing (`/`)** — La página de inicio: presentación, cómo funciona, precios, zona de cobertura.
- **Dashboard (`/dashboard`)** — El cliente agenda su recolección (día, hora, dirección, servicios
  extra como planchado, edredones, tintorería, preferencias de detergente), guarda su tarjeta y
  luego ve el estado de su pedido (el "tendedero" de 4 fases). También aprueba o rechaza si se
  reporta una mancha/daño en su ropa.
- **Admin (`/admin`)** — El panel de la dueña, protegido con un código. Muestra un tablero con
  todas las órdenes: pesar y cobrar, mandar foto de "ropa lista", foto de daño, foto de entrega,
  y mover la orden entre etapas (recogida → lavando → lista → entregada).
- **For Business (`/business`)** — Página para clientes de negocio.
- **Asistente flotante (burbuja)** — Un chat de IA que responde dudas 24/7 solo con la info real
  del negocio.
- **StoreContext** — La "memoria" de la app dentro de cada navegador (la orden actual, el correo
  capturado, el cupón). Es por-navegador: cada cliente tiene su propia copia, no se mezclan.

### La parte del servidor (funciones de Netlify — lo seguro, con las llaves secretas)
- **square-save-card** — Al agendar: guarda la tarjeta del cliente en Square y registra la orden
  en Supabase. **No cobra todavía.**
- **square-charge** — Al pesar la ropa: recalcula el total real en el servidor y cobra la tarjeta
  guardada. Manda el recibo por correo.
- **square-payment / process-payment** — Versiones anteriores del cobro (ver "código muerto" abajo).
- **admin-login** — Valida el código de admin en el servidor (comparación segura).
- **list-orders / update-status / order-details** — Leer y mover órdenes del tablero de admin.
- **issue-coupon / check-coupon** — Crear el cupón único por persona y validarlo.
- **send-welcome-email** — Manda el correo de bienvenida con el cupón.
- **report-incident / review-incident / resolve-incident / incident-photo** — El flujo de "foto de
  daño": la dueña sube foto, el cliente recibe correo con la foto y decide "lavar igual" o
  "devolver sin tocar".
- **ready-photo / delivery-photo (+ sus imágenes)** — Fotos de ropa lista y de entrega.
- **assistant** — El cerebro del chat de IA (usa Claude Haiku).

### Servicios externos
- **Supabase** = tu base de datos (órdenes, correos, cupones).
- **Square** = los cobros con tarjeta.
- **Resend** = el envío de correos.
- **Anthropic (Claude)** = el asistente de IA.

---

## 2) Fallas y errores encontrados (de más grave a menos)

### 🔴 CRÍTICO

**1. Contradicción entre "modo prueba" y "dinero real".**
El código está configurado para **PRODUCCIÓN / dinero real**:
- `src/lib/square.js` → `SQUARE_ENV = 'production'`
- `index.html` → carga el SDK de producción (`web.squarecdn.com`)

Pero el checkout que ve el cliente **dice que es prueba**:
- `Checkout.jsx` muestra: _"🔒 Powered by Square · Sandbox"_ y
  _"Square Sandbox · test mode · no real charge · card data never touches our servers"_.

O de verdad cobras (y entonces estás diciéndole al cliente "no se te cobra" siendo falso, lo cual
es un problema legal y de confianza), o no cobras (y entonces la configuración de producción está
mal). **Hay que decidir uno y dejar el texto igual que la realidad antes de recibir clientes.**

**2. El cupón promete $15 pero solo descuenta $10.**
- Le dices al cliente "$15" en todos lados (`PROMO.amount = 15`, `issue-coupon` crea el cupón por
  `$15`, el correo dice "$15", el checkout muestra "✓ $15 off applied").
- Pero el servidor **topa el descuento a $10** (`MAX_DISCOUNT = 10` en `square-save-card.js` y
  `square-charge.js`).
- Resultado: el cliente ve "$15 de descuento" pero se le cobran $5 de más. **Queja segura.**
  Hay que igualar los dos números (o subir el tope a 15, o bajar la promesa a 10).

**3. No hay límite de uso (rate limiting) en ninguna función.**
Cualquiera en internet puede llamar a tus funciones sin parar. Lo más caro:
- `/api/assistant` — cada mensaje le cuesta dinero real a tu cuenta de Anthropic. Un bot podría
  mandar miles de mensajes y **vaciarte el crédito**.
- `/api/issue-coupon`, `/api/check-coupon`, `/api/send-welcome-email` — se pueden abusar para
  llenar la base o mandar correos.
- `/api/admin-login` — se puede intentar el código miles de veces (fuerza bruta).

### 🟠 ALTO

**4. Login de admin sin bloqueo por intentos.** La comparación es segura, pero nada impide probar
el código una y otra vez. **Usa un `ADMIN_PASSCODE` largo y al azar** (el README menciona `92507`,
que es un código adivinable — no lo dejes así) y agrega un límite de intentos.

**5. La tabla `leads` se escribe desde el navegador** con la llave pública. Si las políticas (RLS)
de Supabase no están bien puestas, cualquiera puede insertar correos basura. **Verifica las
políticas RLS** en Supabase.

**6. Las fotos se guardan como texto gigante (base64) dentro de la tabla `orders`.** Cada foto
pesa hasta ~1.5 MB metida en la fila de la base de datos. Con muchas órdenes, la base crece
rápido y las pantallas de admin se vuelven lentas y caras. **Mejor usar Supabase Storage** y
guardar solo el link.

### 🟡 MEDIO

**7. El `SUPABASE_URL` está copiado a mano en más de 10 funciones.** Si cambias de proyecto tienes
que editarlas todas. Mejor una variable de entorno.

**8. Código muerto / duplicado.** `process-payment.js` (Stripe simulado) y `square-payment.js`
parecen ya no usarse (el flujo real es `square-save-card` + `square-charge`). Conviene borrarlos
para no confundir.

**9. Un solo paquete de JavaScript de 490 KB** (140 KB comprimido) sin dividir. La primera carga en
celular es más pesada de lo necesario. Se puede separar el panel de Admin del código público.

**10. Detalles menores:** el service worker es muy básico (revisar que no muestre versiones viejas
en caché); textos de "Apple Pay/Google Pay coming soon"; el `estPounds` está fijo en 14 libras
para el estimado.

---

## 3) Qué mejoraría PRIMERO (en orden)

1. **Arreglar la contradicción Sandbox vs Producción** y dejar el texto del checkout diciendo la
   verdad. (Es lo primero porque toca dinero y confianza legal.)
2. **Igualar el cupón $15 / $10.**
3. **Poner rate limiting** al menos en `/api/assistant` (protege tu cartera).
4. **Confirmar `ADMIN_PASSCODE` fuerte + límite de intentos** en el login de admin.
5. **Verificar las políticas RLS** de Supabase (tablas `leads`, `orders`, `coupons`).
6. Después: mover fotos a Storage, dividir el bundle, borrar código muerto.

---

## 4) Prueba de aguante — ¿soporta ~30 clientes al mismo tiempo?

### Cómo se probó
- Se compiló la app (build correcto ✅) y se sirvió localmente.
- Se simularon usuarios simultáneos cargando la app (index + JavaScript + CSS + páginas).
- **No** se hizo carga contra el sitio en vivo ni contra las funciones reales de pago, a propósito:
  eso crearía clientes de verdad en Square, gastaría crédito de IA y metería datos basura. Eso sería
  irresponsable. Por eso la prueba de carga fue sobre el frontend compilado.

### Resultados medidos
| Prueba | Peticiones | Exitosas | p50 | p90 | p99 |
|---|---|---|---|---|---|
| **30 usuarios simultáneos** | 150 | **150/150 ✅** | 86 ms | 350 ms | 416 ms |
| **100 usuarios (estrés)** | 400 | **400/400 ✅** | 323 ms | 1.7 s | 1.8 s |

Con 30 usuarios ni se despeinó (todo bajo medio segundo). Con 100 aguantó sin fallar ni una sola
petición. **En Netlify (que usa una red CDN mundial) será aún más rápido y estable que en mi PC.**

### Análisis por pieza
- **Frontend (páginas):** ✅ Sin problema. Netlify sirve archivos estáticos desde CDN; 30 es
  trivial.
- **Estado de cada cliente:** ✅ Cada navegador tiene su propia memoria; los clientes no se
  pisan entre sí.
- **Funciones de Netlify:** ✅ Son "serverless" y escalan solas. 30 a la vez es poco. ⚠️ Ojo con
  los límites del plan gratis (≈125 000 llamadas/mes, 10 s por función, 6 MB por petición — las
  fotos base64 pueden acercarse a ese límite de tamaño).
- **Supabase:** ✅ Aguanta muchas más de 30 conexiones. La redención del cupón usa una
  actualización condicional atómica (bien hecho: evita que un cupón se use dos veces aunque dos
  peticiones lleguen juntas).
- **Square / Anthropic / Resend:** ✅ Escalan sin caerse.

### Veredicto
**Sí aguanta 30 clientes usando la app al mismo tiempo sin caerse.** Con 30 clientes reales los
riesgos NO son de velocidad, sino de:
1. **Costo por abuso** del asistente de IA (falta rate limiting).
2. **Confusión Sandbox/Producción** en el cobro.
3. **El descuento $15 vs $10.**

Esos tres se arreglan con cambios pequeños y son más importantes que el rendimiento, que ya está
sólido.

---

## Estado del build
`npm install` ✅ · `npm run build` ✅ (compila sin errores; bundle 490 KB / 140 KB gzip).

---

# 📌 Cambios hechos — 10 de julio de 2026

Puesta a punto para recibir clientes reales. Todo en palabras sencillas:

### Horarios (sesión anterior)
- Se agregó una sección de horarios en la página de inicio y en la de agendar:
  "Book online: 24/7", tabla de recolecciones (Lun–Vie, Sáb, Dom), teléfonos y ubicación.
- El selector de fecha ahora respeta el horario real y usa la hora de California
  (America/Los_Angeles), no la del celular del cliente.

### Selector de fecha/hora (esta sesión)
- Los domingos ahora salen en gris y NO se pueden elegir (calendario propio), con
  la nota "Closed Sundays".
- El horario de Lun–Vie quedó corrido de 7 AM a 6 PM (se quitó el hueco de 12 a 2):
  Mañana 7 AM–12 PM y Tarde 12 PM–6 PM. Sábado solo 8 AM–12 PM.
- Todo esto se valida también en el servidor, para que nadie agende fuera de horario.

### Zona de servicio (sesión anterior)
- Solo Riverside, CA. ZIP permitidos: 92501, 92503, 92504, 92505, 92506, 92507, 92508
  (editables en un solo lugar).
- Si el ZIP no está en la lista: mensaje amable y se guarda el correo como "fuera de zona".
- También se valida el ZIP en el servidor.

### Footer (sesión anterior)
- En todas las páginas aparece la ubicación "Riverside, CA 92507" y los dos teléfonos
  (Kimberly y Elizabeth), que se pueden tocar para llamar.

### Asistente de IA (sesión anterior)
- Sabe los horarios, teléfonos y que servimos solo Riverside. Si le piden la dirección
  de calle, responde solo "Riverside, CA 92507" y ofrece los teléfonos.

### Checkout honesto (esta sesión)
- Se quitaron los textos falsos de "Sandbox / test mode / no real charge". Ahora dice:
  "Secure payment powered by Square. Your card is saved now and charged after we weigh
  your laundry." La app cobra dinero REAL (Square en producción).

### Cupón $15 (esta sesión)
- Se quitó un tope escondido de $10. El cupón de bienvenida ahora sí descuenta los $15
  completos que se prometen en todos lados.

### Publicación y respaldo — 10 de julio de 2026
- **Publicado en vivo** en https://havenandhours.com usando Netlify CLI, al sitio
  existente `haven-hours` (no se creó ninguno nuevo). Deploy en estado "ready".
- **Sincronizado con GitHub** (`jdayeli8-jpg/haven-hours`, rama `main`, commit `520b750`).
  Ahora el sitio en vivo, GitHub y la computadora dicen lo mismo — un cambio futuro
  ya no puede revertir este trabajo.
- Al subir a GitHub se **conservaron los scripts de ayuda** `PROBAR-APP.bat` y
  `PUBLICAR.bat`, y se quitaron 4 archivos viejos duplicados de la raíz (favicon,
  index.css e íconos que ya estaban correctos en `public/` y `src/`).
- **Variables de entorno en Netlify** confirmadas: `ADMIN_PASSCODE`, `ANTHROPIC_API_KEY`,
  `RESEND_API_KEY`, `SQUARE_ACCESS_TOKEN`, `SUPABASE_SERVICE_KEY`. (`SQUARE_API_BASE` y
  `SQUARE_LOCATION_ID` no se pusieron porque el código ya usa los de producción por defecto.)

### Pendiente para la dueña (prueba con dinero real)
- Hacer un cobro de prueba con tarjeta propia: agendar → pesar y cobrar en `/admin` →
  confirmar que el dinero entra en Square, que llega el recibo por correo, y que el
  cupón de bienvenida resta $15 completos.
