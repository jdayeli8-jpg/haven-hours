// netlify/functions/report-incident.js
//
// FUNCIÓN B (foto de daño) — Adjunta una foto + nota a una orden REAL y
// le manda un correo al cliente con la foto y dos opciones para decidir.
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

  const { data: order, error: updErr } = await supabase
    .from('orders')
    .update({
      incident_photo: photo,
      incident_note: note || null,
      incident_token: token,
      incident_decision: null,
      incident_created_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('id, name, email')
    .single()

  if (updErr || !order) return json(404, { ok: false, error: 'No encontré esa orden.' }, headers)

  // --- Enviar el correo al cliente ---
  let emailed = false
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && order.email) {
    const reviewBase = `${SITE}/api/review-incident?order=${order.id}&token=${token}`
    const photoUrl = `${SITE}/api/incident-photo?order=${order.id}&token=${token}`
    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#2A2622;line-height:1.55">
        <img src="https://havenandhours.com/icons/icon-192.png" alt="Haven &amp; Hours" width="56" height="56" style="display:block;border:0;margin:0 0 16px" />
        <p>Hi ${esc(order.name) || 'there'},</p>
        <p>During our intake inspection, we noticed something on one of your garments
        that we wanted you to see before we continue. We'd rather pause and ask than guess.</p>
        <img src="${photoUrl}" alt="Your garment during inspection"
          style="display:block;max-width:100%;border-radius:12px;border:1px solid #e7e3dd;margin:18px 0" />
        ${note ? `<p style="margin:0 0 16px"><strong>Our note:</strong> ${esc(note)}</p>` : ''}
        <p>How would you like us to proceed?</p>
        <p style="margin:20px 0">
          <a href="${reviewBase}&choice=approve"
            style="display:inline-block;background:#5B5BD6;color:#fff;text-decoration:none;
            padding:12px 20px;border-radius:999px;font-weight:bold;margin:0 8px 8px 0">Wash it anyway</a>
          <a href="${reviewBase}&choice=return"
            style="display:inline-block;background:#fff;color:#2A2622;text-decoration:none;
            border:1px solid #d6d0c8;padding:12px 20px;border-radius:999px;font-weight:bold">Return it untouched</a>
        </p>
        <p style="font-size:13px;color:#7a736b">If you have any questions, just reply to this email.</p>
        <p style="margin-top:24px">Warmly,<br/>Haven &amp; Hours</p>
      </div>`
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: order.email,
          subject: 'A quick check on your garment — Haven & Hours',
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
