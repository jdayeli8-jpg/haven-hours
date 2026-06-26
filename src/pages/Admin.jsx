import { useState, useEffect } from 'react'
import {
  useStore,
  STATUS_STEPS,
  quoteTotal,
} from '../context/StoreContext.jsx'
import ClotheslineTracker from '../components/ClotheslineTracker.jsx'

// Tus precios de tintorería (App Price). Para cambiarlos, solo edita el número.
const DRY_CLEAN = [
  { key: 'suit', label: '2-Piece Suit', price: 18.25 },
  { key: 'shirt', label: 'Dress Shirt', price: 3.5 },
  { key: 'pants', label: 'Pants / Jeans', price: 8.25 },
  { key: 'dress', label: 'Formal Dress', price: 16.5 },
  { key: 'comforter', label: 'Comforter (Q/K)', price: 40.5 },
]

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [passcode, setPasscode] = useState('')
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <p className="eyebrow">Back of house</p>
      <h1 className="mt-2 font-display text-4xl">Admin</h1>
      {unlocked ? (
        <AdminPanel passcode={passcode} />
      ) : (
        <Gate
          onUnlock={(code) => {
            setPasscode(code)
            setUnlocked(true)
          }}
        />
      )}
    </div>
  )
}

/* ---------------- Passcode gate ---------------- */
function Gate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const tryUnlock = async () => {
    if (!code.trim()) return setError('Enter your passcode.')
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        onUnlock(code)
      } else if (res.status === 500) {
        setError(data.error || 'Admin not configured yet — set ADMIN_PASSCODE in Netlify.')
      } else {
        setError('That passcode doesn’t match.')
      }
    } catch {
      setError('Couldn’t reach the server. Publish the app and try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mt-7 max-w-sm">
      <p className="text-[15px] text-ink/70">Enter the staff passcode to continue.</p>
      <label htmlFor="passcode" className="label mt-5">
        Passcode
      </label>
      <input
        id="passcode"
        type="password"
        autoComplete="off"
        className="field"
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          setError('')
        }}
        onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-primary mt-5 w-full disabled:opacity-50"
        onClick={tryUnlock}
        disabled={checking}
      >
        {checking ? 'Checking…' : 'Unlock'}
      </button>
    </div>
  )
}

