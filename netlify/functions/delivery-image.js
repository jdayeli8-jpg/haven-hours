// netlify/functions/delivery-image.js
//
// Sirve la foto de "prueba de entrega" como URL real, para que se vea en el
// correo. Solo funciona con el token correcto. Gemela de ready-image.js.
//
// Llave SECRETA: SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

export async function handler(event) {
  const q = event.queryStringParameters || {}
  const orderId = q.order
  const token = q.token || ''

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseKey) return text(500, 'Server not configured.')
  if (!orderId || !token) return text(400, 'Missing parameters.')

  const supabase = createClient(SUPABASE_URL, supabaseKey)
  const { data: order, error } = await supabase
    .from('orders')
    .select('delivery_photo, delivery_token')
    .eq('id', orderId)
    .single()

  if (error || !order) return text(404, 'Not found.')
  if (!order.delivery_token || order.delivery_token !== token) return text(403, 'Invalid link.')
  if (!order.delivery_photo || !order.delivery_photo.startsWith('data:image/')) {
    return text(404, 'No photo.')
  }

  const comma = order.delivery_photo.indexOf(',')
  const meta = order.delivery_photo.slice(5, comma) // "image/jpeg;base64"
  const mime = meta.split(';')[0] || 'image/jpeg'
  const base64 = order.delivery_photo.slice(comma + 1)

  return {
    statusCode: 200,
    headers: { 'Content-Type': mime, 'Cache-Control': 'private, max-age=86400' },
    body: base64,
    isBase64Encoded: true,
  }
}

function text(statusCode, msg) {
  return { statusCode, headers: { 'Content-Type': 'text/plain' }, body: msg }
}
