import { useState } from 'react'
import {
  BIZ, BIZ_PHONES, BIZ_LOCATION,
  OPTION_A_TIERS, OPTION_B_WASH_TIERS, OPTION_B_SETUP, COLORS,
} from '../lib/businessContent.js'

const money = (n) => '$' + Math.round(n).toLocaleString('en-US')
const tierValue = (tiers, tw, key) => {
  for (const t of tiers) if (tw <= t.max) return t[key]
  return tiers[tiers.length - 1][key]
}

// Campo trampa (honeypot): invisible para personas, tentador para bots.
// Si llega con texto, el servidor descarta el envío.
function Honeypot({ value, onChange }) {
  return (
    <input
      type="text"
      name="company_website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={onChange}
      className="hidden"
    />
  )
}

export default function ForBusiness() {
  return (
    <div>
      <Hero />
      <Ways />
      <Calculator />
      <Colors />
      <Promise />
      <Compare />
      <WhatsNext />
      <Close />
    </div>
  )
}

/* 1. HERO */
function Hero() {
  const c = BIZ.hero
  return (
    <section className="border-b border-ink/10 bg-linen/40">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <p className="eyebrow text-iris">For business · towel service</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">{c.title}</h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink/70">{c.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#contact" className="btn-primary">{c.ctaTrial}</a>
          <a href="#calc" className="btn-ghost">{c.ctaPrice}</a>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink/70">
          {BIZ_PHONES.map((p) => (
            <span key={p.tel} className="font-bold">
              {p.name}{' '}
              <a href={`tel:${p.tel}`} className="text-iris underline underline-offset-2">{p.display}</a>
            </span>
          ))}
          <span className="rounded-full border border-iris/25 bg-iris-tint/50 px-3 py-1 font-bold text-iris-deep">{c.spanish}</span>
        </div>
      </div>
    </section>
  )
}

/* 2. THREE WAYS */
function Ways() {
  const c = BIZ.ways
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-display text-3xl sm:text-4xl">{c.heading}</h2>
      <div className="mt-9 grid gap-6 lg:grid-cols-3">
        <WayCard w={c.a} highlight />
        <WayCard w={c.b} />
        <WayCard w={c.c} />
      </div>
      <p className="mt-8 rounded-2xl border border-iris/20 bg-iris-tint/25 px-5 py-4 text-[13px] leading-relaxed text-ink/80">
        {c.footnote}
      </p>
    </section>
  )
}
function WayCard({ w, highlight }) {
  return (
    <div className={'card flex flex-col ' + (highlight ? 'border-iris/40 ring-1 ring-iris/20' : '')}>
      {w.badge && (
        <span className="mb-3 inline-block w-fit rounded-full bg-iris px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {w.badge}
        </span>
      )}
      <h3 className="font-display text-2xl">{w.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">{w.body}</p>
      {w.rows && (
        <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-[13px]">
          {w.rows.map((r, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-ink">{r[0]}</span>
              <span className="text-right text-stone2">{r[1]}</span>
            </li>
          ))}
        </ul>
      )}
      {w.note && <p className="mt-3 text-[12px] italic text-stone2">{w.note}</p>}
    </div>
  )
}

/* 3. CALCULATOR */
function Calculator() {
  const c = BIZ.calc
  const [perDay, setPerDay] = useState(30)
  const [days, setDays] = useState(6)
  const [opt, setOpt] = useState('A')
  const tw = perDay * days

  const aWeekly = tw * tierValue(OPTION_A_TIERS, tw, 'price')
  const bWash = tierValue(OPTION_B_WASH_TIERS, tw, 'price') // null si ≤130
  const bWeekly = bWash ? tw * bWash : null
  const bSetup = tierValue(OPTION_B_SETUP, tw, 'setup')

  const underB = opt === 'B' && tw <= 130
  const weekly = opt === 'A' ? aWeekly : bWeekly
  const per4 = weekly != null ? weekly * 4 : null

  return (
    <section id="calc" className="scroll-mt-20 border-y border-ink/10 bg-ivory/60">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="eyebrow text-iris">Instant estimate</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">{c.heading}</h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <SliderField label={c.towelsPerDay} min={10} max={60} value={perDay} onChange={setPerDay} />
          <SliderField label={c.daysOpen} min={3} max={7} value={days} onChange={setDays} />
        </div>

        <div className="mt-6">
          <p className="label">{c.iWantTo}</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <OptBtn active={opt === 'A'} onClick={() => setOpt('A')}>{c.optA}</OptBtn>
            <OptBtn active={opt === 'B'} onClick={() => setOpt('B')}>{c.optB}</OptBtn>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-iris/25 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-stone2">{c.towelsWeek}</span>
            <span className="font-display text-2xl">{tw.toLocaleString()}</span>
          </div>
          {underB ? (
            <p className="mt-4 rounded-xl bg-iris-tint/40 px-4 py-3 text-[14px] font-bold text-iris-deep">{c.under200}</p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
                <span className="text-sm text-stone2">{c.weeklyCost}</span>
                <span className="font-display text-2xl text-iris">{money(weekly)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm text-stone2">{c.per4}</span>
                <span className="font-display text-3xl text-iris-deep">{money(per4)}</span>
              </div>
              {opt === 'B' && (
                <div className="mt-3 flex items-baseline justify-between border-t border-ink/10 pt-3 text-[13px]">
                  <span className="text-stone2">{c.setup}</span>
                  <span className="font-bold text-ink">{money(bSetup)} <span className="font-normal text-stone2">{c.or12}</span></span>
                </div>
              )}
            </>
          )}
        </div>

        <a href="#contact" className="btn-primary mt-6 inline-block">{c.lock}</a>
        <p className="mt-3 text-[12px] text-stone2">
          All prices approximate · one flat price — pickup, wash, fold &amp; delivery included · frozen 6 months.
        </p>
      </div>
    </section>
  )
}
function SliderField({ label, min, max, value, onChange }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="label">{label}</label>
        <span className="font-display text-xl text-iris">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-iris" />
      <div className="flex justify-between text-[11px] text-stone2"><span>{min}</span><span>{max}</span></div>
    </div>
  )
}
function OptBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={'rounded-xl border px-4 py-3 text-sm font-bold transition ' +
        (active ? 'border-iris bg-iris text-white' : 'border-ink/15 text-ink hover:border-iris')}>
      {children}
    </button>
  )
}

