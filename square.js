import { useState, useEffect, useRef } from 'react'
import { useStore, PROMO } from '../context/StoreContext.jsx'

/**
 * Lead capture for the $10 first-order promo.
 * Two surfaces, one shared store:
 *   1. A dismissible sticky banner at the very top.
 *   2. An exit-intent modal (fires when the cursor leaves toward the tab bar
 *      on desktop, or after a long idle on touch devices).
 * Once the email is captured, both retire for the session.
 */

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export default function PromoCapture() {
  const { promoUnlocked, captureLead } = useStore()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const modalShown = useRef(false)

  // Exit-intent (desktop) + idle fallback (mobile).
  useEffect(() => {
    if (promoUnlocked) return

    const trigger = () => {
      if (modalShown.current || promoUnlocked) return
      modalShown.current = true
      setModalOpen(true)
    }

    const onMouseOut = (e) => {
      if (e.clientY <= 0) trigger() // cursor left through the top
    }
    document.addEventListener('mouseout', onMouseOut)

    // Mobile has no exit-intent; show after 25s of browsing instead.
    const idle = setTimeout(trigger, 25000)

    return () => {
      document.removeEventListener('mouseout', onMouseOut)
      clearTimeout(idle)
    }
  }, [promoUnlocked])

  if (promoUnlocked) return null

  return (
    <>
      {!bannerDismissed && (
        <PromoBanner onDismiss={() => setBannerDismissed(true)} onClaim={captureLead} />
      )}
      {modalOpen && (
        <PromoModal onClose={() => setModalOpen(false)} onClaim={captureLead} />
      )}
    </>
  )
}

/* ---------------- Sticky banner ---------------- */
function PromoBanner({ onDismiss, onClaim }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  const [issuedCode, setIssuedCode] = useState('')
  const [claiming, setClaiming] = useState(false)

  const claim = async () => {
    if (!isValidEmail(email)) return setError(true)
    setClaiming(true)
    const code = await onClaim(email)
    setIssuedCode(code || PROMO.code)
    setDone(true)
    setClaiming(false)
  }

  return (
    <div className="sticky top-0 z-40 bg-ink text-ivory">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center">
        {done ? (
          <p className="text-[13px] font-bold">
            <span className="text-iris-tint">✓</span> Welcome coupon sent! Use code{' '}
            <span className="rounded bg-iris px-1.5 py-0.5 font-mono">{issuedCode || PROMO.code}</span> for $10 off
            your first wash with us.
          </p>
        ) : (
          <>
            <p className="text-[13px] font-medium">
              New clients: enter your email for a{' '}
              <span className="font-bold">$10 welcome coupon</span> toward your first Atelier Wash.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                aria-label="Email address"
                placeholder="you@email.com"
                className={
                  'w-44 rounded-full border bg-ivory/95 px-3.5 py-1.5 text-[13px] text-ink placeholder:text-stone2/70 focus:outline-none ' +
                  (error ? 'border-red-400' : 'border-transparent')
                }
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && claim()}
              />
              <button
                type="button"
                onClick={claim}
                disabled={claiming}
                className="whitespace-nowrap rounded-full bg-iris px-4 py-1.5 text-[13px] font-bold text-ivory transition-colors hover:bg-iris-deep disabled:opacity-50"
              >
                {claiming ? 'Claiming…' : 'Claim $10 Off'}
              </button>
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss offer"
        onClick={onDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/60 transition-colors hover:text-ivory"
      >
        ✕
      </button>
    </div>
  )
}

/* ---------------- Exit-intent modal ---------------- */
function PromoModal({ onClose, onClaim }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  const [issuedCode, setIssuedCode] = useState('')
  const [claiming, setClaiming] = useState(false)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const claim = async () => {
    if (!isValidEmail(email)) return setError(true)
    setClaiming(true)
    const code = await onClaim(email)
    setIssuedCode(code || PROMO.code)
    setDone(true)
    setClaiming(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="$10 off offer"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-ivory p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 text-stone2 transition-colors hover:text-ink"
        >
          ✕
        </button>

        {done ? (
          <div className="py-6 text-center">
            <p className="font-display text-3xl">Welcome to Haven & Hours.</p>
            <p className="mt-3 text-[15px] text-ink/70">
              We’ve sent your welcome coupon{' '}
              <span className="rounded bg-iris-tint px-2 py-0.5 font-mono font-bold text-iris-deep">
                {issuedCode || PROMO.code}
              </span>{' '}
              — it takes $10 off your <span className="font-bold">first wash with us</span>. Just for
              first-time clients.
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-7">
              Start my first pickup
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">First wash with us</p>
            <h2 className="mt-3 font-display text-3xl leading-tight">
              Your <span className="italic text-iris">$10 welcome coupon</span> is waiting.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
              Enter your email and we’ll send a coupon for $10 off your first Atelier Wash —
              a welcome just for new clients. We’ll add an occasional note, never spam.
            </p>
            <div className="mt-6 space-y-3">
              <input
                type="email"
                aria-label="Email address"
                placeholder="you@email.com"
                className={'field ' + (error ? 'border-red-400' : '')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && claim()}
                autoFocus
              />
              {error && (
                <p className="text-sm font-bold text-[#8C3A2B]">
                  Please enter a valid email address.
                </p>
              )}
              <button type="button" onClick={claim} disabled={claiming} className="btn-primary w-full disabled:opacity-50">
                {claiming ? 'Claiming…' : 'Claim $10 Off'}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mx-auto mt-4 block text-[13px] text-stone2 underline underline-offset-4 hover:text-ink"
            >
              No thanks, I’ll pay full price
            </button>
          </>
        )}
      </div>
    </div>
  )
}
