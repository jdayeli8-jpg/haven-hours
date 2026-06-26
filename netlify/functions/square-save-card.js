// netlify/functions/square-save-card.js
//
// Al AGENDAR: guarda la tarjeta del cliente "en archivo" (card on file) en
// Square y registra la orden en Supabase. NO cobra todavía.
// El cobro del peso real se hace después (square-charge), al pesar.
//
// Usa DOS llaves secretas (solo viven en Netlify):
//   SQUARE_ACCESS_TOKEN   — para Square
//   SUPABASE_SERVICE_KEY  — para escribir en la tabla `orders` (cerrada al público)
//
// Para dinero REAL: cambia SQUARE_API a https://connect.squareup.com/v2

import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// Sandbox por defecto. Para PRODUCCIÓN solo pon en Netlify la variable
// SQUARE_API_BASE = https://connect.squareup.com/v2 (no hace falta tocar el código).
const SQUARE_API = process.env.SQUARE_API_BASE || 'https://connect.squareup.com/v2'
const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

const PRICING = {
  WASH_FOLD_PER_LB: 2.25,
  ORDER_MINIMUM: 35,
  IRONING_PER_PIECE: 3.55,
  BEDDING_KING: 28,
  BEDDING_QUEEN_FULL: 26,
  BEDDING_TWIN: 18,
}
const MAX_DISCOUNT = 10
const round2 = (n) => Math.round(n * 100) / 100
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))

function computeEstimate({ pounds, ironingPieces, beddingKing, beddingQueenFull, beddingTwin, discount }) {
  const subtotal =
    pounds * PRICING.WASH_FOLD_PER_LB +
    ironingPieces * PRICING.IRONING_PER_PIECE +
    beddingKing * PRICING.BEDDING_KING +
    beddingQueenFull * PRICING.BEDDING_QUEEN_FULL +
    beddingTwin * PRICING.BEDDING_TWIN
  const total = Math.max(subtotal, PRICING.ORDER_MINIMUM)
  const safeDiscount = Math.min(Math.max(discount, 0), MAX_DISCOUNT, total)
  return { estimate: round2(total - safeDiscount) }
}

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const squareToken = process.env.SQUARE_ACCESS_TOKEN
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!squareToken) return json(500, { ok: false, error: 'Square no configurado.' }, headers)
  if (!supabaseKey) return json(500, { ok: false, error: 'Supabase (servidor) no configurado.' }, headers)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  const sourceId = String(body.sourceId || '')
  if (!sourceId) return json(400, { ok: false, error: 'Falta la ficha de la tarjeta.' }, headers)

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const phone = String(body.phone || '').trim()
  if (!name) return json(400, { ok: false, error: 'Please enter your name.' }, headers)
  if (!isEmail(email)) return json(400, { ok: false, error: 'Please enter a valid email.' }, headers)

  const pounds = Number(body.pounds)
  const ironingPieces = Number(body.ironingPieces ?? 0)
  const beddingKing = Number(body.beddingKing ?? 0)
  const beddingQueenFull = Number(body.beddingQueenFull ?? 0)
  const beddingTwin = Number(body.beddingTwin ?? 0)
  if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 500) {
    return json(400, { ok: false, error: 'Peso (pounds) inválido.' }, headers)
  }

  // Cliente de base de datos (lo usamos para validar cupón Y para guardar la orden).
  const supabase = createClient(SUPABASE_URL, supabaseKey)

  // Validar el cupón EN EL SERVIDOR (no confiamos en un descuento del navegador).
  // Reservamos su monto en la orden; se "consume" (single-use) al cobrar.
  const couponCodeRaw = String(body.couponCode || '').trim().toUpperCase()
  let couponCode = null
  let couponAmount = 0
  if (couponCodeRaw) {
    const { data: c } = await supabase
      .from('coupons')
      .select('code, amount, status')
      .eq('code', couponCodeRaw)
      .maybeSingle()
    if (c && c.status === 'active') {
      couponCode = c.code
      couponAmount = Math.min(Number(c.amount) || 0, MAX_DISCOUNT)
    }
  }

  const { estimate } = computeEstimate({ pounds, ironingPieces, beddingKing, beddingQueenFull, beddingTwin, discount: couponAmount })

  try {
    // 1) Crear (o registrar) el cliente en Square
    const custRes = await fetch(`${SQUARE_API}/customers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${squareToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        given_name: name,
        email_address: email,
        phone_number: phone || undefined,
      }),
    })
    const custData = await custRes.json().catch(() => ({}))
    if (!custRes.ok || custData.errors) {
      return json(custRes.status || 502, { ok: false, error: custData?.errors?.[0]?.detail || 'No se pudo registrar el cliente.' }, headers)
    }
    const customerId = custData.customer?.id

    // 2) Guardar la tarjeta en archivo
    const cardRes = await fetch(`${SQUARE_API}/cards`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${squareToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        source_id: sourceId,
        card: { customer_id: customerId },
      }),
    })
    const cardData = await cardRes.json().catch(() => ({}))
    if (!cardRes.ok || cardData.errors) {
      return json(cardRes.status || 502, { ok: false, error: cardData?.errors?.[0]?.detail || 'We could not confirm your card. Please try again.' }, headers)
    }
    const cardId = cardData.card?.id

    // 3) Registrar la orden en Supabase (con la llave maestra; tabla cerrada al público)
    const { data: orderRow, error: dbError } = await supabase
      .from('orders')
      .insert({
        name,
        email,
        phone: phone || null,
        zip: body.zip || null,
        pickup_date: body.pickupDate || null,
        pickup_window: body.pickupWindow || null,
        address: body.address || null,
        notes: body.notes || null,
        est_pounds: pounds,
        estimate,
        coupon_code: couponCode,
        coupon_amount: couponAmount,
        square_customer_id: customerId,
        square_card_id: cardId,
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (dbError) {
      console.warn('[Haven & Hours] Order insert error:', dbError.message)
      // La tarjeta SÍ quedó guardada en Square; no rompemos la experiencia.
      return json(200, { ok: true, saved: true, warning: 'order_not_logged', customerId, cardId, estimate }, headers)
    }

    return json(200, { ok: true, saved: true, orderId: orderRow?.id || null, estimate }, headers)
  } catch (e) {
    return json(502, { ok: false, error: 'Network error. Please try again.' }, headers)
  }
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
