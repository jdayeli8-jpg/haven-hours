// netlify/functions/square-payment.js
//
// Autoriza el pago de un estimado con Square (modo Sandbox = dinero falso).
//
// Flujo tipo Poplin: AUTORIZA ahora (retiene), NO cobra todavía.
// El cobro real del peso exacto vendrá después, al pesar (siguiente paso).
//
// La llave SECRETA (SQUARE_ACCESS_TOKEN) vive solo en Netlify.
// El monto SIEMPRE se recalcula aquí en el servidor — nunca se confía
// en un total que venga del navegador.
//
// Para dinero REAL: cambia SQUARE_API a https://connect.squareup.com/v2/payments
// y usa el Location ID de Production.

import { randomUUID } from 'node:crypto'

const SQUARE_API = (process.env.SQUARE_API_BASE || 'https://connect.squareup.com/v2') + '/payments'
const LOCATION_ID = process.env.SQUARE_LOCATION_ID || 'LSGM5HV2V8KRA'

const PRICING = {
  WASH_FOLD_PER_LB: 2.25,
  ORDER_MINIMUM: 35,
  IRONING_PER_PIECE: 3.55,
  BEDDING_KING: 28,
  BEDDING_QUEEN_FULL: 26,
  BEDDING_TWIN: 18,
}
const MAX_DISCOUNT = 10 // tope de seguridad: nadie puede "reclamar" más de $10

const round2 = (n) => Math.round(n * 100) / 100

function computeEstimate({ pounds, ironingPieces, beddingKing, beddingQueenFull, beddingTwin, discount }) {
  const subtotal =
    pounds * PRICING.WASH_FOLD_PER_LB +
    ironingPieces * PRICING.IRONING_PER_PIECE +
    beddingKing * PRICING.BEDDING_KING +
    beddingQueenFull * PRICING.BEDDING_QUEEN_FULL +
    beddingTwin * PRICING.BEDDING_TWIN
  const total = Math.max(subtotal, PRICING.ORDER_MINIMUM)
  const safeDiscount = Math.min(Math.max(discount, 0), MAX_DISCOUNT, total)
  return {
    total: round2(total),
    discount: round2(safeDiscount),
    estimate: round2(total - safeDiscount),
    minimumApplied: subtotal < PRICING.ORDER_MINIMUM,
  }
}

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  if (!accessToken) {
    return json(500, { ok: false, error: 'Square no configurado (falta SQUARE_ACCESS_TOKEN).' }, headers)
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  const sourceId = String(body.sourceId || '')
  if (!sourceId) {
    return json(400, { ok: false, error: 'Falta la ficha de la tarjeta.' }, headers)
  }

  const pounds = Number(body.pounds)
  const ironingPieces = Number(body.ironingPieces ?? 0)
  const beddingKing = Number(body.beddingKing ?? 0)
  const beddingQueenFull = Number(body.beddingQueenFull ?? 0)
  const beddingTwin = Number(body.beddingTwin ?? 0)
  const discount = Number(body.discount ?? 0)

  if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 500) {
    return json(400, { ok: false, error: 'Peso (pounds) inválido.' }, headers)
  }
  for (const c of [ironingPieces, beddingKing, beddingQueenFull, beddingTwin]) {
    if (!Number.isFinite(c) || c < 0 || c > 200) {
      return json(400, { ok: false, error: 'Cantidades inválidas.' }, headers)
    }
  }

  const calc = computeEstimate({ pounds, ironingPieces, beddingKing, beddingQueenFull, beddingTwin, discount })
  const amountInCents = Math.round(calc.estimate * 100)

  try {
    const res = await fetch(SQUARE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: randomUUID(),
        amount_money: { amount: amountInCents, currency: 'USD' },
        location_id: LOCATION_ID,
        autocomplete: false, // AUTORIZAR (retener), NO cobrar todavía
        note: `Haven & Hours — estimado ~${pounds} lb`,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok || data.errors) {
      const msg = data?.errors?.[0]?.detail || 'Square rechazó la autorización.'
      return json(res.status || 502, { ok: false, error: msg }, headers)
    }

    const payment = data.payment || {}
    return json(200, {
      ok: true,
      authorized: true,
      paymentId: payment.id || null,
      status: payment.status || null, // "APPROVED" cuando se autoriza
      estimate: calc.estimate,
      total: calc.total,
      discount: calc.discount,
      minimumApplied: calc.minimumApplied,
    }, headers)
  } catch (e) {
    return json(502, { ok: false, error: 'Error de red al contactar Square.' }, headers)
  }
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
