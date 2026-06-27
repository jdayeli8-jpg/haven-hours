// netlify/functions/process-payment.js
//
// Simulated Stripe charge for Haven & Hours Laundry.
// The price is ALWAYS recalculated on the server — never trust a client total.
//
// To go live with real Stripe:
//   1. `npm install stripe`
//   2. Set STRIPE_SECRET_KEY in Netlify > Site settings > Environment variables
//   3. Uncomment the marked block below.

// ---- Pricing (single source of truth on the server) ----------------------
const PRICING = {
  WASH_FOLD_PER_LB: 2.25,
  ORDER_MINIMUM: 35,
  IRONING_PER_PIECE: 3.55,
  BEDDING_KING: 28, // King / Cal-King, per piece
  BEDDING_QUEEN_FULL: 26, // Queen / Full, per piece
  BEDDING_TWIN: 18, // Twin, per piece
}

function computeTotal({ pounds, ironingPieces = 0, beddingKing = 0, beddingQueenFull = 0, beddingTwin = 0 }) {
  const washFold = pounds * PRICING.WASH_FOLD_PER_LB
  const ironing = ironingPieces * PRICING.IRONING_PER_PIECE
  const bedding =
    beddingKing * PRICING.BEDDING_KING +
    beddingQueenFull * PRICING.BEDDING_QUEEN_FULL +
    beddingTwin * PRICING.BEDDING_TWIN
  const subtotal = washFold + ironing + bedding
  const total = Math.max(subtotal, PRICING.ORDER_MINIMUM)
  return {
    breakdown: {
      washFold: round2(washFold),
      ironing: round2(ironing),
      bedding: round2(bedding),
      subtotal: round2(subtotal),
      minimumApplied: subtotal < PRICING.ORDER_MINIMUM,
      orderMinimum: PRICING.ORDER_MINIMUM,
    },
    total: round2(total),
  }
}

const round2 = (n) => Math.round(n * 100) / 100

// ---- Handler --------------------------------------------------------------
export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' }, headers)
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON body.' }, headers)
  }

  // ---- Validation ----
  const pounds = Number(body.pounds)
  const ironingPieces = Number(body.ironingPieces ?? 0)
  const beddingKing = Number(body.beddingKing ?? 0)
  const beddingQueenFull = Number(body.beddingQueenFull ?? 0)
  const beddingTwin = Number(body.beddingTwin ?? 0)

  if (!Number.isFinite(pounds) || pounds <= 0) {
    return json(400, { error: '`pounds` must be a positive number.' }, headers)
  }
  if (pounds > 500) {
    return json(400, { error: '`pounds` is unreasonably large for a single order.' }, headers)
  }
  for (const count of [ironingPieces, beddingKing, beddingQueenFull, beddingTwin]) {
    if (!Number.isInteger(count) || count < 0 || count > 200) {
      return json(400, { error: 'Piece counts must be non-negative integers.' }, headers)
    }
  }

  // ---- Server-side price calculation (ignores any client-sent total) ----
  const { total, breakdown } = computeTotal({ pounds, ironingPieces, beddingKing, beddingQueenFull, beddingTwin })
  const amountInCents = Math.round(total * 100)

  /* ---------------------------------------------------------------------
  // REAL STRIPE — uncomment when STRIPE_SECRET_KEY is configured.
  //
  // import Stripe from 'stripe'  // move to top of file
  //
  // if (process.env.STRIPE_SECRET_KEY) {
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  //   const paymentIntent = await stripe.paymentIntents.create({
  //     amount: amountInCents,
  //     currency: 'usd',
  //     description: `Haven & Hours order — ${pounds} lb wash & fold`,
  //     metadata: { pounds: String(pounds), ironingPieces: String(ironingPieces), beddingKing: String(beddingKing), beddingQueenFull: String(beddingQueenFull), beddingTwin: String(beddingTwin) },
  //     automatic_payment_methods: { enabled: true },
  //   })
  //   return json(200, {
  //     simulated: false,
  //     paymentIntent: {
  //       id: paymentIntent.id,
  //       clientSecret: paymentIntent.client_secret,
  //       amount: paymentIntent.amount,
  //       currency: paymentIntent.currency,
  //       status: paymentIntent.status,
  //     },
  //     total,
  //     breakdown,
  //   }, headers)
  // }
  --------------------------------------------------------------------- */

  // ---- Simulated PaymentIntent ----
  const paymentIntent = {
    id: 'pi_sim_' + Math.random().toString(36).slice(2, 12),
    object: 'payment_intent',
    amount: amountInCents, // cents, like Stripe
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    description: `Haven & Hours order — ${pounds} lb wash & fold`,
    livemode: false,
  }

  return json(200, { simulated: true, paymentIntent, total, breakdown }, headers)
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
