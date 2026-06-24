import { createContext, useContext, useMemo, useState } from 'react'
import { saveLead } from '../lib/supabase.js'
import { sendWelcomeEmail } from '../lib/email.js'

/**
 * In-memory "database" for the demo.
 * One active order, shared live between /dashboard (customer) and /admin.
 */

export const PRICING = {
  WASH_FOLD_PER_LB: 2.25,
  ORDER_MINIMUM: 35,
  IRONING_PER_PIECE: 3.55,
  BEDDING_KING: 28, // King / Cal-King
  BEDDING_QUEEN_FULL: 26, // Queen / Full
  BEDDING_TWIN: 18,
}

export const STATUS_STEPS = [
  'Order Placed & Scheduled',
  'Collected by Haven & Hours',
  'In Laundry Atelier (Washing / Ironing)',
  'En Route for Delivery',
]

// Inline SVG "photo" of a damaged garment, used by the simulated incident.
const DAMAGED_SHIRT_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 220'>
  <rect width='320' height='220' fill='#EAE4D8'/>
  <g transform='translate(60,30)'>
    <path d='M40 0 L70 14 L100 0 L140 22 L122 56 L104 46 L104 150 L36 150 L36 46 L18 56 L0 22 Z'
          fill='#FBF9F4' stroke='#23201C' stroke-opacity='.25' stroke-width='2'/>
    <path d='M70 14 q-9 14 0 26 q9 -12 0 -26' fill='#EAE4D8'/>
    <path d='M58 92 q10 -8 20 0 q-6 12 -20 14 q-8 -8 0 -14' fill='#B3543F' opacity='.85'/>
    <path d='M64 96 l10 6 M60 102 l14 2' stroke='#8C3A2B' stroke-width='2' stroke-linecap='round'/>
  </g>
  <text x='160' y='204' text-anchor='middle' font-family='monospace' font-size='11' fill='#8B8276'>IMG_0412 — intake inspection</text>
