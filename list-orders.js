// netlify/functions/check-coupon.js
//
// PASO 3D-2 — Dice si un código de cupón es válido (activo) y por cuánto.
// Solo LEE; no cobra ni marca nada como usado. Sirve para mostrar al cliente
// "✓ $10 off" en vivo mientras escribe su código en el checkout.
//
// Llave SECRETA (solo en Netlify): SUPABASE_SERVICE_KEY

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseKey) return json(500, { ok: false, error: 'Supabase (servidor) no configurado.' }, headers)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  const code = String(body.code || '').trim().toUpperCase()
  if (!code) return json(200, { ok: true, valid: false, reason: 'empty' }, headers)

  const supabase = createClient(SUPABASE_URL, supabaseKey)
  const { data, error } = await supabase
    .from('coupons')
    .select('code, amount, status')
    .eq('code', code)
    .maybeSingle()

  if (error) return json(502, { ok: false, error: error.message }, headers)
  if (!data) return json(200, { ok: true, valid: false, reason: 'not_found' }, headers)

  return json(200, {
    ok: true,
    valid: data.status === 'active',
    amount: Number(data.amount) || 0,
    status: data.status,
  }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