/* ---------------- Panel ---------------- */
function AdminPanel({ passcode }) {
  const {
    order,
    advanceStatus,
    setFinalPounds,
    reportIncident,
    recordPayment,
  } = useStore()

  const [pounds, setPounds] = useState('')
  const [charging, setCharging] = useState(false)
  const [chargeError, setChargeError] = useState('')

  if (!order) {
    return (
      <div className="mt-7 space-y-6">
        <OrdersBoard passcode={passcode} />
        <RealOrdersPanel passcode={passcode} />
        <IncidentPanel passcode={passcode} />
        <div className="card text-center">
          <p className="font-display text-2xl">No demo order loaded.</p>
          <p className="mt-2 text-sm text-stone2">
            The live orders above come straight from your database. The demo flow
            shows up here when you place a test order from{' '}
            <span className="font-bold">My Order</span>.
          </p>
        </div>
      </div>
    )
  }

  const parsedPounds = parseFloat(pounds)
  const validPounds = Number.isFinite(parsedPounds) && parsedPounds > 0
  const services = order?.services || {}
  const quote = validPounds ? quoteTotal(parsedPounds, services) : null
  const atFinalStep = order.statusIndex >= STATUS_STEPS.length - 1

  const charge = async () => {
    if (!validPounds) {
      setChargeError('Enter the final weight first.')
      return
    }
    setCharging(true)
    setChargeError('')
    try {
      const res = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pounds: parsedPounds,
          ironingPieces: services.ironingPieces || 0,
          beddingKing: services.beddingKing || 0,
          beddingQueenFull: services.beddingQueenFull || 0,
          beddingTwin: services.beddingTwin || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed.')
      setFinalPounds(parsedPounds)
      const discount = order.authorization?.discount || 0
      const finalTotal = Math.max(data.total - discount, 0)
      recordPayment({
        intentId: data.paymentIntent.id,
        amount: Math.round(finalTotal * 100),
        total: finalTotal,
        discount,
        breakdown: data.breakdown,
        method: order.authorization?.method || 'card',
        chargedAt: new Date().toISOString(),
      })
    } catch (err) {
      setChargeError(
        err.message === 'Failed to fetch'
          ? 'Couldn’t reach the payment function. Run the app with `netlify dev` so /api/* is available.'
          : err.message
      )
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="mt-7 space-y-6">
      {/* Command center — every order as a card, by stage */}
      <OrdersBoard passcode={passcode} />

      {/* Real orders from the database — weigh & charge the saved card */}
      <RealOrdersPanel passcode={passcode} />

      {/* Damage photos — attach a garment photo + note to a real order */}
      <IncidentPanel passcode={passcode} />

      {/* Today's order */}
      <section className="card">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Today · Order {order.id}</p>
          <p className="text-[12px] text-stone2">
            {order.pickup.date} · {order.pickup.window}
          </p>
        </div>
        <p className="mt-3 text-sm">
          <span className="text-stone2">Pickup at</span>{' '}
          <span className="font-bold">{order.pickup.address}</span>
        </p>
        {order.pickup.notes && (
          <p className="mt-1 text-sm text-ink/70">“{order.pickup.notes}”</p>
        )}
        {order.preferences && (
          <p className="mt-2 text-[12px] text-stone2">
            Wash with: <span className="font-bold text-ink/70">{order.preferences.detergent}</span> ·
            Softener: <span className="font-bold text-ink/70">{order.preferences.softener}</span>
            <span className="mt-1 block">
              Whites:{' '}
              {order.preferences.bleach ? (
                <span className="font-bold text-[#8C3A2B]">
                  ⚠ Chlorine bleach requested (consented) — marked items only
                </span>
              ) : (
                <span className="font-bold text-ink/70">Oxygen &amp; baking soda treatment</span>
              )}
            </span>
          </p>
        )}

        <div className="mt-5">
          <ClotheslineTracker statusIndex={order.statusIndex} />
        </div>

        <button
          type="button"
          className="btn-primary mt-5 w-full"
          onClick={advanceStatus}
          disabled={atFinalStep}
        >
          {atFinalStep
            ? `${STATUS_STEPS[STATUS_STEPS.length - 1]} — final stage`
            : `Advance to “${STATUS_STEPS[order.statusIndex + 1]}”`}
        </button>
      </section>

      {/* Weight & total */}
      <section className="card">
        <p className="eyebrow">Final weight &amp; total</p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="pounds" className="label">
              Final pounds
            </label>
            <input
              id="pounds"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              className="field"
              placeholder="e.g. 12.5"
              value={pounds}
              onChange={(e) => setPounds(e.target.value)}
            />
          </div>
          <div className="pb-1 text-right">
            <p className="text-[12px] text-stone2">Total</p>
            <p className="font-display text-3xl text-iris">
              {quote ? `$${quote.total.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[12px] text-stone2">
          $2.25 / lb
          {services.ironingPieces > 0 && ` · ironing ×${services.ironingPieces} ($3.55 ea)`}
          {services.beddingKing > 0 && ` · king bedding ×${services.beddingKing} ($28 ea)`}
          {services.beddingQueenFull > 0 && ` · queen/full bedding ×${services.beddingQueenFull} ($26 ea)`}
          {services.beddingTwin > 0 && ` · twin bedding ×${services.beddingTwin} ($18 ea)`}
          {quote?.minimumApplied ? ' · $35 minimum applied' : ' · $35 minimum'}
        </p>
        {services.dryCleaning && (
          <p className="mt-1 text-[12px] font-bold text-iris">
            Dry cleaning run requested — add the items below; included in the one charge.
          </p>
        )}
      </section>

      {/* Incident */}
      <section className="card">
        <p className="eyebrow">Garment incident</p>
        {order.incident ? (
          <div className="mt-3 text-sm">
            <p className="font-bold">Sent to customer.</p>
            <p className="mt-1 text-ink/70">
              {order.incident.decision === 'approve' && 'Customer approved washing the garment.'}
              {order.incident.decision === 'return' && 'Customer asked to return it unwashed.'}
              {!order.incident.decision && 'Waiting for the customer’s decision…'}
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/70">
              Found a stain or damage at intake? Send a photo to the customer for approval.
            </p>
            <button
              type="button"
              className="btn-ghost mt-4 w-full"
              onClick={() => reportIncident()}
            >
              Simulate incident photo upload
            </button>
          </>
        )}
      </section>

      {/* Charge */}
      <section className="card">
        <p className="eyebrow">Payment</p>
        {order.payment ? (
          <div className="mt-3 text-sm">
            <p className="font-bold text-iris">
              Charged ${order.payment.total.toFixed(2)} · succeeded
            </p>
            <p className="mt-1 text-[12px] text-stone2">{order.payment.intentId}</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink/70">
              {order.authorization
                ? `Customer authorized ${order.authorization.method === 'apple' ? 'Apple Pay' : order.authorization.method === 'google' ? 'Google Pay' : 'their card'} at booking (est. ~$${order.authorization.estimate.toFixed(2)}). Enter the real weight to charge the exact amount.`
                : 'The serverless function revalidates the weight and recomputes the price — the client total is never trusted.'}
            </p>
            <button
              type="button"
              className="btn-primary mt-4 w-full"
              onClick={charge}
              disabled={charging || !validPounds}
            >
              {charging
                ? 'Charging…'
                : quote
                  ? `Charge $${quote.total.toFixed(2)}`
                  : 'Charge customer'}
            </button>
            {chargeError && (
              <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
                {chargeError}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}

/* ---------------- Live orders (Supabase) — weigh & charge ---------------- */
// ── Fase 2a: Tablero de mando ──────────────────────────────────────────
// Todas las órdenes como tarjetas, agrupadas por etapa, con su número.
// Reusa /api/update-status (que también avisa al cliente por correo).
// 'delivered' = Archivo (órdenes completadas).
const BOARD_COLUMNS = [
  { key: 'new', label: 'New orders' },
  { key: 'collected', label: 'Collected' },
  { key: 'washing', label: 'In the wash' },
  { key: 'ready', label: 'Ready' },
]

function stageOf(o) {
  const f = o.fulfillment_status
  return f === 'collected' || f === 'washing' || f === 'ready' || f === 'delivered' ? f : 'new'
}

function OrdersBoard({ passcode }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null) // `${id}:${stage}`
  const [archiveOpen, setArchiveOpen] = useState(false)

  const load = async () => {
    setError('')
    setOrders(null)
    try {
      const res = await fetch('/api/list-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, scope: 'recent' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load orders.')
      setOrders(data.orders || [])
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Couldn’t reach the server. Publish the app so /api works.'
          : err.message
      )
      setOrders([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setStage = async (order, stageKey) => {
    setBusy(`${order.id}:${stageKey}`)
    setError('')
    try {
      const res = await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: stageKey, passcode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not update.')
      setOrders((list) =>
        (list || []).map((o) => (o.id === order.id ? { ...o, fulfillment_status: stageKey } : o))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const list = orders || []
  const active = list.filter((o) => stageOf(o) !== 'delivered')
  const archived = list.filter((o) => stageOf(o) === 'delivered')

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Order board · everything in one place</p>
        <button type="button" className="text-[12px] font-bold text-iris underline" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        Each order is one card with its number. Move it along as it progresses — the
        customer gets an email at each step. Tap <span className="font-bold">Delivered</span>{' '}
        to send it to the archive.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      {orders === null && <p className="mt-4 text-sm text-stone2">Loading orders…</p>}
      {orders !== null && active.length === 0 && (
        <p className="mt-4 text-sm text-stone2">No active orders right now.</p>
      )}

      {BOARD_COLUMNS.map((col) => {
        const inCol = active.filter((o) => stageOf(o) === col.key)
        if (inCol.length === 0) return null
        return (
          <div key={col.key} className="mt-5">
            <p className="text-[12px] font-bold uppercase tracking-wide text-stone2">
              {col.label} · {inCol.length}
            </p>
            <ul className="mt-2 space-y-3">
              {inCol.map((o) => (
                <BoardCard key={o.id} o={o} busy={busy} onStage={setStage} />
              ))}
            </ul>
          </div>
        )
      })}

      {archived.length > 0 && (
        <div className="mt-6 border-t border-ink/10 pt-4">
          <button
            type="button"
            className="text-[13px] font-bold text-iris"
            onClick={() => setArchiveOpen((v) => !v)}
          >
            {archiveOpen ? '▾' : '▸'} Archive · {archived.length} completed
          </button>
          {archiveOpen && (
            <ul className="mt-3 space-y-2">
              {archived.map((o) => (
                <li
                  key={o.id}
                  className="flex items-baseline justify-between rounded-xl border border-ink/10 px-3 py-2 text-[13px]"
                >
                  <span className="font-bold">
                    {o.order_code ? o.order_code + ' · ' : ''}
                    {o.name || 'Customer'}
                  </span>
                  <span className="text-stone2">
                    {o.final_amount ? `$${Number(o.final_amount).toFixed(2)}` : 'delivered'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function BoardCard({ o, busy, onStage }) {
  const here = stageOf(o)
  const paid = o.status === 'paid'
  const hasIncident = !!o.incident_created_at
  const smsBody = encodeURIComponent(
    `Hi${o.name ? ' ' + String(o.name).split(' ')[0] : ''}! This is Haven & Hours — we’re on our way for your pickup.`
  )
  return (
    <li className="rounded-2xl border border-ink/10 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold">
          {o.order_code ? o.order_code + ' · ' : ''}
          {o.name || 'Customer'}
        </p>
        <span
          className={
            'text-[11px] font-bold uppercase tracking-wide ' +
            (paid ? 'text-green-700' : 'text-stone2')
          }
        >
          {paid ? 'Paid' : 'Scheduled'}
        </span>
      </div>

      {(o.pickup_date || o.pickup_window) && (
        <p className="mt-1 text-[12px] text-stone2">
          {o.pickup_date}
          {o.pickup_window ? ` · ${o.pickup_window}` : ''}
        </p>
      )}
      {o.address && <p className="mt-1 text-[13px] text-ink/80">{o.address}</p>}
      {hasIncident && (
        <p className="mt-1 text-[12px] font-bold text-iris">📸 Damage photo on file</p>
      )}

      {/* Mover de etapa */}
      <div className="mt-3 flex flex-wrap gap-2">
        {FULFILLMENT_STAGES.map((stage) => {
          const isCurrent = here === stage.key
          const isBusy = busy === `${o.id}:${stage.key}`
          return (
            <button
              key={stage.key}
              type="button"
              disabled={isBusy || isCurrent}
              onClick={() => onStage(o, stage.key)}
              className={
                'rounded-full px-3 py-1.5 text-[12px] font-bold transition ' +
                (isCurrent
                  ? 'bg-iris text-white'
                  : 'border border-ink/15 text-ink hover:border-iris hover:text-iris disabled:opacity-40')
              }
            >
              {isBusy ? '…' : stage.label}
            </button>
          )
        })}
      </div>

      {o.phone && (
        <a
          href={`sms:${o.phone}?&body=${smsBody}`}
          className="mt-3 inline-block text-[12px] font-bold text-iris underline"
        >
          Text arrival time
        </a>
      )}
    </li>
  )
}

function RealOrdersPanel({ passcode }) {
  const [orders, setOrders] = useState(null) // null = loading
  const [error, setError] = useState('')
  const [weights, setWeights] = useState({}) // { [orderId]: '12.5' }
  const [extras, setExtras] = useState({}) // { [orderId]: '45.00' } — dry cleaning, etc.
  const [extraNotes, setExtraNotes] = useState({}) // { [orderId]: '3 shirts dry clean' }
  const [dryItems, setDryItems] = useState({}) // { [orderId]: { suit: 2, shirt: 1 } }

  // Suma/resta una prenda de tintorería y recalcula el extra + la nota automáticamente.
  const setDryQty = (orderId, key, delta) => {
    const cur = { ...(dryItems[orderId] || {}) }
    const next = Math.max(0, (cur[key] || 0) + delta)
    if (next === 0) delete cur[key]
    else cur[key] = next
    let subtotal = 0
    const parts = []
    for (const item of DRY_CLEAN) {
      const q = cur[item.key] || 0
      if (q > 0) {
        subtotal += q * item.price
        parts.push(`${q} ${item.label}`)
      }
    }
    setDryItems((m) => ({ ...m, [orderId]: cur }))
    setExtras((m) => ({ ...m, [orderId]: subtotal > 0 ? subtotal.toFixed(2) : '' }))
    setExtraNotes((m) => ({ ...m, [orderId]: parts.join(', ') }))
  }
  const [busyId, setBusyId] = useState(null)
  const [done, setDone] = useState({}) // { [orderId]: { washFold, extra, total, paymentId } }

  const load = async () => {
    setError('')
    setOrders(null)
    try {
      const res = await fetch('/api/list-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load orders.')
      setOrders(data.orders)
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Couldn’t reach the server. Publish the app (or run `netlify dev`) so /api works.'
          : err.message
      )
      setOrders([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const charge = async (order) => {
    const pounds = parseFloat(weights[order.id])
    if (!Number.isFinite(pounds) || pounds <= 0) {
      setError('Enter the real weight first.')
      return
    }
    const x = parseFloat(extras[order.id])
    const extraCharge = Number.isFinite(x) && x > 0 ? x : 0
    const extraNote = (extraNotes[order.id] || '').trim()
    setBusyId(order.id)
    setError('')
    try {
      const res = await fetch('/api/square-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, pounds, extraCharge, extraNote, passcode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Charge failed.')
      setDone((d) => ({
        ...d,
        [order.id]: {
          washFold: data.washFold,
          extra: data.extra,
          couponDiscount: data.couponDiscount,
          total: data.total,
          paymentId: data.paymentId,
        },
      }))
      setOrders((list) => (list || []).filter((o) => o.id !== order.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Live orders · weigh &amp; charge</p>
        <button
          type="button"
          className="text-[12px] font-bold text-iris underline"
          onClick={load}
        >
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        Real orders from your database with a card saved on file. Enter the final
        weight and any dry-cleaning extra, then charge the saved card in one go.
        Wash &amp; Fold is $2.25 / lb, $35 minimum.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      {orders === null && <p className="mt-4 text-sm text-stone2">Loading orders…</p>}

      {orders && orders.length === 0 && (
        <p className="mt-4 text-sm text-stone2">No orders waiting to be charged right now.</p>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => {
            const w = parseFloat(weights[o.id])
            const valid = Number.isFinite(w) && w > 0
            const wf = valid ? Math.max(w * 2.25, 35) : 0
            const x = parseFloat(extras[o.id])
            const extraVal = Number.isFinite(x) && x > 0 ? x : 0
            const preview = valid ? wf + extraVal : null
            const noCard = !o.square_card_id
            return (
              <li key={o.id} className="rounded-2xl border border-ink/10 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">{o.order_code ? o.order_code + ' · ' : ''}{o.name || 'Customer'}</p>
                  <p className="text-[12px] text-stone2">
                    est. ~${Number(o.estimate || 0).toFixed(2)}
                  </p>
                </div>
                <p className="mt-0.5 text-[12px] text-stone2">
                  {o.email}
                  {o.phone ? ` · ${o.phone}` : ''}
                </p>

                {noCard ? (
                  <p className="mt-3 text-sm font-bold text-[#8C3A2B]">
                    No card on file — can’t charge this one.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="label" htmlFor={`w-${o.id}`}>
                        Final pounds (Wash &amp; Fold)
                      </label>
                      <input
                        id={`w-${o.id}`}
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        className="field"
                        placeholder="e.g. 12.5"
                        value={weights[o.id] || ''}
                        onChange={(e) =>
                          setWeights((m) => ({ ...m, [o.id]: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="label">Dry cleaning — tap to add</label>
                      <div className="mt-1 space-y-1.5 rounded-xl border border-ink/10 p-3">
                        {DRY_CLEAN.map((item) => {
                          const q = (dryItems[o.id] || {})[item.key] || 0
                          return (
                            <div key={item.key} className="flex items-center justify-between gap-2">
                              <span className="text-[13px]">
                                {item.label}{' '}
                                <span className="text-stone2">${item.price.toFixed(2)}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`Remove one ${item.label}`}
                                  className="h-7 w-7 rounded-full border border-ink/15 font-bold leading-none disabled:opacity-30"
                                  disabled={q === 0}
                                  onClick={() => setDryQty(o.id, item.key, -1)}
                                >
                                  –
                                </button>
                                <span className="w-5 text-center text-sm font-bold">{q}</span>
                                <button
                                  type="button"
                                  aria-label={`Add one ${item.label}`}
                                  className="h-7 w-7 rounded-full border border-ink/15 font-bold leading-none"
                                  onClick={() => setDryQty(o.id, item.key, +1)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="mt-1 text-[12px] text-stone2">
                        Adds to the single total below — one charge, itemized.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-36">
                        <label className="label" htmlFor={`x-${o.id}`}>
                          Dry-clean $ (auto)
                        </label>
                        <input
                          id={`x-${o.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="field"
                          placeholder="0.00"
                          value={extras[o.id] || ''}
                          onChange={(e) =>
                            setExtras((m) => ({ ...m, [o.id]: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="label" htmlFor={`xn-${o.id}`}>
                          Note (optional)
                        </label>
                        <input
                          id={`xn-${o.id}`}
                          type="text"
                          className="field"
                          placeholder="e.g. 3 shirts dry clean"
                          value={extraNotes[o.id] || ''}
                          onChange={(e) =>
                            setExtraNotes((m) => ({ ...m, [o.id]: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12px] text-stone2">
                        {valid
                          ? `W&F $${wf.toFixed(2)}${extraVal > 0 ? ` + extra $${extraVal.toFixed(2)}` : ''}`
                          : 'Enter weight to see total'}
                      </p>
                      <button
                        type="button"
                        className="btn-primary whitespace-nowrap"
                        onClick={() => charge(o)}
                        disabled={busyId === o.id || !valid}
                      >
                        {busyId === o.id
                          ? 'Charging…'
                          : preview
                            ? `Charge $${preview.toFixed(2)}`
                            : 'Charge'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {Object.keys(done).length > 0 && (
        <div className="mt-5 rounded-2xl bg-iris-tint/50 p-4">
          <p className="eyebrow">Charged just now</p>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(done).map(([id, info]) => (
              <li key={id} className="font-bold text-iris">
                ✓ ${Number(info.total).toFixed(2)}
                {(info.extra > 0 || info.couponDiscount > 0) && (
                  <span className="font-normal text-[12px] text-stone2">
                    {' '}
                    (W&amp;F ${Number(info.washFold).toFixed(2)}
                    {info.extra > 0 ? ` + extra $${Number(info.extra).toFixed(2)}` : ''}
                    {info.couponDiscount > 0 ? ` - coupon $${Number(info.couponDiscount).toFixed(2)}` : ''})
                  </span>
                )}{' '}
                <span className="font-normal text-[12px] text-stone2">{info.paymentId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ---------------- Order status + client email updates (Feature A) ---------------- */
const FULFILLMENT_STAGES = [
  { key: 'collected', label: 'Collected' },
  { key: 'washing', label: 'In the wash' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
]

function StatusPanel({ passcode }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('') // `${orderId}:${stageKey}`
  const [flash, setFlash] = useState({}) // orderId -> { label, emailed }

  const load = async () => {
    setError('')
    setOrders(null)
    try {
      const res = await fetch('/api/list-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, scope: 'recent' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load orders.')
      setOrders(data.orders)
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Couldn’t reach the server. Publish the app so /api works.'
          : err.message
      )
      setOrders([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setStatus = async (order, stage) => {
    setBusy(`${order.id}:${stage.key}`)
    setError('')
    try {
      const res = await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: stage.key, passcode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Update failed.')
      setOrders((list) =>
        (list || []).map((o) => (o.id === order.id ? { ...o, fulfillment_status: stage.key } : o))
      )
      setFlash((f) => ({ ...f, [order.id]: { label: data.label, emailed: data.emailed } }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Order status · email the client</p>
        <button type="button" className="text-[12px] font-bold text-iris underline" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        Tap a stage to update the order and email the customer automatically.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      {orders === null && <p className="mt-4 text-sm text-stone2">Loading orders…</p>}
      {orders && orders.length === 0 && <p className="mt-4 text-sm text-stone2">No orders yet.</p>}

      {orders && orders.length > 0 && (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => {
            const f = flash[o.id]
            return (
              <li key={o.id} className="rounded-2xl border border-ink/10 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">{o.order_code ? o.order_code + ' · ' : ''}{o.name || 'Customer'}</p>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-stone2">
                    {o.status === 'paid' ? 'Paid' : 'Scheduled'}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-stone2">{o.email}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {FULFILLMENT_STAGES.map((stage) => {
                    const isCurrent = o.fulfillment_status === stage.key
                    const isBusy = busy === `${o.id}:${stage.key}`
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => setStatus(o, stage)}
                        disabled={!!busy}
                        className={
                          'rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-50 ' +
                          (isCurrent
                            ? 'bg-iris text-ivory'
                            : 'border border-ink/15 text-ink hover:bg-ivory')
                        }
                      >
                        {isBusy ? '…' : stage.label}
                      </button>
                    )
                  })}
                </div>

                {f && (
                  <p className="mt-2 text-[12px] font-bold text-iris">
                    ✓ Marked “{f.label}”{' '}
                    <span className="font-normal text-stone2">
                      {f.emailed ? '· email sent' : '· status saved (email not sent)'}
                    </span>
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* ---------------- Damage photos (Función B-1) ---------------- */

// Shrinks a phone photo in the browser before upload: resizes the long edge to
// ~1000px and re-encodes as JPEG, so the stored base64 stays small (~100–300 KB).
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the photo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file isn’t a valid image.'))
      img.onload = () => {
        const MAX = 1000
        let { width, height } = img
        if (width > height && width > MAX) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else if (height >= width && height > MAX) {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function IncidentPanel({ passcode }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState({}) // orderId -> compressed dataURL
  const [notes, setNotes] = useState({}) // orderId -> note text
  const [busy, setBusy] = useState('') // orderId currently sending
  const [flash, setFlash] = useState({}) // orderId -> name (just attached)

  const load = async () => {
    setError('')
    setOrders(null)
    try {
      const res = await fetch('/api/list-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, scope: 'recent' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load orders.')
      setOrders(data.orders)
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Couldn’t reach the server. Publish the app so /api works.'
          : err.message
      )
      setOrders([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickPhoto = async (orderId, file) => {
    if (!file) return
    setError('')
    try {
      const dataUrl = await compressImage(file)
      setPhotos((p) => ({ ...p, [orderId]: dataUrl }))
    } catch (err) {
      setError(err.message)
    }
  }

  const attach = async (order) => {
    const photo = photos[order.id]
    if (!photo) return setError('Pick a photo first.')
    setBusy(order.id)
    setError('')
    try {
      const res = await fetch('/api/report-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          passcode,
          photo,
          note: notes[order.id] || '',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed.')
      setFlash((f) => ({ ...f, [order.id]: { name: data.name || 'customer', emailed: data.emailed } }))
      setOrders((list) =>
        (list || []).map((o) =>
          o.id === order.id ? { ...o, incident_created_at: new Date().toISOString() } : o
        )
      )
      // clear the picker for this order
      setPhotos((p) => ({ ...p, [order.id]: null }))
      setNotes((n) => ({ ...n, [order.id]: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Damage photos · attach to an order</p>
        <button type="button" className="text-[12px] font-bold text-iris underline" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        Found a stain, tear, or pre-existing damage? Snap a photo and add a note.
        We email the customer the photo with two choices: wash it anyway, or
        return it untouched — and their answer comes back to you.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      {orders === null && <p className="mt-4 text-sm text-stone2">Loading orders…</p>}
      {orders && orders.length === 0 && <p className="mt-4 text-sm text-stone2">No orders yet.</p>}

      {orders && orders.length > 0 && (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => {
            const picked = photos[o.id]
            const justSaved = flash[o.id]
            const hasIncident = !!o.incident_created_at
            const isBusy = busy === o.id
            return (
              <li key={o.id} className="rounded-2xl border border-ink/10 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold">{o.order_code ? o.order_code + ' · ' : ''}{o.name || 'Customer'}</p>
                  {hasIncident && !justSaved && (
                    <span className="text-[11px] font-bold uppercase tracking-wide text-iris">
                      Photo on file
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-stone2">{o.email}</p>

                {o.incident_decision && (
                  <p className="mt-1 inline-block rounded-full bg-iris-tint px-2.5 py-1 text-[12px] font-bold text-iris-deep">
                    Customer chose:{' '}
                    {o.incident_decision === 'approve' ? 'Wash it anyway' : 'Return it untouched'}
                  </p>
                )}

                <div className="mt-3 flex flex-col gap-3">
                  <label className="btn-ghost cursor-pointer text-center">
                    {picked ? 'Choose a different photo' : 'Choose / take a photo'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => pickPhoto(o.id, e.target.files && e.target.files[0])}
                    />
                  </label>

                  {picked && (
                    <img
                      src={picked}
                      alt="Selected garment"
                      className="max-h-48 w-auto rounded-xl border border-ink/10 object-contain"
                    />
                  )}

                  <textarea
                    className="field min-h-[64px]"
                    placeholder="Optional note (e.g. small red stain on the left cuff, looks pre-existing)"
                    value={notes[o.id] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [o.id]: e.target.value }))}
                  />

                  <button
                    type="button"
                    onClick={() => attach(o)}
                    disabled={!picked || isBusy}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isBusy ? 'Saving…' : 'Attach photo to order'}
                  </button>
                </div>

                {justSaved && (
                  <p className="mt-2 text-[12px] font-bold text-iris">
                    ✓ Photo sent to {justSaved.name}{' '}
                    <span className="font-normal text-stone2">
                      {justSaved.emailed ? '· email sent for review' : '· saved (email not sent)'}
                    </span>
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/* ---------------- Today's pickups & route (batching helper) ---------------- */

function RoutePanel({ passcode }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  const load = async () => {
    setError('')
    setOrders(null)
    try {
      const res = await fetch('/api/list-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, scope: 'recent' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load orders.')
      setOrders(data.orders)
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Couldn’t reach the server. Publish the app so /api works.'
          : err.message
      )
      setOrders([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const withPickup = (orders || []).filter((o) => o.pickup_date)
  const todays = withPickup.filter((o) => o.pickup_date === today)
  const upcoming = withPickup.filter((o) => o.pickup_date !== today)

  const textLink = (o) => {
    const digits = String(o.phone || '').replace(/[^\d]/g, '')
    const win = o.pickup_window || 'your window'
    const msg = `Hi ${o.name || 'there'}, this is Haven & Hours. Your laundry pickup is today (${win}). We'll arrive around ~____. See you soon!`
    return `sms:${digits}?body=${encodeURIComponent(msg)}`
  }

  const Card = ({ o, isToday }) => (
    <li className="rounded-2xl border border-ink/10 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold">{o.order_code ? o.order_code + ' · ' : ''}{o.name || 'Customer'}</p>
        <span className="text-[12px] text-stone2">{o.pickup_window}</span>
      </div>
      {o.address && <p className="mt-1 text-[13px] text-ink/75">{o.address}</p>}
      <p className="mt-0.5 text-[12px] text-stone2">
        {o.pickup_date}
        {o.phone ? ` · ${o.phone}` : ''}
      </p>
      {o.phone && isToday && (
        <a href={textLink(o)} className="btn-ghost mt-3 inline-block text-center">
          📲 Text arrival time
        </a>
      )}
    </li>
  )

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Today’s pickups &amp; route</p>
        <button type="button" className="text-[12px] font-bold text-iris underline" onClick={load}>
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        Group these into one efficient loop. Tap “Text arrival time” to send each
        customer a closer ETA from your phone.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-[#8C3A2B]">
          {error}
        </p>
      )}

      {orders === null && <p className="mt-4 text-sm text-stone2">Loading…</p>}
      {orders && withPickup.length === 0 && (
        <p className="mt-4 text-sm text-stone2">No scheduled pickups yet.</p>
      )}

      {todays.length > 0 && (
        <>
          <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-iris">
            Today ({todays.length})
          </p>
          <ul className="mt-2 space-y-3">
            {todays.map((o) => (
              <Card key={o.id} o={o} isToday />
            ))}
          </ul>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-stone2">
            Upcoming
          </p>
          <ul className="mt-2 space-y-3">
            {upcoming.map((o) => (
              <Card key={o.id} o={o} isToday={false} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
