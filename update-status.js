// netlify/functions/issue-coupon.js
//
// PASO 3D-1 — Genera (o reúsa) un cupón ÚNICO por persona.
//
// Regla: una persona (email) = UN cupón de bienvenida.
//   - Si ya tiene uno activo, lo devolvemos (no creamos otro).
//   - Si ya lo usó (redeemed), avisamos (no se le da otro: "first wash only").
//   - Si no tiene, generamos un código único y lo guardamos.
//
// Llave SECRETA (solo en Netlify): SUPABASE_SERVICE_KEY
// La tabla `coupons` está cerrada al público; solo el servidor la toca.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const AMOUNT = 10
// Alfabeto sin caracteres confusos (sin 0/O, 1/I/L) para que sea fácil de leer/teclear.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode() {
  let s = ''
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return 'HAVEN-' + s
}

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))

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

  const email = String(body.email || '').trim().toLowerCase()
  if (!isEmail(email)) return json(400, { ok: false, error: 'Email inválido.' }, headers)

  const supabase = createClient(SUPABASE_URL, supabaseKey)

  // 1) ¿Esta persona ya tiene un cupón de bienvenida? (uno por persona)
  const { data: existing } = await supabase
    .from('coupons')
    .select('code, amount, status')
    .eq('email', email)
    .eq('kind', 'welcome')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing && existing.code) {
    return json(200, {
      ok: true,
      code: existing.code,
      amount: existing.amount,
      reused: true,
      alreadyUsed: existing.status === 'redeemed',
    }, headers)
  }

  // 2) No tiene: generamos un código único (reintenta si por azar choca).
  let code = null
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = randomCode()
    const { error: insErr } = await supabase
      .from('coupons')
      .insert({ code: candidate, email, amount: AMOUNT, kind: 'welcome', status: 'active' })
    if (!insErr) {
      code = candidate
      break
    }
    // 23505 = código repetido (unique_violation) → reintentar con otro
    if (insErr.code !== '23505') {
      return json(502, { ok: false, error: insErr.message }, headers)
    }
  }
  if (!code) return json(500, { ok: false, error: 'No se pudo generar un código único.' }, headers)

  return json(200, { ok: true, code, amount: AMOUNT, reused: false, alreadyUsed: false }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
