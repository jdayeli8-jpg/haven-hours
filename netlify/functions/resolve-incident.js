// netlify/functions/resolve-incident.js
//
// FUNCIÓN B (foto de daño) — Guarda la decisión del cliente
// ('approve' = lávenla igual / 'return' = devuélvanla). Requiere el token.
//
// Llave SECRETA: SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed.' }, headers)
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseKey) return json(500, { ok: false, error: 'Server not configured.' }, headers)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Bad JSON.' }, headers)
  }

  const orderId = body.order
  const token = String(body.token || '')
  const decision = body.decision
  if (!orderId || !token) return json(400, { ok: false, error: 'Missing parameters.' }, headers)
  if (decision !== 'approve' && decision !== 'return') {
    return json(400, { ok: false, error: 'Invalid choice.' }, headers)
  }

  const supabase = createClient(SUPABASE_URL, supabaseKey)
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, incident_token, incident_decision')
    .eq('id', orderId)
    .single()

  if (error || !order) return json(404, { ok: false, error: 'Not found.' }, headers)
  if (!order.incident_token || order.incident_token !== token) {
    return json(403, { ok: false, error: 'Invalid link.' }, headers)
  }

  const { error: updErr } = await supabase
    .from('orders')
    .update({ incident_decision: decision })
    .eq('id', orderId)

  if (updErr) return json(502, { ok: false, error: updErr.message }, headers)
  return json(200, { ok: true, decision }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
