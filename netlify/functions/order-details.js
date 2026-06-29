// netlify/functions/order-details.js
//
// DETALLES DE UNA ORDEN + HISTORIAL DEL CLIENTE
// Trae el detalle completo de una orden (incluidas las fotos guardadas) y,
// además, TODAS las órdenes pasadas del mismo cliente (por correo) en una
// lista ligera. La tabla está cerrada al público, así que leemos aquí en el
// servidor con la llave maestra y protegemos con el código de admin.
//
// Llaves SECRETAS (solo en Netlify):
//   SUPABASE_SERVICE_KEY  — leer la tabla orders
//   ADMIN_PASSCODE        — candado de admin

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

// Columnas del detalle (incluye las fotos como data URL).
const DETAIL_COLS =
  'id, order_code, name, email, phone, zip, address, notes, pickup_date, pickup_window, ' +
  'stage, status, fulfillment_status, fulfillment_updated_at, ' +
  'est_pounds, estimate, final_pounds, final_amount, extra_amount, extra_note, ' +
  'coupon_code, coupon_amount, coupon_discount, square_payment_id, paid_at, ' +
  'incident_created_at, incident_note, incident_decision, incident_photo, ' +
  'ready_created_at, ready_note, ready_photo, ' +
  'delivery_created_at, delivery_note, delivery_photo'

// Columnas ligeras para el historial (SIN fotos, para que cargue rápido).
const HISTORY_COLS =
  'id, order_code, pickup_date, pickup_window, status, fulfillment_status, ' +
  'estimate, final_amount, paid_at, incident_decision'

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
  if (!orderId) return json(400, { ok: false, error: 'Falta el ID de la orden.' }, headers)

  const supabase = createClient(SUPABASE_URL, supabaseKey)

  // 1) El detalle completo de la orden enfocada.
  const { data: order, error } = await supabase
    .from('orders')
    .select(DETAIL_COLS)
    .eq('id', orderId)
    .single()

  if (error || !order) return json(404, { ok: false, error: 'No encontré esa orden.' }, headers)

  // 2) Historial del MISMO cliente (por correo), de más nueva a más vieja.
  let history = []
  if (order.email) {
    const { data: hist } = await supabase
      .from('orders')
      .select(HISTORY_COLS)
      .eq('email', order.email)
      .order('id', { ascending: false })
      .limit(50)
    history = hist || []
  }

  return json(200, { ok: true, order, history }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
