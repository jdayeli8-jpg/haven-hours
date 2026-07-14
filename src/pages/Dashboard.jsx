import { useState, useEffect } from 'react'
import { useStore, STATUS_STEPS } from '../context/StoreContext.jsx'
import ClotheslineTracker from '../components/ClotheslineTracker.jsx'
import Checkout from '../components/Checkout.jsx'
import ReferAFriend from '../components/ReferAFriend.jsx'
import ZipGate from '../components/ZipGate.jsx'
import HoursSection from '../components/HoursSection.jsx'
import DatePicker from '../components/DatePicker.jsx'
import InstallApp from '../components/InstallApp.jsx'

// Horarios de recolección (America/Los_Angeles):
//   Lun–Vie 7 AM–6 PM · Sáb 8 AM–12 PM · Dom cerrado.
const WINDOW_SAT = 'Morning · 8 AM – 12 PM'
const WINDOWS_WEEKDAY = ['Morning · 7 AM – 12 PM', 'Afternoon · 12 PM – 6 PM']

// "Hoy" según la zona horaria de California, no la del navegador del cliente.
function laToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()) // -> "YYYY-MM-DD"
}

// Día de la semana (0=Dom … 6=Sáb) de una fecha Y-M-D. Es dato de calendario,
// así que no depende de la zona horaria.
function weekdayOf(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}
function ymd(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
// Devuelve el primer día NO-domingo a partir de la fecha dada.
function nextOpenDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  while (dt.getDay() === 0) dt.setDate(dt.getDate() + 1)
  return ymd(dt)
}
// Ventanas disponibles según el día: Dom cerrado, Sáb solo mañana, L-V dos bloques.
function windowsForDate(dateStr) {
  const wd = weekdayOf(dateStr)
  if (wd === 0) return [] // domingo: cerrado
  if (wd === 6) return [WINDOW_SAT] // sábado: solo mañana
  return WINDOWS_WEEKDAY // lunes a viernes
}

export default function Dashboard() {
  const { order } = useStore()
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <p className="eyebrow">Customer</p>
      <h1 className="mt-2 font-display text-4xl">
        {!order ? 'Schedule a pickup' : order.authorization ? 'Your order' : 'Confirm your pickup'}
      </h1>
      {order ? <OrderView /> : <PickupForm />}
      <InstallApp />
    </div>
  )
}

