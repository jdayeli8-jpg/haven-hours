import { useState } from 'react'
import { useStore, SERVICE_ZIPS } from '../context/StoreContext.jsx'

/**
 * Service-area geofence. Gates the booking form behind a ZIP check.
 *  - match  → success message, calls onVerified(zip) to unlock the form
 *  - no match → waitlist message + email capture (stored as a lead)
 */
export default function ZipGate({ onVerified }) {
  const { captureLead } = useStore()
  const [zip, setZip] = useState('')
  const [state, setState] = useState('idle') // 'idle' | 'rejected'
  const [error, setError] = useState('')

  // Waitlist
  const [waitEmail, setWaitEmail] = useState('')
  const [waitDone, setWaitDone] = useState(false)
  const [waitError, setWaitError] = useState(false)

  const check = () => {
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) {
      setError('Enter a 5-digit ZIP code.')
      return
    }
    setError('')
    if (SERVICE_ZIPS.includes(clean)) {
      onVerified(clean)
    } else {
      setState('rejected')
    }
  }

  const joinWaitlist = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitEmail)) {
      setWaitError(true)
      return
    }
    captureLead(waitEmail, { source: 'out_of_area', zip: zip.trim(), notes: 'out_of_zone_waitlist' })
    setWaitDone(true)
  }

  return (
    <div className="mt-7">
      <div className="card">
        <p className="eyebrow">Step 1 · Service area</p>
        <h2 className="mt-2 font-display text-2xl">Enter your ZIP code to verify service in your area.</h2>

        {state !== 'rejected' && (
          <>
            <div className="mt-5 flex gap-2">
              <input
                inputMode="numeric"
                aria-label="ZIP code"
                placeholder="92507"
                maxLength={5}
                className="field max-w-[160px] tracking-[0.25em]"
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && check()}
              />
              <button type="button" className="btn-primary" onClick={check}>
                Verify
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
                {error}
              </p>
            )}
            <p className="mt-3 text-[12px] text-stone2">
              Currently serving Riverside, CA only — ZIP codes {SERVICE_ZIPS.join(', ')}.
            </p>
          </>
        )}

        {/* Waitlist (rejection) */}
        {state === 'rejected' && (
          <div className="mt-5">
            {waitDone ? (
              <div className="rounded-xl border border-iris/20 bg-iris-tint/30 px-5 py-6 text-center">
                <p className="text-2xl text-iris-deep">✓</p>
                <p className="mt-2 font-display text-xl">You’re on the list.</p>
                <p className="mt-1 text-sm text-ink/70">
                  We’ll email you the moment Haven &amp; Hours reaches your neighborhood.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink/10 bg-linen/40 p-6">
                <h3 className="font-display text-xl leading-snug">
                  We’re not in your area yet! Leave your email and we’ll let you know when we arrive.
                </h3>
                <div className="mt-4 flex gap-2">
                  <input
                    type="email"
                    aria-label="Email address"
                    placeholder="you@email.com"
                    className={'field ' + (waitError ? 'border-red-400' : '')}
                    value={waitEmail}
                    onChange={(e) => {
                      setWaitEmail(e.target.value)
                      setWaitError(false)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && joinWaitlist()}
                  />
                  <button type="button" className="btn-primary whitespace-nowrap" onClick={joinWaitlist}>
                    Notify me
                  </button>
                </div>
                {waitError && (
                  <p className="mt-2 text-sm font-bold text-[#8C3A2B]">Enter a valid email address.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setState('idle')
                    setZip('')
                  }}
                  className="mt-4 text-[13px] font-bold text-stone2 underline underline-offset-4 hover:text-ink"
                >
                  Try a different ZIP
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
