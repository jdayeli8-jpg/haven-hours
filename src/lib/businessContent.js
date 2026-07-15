// Todos los textos de la página /business en UN SOLO LUGAR, en inglés y español.
// Los NÚMEROS y precios NO cambian por idioma (viven en las constantes de arriba).
// Para editar un texto: búscalo en BIZ_CONTENT.en o BIZ_CONTENT.es.

/* ---------- Contacto ---------- */
export const BIZ_PHONES = [
  { name: 'Kimberly', display: '(714) 260-2637', tel: '+17142602637' },
  { name: 'Elizabeth', display: '(714) 610-6933', tel: '+17146106933' },
]
export const BIZ_LOCATION = 'Riverside, CA 92507'

/* ---------- Calculadora (números, iguales en cualquier idioma) ---------- */
export const OPTION_A_TIERS = [
  { max: 130, price: 0.75 },
  { max: 224, price: 0.6 },
  { max: 274, price: 0.55 },
  { max: Infinity, price: 0.5 },
]
export const OPTION_B_WASH_TIERS = [
  { max: 130, price: null },
  { max: 224, price: 0.44 },
  { max: 274, price: 0.42 },
  { max: Infinity, price: 0.4 },
]
export const OPTION_B_SETUP = [
  { max: 224, setup: 450 },
  { max: 274, setup: 570 },
  { max: Infinity, setup: 675 },
]
export const ADDON_WEEKLY = 10

/* ---------- Colores (los HEX no cambian; los nombres sí, por idioma) ---------- */
export const COLOR_SWATCHES = ['#1c1c1c', '#f4f1ea', '#3f4247', '#6b2b3a', '#1f2a44']