</svg>`

export const INCIDENT_PHOTO_DATA_URI =
  'data:image/svg+xml;utf8,' + encodeURIComponent(DAMAGED_SHIRT_SVG)

export function quoteTotal(
  pounds,
  { ironingPieces = 0, beddingKing = 0, beddingQueenFull = 0, beddingTwin = 0 } = {}
) {
  const subtotal =
    pounds * PRICING.WASH_FOLD_PER_LB +
    ironingPieces * PRICING.IRONING_PER_PIECE +
    beddingKing * PRICING.BEDDING_KING +
    beddingQueenFull * PRICING.BEDDING_QUEEN_FULL +
    beddingTwin * PRICING.BEDDING_TWIN
  return {
    subtotal: round2(subtotal),
    total: round2(Math.max(subtotal, PRICING.ORDER_MINIMUM)),
    minimumApplied: subtotal < PRICING.ORDER_MINIMUM,
  }
}

const round2 = (n) => Math.round(n * 100) / 100

const StoreContext = createContext(null)

export const PROMO = {
  code: 'HAVEN10',
  amount: 10,
  label: '$10 welcome coupon — first wash only',
}

// Approved service-area ZIP codes. Edit this list as coverage expands.
export const SERVICE_ZIPS = ['92506', '92508', '92501', '92504', '92507']

// Referral program: give a neighbor $10, get $10 yourself.
export const REFERRAL = {
  giveAmount: 10,
  getAmount: 10,
  // A friendly, unique-looking code for the demo. Real codes come with the database.
  sampleCode: 'HAVEN-MARISOL-10',
  baseUrl: 'https://haven-hours.netlify.app/?ref=',
}

/**
 * Discounts never stack. A customer gets ONE discount per order — the larger
 * of the welcome coupon and the referral credit. Returns the chosen discount
 * and a label so the UI can explain which one applied.
 */
export function bestDiscount({ promoUnlocked, referredBy, orderTotal }) {
  const candidates = []
  if (promoUnlocked) {
    candidates.push({ amount: PROMO.amount, kind: 'welcome', label: 'Welcome coupon' })
  }
  if (referredBy) {
    candidates.push({ amount: REFERRAL.giveAmount, kind: 'referral', label: 'Referral credit' })
  }
  if (candidates.length === 0) return { amount: 0, kind: null, label: null }
  // Pick the largest; on a tie, prefer the referral (rewards word-of-mouth).
  candidates.sort((a, b) => b.amount - a.amount || (a.kind === 'referral' ? -1 : 1))
  const chosen = candidates[0]
  const amount = Math.min(chosen.amount, orderTotal)
  return { ...chosen, amount }
}

export function StoreProvider({ children }) {
  const [order, setOrder] = useState(null)
  // Captured emails (lead database for the demo — lives in this session).
  const [leads, setLeads] = useState([])
  // Whether the visitor has unlocked the $10 welcome coupon.
  const [promoUnlocked, setPromoUnlocked] = useState(false)
  // The visitor's OWN unique welcome coupon code (set after they sign up).
  const [couponCode, setCouponCode] = useState(null)
  // Whether the visitor arrived via a referral link (?ref=...).
  const [referredBy, setReferredBy] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('ref') || null
    } catch {
      return null
    }
  })

  const captureLead = async (email, opts = {}) => {
    const clean = String(email || '').trim().toLowerCase()
    if (!clean) return null
    setLeads((prev) => (prev.includes(clean) ? prev : [...prev, clean]))
    setPromoUnlocked(true)
    // Guardar el correo (y datos extra) en Supabase, sin bloquear al cliente.
    // Cada formulario puede pasar su propia etiqueta (source) y campos.
    saveLead({ email: clean, source: 'welcome_coupon', referralCode: referredBy, ...opts })

    // Solo el cupón de bienvenida genera código + correo (no lista de espera,
    // referidos ni negocios).
    const source = opts.source ?? 'welcome_coupon'
    if (source !== 'welcome_coupon') return null

    // Pedir el cupón ÚNICO de esta persona (se crea/guarda en la base).
    let code = null
    try {
      const res = await fetch('/api/issue-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok && data.code) code = data.code
    } catch {
      // Sin red: no rompemos nada; el correo usará el código de respaldo.
    }
    setCouponCode(code)
    // Enviar el correo de bienvenida CON ese código único.
    sendWelcomeEmail(clean, code || undefined)
    return code
  }

  const placeOrder = (pickup, services, preferences) => {
    setOrder({
      id: 'HH-' + String(Math.floor(1000 + Math.random() * 9000)),
      placedAt: new Date().toISOString(),
      pickup, // { date, window, address, notes }
      services, // { ironingPieces, beddingKing, beddingQueenFull, beddingTwin, dryCleaning }
      preferences, // { detergent, softener }
      statusIndex: 0,
      finalPounds: null,
      authorization: null, // { method, savedCard, estimate, authorizedAt } — at booking
      incident: null, // { photo, note, sentAt, decision: null | 'approve' | 'return' }
      payment: null, // { intentId, amount, total, breakdown, chargedAt } — after weighing
    })
  }

  const advanceStatus = () =>
    setOrder((o) =>
      o ? { ...o, statusIndex: Math.min(o.statusIndex + 1, STATUS_STEPS.length - 1) } : o
    )

  const setFinalPounds = (pounds) =>
    setOrder((o) => (o ? { ...o, finalPounds: pounds } : o))

  const reportIncident = (note) =>
    setOrder((o) =>
      o
        ? {
            ...o,
            incident: {
              photo: INCIDENT_PHOTO_DATA_URI,
              note:
                note ||
                'Pre-existing stain found on a white cotton shirt during intake inspection. Washing may set or partially lift it — we can’t guarantee the outcome.',
              sentAt: new Date().toISOString(),
              decision: null,
            },
          }
        : o
    )

  const resolveIncident = (decision) =>
    setOrder((o) =>
      o && o.incident ? { ...o, incident: { ...o.incident, decision } } : o
    )

  const recordPayment = (payment) =>
    setOrder((o) => (o ? { ...o, payment } : o))

  const recordAuthorization = (authorization) =>
    setOrder((o) => (o ? { ...o, authorization } : o))

  const resetOrder = () => setOrder(null)

  const value = useMemo(
    () => ({
      order,
      placeOrder,
      advanceStatus,
      setFinalPounds,
      reportIncident,
      resolveIncident,
      recordPayment,
      recordAuthorization,
      resetOrder,
      leads,
      promoUnlocked,
      couponCode,
      referredBy,
      captureLead,
    }),
    [order, leads, promoUnlocked, referredBy, couponCode]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
