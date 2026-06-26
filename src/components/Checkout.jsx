import { useState, useEffect, useRef } from 'react'
import { useStore, quoteTotal, PROMO, bestDiscount } from '../context/StoreContext.jsx'
import { SQUARE_APP_ID, SQUARE_LOCATION_ID } from '../lib/square.js'
import PolicyModal from './PolicyModal.jsx'
import { TermsModal, PrivacyModal } from './LegalDocs.jsx'

/**
 * Customer-facing checkout, demo mode — Poplin-style.
 *
 * Laundry is priced by weight, which isn't known until we weigh it.
 * So at booking we AUTHORIZE the customer's payment method against an estimate;
 * we do NOT charge yet. The real charge happens after weighing (from Admin),
 * and the customer then sees an itemized receipt with the exact total.
 */

const fmt = (n) => '$' + n.toFixed(2)

export default function Checkout({ estPounds = 14 }) {
  const { order, recordAuthorization, promoUnlocked, referredBy, couponCode: myCouponCode } = useStore()
  const [step, setStep] = useState('authorize')
  const [method, setMethod] = useState(null)
  const [saveCard, setSaveCard] = useState(true)
  const [policyAgreed, setPolicyAgreed] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const cardRef = useRef(null)
  const cardContainerRef = useRef(null)
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [coupon, setCoupon] = useState('')
  const [couponInfo, setCouponInfo] = useState(null) // null | { valid, amount, status }
  const [couponChecking, setCouponChecking] = useState(false)

  const services = order?.services || {}
  const quote = quoteTotal(estPounds, services)
  const couponValid = !!(couponInfo && couponInfo.valid)
  const offer = couponValid
    ? { amount: Math.min(couponInfo.amount, quote.total), kind: 'welcome', label: 'Welcome coupon' }
    : bestDiscount({ promoUnlocked: false, referredBy, orderTotal: quote.total })
  const discount = offer.amount
  const estimate = Math.max(quote.total - discount, 0)

  // Inicializa la caja segura de Square una sola vez.
  useEffect(() => {
    let card
    let cancelled = false
    async function init() {
      if (!window.Square) {
        setError('No se pudo cargar el sistema de pagos. Recarga la página.')
        return
      }
      try {
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID)
        card = await payments.card()
        if (cancelled) return
        await card.attach(cardContainerRef.current)
        cardRef.current = card
        setCardReady(true)
      } catch (e) {
        console.warn('[Haven & Hours] Square init error:', e)
        setError('No se pudo iniciar el formulario de pago. Recarga la página.')
      }
    }
    init()
    return () => {
      cancelled = true
      if (card) {
        try {
          card.destroy()
        } catch {}
      }
    }
  }, [])

  // Pre-llenar la casilla con el código propio del visitante (si ya se registró).
  useEffect(() => {
    if (myCouponCode) setCoupon(myCouponCode)
  }, [myCouponCode])

  // Validar el cupón en vivo contra el servidor mientras lo escriben.
  useEffect(() => {
    const code = coupon.trim().toUpperCase()
    if (!code) {
      setCouponInfo(null)
      return
    }
    let cancelled = false
    setCouponChecking(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          setCouponInfo(
            data.ok ? { valid: !!data.valid, amount: Number(data.amount) || 0, status: data.status } : null
          )
        }
      } catch {
        if (!cancelled) setCouponInfo(null)
      } finally {
        if (!cancelled) setCouponChecking(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [coupon])

  const payWithCard = async () => {
    setError('')
    if (!policyAgreed) {
      return setError('Please agree to the Policy, Terms of Service, and Privacy Policy to continue.')
    }
    if (!contact.name.trim()) return setError('Please enter your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      return setError('Please enter a valid email.')
    }
    if (contact.phone.replace(/\D/g, '').length < 7) {
      return setError('Please enter a valid phone number.')
    }
    if (!cardRef.current) {
      return setError('The payment form is still loading — please wait a moment.')
    }
    setPaying(true)
    try {
      const tokenResult = await cardRef.current.tokenize()
      if (tokenResult.status !== 'OK') {
        setPaying(false)
        return setError('We could not verify your card. Please check the details and try again.')
      }
      const resp = await fetch('/api/square-save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          name: contact.name.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim(),
          orderCode: order?.id,
          pickupDate: order?.pickup?.date,
          pickupWindow: order?.pickup?.window,
          address: order?.pickup?.address,
          notes: order?.pickup?.notes,
          pounds: estPounds,
          ironingPieces: services.ironingPieces || 0,
          beddingKing: services.beddingKing || 0,
          beddingQueenFull: services.beddingQueenFull || 0,
          beddingTwin: services.beddingTwin || 0,
          couponCode: couponValid ? coupon.trim().toUpperCase() : undefined,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      setPaying(false)
      if (!resp.ok || !data.ok) {
        return setError(data.error || 'We could not confirm your card. Please try again.')
      }
      setMethod('card')
      recordAuthorization({
        method: 'card',
        savedCard: true,
        estimate: data.estimate ?? estimate,
        discount,
        discountLabel: offer.label,
        orderId: data.orderId || null,
        authorizedAt: new Date().toISOString(),
      })
      setStep('done')
    } catch (e) {
      setPaying(false)
      setError('There was a network problem. Please try again.')
    }
  }

  const authorize = (chosen) => {
    setError('')
    if (!policyAgreed) {
      return setError('Please agree to the Policy, Terms of Service, and Privacy Policy to continue.')
    }
    setMethod(chosen)
    recordAuthorization({
      method: chosen,
      savedCard: true,
      estimate,
      discount,
      discountLabel: offer.label,
      authorizedAt: new Date().toISOString(),
    })
    setStep('done')
  }

  if (step === 'done') return <Authorized method={method} estimate={estimate} />

  return (
    <section className="card mt-6">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Secure checkout</p>
        <span className="text-[11px] text-stone2">🔒 Powered by Square · Sandbox</span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="font-display text-2xl">Estimated total</span>
        <span className="font-display text-3xl text-iris">~{fmt(estimate)}</span>
      </div>
      <p className="mt-1 text-[12px] text-stone2">
        Based on ~{estPounds} lb wash &amp; fold
        {discount > 0 && ` · ${fmt(discount)} ${offer.kind === 'referral' ? 'referral credit' : 'welcome coupon'} applied`}
        {quote.minimumApplied && ' · $35 minimum'}
      </p>
      {promoUnlocked && referredBy && (
        <p className="mt-1 text-[11px] italic text-stone2">
          One discount per order — we’ve applied the {offer.kind === 'referral' ? 'referral credit' : 'welcome coupon'} (the best one for you).
        </p>
      )}

      <div className="mt-4 rounded-xl border border-iris/20 bg-iris-tint/30 px-4 py-3">
        <p className="text-[13px] leading-relaxed text-ink/80">
          <span className="font-bold">You won’t be charged yet.</span> We confirm your card now,
          then weigh your laundry at pickup. You’ll get the exact total and an itemized receipt —
          and only then are you charged.
        </p>
      </div>

      {/* Mandatory policy consent — required before any payment method */}
      <label className="mt-5 flex items-start gap-3 text-[13px] text-ink/80">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-iris"
          checked={policyAgreed}
          onChange={(e) => setPolicyAgreed(e.target.checked)}
        />
        <span>
          I have read and agree to the{' '}
          <button
            type="button"
            onClick={() => setPolicyOpen(true)}
            className="font-bold text-iris underline underline-offset-2 hover:text-iris-deep"
          >
            Garment Care &amp; Claims Policy
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="font-bold text-iris underline underline-offset-2 hover:text-iris-deep"
          >
            Terms of Service
          </button>
          , and{' '}
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="font-bold text-iris underline underline-offset-2 hover:text-iris-deep"
          >
            Privacy Policy
          </button>
          .
        </span>
      </label>

      {/* Apple Pay / Google Pay eran solo demo — se quitaron para no confundir.
          Las carteras reales necesitan configuración extra; la tarjeta de abajo ya funciona. */}
      <div className="mt-4 rounded-xl border border-ink/10 bg-ivory/60 px-4 py-3 text-center">
        <p className="text-[12px] text-stone2">
          <span className="font-bold text-ink/70">Apple Pay &amp; Google Pay</span> coming soon —
          for now, please use a card below.
        </p>
      </div>

      <input
        aria-label="Full name"
        placeholder="Full name"
        className="field"
        value={contact.name}
        onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
      />
      <div className="mt-2 flex gap-2">
        <input
          type="email"
          aria-label="Email"
          placeholder="Email"
          className="field"
          value={contact.email}
          onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
        />
        <input
          inputMode="tel"
          aria-label="Phone"
          placeholder="Phone"
          className="field"
          value={contact.phone}
          onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
        />
      </div>

      <div className="mt-2">
        <input
          aria-label="Coupon code"
          placeholder="Coupon code (optional)"
          className="field uppercase"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
        {coupon.trim() && (
          <p className="mt-1 text-[12px]">
            {couponChecking ? (
              <span className="text-stone2">Checking code…</span>
            ) : couponValid ? (
              <span className="font-bold text-iris">
                ✓ {fmt(Math.min(couponInfo.amount, quote.total))} off applied
              </span>
            ) : (
              <span className="text-[#8C3A2B]">That code isn’t valid or has already been used.</span>
            )}
          </p>
        )}
      </div>

      <div
        ref={cardContainerRef}
        className="field"
        style={{ minHeight: '52px', padding: '6px 10px' }}
        aria-label="Card details"
      />
      {!cardReady && !error && (
        <p className="mt-2 text-[12px] text-stone2">Loading secure card field…</p>
      )}

      <label className="mt-4 flex items-start gap-3 text-[13px] text-ink/75">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-iris"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
        />
        Save this card securely on file for future weight adjustments and recurring orders
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={payWithCard}
        disabled={paying || !cardReady}
        className={'btn-primary mt-5 w-full ' + (policyAgreed && cardReady && !paying ? '' : 'opacity-40')}
      >
        {paying ? 'Confirming…' : 'Confirm card & schedule'}
      </button>
      <p className="mt-3 text-center text-[11px] text-stone2">
        🔒 Square Sandbox · test mode · no real charge · card data never touches our servers
      </p>

      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </section>
  )
}

function Authorized({ method, estimate }) {
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const label = method === 'apple' ? 'Apple Pay' : method === 'google' ? 'Google Pay' : 'your card'

  return (
    <section className="card mt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-iris-tint">
        <span className="text-2xl text-iris-deep">✓</span>
      </div>
      <h2 className="mt-4 font-display text-3xl">Pickup scheduled.</h2>
      <p className="mt-2 text-[15px] text-ink/70">
        {label} is confirmed for your estimate of ~{fmt(estimate)}.{' '}
        <span className="font-bold text-ink">No charge yet</span> — we’ll weigh your laundry at
        pickup, then send your exact total and an itemized receipt before charging.
      </p>

      {saved ? (
        <p className="mt-6 rounded-xl bg-iris-tint/40 px-4 py-3 text-sm font-bold text-iris-deep">
          Account created — next time, checkout is one tap.
        </p>
      ) : (
        <div className="mt-7 rounded-2xl border border-ink/10 bg-ivory/70 p-5 text-left">
          <p className="font-display text-lg">Save your details for next time?</p>
          <p className="mt-1 text-[13px] text-ink/70">
            Set a password to track orders and reorder in one tap. Totally optional.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              aria-label="Create a password"
              placeholder="Create a password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => password.length >= 4 && setSaved(true)}
              className="btn-primary whitespace-nowrap"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function formatCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExp(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length >= 3 ? d.slice(0, 2) + ' / ' + d.slice(2) : d
}
