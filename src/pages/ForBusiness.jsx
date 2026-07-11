import { useState } from 'react'

/**
 * "For Business" — B2B landing for recurring commercial accounts.
 * Captures inquiries into the in-session lead store (demo). Real CRM/database
 * storage arrives with the database step.
 */

const SEGMENTS = [
  {
    title: 'Short-term rentals & Airbnb',
    body: 'Fresh linens and towels turned around between guests, on your schedule. Perfect for hosts and property managers who need reliable, hands-off turnovers.',
    icon: '🏠',
  },
  {
    title: 'Gyms & wellness studios',
    body: 'Clean towels for members, day after day. Yoga studios, spas, salons and fitness centers — we keep your linens fresh so you can focus on your clients.',
    icon: '🧘',
  },
  {
    title: 'Salons & barbershops',
    body: 'Capes, towels and smocks laundered and returned pressed. A steady rotation so your space always looks and feels its best.',
    icon: '✂️',
  },
  {
    title: 'Restaurants & cafés',
    body: 'Aprons, napkins and table linens cleaned to a crisp, consistent standard — picked up and delivered around your service hours.',
    icon: '🍽️',
  },
  {
    title: 'Offices & co-working',
    body: 'Offer premium laundry pickup as a standout employee perk, or keep kitchen and bathroom linens fresh for your team.',
    icon: '🏢',
  },
  {
    title: 'Events & short projects',
    body: 'Conferences, retreats, film shoots, pop-ups — flexible laundry and linen service for the run of your event. No long-term commitment.',
    icon: '🎪',
  },
]

const REASONS = [
  {
    h: 'Local & personal',
    p: 'You work directly with us — not a call center three states away. We know Riverside, and we treat your business like a neighbor, because you are one.',
  },
  {
    h: 'One point of contact',
    p: 'A single, dependable person who knows your account, your schedule, and your standards. No re-explaining yourself every time.',
  },
  {
    h: 'Flexible, no contract',
    p: 'Service that adapts as your needs change, with no long-term lock-in. Start small with a trial and grow at your own pace.',
  },
  {
    h: 'Premium care, every time',
    p: 'The same hands-on, garment-by-garment attention that defines Haven & Hours — applied consistently to every order you send us.',
  },
]

export default function ForBusiness() {
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    type: SEGMENTS[0].title,
    notes: '',
  })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.company.trim()) return setError('Please add your business name.')
    if (!form.name.trim()) return setError('Please add your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError('Please add a valid email address.')
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/business-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: form.company.trim(),
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          type: form.type,
          notes: form.notes.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      setSending(false)
      if (!res.ok || !data.ok) {
        return setError(data.error || 'Something went wrong. Please try again, or email hello@havenandhours.com.')
      }
      setSent(true)
    } catch {
      setSending(false)
      setError('There was a network problem. Please try again, or email hello@havenandhours.com.')
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink/10 bg-linen/40">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="eyebrow text-iris">For business</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
            Premium laundry &amp; linen service for your business.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink/70">
            Reliable pickup and delivery for Riverside’s rentals, studios, salons, restaurants and
            offices. We handle the laundry, so you can focus on running your business.
          </p>
          <a href="#inquire" className="btn-primary mt-7 inline-block">
            Get a custom quote
          </a>
        </div>
      </section>

      {/* Who we serve */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-3xl">Who we serve</h2>
        <p className="mt-3 max-w-xl text-[15px] text-ink/70">
          Steady, recurring service tailored to how your business actually runs.
        </p>
        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SEGMENTS.map((s) => (
            <div key={s.title} className="card">
              <div className="text-2xl">{s.icon}</div>
              <h3 className="mt-3 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why partner */}
      <section className="border-y border-ink/10 bg-ivory/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-3xl">Why partner with Haven &amp; Hours</h2>
          <div className="mt-9 grid gap-8 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.h} className="flex gap-4">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-iris" />
                <div>
                  <h3 className="font-display text-xl">{r.h}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{r.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="inquire" className="mx-auto max-w-2xl px-6 py-16">
        {sent ? (
          <div className="card text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-iris-tint">
              <span className="text-2xl text-iris-deep">✓</span>
            </div>
            <h2 className="mt-4 font-display text-3xl">Thank you!</h2>
            <p className="mt-2 text-[15px] text-ink/70">
              We’ll contact you within 24 hours with your custom quote.
            </p>
          </div>
        ) : (
          <>
            <p className="eyebrow text-iris">Get in touch</p>
            <h2 className="mt-2 font-display text-3xl">Tell us about your business.</h2>
            <p className="mt-2 text-[15px] text-ink/70">
              Share a few details and we’ll prepare a quote tailored to your needs. No commitment.
            </p>

            <div className="mt-7 space-y-4">
              <div>
                <label className="label" htmlFor="company">
                  Business name
                </label>
                <input
                  id="company"
                  className="field"
                  placeholder="e.g. Sunrise Yoga Studio"
                  value={form.company}
                  onChange={set('company')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="name">
                    Your name
                  </label>
                  <input id="name" className="field" value={form.name} onChange={set('name')} />
                </div>
                <div>
                  <label className="label" htmlFor="phone">
                    Phone <span className="text-stone2">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    inputMode="tel"
                    className="field"
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="field"
                  placeholder="you@business.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>

              <div>
                <label className="label" htmlFor="type">
                  Type of business
                </label>
                <select id="type" className="field" value={form.type} onChange={set('type')}>
                  {SEGMENTS.map((s) => (
                    <option key={s.title} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                  <option value="Other">Something else</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="notes">
                  Tell us about your needs <span className="text-stone2">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="field"
                  placeholder="Volume, how often, what items…"
                  value={form.notes}
                  onChange={set('notes')}
                />
              </div>

              {error && <p className="text-sm font-bold text-[#8C3A2B]">{error}</p>}

              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="btn-primary w-full disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Request a custom quote'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
