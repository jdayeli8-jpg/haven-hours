// netlify/functions/report-incident.js
//
// FUNCIÓN B-1 — Adjunta una foto de daño + nota a una orden REAL.
//
// La foto llega YA comprimida desde el navegador (como texto base64) para que
// pese poco. La guardamos en la orden, junto con un "token" secreto que servirá
// en el B-2 para el link de confirmación del cliente.
//
// Llaves SECRETAS (solo en Netlify): SUPABASE_SERVICE_KEY, ADMIN_PASSCODE

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz'
// Tope de tamaño de la foto (base64). ~1.5 MB de texto ≈ ~1.1 MB de imagen.
const MAX_PHOTO_CHARS = 1_500_000

function randomToken(n = 18) {
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE
  if (!supabaseKey) return json(500, { ok: false, error: 'Supabase (servidor) no configurado.' }, headers)
  if (!ADMIN_PASSCODE) return json(500, { ok: false, error: 'Admin sin configurar (ADMIN_PASSCODE).' }, headers)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  if (String(body.passcode || '') !== ADMIN_PASSCODE) {
    return json(401, { ok: false, error: 'Código de admin incorrecto.' }, headers)
  }

  const orderId = body.orderId
  const photo = String(body.photo || '')
  const note = String(body.note || '').trim().slice(0, 500)

  if (!orderId) return json(400, { ok: false, error: 'Falta el ID de la orden.' }, headers)
  if (!photo.startsWith('data:image/')) {
    return json(400, { ok: false, error: 'La foto no es válida.' }, headers)
  }
  if (photo.length > MAX_PHOTO_CHARS) {
    return json(413, { ok: false, error: 'La foto pesa demasiado. Toma una más ligera.' }, headers)
  }

  const supabase = createClient(SUPABASE_URL, supabaseKey)
  const token = randomToken()

  const { data: order, error: updErr } = await supabase
    .from('orders')
    .update({
      incident_photo: photo,
      incident_note: note || null,
      incident_token: token,
      incident_decision: null, // nueva foto = decisión pendiente otra vez
      incident_created_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('id, name')
    .single()

  if (updErr || !order) return json(404, { ok: false, error: 'No encontré esa orden.' }, headers)

  return json(200, { ok: true, name: order.name }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
