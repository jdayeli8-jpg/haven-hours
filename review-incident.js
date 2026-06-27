// netlify/functions/ready-image.js
//
// Sirve la foto de "ropa lista" como URL real, para que se vea en el correo.
// Solo funciona con el token correcto. Espejo de incident-photo.js.
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
    .select('ready_photo, ready_token')
    .eq('id', orderId)
    .single()

  if (error || !order) return text(404, 'Not found.')
  if (!order.ready_token || order.ready_token !== token) return text(403, 'Invalid link.')
  if (!order.ready_photo || !order.ready_photo.startsWith('data:image/')) {
    return text(404, 'No photo.')
  }

  const comma = order.ready_photo.indexOf(',')
  const meta = order.ready_photo.slice(5, comma) // "image/jpeg;base64"
  const mime = meta.split(';')[0] || 'image/jpeg'
  const base64 = order.ready_photo.slice(comma + 1)

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
