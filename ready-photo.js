// netlify/functions/admin-login.js
//
// PASO 3E (seguridad) — Valida el código de admin EN EL SERVIDOR.
//
// El código secreto vive SOLO en Netlify (Environment variable ADMIN_PASSCODE),
// nunca en el navegador. Así nadie puede leerlo viendo el código fuente del sitio.
//
// Recomendación: usa un código LARGO y al azar (ej. 16+ caracteres), no tu ZIP.

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE
  if (!ADMIN_PASSCODE) {
    return json(500, { ok: false, error: 'Admin sin configurar: define ADMIN_PASSCODE en Netlify.' }, headers)
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  const passcode = String(body.passcode || '')
  if (passcode && safeEqual(passcode, ADMIN_PASSCODE)) {
    return json(200, { ok: true }, headers)
  }
  return json(401, { ok: false, error: 'Código incorrecto.' }, headers)
}

// Comparación de tiempo constante (evita filtrar el código carácter por carácter).
function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
