// netlify/functions/list-orders.js
//
// PASO 3C-3 — Trae las órdenes reales que están listas para cobrar.
// La tabla `orders` está cerrada al público, así que la leemos aquí en el
// servidor con la llave maestra (SUPABASE_SERVICE_KEY) y la protegemos con
// el código de admin.
//
// Llaves SECRETAS (solo viven en Netlify):
//   SUPABASE_SERVICE_KEY      — para leer la tabla `orders`
//   ADMIN_PASSCODE (opcional) — si la pones en Netlify, reemplaza al demo 92507

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

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

  const supabase = createClient(SUPABASE_URL, supabaseKey)

  // scope 'recent' → últimas órdenes (cualquier estatus), para el panel de updates.
  // scope por defecto → órdenes 'scheduled' listas para pesar y cobrar.
  if (body.scope === 'recent') {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_code, stage, name, email, phone, estimate, final_amount, status, fulfillment_status, incident_created_at, incident_decision, pickup_date, pickup_window, address')
      .order('id', { ascending: false })
      .limit(30)
    if (error) return json(502, { ok: false, error: error.message }, headers)
    return json(200, { ok: true, orders: data || [] }, headers)
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_code, stage, name, email, phone, est_pounds, estimate, square_card_id, status, fulfillment_status')
    .eq('status', 'scheduled')
    .order('id', { ascending: false })
    .limit(100)

  if (error) return json(502, { ok: false, error: error.message }, headers)

  return json(200, { ok: true, orders: data || [] }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
