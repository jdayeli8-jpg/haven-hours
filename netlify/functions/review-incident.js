// netlify/functions/review-incident.js
//
// FUNCIÓN B (foto de daño) — Página (hecha por el servidor) donde el cliente
// ve la foto, lee la nota y confirma: 'Wash it anyway' o 'Return it untouched'.
// Llega por el link del correo. Requiere el token correcto.
//
// Llave SECRETA: SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function page(inner) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Haven &amp; Hours — Garment review</title>
<style>
  body{margin:0;background:#F3EFE8;color:#2A2622;font-family:Helvetica,Arial,sans-serif;line-height:1.55}
  .wrap{max-width:540px;margin:0 auto;padding:32px 20px 64px}
  .brand{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7a736b;font-weight:700}
  .card{background:#fff;border:1px solid #e7e3dd;border-radius:20px;padding:24px;margin-top:14px}
  h1{font-size:22px;margin:.2em 0 .4em}
  img.photo{display:block;max-width:100%;border-radius:14px;border:1px solid #e7e3dd;margin:16px 0}
  .note{background:#F3EFE8;border-radius:12px;padding:12px 14px;margin:12px 0;font-size:15px}
  .btn{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;
    padding:14px 18px;border-radius:999px;font-weight:700;font-size:16px;margin:10px 0;cursor:pointer;border:0}
  .primary{background:#5B5BD6;color:#fff}
  .ghost{background:#fff;color:#2A2622;border:1px solid #d6d0c8}
  .fine{font-size:13px;color:#7a736b}
  a.swap{display:inline-block;margin-top:10px;color:#5B5BD6;font-weight:700;font-size:14px}
  .ok{font-size:18px;font-weight:700;color:#5B5BD6}
</style></head><body><div class="wrap">
  <p class="brand">Haven &amp; Hours</p>
  <div class="card">${inner}</div>
</div></body></html>`
}

export async function handler(event) {
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }
  const q = event.queryStringParameters || {}
  const orderId = q.order
  const token = q.token || ''
  const choice = q.choice

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseKey) return html(500, page('<p>Sorry, this page isn’t available right now.</p>'), htmlHeaders)
  if (!orderId || !token) return html(400, page('<p>This link is missing information.</p>'), htmlHeaders)

  const supabase = createClient(SUPABASE_URL, supabaseKey)
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, name, incident_note, incident_token, incident_decision, incident_photo')
    .eq('id', orderId)
    .single()

  if (error || !order) return html(404, page('<p>We couldn’t find this request.</p>'), htmlHeaders)
  if (!order.incident_token || order.incident_token !== token) {
    return html(403, page('<p>This link is no longer valid. If you think this is a mistake, just reply to our email.</p>'), htmlHeaders)
  }

  const photoUrl = `/api/incident-photo?order=${order.id}&token=${encodeURIComponent(token)}`
  const noteHtml = order.incident_note ? `<div class="note"><strong>Our note:</strong> ${esc(order.incident_note)}</div>` : ''
  const hi = `Hi ${esc(order.name) || 'there'},`

  // Ya decidió antes → mostrar lo que eligió
  if (order.incident_decision) {
    const msg =
      order.incident_decision === 'approve'
        ? 'You chose to have us <strong>wash it anyway</strong>. We’ll clean it with extra care.'
        : 'You chose to have us <strong>return it untouched</strong>. We’ll set it aside, unwashed, with no charge for this item.'
    return html(200, page(`<p>${hi}</p><p class="ok">✓ Thank you — your choice is recorded.</p><p>${msg}</p><p class="fine">Questions? Just reply to our email.</p>`), htmlHeaders)
  }

  // Confirmación de una opción concreta (vino del botón del correo)
  if (choice === 'approve' || choice === 'return') {
    const heading = choice === 'approve' ? 'Wash it anyway' : 'Return it untouched'
    const detail =
      choice === 'approve'
        ? `<p>We’ll clean it with extra care. By confirming, you’ve seen the condition shown above and agree it was noted <em>before</em> cleaning — so Haven &amp; Hours isn’t held responsible for this pre-existing condition or any change to it during normal cleaning.</p>`
        : `<p>We’ll set it aside and return it to you unwashed, with no charge for this item.</p>`
    const other = choice === 'approve' ? 'return' : 'approve'
    const otherLabel = choice === 'approve' ? 'return it untouched instead' : 'wash it anyway instead'
    return html(200, page(`
      <p>${hi}</p>
      <img class="photo" src="${photoUrl}" alt="Your garment during inspection"/>
      ${noteHtml}
      <h1>${heading}</h1>
      ${detail}
      <form method="POST" action="/api/resolve-incident">
        <input type="hidden" name="order" value="${order.id}"/>
        <input type="hidden" name="token" value="${esc(token)}"/>
        <input type="hidden" name="decision" value="${choice}"/>
        <button class="btn primary" type="submit">Confirm this choice</button>
      </form>
      <a class="swap" href="?order=${order.id}&token=${encodeURIComponent(token)}&choice=${other}">← I’d rather ${otherLabel}</a>
    `), htmlHeaders)
  }

  // Sin opción elegida → mostrar foto + nota + las dos opciones
  return html(200, page(`
    <p>${hi}</p>
    <p>During our intake inspection, we noticed something on one of your garments that we wanted you to see before we continue.</p>
    <img class="photo" src="${photoUrl}" alt="Your garment during inspection"/>
    ${noteHtml}
    <h1>How should we proceed?</h1>
    <a class="btn primary" href="?order=${order.id}&token=${encodeURIComponent(token)}&choice=approve">Wash it anyway</a>
    <a class="btn ghost" href="?order=${order.id}&token=${encodeURIComponent(token)}&choice=return">Return it untouched</a>
    <p class="fine">Questions? Just reply to our email.</p>
  `), htmlHeaders)
}

function html(statusCode, body, headers) {
  return { statusCode, headers, body }
}
