import { Link } from 'react-router-dom'
import { PRICING, SERVICE_ZIPS } from '../context/StoreContext.jsx'
import HoursSection from '../components/HoursSection.jsx'

const STEPS = [
  {
    title: 'Book online',
    body: 'Pick a day and a time block — morning or afternoon. Leave the bag at your door — that’s it. We’ll text a closer arrival time the morning of.',
  },
  {
    title: 'We collect',
    body: 'A Haven & Hours valet picks up, weighs and inspects every garment, and texts you a photo if anything needs your call.',
  },
  {
    title: 'Delivered fresh',
    body: 'Washed, pressed and folded to boutique standard, back at your door the next day (we rest on Sundays). Orders with dry cleaning come back together once it’s ready — usually 2–5 business days.',
  },
]

const FAQS = [
  {
    q: 'How is my laundry weighed and priced?',
    a: 'Your valet weighs the bag at pickup, and your card on file is charged only after the final weigh-and-count — with a fully itemized receipt emailed to you so every line is clear. Wash & Fold is $2.25 per pound with a $35 order minimum — bedding and ironing are priced by the piece, so they never inflate your by-the-pound weight.',
  },
  {
    q: 'Is my laundry washed with other people’s?',
    a: 'Never. Each order is washed in its own dedicated machine, with the detergent and softener you chose when booking.',
  },
  {
    q: 'Can I choose the detergent?',
    a: 'Yes — pick Tide, Gain, or a hypoallergenic Free & Clear option when you book, and add fabric softener if you like. Preferences are always free.',
  },
  {
    q: 'What if you find a stain or damage on a garment?',
    a: 'We photograph it and send it to you in the app before washing. You decide: approve the wash, or have it returned untouched. Nothing risky happens without your say-so.',
  },
  {
    q: 'How does the dry cleaning run work?',
    a: 'Mark dry-clean garments at pickup. We hand them to our trusted partner cleaner and return them with your order once everything is ready. Dry cleaning usually takes 2–5 business days, depending on the garment — delicate fabrics and formalwear need a little more time. Need something urgently? Just ask and we’ll see what’s possible. Each piece is itemized and added to your one order total — a single charge, broken out on your receipt.',
  },
  {
    q: 'Do I need to sort or count anything?',
    a: 'No sorting needed for Wash & Fold — just bag it. Only ironing asks for a piece count so we can quote you fairly.',
  },
]

const RATES = [
  {
    name: 'Wash & Fold',
    price: `$${PRICING.WASH_FOLD_PER_LB.toFixed(2)}`,
    unit: '/ lb',
    note: `$${PRICING.ORDER_MINIMUM} order minimum`,
  },
  {
    name: 'Ironing',
    price: `$${PRICING.IRONING_PER_PIECE.toFixed(2)}`,
    unit: '/ piece',
    note: 'Shirts, blouses, trousers',
  },
  {
    name: 'Comforters & Bedding',
    price: `$${PRICING.BEDDING_TWIN}–$${PRICING.BEDDING_KING}`,
    unit: '/ piece',
    note: `King / Cal-King $${PRICING.BEDDING_KING} · Queen / Full $${PRICING.BEDDING_QUEEN_FULL} · Twin $${PRICING.BEDDING_TWIN}`,
  },
  {
    name: 'Dry Cleaning Run',
    price: 'from $3.50',
    unit: '/ item',
    note: 'Suits, shirts, dresses & comforters — itemized and added to your one order total',
  },
]

// ──────────────────────────────────────────────────────────────────────────
// TESTIMONIOS — reseñas REALES de clientes.
// Mientras esté vacío [], la sección NO aparece en el sitio (nada falso).
// Cuando tengas una reseña real, agrégala así (y la sección aparece sola):
//   { quote: 'Lo que dijo el cliente, en sus palabras.', name: 'Maria R.', area: 'Canyon Crest' },
// ──────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = []

