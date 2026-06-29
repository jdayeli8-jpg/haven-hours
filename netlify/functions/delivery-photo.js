// netlify/functions/delivery-photo.js
//
// PRUEBA DE ENTREGA — Adjunta una foto del paquete dejado en la puerta a una
// orden real, marca la orden como "delivered" y le manda al cliente un correo
// cálido con la foto: "tu ropa llegó". Gemela de ready-photo.js. 💛
//
// Llaves SECRETAS (solo en Netlify):
//   SUPABASE_SERVICE_KEY  — leer/actualizar la orden
//   RESEND_API_KEY        — enviar el correo
//   ADMIN_PASSCODE        — candado de admin

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const SITE = 'https://havenandhours.com'
const FROM = 'Haven & Hours <hello@havenandhours.com>'
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz'
const MAX_PHOTO_CHARS = 1_500_000

function randomToken(n = 18) {
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return s
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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

  // Guarda la prueba de entrega Y marca la orden como entregada (se va al archivo).
  const { data: order, error: updErr } = await supabase
    .from('orders')
    .update({
      delivery_photo: photo,
      delivery_note: note || null,
      delivery_token: token,
      delivery_created_at: new Date().toISOString(),
      fulfillment_status: 'delivered',
      fulfillment_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('id, name, email, order_code')
    .single()

  if (updErr || !order) return json(404, { ok: false, error: 'No encontré esa orden.' }, headers)

  // --- Enviar el correo cálido al cliente ---
  let emailed = false
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && order.email) {
    const photoUrl = `${SITE}/api/delivery-image?order=${order.id}&token=${token}`
    const first = esc(order.name ? String(order.name).split(' ')[0] : '') || 'there'
    const html = `
      <div style="margin:0;background:#F4F1EC;padding:0">
        <div style="font-family:Georgia,'Times New Roman',serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2A2622;line-height:1.6">
          <h1 style="font-size:24px;color:#463E59;margin:0 0 4px">Haven &amp; Hours</h1>
          <p style="font-size:13px;color:#7a736b;margin:0 0 24px;letter-spacing:.04em;text-transform:uppercase">Your laundry has arrived</p>
          <p style="font-size:16px;margin:0 0 14px">Hi ${first},</p>
          <p style="font-size:16px;margin:0 0 18px">Your freshly cleaned laundry has just been delivered. Here's a photo of where we left it, so you know exactly where to find it.</p>
          <img src="${photoUrl}" alt="Your delivered laundry"
            style="display:block;max-width:100%;border-radius:14px;border:1px solid #e7e3dd;margin:0 0 18px" />
          ${note ? `<p style="font-size:16px;margin:0 0 18px;padding:14px 16px;background:#EFEAF3;border-radius:12px"><strong style="color:#463E59">A note from us:</strong> ${esc(note)}</p>` : ''}
          <p style="font-size:16px;margin:0 0 18px">Thank you for trusting us with it. We hope it brightens your day. 💛</p>
          <p style="font-size:14px;color:#7a736b;margin:24px 0 0">Questions? Just reply to this email or reach us at hello@havenandhours.com.</p>
          <p style="font-size:16px;margin:18px 0 0">Warmly,<br/>Haven &amp; Hours</p>
        </div>
      </div>`
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: order.email,
          subject: 'Your laundry has arrived — Haven & Hours',
          html,
        }),
      })
      emailed = res.ok
    } catch {
      emailed = false
    }
  }

  return json(200, { ok: true, name: order.name, emailed }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
