import { useState } from 'react'
import { useStore, REFERRAL } from '../context/StoreContext.jsx'

/**
 * "Refer a Neighbor" — give $10, get $10.
 * Demo mode: the referral code is a friendly placeholder and invites are
 * captured into the in-session lead store. Real, persistent codes and
 * reward tracking arrive with the database.
 */
export default function ReferAFriend() {
  const { captureLead } = useStore()
  const link = REFERRAL.baseUrl + REFERRAL.sampleCode
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* clipboard may be blocked; the field is selectable as a fallback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const invite = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(true)
      return
    }
    captureLead(email, { source: 'referral_invite' })
    setSent(true)
    setEmail('')
    setTimeout(() => setSent(false), 3500)
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow text-iris">Refer a neighbor</p>
        <span className="text-[11px] font-bold text-stone2">
          Give ${REFERRAL.giveAmount} · Get ${REFERRAL.getAmount}
        </span>
      </div>

      <h2 className="mt-2 font-display text-2xl leading-tight">
        Share the Haven &amp; Hours experience.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Give a neighbor <span className="font-bold text-ink">${REFERRAL.giveAmount} off</span> their
        first pickup, and you get{' '}
        <span className="font-bold text-ink">${REFERRAL.getAmount} off</span> your next order — the
        moment they complete their first wash.
      </p>

      {/* Shareable link */}
      <p className="mt-6 text-[13px] font-bold text-ink/80">Your personal link</p>
      <div className="mt-2 flex gap-2">
        <input
          readOnly
          aria-label="Your referral link"
          value={link}
          onFocus={(e) => e.target.select()}
          className="field flex-1 text-[13px] text-ink/70"
        />
        <button type="button" onClick={copy} className="btn-primary whitespace-nowrap">
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </div>

      {/* Or invite by email */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-ink/10" />
        <span className="text-[12px] text-stone2">or invite by email</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          aria-label="Neighbor's email"
          placeholder="neighbor@email.com"
          className={'field flex-1 ' + (error ? 'border-red-400' : '')}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && invite()}
        />
        <button type="button" onClick={invite} className="btn-ghost whitespace-nowrap">
          Send invite
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm font-bold text-[#8C3A2B]">Enter a valid email address.</p>
      )}
      {sent && (
        <p className="mt-3 rounded-xl bg-iris-tint/40 px-4 py-2.5 text-[13px] font-bold text-iris-deep">
          Invite sent! When your neighbor completes their first wash, your ${REFERRAL.getAmount} lands
          on your next order.
        </p>
      )}
    </section>
  )
}