/* 4. COLORS */
function Colors() {
  const c = BIZ.colors
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-display text-3xl sm:text-4xl">{c.heading}</h2>
      <div className="mt-8 flex flex-wrap gap-6">
        {COLORS.map((col) => (
          <div key={col.name} className="flex w-28 flex-col items-center text-center">
            <span className="h-14 w-14 rounded-full border border-ink/15" style={{ backgroundColor: col.hex }} />
            <span className="mt-2 text-[13px] font-bold text-ink">{col.name}</span>
            {col.note && <span className="text-[11px] leading-tight text-stone2">{col.note}</span>}
          </div>
        ))}
        <div className="flex w-28 flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-ink/30 text-lg text-stone2">+</span>
          <span className="mt-2 text-[13px] font-bold text-ink">{c.more}</span>
        </div>
      </div>
      <p className="mt-8 font-display text-xl text-iris-deep">{c.tagline}</p>
    </section>
  )
}

/* 5. NEIGHBOR PROMISE */
function Promise() {
  const c = BIZ.promise
  return (
    <section className="border-y border-ink/10 bg-linen/50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl">{c.heading}</h2>
        <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((it) => (
            <div key={it.title} className="card">
              <div className="text-2xl">{it.icon}</div>
              <h3 className="mt-2 font-display text-xl">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 6. QUOTE VS BILL */
function Compare() {
  const c = BIZ.compare
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="font-display text-3xl sm:text-4xl">{c.heading}</h2>
      <p className="mt-2 text-[15px] text-ink/70">{c.sub}</p>
      <div className="mt-9 grid gap-6 sm:grid-cols-2">
        <InvoiceCard inv={c.big} />
        <InvoiceCard inv={c.us} highlight />
      </div>
      <p className="mt-6 text-[13px] italic text-stone2">{c.foot}</p>
    </section>
  )
}
function InvoiceCard({ inv, highlight }) {
  return (
    <div className={'card ' + (highlight ? 'border-iris/40 ring-1 ring-iris/20' : '')}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl">{inv.title}</h3>
        <span className="text-[12px] text-stone2">{inv.quote}</span>
      </div>
      <ul className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-[13px]">
        {inv.rows.map((r, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="text-ink/80">{r[0]}</span>
            <span className="font-bold text-ink">{r[1]}</span>
          </li>
        ))}
      </ul>
      <div className={'mt-4 flex items-baseline justify-between border-t pt-3 ' + (highlight ? 'border-iris/30' : 'border-ink/10')}>
        <span className="font-display text-lg">Total</span>
        <span className={'font-display text-2xl ' + (highlight ? 'text-iris-deep' : 'text-ink')}>{inv.total}</span>
      </div>
      <p className="mt-3 text-[12px] italic text-stone2">{inv.note}</p>
    </div>
  )
}

/* 7. WHAT'S NEXT + VOTE */
function WhatsNext() {
  const c = BIZ.next
  const [vote, setVote] = useState('')
  const [email, setEmail] = useState('')
  const [hp, setHp] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!vote.trim()) return setError('Please tell us what service you need.')
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/business-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'service_vote', vote: vote.trim(), email: email.trim().toLowerCase(), hp }),
      })
      const data = await res.json().catch(() => ({}))
      setSending(false)
      if (!res.ok || !data.ok) return setError(data.error || 'Something went wrong. Please try again.')
      setSent(true)
    } catch { setSending(false); setError('Network problem. Please try again.') }
  }

  return (
    <section className="border-t border-ink/10 bg-ivory/60">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl">{c.heading}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{c.body}</p>
        <div className="card mt-7">
          {sent ? (
            <p className="text-center font-display text-xl text-iris-deep">{c.voteThanks}</p>
          ) : (
            <>
              <p className="font-bold text-ink">{c.voteTitle}</p>
              <input className="field mt-3" placeholder={c.votePlaceholder} value={vote} onChange={(e) => setVote(e.target.value)} />
              <input type="email" className="field mt-2" placeholder={c.voteEmail} value={email} onChange={(e) => setEmail(e.target.value)} />
              <Honeypot value={hp} onChange={(e) => setHp(e.target.value)} />
              {error && <p className="mt-2 text-sm font-bold text-[#8C3A2B]">{error}</p>}
              <button type="button" onClick={submit} disabled={sending} className="btn-primary mt-3 w-full disabled:opacity-50">
                {sending ? 'Sending…' : c.voteBtn}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* 8. CLOSE + PROMOS + CONTACT */
function Close() {
  const c = BIZ.close
  return (
    <section id="contact" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16">
      <h2 className="font-display text-3xl sm:text-4xl">{c.promosHeading}</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {c.promos.map((p) => (
          <div key={p.title} className="card">
            <h3 className="font-display text-lg">{p.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/70">{p.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-12"><ContactForm /></div>
      <div className="mt-10 border-t border-ink/10 pt-6 text-center">
        <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[14px] font-bold">
          {BIZ_PHONES.map((p) => (
            <span key={p.tel}>
              {p.name}{' '}
              <a href={`tel:${p.tel}`} className="text-iris underline underline-offset-2">{p.display}</a>
            </span>
          ))}
        </p>
        <p className="mt-2 text-[13px] text-stone2">{BIZ_LOCATION}</p>
      </div>
    </section>
  )
}
function ContactForm() {
  const c = BIZ.close
  const [form, setForm] = useState({ salon: '', name: '', phone: '', email: '', message: '', hp: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.salon.trim()) return setError('Please add your salon name.')
    if (!form.name.trim()) return setError('Please add your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please add a valid email address.')
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/business-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'business_page',
          company: form.salon.trim(), name: form.name.trim(),
          phone: form.phone.trim(), email: form.email.trim().toLowerCase(),
          message: form.message.trim(), hp: form.hp,
        }),
      })
      const data = await res.json().catch(() => ({}))
      setSending(false)
      if (!res.ok || !data.ok) return setError(data.error || 'Something went wrong. Please try again, or call us.')
      setSent(true)
    } catch { setSending(false); setError('Network problem. Please try again, or call us.') }
  }

  if (sent) {
    return (
      <div className="card text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-iris-tint"><span className="text-2xl text-iris-deep">✓</span></div>
        <h3 className="mt-4 font-display text-2xl">Thank you!</h3>
        <p className="mt-2 text-[15px] text-ink/70">{c.thanks}</p>
      </div>
    )
  }
  return (
    <div className="card">
      <p className="eyebrow text-iris">{c.formHeading}</p>
      <h3 className="mt-2 font-display text-2xl">Tell us about your salon.</h3>
      <p className="mt-2 text-[14px] text-ink/70">{c.formSub}</p>
      <div className="mt-5 space-y-3">
        <div><label className="label">{c.fSalon}</label><input className="field" value={form.salon} onChange={set('salon')} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">{c.fName}</label><input className="field" value={form.name} onChange={set('name')} /></div>
          <div><label className="label">{c.fPhone}</label><input inputMode="tel" className="field" value={form.phone} onChange={set('phone')} /></div>
        </div>
        <div><label className="label">{c.fEmail}</label><input type="email" className="field" value={form.email} onChange={set('email')} /></div>
        <div><label className="label">{c.fMessage}</label><textarea rows={3} className="field" value={form.message} onChange={set('message')} /></div>
        <Honeypot value={form.hp} onChange={set('hp')} />
        {error && <p className="text-sm font-bold text-[#8C3A2B]">{error}</p>}
        <button type="button" onClick={submit} disabled={sending} className="btn-primary w-full disabled:opacity-50">
          {sending ? c.sending : c.submit}
        </button>
      </div>
    </div>
  )
}
