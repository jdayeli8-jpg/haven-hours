// netlify/functions/resolve-incident.js
//
// FUNCIÓN B (foto de daño) — Recibe la decisión del cliente desde un FORMULARIO
// normal (sin depender de JavaScript), la guarda y muestra una página de gracias.
//
// Llave SECRETA: SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

function pageShell(inner) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Haven &amp; Hours</title>
<style>
  body{margin:0;background:#F3EFE8;color:#2A2622;font-family:Helvetica,Arial,sans-serif;line-height:1.55}
  .wrap{max-width:540px;margin:0 auto;padding:40px 20px 64px}
  .brand{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7a736b;font-weight:700}
  .card{background:#fff;border:1px solid #e7e3dd;border-radius:20px;padding:28px;margin-top:14px}
  .ok{font-size:18px;font-weight:700;color:#5B5170}
  .fine{font-size:13px;color:#7a736b}
</style></head><body><div class="wrap">
  <p class="brand">Haven &amp; Hours</p>
  <div class="card">${inner}</div>
</div></body></html>`
}

export async function handler(event) {
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }

  if (event.httpMethod !== 'POST') {
    return html(405, pageShell('<p>This page can’t be opened directly.</p>'), htmlHeaders)
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseKey) return html(500, pageShell('<p>Sorry, this isn’t available right now.</p>'), htmlHeaders)

  // El formulario llega como "order=..&token=..&decision=.." (urlencoded).
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || ''
  const ct = (event.headers['content-type'] || event.headers['Content-Type'] || '').toLowerCase()

  let orderId, token, decision
  if (ct.includes('application/json')) {
    try {
      const j = JSON.parse(raw)
      orderId = j.order; token = j.token; decision = j.decision
    } catch {
      /* ignore */
    }
  } else {
    const sp = new URLSearchParams(raw)
    orderId = sp.get('order'); token = sp.get('token'); decision = sp.get('decision')
  }
  token = String(token || '')

  if (!orderId || !token) return html(400, pageShell('<p>This link is missing information.</p>'), htmlHeaders)
  if (decision !== 'approve' && decision !== 'return') {
    return html(400, pageShell('<p>Please choose one of the options.</p>'), htmlHeaders)
  }

  const supabase = createClient(SUPABASE_URL, supabaseKey)
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, incident_token')
    .eq('id', orderId)
    .single()

  if (error || !order) return html(404, pageShell('<p>We couldn’t find this request.</p>'), htmlHeaders)
  if (!order.incident_token || order.incident_token !== token) {
    return html(403, pageShell('<p>This link is no longer valid. If you think this is a mistake, just reply to our email.</p>'), htmlHeaders)
  }

  const { error: updErr } = await supabase
    .from('orders')
    .update({ incident_decision: decision })
    .eq('id', orderId)

  if (updErr) return html(502, pageShell('<p>Something went wrong saving your choice. Please try again or reply to our email.</p>'), htmlHeaders)

  const msg =
    decision === 'approve'
      ? 'We’ll clean it with extra care.'
      : 'We’ll set it aside and return it to you unwashed, with no charge for this item.'
  return html(
    200,
    pageShell(`<p class="ok">✓ Thank you — your choice is recorded.</p><p>${msg}</p><p class="fine">Questions? Just reply to our email.</p>`),
    htmlHeaders
  )
}

function html(statusCode, body, headers) {
  return { statusCode, headers, body }
}