export default function Landing() {
  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 sm:pt-24">
        <p className="eyebrow">Premium laundry · picked up at your door</p>
        <h1 className="mt-5 font-display text-[44px] font-medium leading-[1.04] tracking-tight sm:text-7xl">
          Your home, <span className="italic text-iris">a haven.</span>
          <br />
          Your day, <span className="italic text-iris">restored.</span>
        </h1>
        <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-ink/70">
          Give yourself the hours back. You have better things to do than laundry — so we
          collect it, care for it like our own, and return it fresh, pressed, and neatly
          folded, ready to simply put away. Proudly serving Riverside, California.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link to="/dashboard" className="btn-primary">
            Schedule a Pickup
          </Link>
          <a href="#rates" className="text-sm font-bold text-ink/70 underline underline-offset-4 hover:text-ink">
            See rates
          </a>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-iris/25 bg-iris-tint/50 px-4 py-2">
          <span aria-hidden="true">🎉</span>
          <p className="text-[13px] font-bold text-iris-deep">
            Grand Opening: $15 off your first wash
            <span className="font-normal text-iris"> · new clients, through July 31, 2026</span>
          </p>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="border-y border-ink/10 bg-linen/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Three quiet steps.</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <p className="font-display text-xl">
                  {s.title}
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="ml-2 text-iris">
                      →
                    </span>
                  )}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- Our story ---------------- */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid items-center gap-10 sm:grid-cols-5">
          {/* Foto de la fundadora.
              Cuando tengas una foto, reemplaza TODO este bloque <div> por:
              <img src="/founder.jpg" alt="Elizabeth Diaz, founder of Haven & Hours"
                   className="sm:col-span-2 w-full rounded-2xl object-cover shadow-sm" />
              (sube la imagen como public/founder.jpg) */}
          <div className="sm:col-span-2">
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-iris/20 bg-iris-tint">
              <div className="text-center">
                <p className="font-display text-5xl text-iris-deep">ED</p>
                <p className="mt-2 text-[11px] uppercase tracking-wider2 text-iris">Elizabeth Diaz</p>
                <p className="mt-1 text-[11px] text-iris/70">Founder</p>
              </div>
            </div>
          </div>

          <div className="sm:col-span-3">
            <p className="eyebrow">Our story</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Why Haven &amp; Hours exists.</h2>

            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/75">
              <p>
                For years, I lived the very need I now help solve. Between ten-hour workdays and
                nearly three hours of driving each day, I would come home with nothing left to wash,
                sort, and fold my family’s laundry. My husband worked those same long hours; my kids
                helped where they could, but between homework and exhaustion, the laundry always
                ended up in a pile. I know what it’s like to finish the day completely drained and
                still face a mountain of laundry waiting.
              </p>
              <p className="font-display text-lg italic text-iris-deep">
                I know what it’s like to need — even just for a moment — someone there to help with
                the hard things.
              </p>
              <p>
                That’s why I created Haven &amp; Hours: to give families that breath back. We pick up
                your laundry, care for it as if it were our own, and return it clean, pressed, and
                neatly folded — ready to simply put away. As a mom of three and a wife, I know what a
                well-tended detail is worth. That’s why I’ll almost always give a little more than I
                promise.
              </p>
              <p>
                I believe that moms — and all families — sometimes need someone who understands what
                we need and gives us room to breathe. That’s my purpose. We’ll honor and protect the
                trust you place in us, with the same care I’d give my own. And it fills my heart to
                start with my own community.
              </p>
            </div>

            <p className="mt-6 font-display text-lg text-iris">— Elizabeth Diaz, Founder</p>
          </div>
        </div>
      </section>

      {/* ---------------- Rates ---------------- */}
      <section id="rates" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16">
        <p className="eyebrow">Rates</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Honest, by the pound.</h2>
        <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
          {RATES.map((r) => (
            <div key={r.name} className="flex items-baseline justify-between gap-4 py-5">
              <div>
                <p className="font-display text-xl">{r.name}</p>
                <p className="mt-0.5 text-[13px] text-stone2">{r.note}</p>
              </div>
              <p className="whitespace-nowrap font-display text-xl text-iris">
                {r.price} <span className="text-sm text-stone2">{r.unit}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-stone2">
          Final total is confirmed after weighing at pickup. No hidden fees.
        </p>
      </section>

      {/* ---------------- The process, explained ---------------- */}
      <section className="border-t border-ink/10 bg-linen/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="eyebrow">Our care, explained</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            What happens to your laundry.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-xl">Wash &amp; Fold</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Every order is inspected piece by piece at intake, then washed in its{' '}
                <strong className="font-bold text-ink">own dedicated machine</strong> — never
                mixed with anyone else’s. You choose the detergent and softener at no extra
                cost, including hypoallergenic options. Everything comes back neatly folded,
                socks paired.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl">Ironing</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Add ironing to any order and tell us how many pieces. Shirts, blouses and
                trousers are pressed crisp by hand and returned ready to wear — folded with
                your order or on hangers if you prefer (just say so in your pickup notes).
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl">Whites, treated gently</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Our <strong className="font-bold text-ink">Active Oxygen &amp; Baking Soda</strong>{' '}
                treatment is standard on every white load — no harsh chlorine bleach by default. It
                lifts stains, softens the water and brightens naturally, so fibers stay strong
                without thinning or yellowing. Prefer traditional bleach for sturdy items? Just ask
                at checkout.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl">Comforters &amp; bedding</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Large bedding is set aside before weighing and cared for by the piece, in
                machines sized for the job — so a bulky comforter never inflates your
                by-the-pound total. It comes home fresh, lofted and folded.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl">Dry cleaning run</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Have garments that need a professional cleaner? Mark them at pickup and we’ll
                hand them to our trusted partner cleaner and bring them back with your order once
                everything is ready — usually 2–5 business days, depending on the garment. Each
                piece is itemized and added to your one order total — a single charge, with
                everything broken out on your receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- The Haven & Hours Guarantee ---------------- */}
      <section className="bg-iris text-ivory">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ivory/70">
            Our promise
          </p>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
            The Haven &amp; Hours Guarantee
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ivory/85">
            We treat your clothes like our own — with care, attention, and respect. If something
            isn’t right when your order returns, just tell us within 48 hours and we’ll make it
            right: we’ll re-clean it free, or add a credit toward your next order. No stress, no
            runaround. That’s our word to you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-bold text-ivory/90">
            <span className="flex items-center gap-2">
              <span className="text-base">✓</span> Every order washed separately
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base">✓</span> Re-clean or credit, guaranteed
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base">✓</span> Real people, right here in Riverside
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- Testimonials (aparece solo cuando hay reseñas reales) ---------------- */}
      {TESTIMONIALS.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <p className="eyebrow">Kind words</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">From our Riverside families.</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="rounded-2xl border border-ink/10 bg-ivory p-6">
                <div aria-hidden="true" className="text-iris">★★★★★</div>
                <blockquote className="mt-3 text-[15px] leading-relaxed text-ink/80">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-[13px] font-bold text-ink">
                  {t.name}
                  {t.area && <span className="font-normal text-stone2"> · {t.area}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Dry cleaning billing ---------------- */}
      <section className="border-t border-ink/10 bg-linen/50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="eyebrow">Dry cleaning · how it works &amp; billing</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            Priced by the piece, charged with care.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
            Dry cleaning works a little differently from wash &amp; fold — here’s exactly when and
            how you’re billed, so there are no surprises.
          </p>

          <ol className="mt-9 space-y-7">
            <li className="flex gap-5">
              <span className="font-display text-2xl leading-none text-iris">1</span>
              <div>
                <h3 className="font-display text-xl">Thoughtful itemization</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                  Dry cleaning is priced per garment, never by the pound. Once we collect your
                  pieces, our Atelier team inspects and itemizes each one by hand — accounting for
                  fabric, construction, and the care each garment quietly asks for.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-display text-2xl leading-none text-iris">2</span>
              <div>
                <h3 className="font-display text-xl">Transparent, itemized pricing</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                  When the inspection is complete, you’ll receive a detailed receipt in your app and
                  inbox — every piece listed, every price clear. Nothing is hidden, and nothing is
                  assumed.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-display text-2xl leading-none text-iris">3</span>
              <div>
                <h3 className="font-display text-xl">Charged only when it’s counted</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                  Your card on file is charged securely only after we weigh and count everything —
                  never before. The moment we do, a fully itemized receipt lands in your inbox: every
                  pound, every piece, every price spelled out. No guesses, no surprises.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-display text-2xl leading-none text-iris">4</span>
              <div>
                <h3 className="font-display text-xl">Our $35 minimum</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                  A gentle note: our standard $35 minimum order applies to dry cleaning pickups as
                  well, so we can give every order the hands-on attention it deserves.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="eyebrow">Good to know</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Questions, answered.</h2>
        <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                <span className="text-[15px]">{f.q}</span>
                <span aria-hidden="true" className="text-iris transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------------- Hours & contact ---------------- */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <HoursSection />
      </section>

      {/* ---------------- Coverage ---------------- */}
      <section className="border-t border-ink/10 bg-linen/50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="eyebrow">Where we collect</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Riverside, door to door.</h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
            <strong className="font-bold text-ink">Currently serving Riverside, CA only.</strong>{' '}
            We collect and deliver across these Riverside ZIP codes — with nearby
            neighborhoods joining soon.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SERVICE_ZIPS.map((z) => (
              <span
                key={z}
                className="rounded-full border border-ink/15 bg-ivory px-3.5 py-1.5 text-[13px] font-bold text-ink/70"
              >
                {z}
              </span>
            ))}
          </div>
          <Link to="/dashboard" className="btn-primary mt-10">
            Schedule a Pickup
          </Link>
          <p className="mt-6 text-[13px] text-ink/60">
            Run a rental, gym, salon or restaurant?{' '}
            <Link
              to="/business"
              className="font-bold text-iris underline underline-offset-2 hover:text-iris-deep"
            >
              See our business service →
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
