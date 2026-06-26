// netlify/functions/square-charge.js
//
// PASO 3C-3 — COBRAR la tarjeta guardada (card on file).
//
// Recibe el ID de una orden real y el PESO real (libras). El servidor:
//   1) Busca la orden en Supabase (NUNCA confía en el navegador para la tarjeta).
//   2) Recalcula el total real ($2.25/lb, mínimo $35).
//   3) Cobra la tarjeta que ya quedó guardada en Square (autocomplete: true).
//   4) Marca la orden como "paid" y guarda el monto + el ID del pago.
//
// Llaves SECRETAS (solo viven en Netlify):
//   SQUARE_ACCESS_TOKEN   — para Square
//   SUPABASE_SERVICE_KEY  — para leer/escribir la tabla `orders` (cerrada al público)
//   ADMIN_PASSCODE (opcional) — si la pones en Netlify, reemplaza al código demo 92507
//
// Para dinero REAL: cambia SQUARE_API y SQUARE_LOCATION_ID por los de Producción.

import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// Sandbox por defecto. Para PRODUCCIÓN, en Netlify pon:
//   SQUARE_API_BASE    = https://connect.squareup.com/v2
//   SQUARE_LOCATION_ID = (tu Location ID real de Producción)
const SQUARE_API = process.env.SQUARE_API_BASE || 'https://connect.squareup.com/v2'
const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || 'LSGM5HV2V8KRA'

const PER_LB = 2.25
const MINIMUM = 35
const round2 = (n) => Math.round(n * 100) / 100

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const squareToken = process.env.SQUARE_ACCESS_TOKEN
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE
  if (!squareToken) return json(500, { ok: false, error: 'Square no configurado.' }, headers)
  if (!supabaseKey) return json(500, { ok: false, error: 'Supabase (servidor) no configurado.' }, headers)
  if (!ADMIN_PASSCODE) return json(500, { ok: false, error: 'Admin sin configurar (ADMIN_PASSCODE).' }, headers)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  // Candado de admin (mismo código del panel; cámbialo por ADMIN_PASSCODE en 3E).
  if (String(body.passcode || '') !== ADMIN_PASSCODE) {
    return json(401, { ok: false, error: 'Código de admin incorrecto.' }, headers)
  }

  const orderId = body.orderId
  const pounds = Number(body.pounds)
  if (!orderId) return json(400, { ok: false, error: 'Falta el ID de la orden.' }, headers)
  if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 500) {
    return json(400, { ok: false, error: 'Peso (libras) inválido.' }, headers)
  }

  // Cargo EXTRA opcional (tintorería, etc.). El servidor lo valida.
  const extra = round2(Number(body.extraCharge ?? 0))
  if (!Number.isFinite(extra) || extra < 0 || extra > 1000) {
    return json(400, { ok: false, error: 'Cargo extra inválido (debe ser entre $0 y $1000).' }, headers)
  }
  const extraNote = String(body.extraNote || '').trim().slice(0, 120)

  const supabase = createClient(SUPABASE_URL, supabaseKey)

  // 1) Traer la orden (la tarjeta y el cliente salen de la base, no del navegador)
  const { data: order, error: readErr } = await supabase
    .from('orders')
    .select('id, name, square_customer_id, square_card_id, status, coupon_code, coupon_amount')
    .eq('id', orderId)
    .single()

  if (readErr || !order) return json(404, { ok: false, error: 'No encontré esa orden.' }, headers)
  if (order.status === 'paid') return json(409, { ok: false, error: 'Esa orden ya fue cobrada.' }, headers)
  if (!order.square_card_id || !order.square_customer_id) {
    return json(400, { ok: false, error: 'Esta orden no tiene tarjeta guardada.' }, headers)
  }

  // 2) Calcular el total REAL en el servidor (nunca confiar en el navegador)
  const washFold = round2(Math.max(pounds * PER_LB, MINIMUM))
  const baseTotal = round2(washFold + extra)

  // 2b) Cupón: lo "consumimos" aquí (single-use). Marcamos redeemed SOLO si sigue
  // activo; si el cobro falla más abajo, lo regresamos a activo (rollback).
  let couponDiscount = 0
  let couponRedeemed = false
  if (order.coupon_code) {
    const { data: redeemed } = await supabase
      .from('coupons')
      .update({ status: 'redeemed', order_id: String(order.id), redeemed_at: new Date().toISOString() })
      .eq('code', order.coupon_code)
      .eq('status', 'active')
      .select('amount')
    if (redeemed && redeemed.length > 0) {
      couponRedeemed = true
      const amt = Number(order.coupon_amount) || Number(redeemed[0].amount) || 0
      couponDiscount = round2(Math.min(amt, baseTotal))
    }
  }

  const total = round2(Math.max(baseTotal - couponDiscount, 0))
  const amountCents = Math.round(total * 100)

  try {
    // 3) Cobrar la tarjeta guardada
    const payRes = await fetch(`${SQUARE_API}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${squareToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        source_id: order.square_card_id,
        customer_id: order.square_customer_id,
        amount_money: { amount: amountCents, currency: 'USD' },
        location_id: SQUARE_LOCATION_ID,
        autocomplete: true,
        reference_id: String(order.id).slice(0, 40),
        note:
          `Haven & Hours - W&F ${pounds}lb $${washFold.toFixed(2)}` +
          (extra > 0 ? ` + extra $${extra.toFixed(2)}${extraNote ? ' (' + extraNote + ')' : ''}` : '') +
          (couponDiscount > 0 ? ` - coupon $${couponDiscount.toFixed(2)}` : ''),
      }),
    })
    const payData = await payRes.json().catch(() => ({}))
    if (!payRes.ok || payData.errors) {
      // El cobro falló: devolvemos el cupón a "activo" para que no se pierda.
      if (couponRedeemed) {
        await supabase
          .from('coupons')
          .update({ status: 'active', order_id: null, redeemed_at: null })
          .eq('code', order.coupon_code)
      }
      return json(payRes.status || 502, {
        ok: false,
        error: payData?.errors?.[0]?.detail || 'No se pudo cobrar la tarjeta.',
      }, headers)
    }
    const paymentId = payData.payment?.id || null
    const paymentStatus = payData.payment?.status || null

    // 4) Marcar la orden como pagada
    const { error: updErr } = await supabase
      .from('orders')
      .update({
        final_pounds: pounds,
        final_amount: total,
        extra_amount: extra,
        extra_note: extraNote || null,
        coupon_discount: couponDiscount,
        square_payment_id: paymentId,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updErr) {
      // El cobro SÍ ocurrió; avisamos pero no lo tratamos como falla de cobro.
      console.warn('[Haven & Hours] Cobro OK, pero no se pudo actualizar la orden:', updErr.message)
      return json(200, { ok: true, charged: true, washFold, extra, couponDiscount, total, paymentId, paymentStatus, name: order.name, warning: 'order_not_updated' }, headers)
    }

    return json(200, { ok: true, charged: true, washFold, extra, couponDiscount, total, paymentId, paymentStatus, name: order.name }, headers)
  } catch (e) {
    // Error de red: regresamos el cupón a activo si lo habíamos consumido.
    if (couponRedeemed) {
      await supabase
        .from('coupons')
        .update({ status: 'active', order_id: null, redeemed_at: null })
        .eq('code', order.coupon_code)
    }
    return json(502, { ok: false, error: 'Error de red al cobrar. Intenta otra vez.' }, headers)
  }
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