/* ---------- Textos por idioma ---------- */
export const BIZ_CONTENT = {
  en: {
    hero: {
      eyebrow: 'For business · towel service',
      title: 'Fresh towels. Frozen prices. Local owners.',
      line: 'Premium towel service, owned & run by Elizabeth & Kimberly in Riverside — the owners answer the phone, in English o en español.',
      types: 'For salons, barbershops, spas, gyms, tattoo studios & any business that runs on towels.',
      ctaTrial: 'Get my free trial load',
      ctaPrice: 'See my price in 30 seconds',
      spanish: 'Se habla español',
    },
    how: {
      steps: [
        { icon: '🎁', text: 'Try us free — one trial load, no strings.' },
        { icon: '🔒', text: 'Pick your plan — price frozen in writing.' },
        { icon: '🚐', text: 'Never think about towels again — weekly pickup & delivery.' },
      ],
    },
    calc: {
      eyebrow: 'Instant estimate',
      heading: 'Know your price in 30 seconds',
      towelsPerDay: 'Towels per day',
      daysOpen: 'Days open per week',
      iWantTo: 'I want to:',
      optA: 'Bring my own towels',
      optB: 'Buy towels + weekly wash',
      addon: 'Add capes & smocks (+$10/week)',
      towelsLabel: 'Towels',
      addonLabel: 'Capes & smocks',
      perWeek: '/ week',
      towelsWeek: 'Towels per week',
      weeklyCost: 'Weekly cost',
      per4: 'Per 4 weeks',
      setup: 'One-time towels (setup)',
      or12: 'or 12 weekly payments',
      under200: 'Under 200 towels? Price drops — just call us for a custom quote.',
      lock: 'Lock this price for 6 months →',
      footnote: 'All prices approximate · one flat price — pickup, wash, fold & delivery included · frozen 6 months.',
    },
    ways: {
      heading: 'Three ways to work with us',
      seeDetails: 'See details',
      hideDetails: 'Hide details',
      a: {
        badge: 'Most popular',
        title: 'We wash YOUR towels',
        short: 'Keep your own towels — we pick up, wash separately, fold & deliver weekly.',
        from: 'from ~$392 per 4 weeks',
        body: 'Keep your own towels. We pick up, wash separately, fold beautifully and deliver every week.',
        rows: [
          ['Up to 130 / week', 'from $0.75/towel (~$392 per 4 weeks)'],
          ['200', '$0.60 (~$480)'],
          ['250', '$0.55 (~$552)'],
          ['300', '$0.50 (~$600)'],
        ],
      },
      b: {
        badge: 'Best long-term value',
        title: 'Buy our towels + weekly wash',
        short: 'Premium bleach-proof towels that become YOURS, plus weekly wash.',
        from: 'from ~$348 per 4 weeks + towels',
        body: 'Premium bleach-proof towels in black, white or your color. And unlike the big companies: after you pay for them, the towels are YOURS — not rented forever. Or split into 12 easy weekly payments.',
        rows: [
          ['200 towels', '$450 setup + $87/week wash (~$348 per 4 weeks)'],
          ['250', '$570 + $105/week (~$420)'],
          ['300', '$675 + $120/week (~$480)'],
        ],
        note: 'Worn towels replaced at just $3 each — only with your approval.',
      },
      c: {
        title: 'Rent our towels',
        short: "Don't want to own or bring anything? We supply, rotate, wash & deliver.",
        from: 'same-day custom quote',
        body: "Don't want to own or bring anything? We supply, rotate, wash and deliver. Ask us for a same-day custom quote.",
      },
      addon: {
        title: 'Capes & Smocks · add-on',
        body: 'We wash your cutting capes too — separately, fabric-safe care (no high heat). +$10/week up to 20 pieces (~$40 per 4 weeks) · 20+: +$18/week. First 2 weeks free. Add-on for towel clients only.',
      },
      footnote:
        "Every price is approximate — your final quote is personalized to YOUR business and it's always ONE flat price: pickup, wash, fold & delivery included. No hidden fees: what you see is what you pay. Always. Price frozen in writing for 6 months.",
    },
    promise: {
      heading: 'Our neighbor promise',
      items: [
        { icon: '🚨', title: 'Towel 911', short: 'Ran out? Same-day emergency packs.', body: 'Ran out on a busy Saturday? Call us. We live 15 minutes away, not 3 states away. Emergency packs delivered same day for active clients.' },
        { icon: '🧾', title: 'Free invoice audit', short: "We'll circle every hidden fee on your bill.", body: "Bring us your current provider's invoice. In 10 minutes we'll circle every hidden fee with a pen. No strings." },
        { icon: '📋', title: 'Sanitization letter', short: 'Signed proof for State Board.', body: 'Every month you get a signed letter certifying your towels are professionally hot-washed and sanitized weekly — keep it next to your license for State Board inspections.' },
        { icon: '🧺', title: 'Shelf-ready delivery', short: 'Folded onto your shelf; dirty ones taken away.', body: "We don't drop a bag at the door. We place your folded towels right on your shelf and take the dirty ones with us." },
        { icon: '🗣️', title: 'Truly bilingual', short: 'English or Spanish — your choice.', body: "Contract, receipts, texts and support in English or Spanish. Whichever YOU prefer. No 'press 2', no call centers." },
      ],
    },
    accordion: { eyebrow: 'More details', compare: 'Why our bill never surprises you', colors: 'Colors', next: "What's coming next + vote" },
    compare: {
      heading: 'The quote is not the bill',
      sub: 'Illustrative example for a salon using 240 towels/week.',
      big: {
        title: 'Big company',
        quote: 'Quotes $0.42/towel',
        rows: [
          ['Towel service', '$437'],
          ['Fuel surcharge', '$18'],
          ['Environmental fee', '$12'],
          ['Service & delivery', '$25'],
          ['"Lost towel" replacements', '$29'],
        ],
        total: '$521',
        note: '…and it usually goes up every year, on a 3–5 year auto-renewing contract.',
      },
      us: {
        title: 'Haven & Hours',
        quote: 'Quotes $0.47/towel',
        rows: [
          ['Towel service', '$489'],
          ['Hidden fees', '$0'],
        ],
        total: '$489',
        note: 'Frozen in writing for 6 months. Month 6 bill = month 1 bill.',
      },
      foot: 'Illustrative example. Never sign ANY towel contract without asking: How long is the term? Does it auto-renew? Can the bill grow?',
    },
    colors: {
      heading: 'Your towels, your brand',
      more: 'More colors on request',
      tagline: 'Big companies give you two colors. We match YOUR brand.',
      swatches: [
        { name: 'Black', note: 'bleach & dye proof — our star' },
        { name: 'White', note: 'spas & facials' },
        { name: 'Charcoal', note: '' },
        { name: 'Burgundy', note: '' },
        { name: 'Navy', note: '' },
      ],
    },
    next: {
      heading: "What's next — you vote",
      body: 'Coming soon: facial bed sheets, manicure towels, laser engraved logo towels, and more.',
      voteTitle: "What service do you need that nobody offers you? Tell us and we'll build it.",
      votePlaceholder: 'e.g. weekly facial sheets…',
      voteEmail: 'Email (optional)',
      voteBtn: 'Send my vote',
      voteThanks: 'Got it! You just helped decide our next service 💛',
    },
    close: {
      promosHeading: 'Ways to start saving today',
      promos: [
        { title: 'Free trial load', body: 'No cost, no commitment.' },
        { title: 'Week 5 free', body: 'Your 5th week is on us when you join.' },
        { title: 'Founding Partner', body: "Lock today's price for 12 MONTHS + 6 towels laser engraved with your logo FREE (first businesses only — limited spots)." },
        { title: 'Refer a neighbor', body: '$25 credit for you, $25 for them.' },
      ],
      formHeading: 'Get my free trial load',
      contactTitle: 'Tell us about your business.',
      formSub: "Tell us about your business and we'll send a personalized, flat-price quote — frozen for 6 months.",
      fSalon: 'Business name',
      fName: 'Your name',
      fPhone: 'Phone',
      fEmail: 'Email',
      fMessage: 'Message (optional)',
      submit: 'Get my free trial load',
      sending: 'Sending…',
      thanksTitle: 'Thank you!',
      thanks: "Thank you! We'll contact you within 24 hours with your custom quote.",
    },
    errors: {
      vote: 'Please tell us what service you need.',
      salon: 'Please add your business name.',
      name: 'Please add your name.',
      email: 'Please add a valid email address.',
      generic: 'Something went wrong. Please try again.',
      genericCall: 'Something went wrong. Please try again, or call us.',
      network: 'Network problem. Please try again.',
      networkCall: 'Network problem. Please try again, or call us.',
    },
  },

  es: {
    hero: {
      eyebrow: 'Para negocios · servicio de toallas',
      title: 'Toallas siempre frescas. Precios congelados. Dueñas locales.',
      line: 'Servicio premium de toallas, atendido por sus dueñas Elizabeth y Kimberly aquí en Riverside — las dueñas contestan el teléfono, en inglés o en español.',
      types: 'Para salones, barberías, spas, gimnasios, estudios de tatuajes y cualquier negocio que use toallas.',
      ctaTrial: 'Quiero mi carga de prueba gratis',
      ctaPrice: 'Ver mi precio en 30 segundos',
      spanish: 'Se habla español',
    },
    how: {
      steps: [
        { icon: '🎁', text: 'Pruébanos gratis — una carga, sin compromiso.' },
        { icon: '🔒', text: 'Elige tu plan — tu precio congelado por escrito.' },
        { icon: '🚐', text: 'Olvídate de las toallas para siempre — recolección y entrega cada semana.' },
      ],
    },
    calc: {
      eyebrow: 'Estimado al instante',
      heading: 'Conoce tu precio en 30 segundos',
      towelsPerDay: 'Toallas por día',
      daysOpen: 'Días abiertos por semana',
      iWantTo: 'Quiero:',
      optA: 'Traer mis propias toallas',
      optB: 'Comprar toallas + lavado semanal',
      addon: 'Agregar capas y batas (+$10/semana)',
      towelsLabel: 'Toallas',
      addonLabel: 'Capas y batas',
      perWeek: '/ semana',
      towelsWeek: 'Toallas por semana',
      weeklyCost: 'Costo semanal',
      per4: 'Cada 4 semanas',
      setup: 'Toallas (pago único inicial)',
      or12: 'o 12 pagos semanales',
      under200: '¿Menos de 200 toallas? El precio baja — llámanos para una cotización personalizada.',
      lock: 'Congelar este precio por 6 meses →',
      footnote: 'Todos los precios aproximados · un solo precio fijo — recolección, lavado, doblado y entrega incluidos · congelado 6 meses.',
    },
    ways: {
      heading: 'Tres formas de trabajar con nosotras',
      seeDetails: 'Ver detalles',
      hideDetails: 'Ocultar detalles',
      a: {
        badge: 'La más popular',
        title: 'Lavamos TUS toallas',
        short: 'Quédate con tus toallas — recogemos, lavamos por separado, doblamos y entregamos cada semana.',
        from: 'desde ~$392 cada 4 semanas',
        body: 'Quédate con tus propias toallas. Recogemos, lavamos por separado, doblamos con cuidado y entregamos cada semana.',
        rows: [
          ['Hasta 130 / semana', 'desde $0.75/toalla (~$392 cada 4 semanas)'],
          ['200', '$0.60 (~$480)'],
          ['250', '$0.55 (~$552)'],
          ['300', '$0.50 (~$600)'],
        ],
      },
      b: {
        badge: 'Mejor valor a largo plazo',
        title: 'Compra nuestras toallas + lavado semanal',
        short: 'Toallas premium a prueba de cloro que se vuelven TUYAS, más el lavado semanal.',
        from: 'desde ~$348 cada 4 semanas + toallas',
        body: 'Toallas premium a prueba de cloro en negro, blanco o tu color. Y a diferencia de las grandes compañías: cuando terminas de pagarlas, las toallas son TUYAS — no rentadas para siempre. O divídelo en 12 pagos semanales fáciles.',
        rows: [
          ['200 toallas', '$450 inicial + $87/semana de lavado (~$348 cada 4 semanas)'],
          ['250', '$570 + $105/semana (~$420)'],
          ['300', '$675 + $120/semana (~$480)'],
        ],
        note: 'Reemplazamos toallas desgastadas por solo $3 cada una — solo con tu aprobación.',
      },
      c: {
        title: 'Renta nuestras toallas',
        short: '¿No quieres comprar ni traer nada? Nosotras ponemos, rotamos, lavamos y entregamos.',
        from: 'cotización personalizada el mismo día',
        body: '¿No quieres comprar ni traer nada? Nosotras ponemos, rotamos, lavamos y entregamos. Pídenos una cotización personalizada el mismo día.',
      },
      addon: {
        title: 'Capes & Smocks — capas y batas · complemento',
        body: 'También lavamos tus capas de corte — por separado, con cuidado que respeta la tela (sin calor alto). +$10/semana hasta 20 piezas (~$40 cada 4 semanas) · 20+: +$18/semana. Las primeras 2 semanas gratis. Complemento solo para clientes de toallas.',
      },
      footnote:
        'Todos los precios son aproximados — tu cotización final es personalizada para TU negocio y siempre es UN solo precio fijo: recolección, lavado, doblado y entrega incluidos. Cero cargos escondidos: lo que ves es lo que pagas. Siempre. Precio congelado por escrito por 6 meses.',
    },
    promise: {
      heading: 'Nuestra promesa de vecinas',
      items: [
        { icon: '🚨', title: 'Towel 911', short: '¿Te quedaste sin toallas? Paquete de emergencia el mismo día.', body: '¿Te quedaste sin toallas un sábado lleno? Llámanos. Vivimos a 15 minutos, no a 3 estados de distancia. Entregamos paquetes de emergencia el mismo día a clientes activos.' },
        { icon: '🧾', title: 'Auditoría de factura gratis', short: 'Marcamos con pluma cada cargo escondido de tu factura.', body: 'Tráenos la factura de tu proveedor actual. En 10 minutos marcamos con pluma cada cargo escondido. Sin compromiso.' },
        { icon: '📋', title: 'Carta de sanitización', short: 'Comprobante firmado para el State Board.', body: 'Cada mes recibes una carta firmada que certifica que tus toallas se lavan en caliente y se sanitizan cada semana — guárdala junto a tu licencia para las inspecciones del State Board.' },
        { icon: '🧺', title: 'Entrega lista para el estante', short: 'Dobladas en tu estante; nos llevamos las sucias.', body: 'No dejamos una bolsa en la puerta. Colocamos tus toallas dobladas directo en tu estante y nos llevamos las sucias.' },
        { icon: '🗣️', title: 'De verdad bilingües', short: 'Inglés o español — tú eliges.', body: "Contrato, recibos, mensajes y atención en inglés o español. El que TÚ prefieras. Sin 'marque 2', sin call centers." },
      ],
    },
    accordion: { eyebrow: 'Más detalles', compare: 'Por qué nuestra factura nunca te sorprende', colors: 'Colores', next: 'Qué viene después + tu voto' },
    compare: {
      heading: 'La cotización no es la factura',
      sub: 'Ejemplo ilustrativo de un salón que usa 240 toallas/semana.',
      big: {
        title: 'Compañía grande',
        quote: 'Te cotiza $0.42/toalla',
        rows: [
          ['Servicio de toallas', '$437'],
          ['Cargo por combustible', '$18'],
          ['Cargo ambiental', '$12'],
          ['Servicio y entrega', '$25'],
          ["Reposición por 'toallas perdidas'", '$29'],
        ],
        total: '$521',
        note: '…y normalmente sube cada año, en un contrato de 3–5 años que se renueva solo.',
      },
      us: {
        title: 'Haven & Hours',
        quote: 'Te cotiza $0.47/toalla',
        rows: [
          ['Servicio de toallas', '$489'],
          ['Cargos escondidos', '$0'],
        ],
        total: '$489',
        note: 'Congelado por escrito por 6 meses. La factura del mes 6 = la del mes 1.',
      },
      foot: 'Ejemplo ilustrativo. Nunca firmes NINGÚN contrato de toallas sin preguntar: ¿Cuánto dura? ¿Se renueva solo? ¿Puede subir la factura?',
    },
    colors: {
      heading: 'Tus toallas, tu marca',
      more: 'Más colores a pedido',
      tagline: 'Las grandes compañías te dan dos colores. Nosotras igualamos TU marca.',
      swatches: [
        { name: 'Negro', note: 'a prueba de tinte, nuestra estrella' },
        { name: 'Blanco', note: 'spas y faciales' },
        { name: 'Gris carbón', note: '' },
        { name: 'Vino', note: '' },
        { name: 'Azul marino', note: '' },
      ],
    },
    next: {
      heading: 'Qué viene después — tú votas',
      body: 'Próximamente: sábanas para camilla facial, toallas de manicure, toallas con tu logo grabado a láser y más.',
      voteTitle: '¿Qué servicio necesitas que nadie te ofrece? Dinos y lo creamos.',
      votePlaceholder: 'ej. sábanas faciales cada semana…',
      voteEmail: 'Correo (opcional)',
      voteBtn: 'Enviar mi voto',
      voteThanks: '¡Listo! Acabas de ayudar a decidir nuestro próximo servicio 💛',
    },
    close: {
      promosHeading: 'Formas de empezar a ahorrar hoy',
      promos: [
        { title: 'Carga de prueba gratis', body: 'Sin costo, sin compromiso.' },
        { title: 'La semana 5 gratis', body: 'Tu quinta semana va por nuestra cuenta al unirte.' },
        { title: 'Founding Partner', body: 'Congela el precio de hoy por 12 MESES + 6 toallas con tu logo grabado a láser GRATIS (solo los primeros negocios — cupos limitados).' },
        { title: 'Recomienda a un vecino', body: '$25 de crédito para ti, $25 para quien recomiendes.' },
      ],
      formHeading: 'Quiero mi carga de prueba gratis',
      contactTitle: 'Cuéntanos de tu negocio.',
      formSub: 'Cuéntanos de tu negocio y te enviamos una cotización personalizada de precio fijo — congelada por 6 meses.',
      fSalon: 'Nombre del negocio',
      fName: 'Tu nombre',
      fPhone: 'Teléfono',
      fEmail: 'Correo',
      fMessage: 'Mensaje (opcional)',
      submit: 'Quiero mi carga de prueba gratis',
      sending: 'Enviando…',
      thanksTitle: '¡Gracias!',
      thanks: 'Te contactamos en menos de 24 horas con tu cotización personalizada.',
    },
    errors: {
      vote: 'Dinos qué servicio necesitas.',
      salon: 'Agrega el nombre de tu negocio.',
      name: 'Agrega tu nombre.',
      email: 'Agrega un correo válido.',
      generic: 'Algo salió mal. Inténtalo de nuevo.',
      genericCall: 'Algo salió mal. Inténtalo de nuevo o llámanos.',
      network: 'Problema de red. Inténtalo de nuevo.',
      networkCall: 'Problema de red. Inténtalo de nuevo o llámanos.',
    },
  },
}