/* ---------------- Pickup form ---------------- */
function PickupForm() {
  const { placeOrder, promoUnlocked, couponCode } = useStore()
  const today = laToday() // "hoy" en horario de California
  const [verifiedZip, setVerifiedZip] = useState(null)
  const initialDate = nextOpenDate(today)
  const [form, setForm] = useState({
    date: initialDate,
    window: windowsForDate(initialDate)[0],
    address: '',
    notes: '',
  })
  const [services, setServices] = useState({
    ironing: false,
    ironingPieces: '',
    beddingKing: 0,
    beddingQueenFull: 0,
    beddingTwin: 0,
    dryCleaning: false,
  })
  const [prefs, setPrefs] = useState({
    detergent: 'Tide',
    softener: 'No softener',
    bleach: false, // traditional chlorine bleach, by request
    bleachConsent: false,
  })
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Al elegir una fecha en el calendario (los domingos ya no son seleccionables).
  const pickDate = (picked) => {
    if (weekdayOf(picked) === 0) return // domingo: cerrado (guarda por seguridad)
    const allowed = windowsForDate(picked)
    setForm((f) => ({ ...f, date: picked, window: allowed.includes(f.window) ? f.window : allowed[0] }))
    setError('')
  }

  const availableWindows = windowsForDate(form.date)

  const submit = () => {
    if (!form.date) return setError('Choose a pickup date.')
    const allowed = windowsForDate(form.date)
    if (allowed.length === 0) return setError('We’re closed on Sundays — please choose another day.')
    // Aseguramos que la ventana elegida sea válida para ese día.
    const window = allowed.includes(form.window) ? form.window : allowed[0]
    if (!form.address.trim()) return setError('Add the address where we should collect.')
    const ironingPieces = services.ironing ? parseInt(services.ironingPieces, 10) || 0 : 0
    if (services.ironing && ironingPieces <= 0)
      return setError('Tell us how many pieces to iron, or uncheck ironing.')
    if (prefs.bleach && !prefs.bleachConsent)
      return setError('Please confirm you understand the chlorine bleach note, or turn it off.')
    setError('')
    placeOrder(
      { ...form, window, address: form.address.trim(), notes: form.notes.trim(), zip: verifiedZip },
      {
        ironingPieces,
        beddingKing: services.beddingKing,
        beddingQueenFull: services.beddingQueenFull,
        beddingTwin: services.beddingTwin,
        dryCleaning: services.dryCleaning,
      },
      { ...prefs }
    )
  }

  // Gate the form behind ZIP verification.
  if (!verifiedZip) {
    return (
      <ZipGate
        onVerified={(zip) => {
          setVerifiedZip(zip)
          // Prefill the ZIP into the address line for convenience.
          setForm((f) => ({ ...f, address: f.address || `Riverside, CA ${zip}` }))
        }}
      />
    )
  }

  return (
    <div className="mt-7 space-y-5">
      {/* Success state — service confirmed */}
      <div className="flex items-center gap-3 rounded-xl border border-green-600/30 bg-green-50 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
          ✓
        </span>
        <p className="text-[13px] font-bold text-green-800">
          Great news! We service your area ({verifiedZip}).
        </p>
      </div>

      <p className="text-[15px] leading-relaxed text-ink/70">
        Tell us when and where. We’ll handle the rest.
      </p>

      {promoUnlocked && (
        <div className="flex items-center gap-3 rounded-xl border border-iris/30 bg-iris-tint/40 px-4 py-3">
          <span className="text-lg">🎉</span>
          <p className="text-[13px] font-bold text-iris-deep">
            Your $15 Grand Opening coupon{couponCode ? ` (${couponCode})` : ''} is applied — valid on
            your first wash with us.
          </p>
        </div>
      )}

      <div>
        <p className="label">Pickup date</p>
        <DatePicker value={form.date} min={today} onPick={pickDate} />
      </div>
      <div>
        <label htmlFor="window" className="label">
          Time window
        </label>
        <select id="window" className="field" value={form.window} onChange={set('window')}>
          {availableWindows.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <p className="mt-1 text-[12px] text-stone2">
          We’ll text you a closer arrival time the morning of your pickup.
        </p>
      </div>

      <div>
        <label htmlFor="address" className="label">
          Pickup address
        </label>
        <input
          id="address"
          className="field"
          placeholder="1234 Linden St, Riverside, CA 92507"
          value={form.address}
          onChange={set('address')}
          autoComplete="street-address"
        />
      </div>

      <div>
        <label htmlFor="notes" className="label">
          Notes for the valet <span className="font-normal text-stone2">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows="3"
          className="field resize-none"
          placeholder="Gate code, delicate items, detergent preferences…"
          value={form.notes}
          onChange={set('notes')}
        />
      </div>

      {/* ---- Extra care services ---- */}
      <fieldset className="card space-y-4">
        <legend className="eyebrow px-1">Extra care</legend>

        {/* Ironing */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-iris"
            checked={services.ironing}
            onChange={(e) => setServices((s) => ({ ...s, ironing: e.target.checked }))}
          />
          <span className="text-sm">
            <span className="font-bold">Ironing</span> — $3.55 / piece
            <span className="block text-stone2">Shirts, blouses, trousers, pressed crisp.</span>
          </span>
        </label>
        {services.ironing && (
          <div className="ml-7">
            <label htmlFor="ironingPieces" className="label">
              How many pieces?
            </label>
            <input
              id="ironingPieces"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className="field max-w-[120px]"
              placeholder="e.g. 5"
              value={services.ironingPieces}
              onChange={(e) => setServices((s) => ({ ...s, ironingPieces: e.target.value }))}
            />
          </div>
        )}

        {/* Bedding */}
        <div className="border-t border-ink/10 pt-4">
          <p className="text-sm font-bold">Comforters &amp; bedding</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <Counter
              label="King / Cal-King"
              price="$28 each"
              value={services.beddingKing}
              onChange={(v) => setServices((s) => ({ ...s, beddingKing: v }))}
            />
            <Counter
              label="Queen / Full"
              price="$26 each"
              value={services.beddingQueenFull}
              onChange={(v) => setServices((s) => ({ ...s, beddingQueenFull: v }))}
            />
            <Counter
              label="Twin"
              price="$18 each"
              value={services.beddingTwin}
              onChange={(v) => setServices((s) => ({ ...s, beddingTwin: v }))}
            />
          </div>
        </div>

        {/* Dry cleaning */}
        <label className="flex items-start gap-3 border-t border-ink/10 pt-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-iris"
            checked={services.dryCleaning}
            onChange={(e) => setServices((s) => ({ ...s, dryCleaning: e.target.checked }))}
          />
          <span className="text-sm">
            <span className="font-bold">Dry cleaning run</span>
            <span className="block text-stone2">
              We’ll take marked garments to our partner cleaner and bring them back. Each
              piece is itemized and added to your one order total.
            </span>
          </span>
        </label>
      </fieldset>

      {/* ---- Wash preferences (no extra cost) ---- */}
      <fieldset className="card space-y-4">
        <legend className="eyebrow px-1">Wash preferences · no extra cost</legend>

        <div>
          <p className="text-sm font-bold">Detergent</p>
          <div className="mt-2 space-y-2">
            {['Tide', 'Gain', 'Free & Clear (hypoallergenic)'].map((d) => (
              <label key={d} className="flex items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="detergent"
                  className="h-4 w-4 accent-iris"
                  checked={prefs.detergent === d}
                  onChange={() => setPrefs((p) => ({ ...p, detergent: d }))}
                />
                {d}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-ink/10 pt-4">
          <p className="text-sm font-bold">Fabric softener</p>
          <div className="mt-2 space-y-2">
            {['No softener', 'Downy', 'Free & Clear (hypoallergenic)'].map((s) => (
              <label key={s} className="flex items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="softener"
                  className="h-4 w-4 accent-iris"
                  checked={prefs.softener === s}
                  onChange={() => setPrefs((p) => ({ ...p, softener: s }))}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* White treatment — signature oxygen process + optional bleach */}
        <div className="border-t border-ink/10 pt-4">
          <p className="text-sm font-bold">Whites treatment</p>
          <div className="mt-2 rounded-xl border border-iris/20 bg-iris-tint/30 px-4 py-3">
            <p className="text-[13px] font-bold text-iris-deep">
              ✦ Active Oxygen &amp; Baking Soda White Treatment
              <span className="ml-1 font-normal text-stone2">· included</span>
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink/70">
              Our signature care for whites. Instead of harsh chlorine bleach, we pair active
              oxygen with a baking-soda soften — lifting stains, brightening naturally, and keeping
              fibers strong. No thinning, no yellowing.
            </p>
          </div>

          <label className="mt-3 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-iris"
              checked={prefs.bleach}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  bleach: e.target.checked,
                  bleachConsent: e.target.checked ? p.bleachConsent : false,
                }))
              }
            />
            <span>
              <span className="font-bold">Add traditional chlorine bleach</span>{' '}
              <span className="text-stone2">(by request)</span>
              <span className="block text-[12px] text-stone2">
                For specific sturdy items — plain cotton socks, undershirts, white linens. We’ll
                apply it only to items you mark. Most whites don’t need it.
              </span>
            </span>
          </label>

          {prefs.bleach && (
            <div className="mt-3 rounded-xl border border-[#8C3A2B]/25 bg-[#8C3A2B]/5 p-4">
              <p className="text-[13px] font-bold text-[#8C3A2B]">
                A quick note before we use chlorine bleach
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/75">
                Traditional chlorine bleach is powerful, and that power comes with trade-offs. By
                requesting it, you acknowledge it may shorten the lifespan of the marked garments,
                weaken their fibers over time, or cause eventual yellowing — and you release Haven
                &amp; Hours from liability for fabric degradation on those specific items. We’ll
                always apply it carefully, only to what you’ve marked.
              </p>
              <label className="mt-3 flex items-start gap-3 text-[13px] font-bold">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-iris"
                  checked={prefs.bleachConsent}
                  onChange={(e) => setPrefs((p) => ({ ...p, bleachConsent: e.target.checked }))}
                />
                I understand and request chlorine bleach for my marked items.
              </label>
            </div>
          )}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      <button type="button" className="btn-primary w-full" onClick={submit}>
        Schedule a Pickup
      </button>
      <p className="text-center text-[12px] text-stone2">
        Wash &amp; Fold $2.25/lb · $35 minimum · final weight confirmed at pickup
      </p>

      <HoursSection />

      <ReferAFriend />
    </div>
  )
}

/* ---------------- Active order ---------------- */
function OrderView() {
  const { order, resolveIncident, resetOrder } = useStore()
  const { incident, payment } = order

  // When the order view first appears (right after scheduling), jump to the top
  // so the customer lands on "Confirm your pickup", not halfway down the page.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return (
    <div className="mt-7 space-y-6">
      {/* Before the card is saved: make it clear the pickup isn't confirmed yet */}
      {!order.authorization && !payment && (
        <section className="card border-iris/30 bg-iris-tint/30">
          <p className="eyebrow text-iris">Almost done</p>
          <h2 className="mt-2 font-display text-2xl">Confirm your pickup</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            Save your card below to lock in your pickup for{' '}
            <span className="font-bold">
              {order.pickup.date} · {order.pickup.window}
            </span>
            . <span className="font-bold text-ink">You’re only charged after we weigh your laundry</span>{' '}
            — you’ll see the exact total first. A $35 minimum applies.
          </p>
        </section>
      )}

      {/* Status — only once the pickup is actually confirmed (card on file) */}
      {order.authorization && (
        <section className="card">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Order {order.id}</p>
            <p className="text-[12px] text-stone2">
              {order.pickup.date} · {order.pickup.window}
            </p>
          </div>
          <div className="mt-5">
            <ClotheslineTracker statusIndex={order.statusIndex} />
          </div>
          <p className="mt-4 text-center text-sm">
            <span className="font-bold text-iris">{STATUS_STEPS[order.statusIndex]}</span>
            {order.statusIndex === STATUS_STEPS.length - 1 && ' — almost home.'}
          </p>
        </section>
      )}

      {/* Customer checkout — shows until the card is authorized */}
      {!order.authorization && !payment && <Checkout estPounds={14} />}

      {/* Incident approval */}
      {incident && (
        <section className="card border-iris/30 bg-iris-tint/40">
          <p className="eyebrow text-iris">Needs your decision</p>
          <h2 className="mt-2 font-display text-2xl">We found something.</h2>
          <img
            src={incident.photo}
            alt="Garment with a reddish stain, photographed during intake inspection"
            className="mt-4 w-full rounded-xl border border-ink/10"
          />
          <p className="mt-3 text-sm leading-relaxed text-ink/80">{incident.note}</p>

          {incident.decision ? (
            <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm font-bold">
              {incident.decision === 'approve'
                ? 'You approved washing this garment. We’ll treat it gently.'
                : 'We’ll return this garment unwashed with the rest of your order.'}
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" className="btn-primary" onClick={() => resolveIncident('approve')}>
                Approve &amp; Wash
              </button>
              <button type="button" className="btn-ghost" onClick={() => resolveIncident('return')}>
                Return Unwashed
              </button>
            </div>
          )}
        </section>
      )}

      {/* Card authorized, waiting to be weighed & charged */}
      {order.authorization && !payment && (
        <section className="card border-iris/20 bg-iris-tint/20">
          <p className="eyebrow text-iris">Card confirmed</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            Your {labelFor(order.authorization.method)} is on file for the estimated{' '}
            <span className="font-bold">~${order.authorization.estimate.toFixed(2)}</span>.{' '}
            <span className="font-bold text-ink">You haven’t been charged yet.</span> Once we collect
            and weigh your laundry, you’ll see the exact total and itemized receipt right here.
          </p>
        </section>
      )}

      {/* Itemized receipt — after weighing & charging */}
      {payment && (
        <section className="card">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Receipt · {order.id}</p>
            <span className="text-[11px] font-bold text-iris">Paid</span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <ReceiptRow
              k={`Wash & Fold · ${order.finalPounds} lb × $2.25`}
              v={payment.breakdown.washFold}
            />
            {payment.breakdown.ironing > 0 && (
              <ReceiptRow k="Ironing" v={payment.breakdown.ironing} />
            )}
            {payment.breakdown.bedding > 0 && (
              <ReceiptRow k="Comforters & bedding" v={payment.breakdown.bedding} />
            )}
            {payment.breakdown.minimumApplied && (
              <ReceiptRow
                k="$35 order minimum applied"
                v={35 - payment.breakdown.subtotal}
                muted
              />
            )}
            {payment.discount > 0 && (
              <ReceiptRow
                k={order.authorization?.discountLabel || 'Discount'}
                v={-payment.discount}
                discount
              />
            )}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-ink/10 pt-4">
            <span className="font-display text-xl">Total paid</span>
            <span className="font-display text-2xl text-iris">${payment.total.toFixed(2)}</span>
          </div>
          <p className="mt-3 text-[12px] text-stone2">
            Charged to {labelFor(payment.method)} · {payment.intentId}
          </p>
        </section>
      )}

      {/* Details */}
      <section className="card">
        <p className="eyebrow">Pickup details</p>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Address" v={order.pickup.address} />
          <Row k="Date" v={order.pickup.date} />
          <Row k="Window" v={order.pickup.window} />
          {order.pickup.notes && <Row k="Notes" v={order.pickup.notes} />}
          {order.services?.ironingPieces > 0 && (
            <Row k="Ironing" v={`${order.services.ironingPieces} pieces · $3.55 ea`} />
          )}
          {order.services?.beddingKing > 0 && (
            <Row k="King / Cal-King bedding" v={`${order.services.beddingKing} · $28 ea`} />
          )}
          {order.services?.beddingQueenFull > 0 && (
            <Row k="Queen / Full bedding" v={`${order.services.beddingQueenFull} · $26 ea`} />
          )}
          {order.services?.beddingTwin > 0 && (
            <Row k="Twin bedding" v={`${order.services.beddingTwin} · $18 ea`} />
          )}
          {order.services?.dryCleaning && (
            <Row k="Dry cleaning run" v="Yes · itemized on your total" />
          )}
          {order.preferences && (
            <>
              <Row k="Detergent" v={order.preferences.detergent} />
              <Row k="Softener" v={order.preferences.softener} />
              <Row
                k="Whites"
                v={
                  order.preferences.bleach
                    ? 'Chlorine bleach (by request) — consented'
                    : 'Oxygen & baking soda treatment'
                }
              />
            </>
          )}
        </dl>
      </section>

      <ReferAFriend />

      <button
        type="button"
        onClick={resetOrder}
        className="mx-auto block text-[13px] font-bold text-stone2 underline underline-offset-4 hover:text-ink"
      >
        Start over (demo)
      </button>
    </div>
  )
}

function Counter({ label, price, value, onChange }) {
  return (
    <div>
      <p className="text-[13px] font-bold">{label}</p>
      <p className="text-[12px] text-stone2">{price}</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label={`Remove one ${label}`}
          className="h-8 w-8 rounded-full border border-ink/20 font-bold disabled:opacity-30"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          −
        </button>
        <span className="w-5 text-center font-bold">{value}</span>
        <button
          type="button"
          aria-label={`Add one ${label}`}
          className="h-8 w-8 rounded-full border border-ink/20 font-bold"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

function labelFor(method) {
  return method === 'apple' ? 'Apple Pay' : method === 'google' ? 'Google Pay' : 'card'
}

function ReceiptRow({ k, v, muted, discount }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className={muted ? 'text-stone2' : 'text-ink/70'}>{k}</dt>
      <dd
        className={
          'font-bold ' + (discount ? 'text-iris' : muted ? 'text-stone2' : 'text-ink')
        }
      >
        {v < 0 ? '−$' + Math.abs(v).toFixed(2) : '$' + v.toFixed(2)}
      </dd>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="shrink-0 text-stone2">{k}</dt>
      <dd className="text-right font-bold text-ink/90">{v}</dd>
    </div>
  )
}
