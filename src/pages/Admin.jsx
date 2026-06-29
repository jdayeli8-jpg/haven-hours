import { useState, useEffect, useRef } from 'react'

// Tus precios de tintorería (App Price). Para cambiarlos, solo edita el número.
const DRY_CLEAN = [
  { key: 'suit', label: '2-Piece Suit', price: 18.25 },
  { key: 'shirt', label: 'Dress Shirt', price: 3.5 },
  { key: 'pants', label: 'Pants / Jeans', price: 8.25 },
  { key: 'dress', label: 'Formal Dress', price: 16.5 },
  { key: 'comforter', label: 'Comforter (Q/K)', price: 40.5 },
]

// Las columnas del tablero, en orden de flujo de trabajo.
const BOARD_COLUMNS = [
  { key: 'new', label: 'New orders' },
  { key: 'collected', label: 'Collected' },
  { key: 'washing', label: 'In the wash' },
  { key: 'ready', label: 'Ready' },
]

// Los botones para mover una orden de etapa.
const FULFILLMENT_STAGES = [
  { key: 'collected', label: 'Collected' },
  { key: 'washing', label: 'In the wash' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
]

function stageOf(o) {
  const f = o.fulfillment_status
  return f === 'collected' || f === 'washing' || f === 'ready' || f === 'delivered' ? f : 'new'
}

/* ============================================================
   PANTALLA PRINCIPAL — login + un solo tablero
   ============================================================ */
export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [passcode, setPasscode] = useState('')
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <p className="eyebrow">Back of house</p>
      <h1 className="mt-2 font-display text-4xl">Admin</h1>
      {unlocked ? (
        <div className="mt-7">
          <OrdersBoard passcode={passcode} />
        </div>
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

/* ============================================================
   EL TABLERO — una tarjeta por orden, todo adentro
   ============================================================ */
function OrdersBoard({ passcode }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null) // `${id}:${stage}`
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const firstLoad = useRef(true)

  // quiet = recarga silenciosa (no muestra "Loading…", no borra lo que ya hay)
  const load = async (quiet = false) => {
    if (!quiet) {
      setError('')
      setOrders(null)
    }
    try {
      const res = await fetch('/api/list-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, scope: 'recent' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load orders.')
      setOrders(data.orders || [])
      setLastSync(new Date())
      if (!quiet) setError('')
    } catch (err) {
      if (!quiet) {
        setError(
          err.message === 'Failed to fetch'
            ? 'Couldn’t reach the server. Publish the app so /api works.'
            : err.message
        )
        setOrders([])
      }
    }
  }

  // Carga al abrir, y luego se actualiza sola cada 25 segundos.
  useEffect(() => {
    load(false)
    const t = setInterval(() => load(true), 25000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aplica un cambio a una orden en la lista local (sin recargar todo).
  const patchOrder = (orderId, patch) => {
    setOrders((list) => (list || []).map((o) => (o.id === orderId ? { ...o, ...patch } : o)))
  }

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
      patchOrder(order.id, { fulfillment_status: stageKey })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const list = orders || []
  const active = list.filter((o) => stageOf(o) !== 'delivered')
  const archived = list.filter((o) => stageOf(o) === 'delivered')

  const syncLabel = lastSync
    ? `Updated ${lastSync.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : ''

  return (
    <section className="card">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Order board · everything in one place</p>
        <button type="button" className="text-[12px] font-bold text-iris underline" onClick={() => load(false)}>
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        One card per order — newest on top. Weigh &amp; charge, send a “ready” photo,
        report damage, and move the order along, all in the same place. The board
        refreshes itself, so a customer’s reply and a charge show up on their own.
      </p>
      {syncLabel && <p className="mt-1 text-[11px] text-stone2">{syncLabel} · auto-refreshes</p>}

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
          <div key={col.key} className="mt-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-stone2">
              {col.label} · {inCol.length}
            </p>
            <ul className="mt-2 space-y-3">
              {inCol.map((o) => (
                <BoardCard
                  key={o.id}
                  o={o}
                  busy={busy}
                  onStage={setStage}
                  onPatch={patchOrder}
                  passcode={passcode}
                />
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

/* ---------------- Una tarjeta de orden (con TODO adentro) ---------------- */
function BoardCard({ o, busy, onStage, onPatch, passcode }) {
  const here = stageOf(o)
  const paid = o.status === 'paid'
  const hasIncident = !!o.incident_created_at
  const hasCard = !!o.square_card_id

  // ---- Pesar y cobrar ----
  const [weight, setWeight] = useState('')
  const [dryQty, setDryQtyState] = useState({}) // { suit: 2, shirt: 1 }
  const [extraNote, setExtraNote] = useState('')
  const [charging, setCharging] = useState(false)
  const [chargeErr, setChargeErr] = useState('')
  const [charged, setCharged] = useState(null) // { total, washFold, extra, couponDiscount, paymentId }

  const bumpDry = (key, delta) => {
    setDryQtyState((cur) => {
      const next = { ...cur }
      const v = Math.max(0, (next[key] || 0) + delta)
      if (v === 0) delete next[key]
      else next[key] = v
      // recalcula la nota automática
      const parts = []
      for (const item of DRY_CLEAN) {
        const q = next[item.key] || 0
        if (q > 0) parts.push(`${q} ${item.label}`)
      }
      setExtraNote(parts.join(', '))
      return next
    })
  }

  let dryTotal = 0
  for (const item of DRY_CLEAN) dryTotal += (dryQty[item.key] || 0) * item.price

  const w = parseFloat(weight)
  const validW = Number.isFinite(w) && w > 0
  const wf = validW ? Math.max(w * 2.25, 35) : 0
  const preview = validW ? wf + dryTotal : null

  const doCharge = async () => {
    if (!validW) {
      setChargeErr('Enter the real weight first.')
      return
    }
    setCharging(true)
    setChargeErr('')
    try {
      const res = await fetch('/api/square-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: o.id,
          pounds: w,
          extraCharge: dryTotal > 0 ? Number(dryTotal.toFixed(2)) : 0,
          extraNote: extraNote.trim(),
          passcode,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Charge failed.')
      setCharged({
        total: data.total,
        washFold: data.washFold,
        extra: data.extra,
        couponDiscount: data.couponDiscount,
        paymentId: data.paymentId,
      })
      // Marca pagado en la tarjeta al instante.
      onPatch(o.id, { status: 'paid', final_amount: data.total })
    } catch (err) {
      setChargeErr(err.message)
    } finally {
      setCharging(false)
    }
  }

  // ---- Foto de daño ----
  const [dmgOpen, setDmgOpen] = useState(false)
  const [dmgPhoto, setDmgPhoto] = useState(null)
  const [dmgNote, setDmgNote] = useState('')
  const [dmgBusy, setDmgBusy] = useState(false)
  const [dmgErr, setDmgErr] = useState('')
  const [dmgSent, setDmgSent] = useState(null) // { name, emailed }

  const pickDmg = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setDmgErr('')
    try {
      setDmgPhoto(await compressImage(file))
    } catch {
      setDmgErr('Could not read that image.')
    }
  }

  const attachDmg = async () => {
    if (!dmgPhoto || dmgBusy) return
    setDmgBusy(true)
    setDmgErr('')
    try {
      const res = await fetch('/api/report-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o.id, passcode, photo: dmgPhoto, note: dmgNote.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed.')
      setDmgSent({ name: data.name || 'customer', emailed: data.emailed })
      onPatch(o.id, { incident_created_at: new Date().toISOString() })
      setDmgPhoto(null)
      setDmgNote('')
      setDmgOpen(false)
    } catch (err) {
      setDmgErr(err.message)
    } finally {
      setDmgBusy(false)
    }
  }

  // ---- Foto de "ropa lista" ----
  const [readyOpen, setReadyOpen] = useState(false)
  const [readyPhoto, setReadyPhoto] = useState(null)
  const [readyNote, setReadyNote] = useState('')
  const [readyBusy, setReadyBusy] = useState(false)
  const [readyErr, setReadyErr] = useState('')
  const [readyMsg, setReadyMsg] = useState(o.ready_created_at ? 'Ready photo sent ✓' : '')

  const pickReady = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setReadyErr('')
    try {
      setReadyPhoto(await compressImage(file))
    } catch {
      setReadyErr('Could not read that image.')
    }
  }

  const sendReady = async () => {
    if (!readyPhoto || readyBusy) return
    setReadyBusy(true)
    setReadyErr('')
    try {
      const res = await fetch('/api/ready-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o.id, photo: readyPhoto, note: readyNote.trim(), passcode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not send.')
      setReadyMsg('Ready photo sent ✓')
      onPatch(o.id, { ready_created_at: new Date().toISOString() })
      setReadyOpen(false)
      setReadyPhoto(null)
      setReadyNote('')
    } catch (err) {
      setReadyErr(err.message)
    } finally {
      setReadyBusy(false)
    }
  }

  const smsBody = encodeURIComponent(
    `Hi${o.name ? ' ' + String(o.name).split(' ')[0] : ''}! This is Haven & Hours — we’re on our way for your pickup.`
  )

  const showCharge = !paid && hasCard

  return (
    <li className="rounded-2xl border border-ink/10 p-4">
      {/* Encabezado */}
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

      {/* Avisos de daño + decisión del cliente */}
      {hasIncident && (
        <p className="mt-1 text-[12px] font-bold text-iris">📸 Damage photo on file</p>
      )}
      {o.incident_decision && (
        <p className="mt-1 inline-block rounded-full bg-iris-tint px-2.5 py-1 text-[12px] font-bold text-iris-deep">
          Customer chose: {o.incident_decision === 'approve' ? 'Wash it anyway' : 'Return it untouched'}
        </p>
      )}

      {/* Etapas */}
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

      {/* ---- Pesar y cobrar ---- */}
      <div className="mt-3 border-t border-ink/10 pt-3">
        {paid ? (
          <p className="text-[13px] font-bold text-green-700">
            ✓ Paid {o.final_amount ? `· $${Number(o.final_amount).toFixed(2)}` : ''}
            {charged && (charged.extra > 0 || charged.couponDiscount > 0) && (
              <span className="font-normal text-[12px] text-stone2">
                {' '}(W&amp;F ${Number(charged.washFold).toFixed(2)}
                {charged.extra > 0 ? ` + extra $${Number(charged.extra).toFixed(2)}` : ''}
                {charged.couponDiscount > 0 ? ` - coupon $${Number(charged.couponDiscount).toFixed(2)}` : ''})
              </span>
            )}
          </p>
        ) : !hasCard ? (
          <p className="text-[13px] font-bold text-[#8C3A2B]">No card on file — can’t charge this one.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-wide text-stone2">Weigh &amp; charge</p>
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
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Dry cleaning — tap to add</label>
              <div className="mt-1 space-y-1.5 rounded-xl border border-ink/10 p-3">
                {DRY_CLEAN.map((item) => {
                  const q = dryQty[item.key] || 0
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-2">
                      <span className="text-[13px]">
                        {item.label} <span className="text-stone2">${item.price.toFixed(2)}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Remove one ${item.label}`}
                          className="h-7 w-7 rounded-full border border-ink/15 font-bold leading-none disabled:opacity-30"
                          disabled={q === 0}
                          onClick={() => bumpDry(item.key, -1)}
                        >
                          –
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{q}</span>
                        <button
                          type="button"
                          aria-label={`Add one ${item.label}`}
                          className="h-7 w-7 rounded-full border border-ink/15 font-bold leading-none"
                          onClick={() => bumpDry(item.key, +1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {dryTotal > 0 && (
                <input
                  type="text"
                  className="field mt-2"
                  placeholder="Note (optional)"
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                />
              )}
            </div>

            {chargeErr && <p className="text-[12px] font-bold text-[#8C3A2B]">{chargeErr}</p>}

            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-stone2">
                {validW
                  ? `W&F $${wf.toFixed(2)}${dryTotal > 0 ? ` + extra $${dryTotal.toFixed(2)}` : ''}`
                  : 'Enter weight to see total'}
              </p>
              <button
                type="button"
                className="btn-primary whitespace-nowrap"
                onClick={doCharge}
                disabled={charging || !validW}
              >
                {charging ? 'Charging…' : preview ? `Charge $${preview.toFixed(2)}` : 'Charge'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- Foto de daño ---- */}
      <div className="mt-3 border-t border-ink/10 pt-3">
        {!dmgOpen ? (
          <button
            type="button"
            className="text-[12px] font-bold text-iris"
            onClick={() => setDmgOpen(true)}
          >
            🔎 {hasIncident ? 'Add another damage photo' : 'Report damage / stain'}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-ink">Damage photo</p>
            <input type="file" accept="image/*" capture="environment" onChange={pickDmg} className="block w-full text-[12px]" />
            {dmgPhoto && (
              <img src={dmgPhoto} alt="Garment preview" className="max-h-32 rounded-lg border border-ink/10" />
            )}
            <textarea
              rows={2}
              value={dmgNote}
              onChange={(e) => setDmgNote(e.target.value)}
              placeholder="Optional note (e.g. small red stain on the left cuff, looks pre-existing)"
              className="w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-iris"
            />
            {dmgErr && <p className="text-[12px] font-bold text-[#8C3A2B]">{dmgErr}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!dmgPhoto || dmgBusy}
                onClick={attachDmg}
                className="rounded-full bg-iris px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
              >
                {dmgBusy ? 'Sending…' : 'Attach & email customer'}
              </button>
              <button type="button" className="text-[12px] text-stone2" onClick={() => setDmgOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {dmgSent && (
          <p className="mt-2 text-[12px] font-bold text-iris">
            ✓ Photo sent to {dmgSent.name}{' '}
            <span className="font-normal text-stone2">
              {dmgSent.emailed ? '· email sent for review' : '· saved (email not sent)'}
            </span>
          </p>
        )}
      </div>

      {/* ---- Foto de "ropa lista" ---- */}
      <div className="mt-3 border-t border-ink/10 pt-3">
        {!readyOpen ? (
          <button
            type="button"
            className="text-[12px] font-bold text-iris"
            onClick={() => setReadyOpen(true)}
          >
            📸 {readyMsg ? 'Send another ready photo' : 'Send “ready” photo'}
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-ink">Photo of the finished laundry</p>
            <input type="file" accept="image/*" capture="environment" onChange={pickReady} className="block w-full text-[12px]" />
            {readyPhoto && (
              <img src={readyPhoto} alt="Finished laundry preview" className="max-h-32 rounded-lg border border-ink/10" />
            )}
            <textarea
              rows={2}
              value={readyNote}
              onChange={(e) => setReadyNote(e.target.value)}
              placeholder="Optional note to the customer…"
              className="w-full resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-iris"
            />
            {readyErr && <p className="text-[12px] font-bold text-[#8C3A2B]">{readyErr}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!readyPhoto || readyBusy}
                onClick={sendReady}
                className="rounded-full bg-iris px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-40"
              >
                {readyBusy ? 'Sending…' : 'Send to customer'}
              </button>
              <button type="button" className="text-[12px] text-stone2" onClick={() => setReadyOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {readyMsg && !readyOpen && <p className="mt-1 text-[12px] font-bold text-iris">{readyMsg}</p>}
      </div>
    </li>
  )
}

/* ---------------- Helper: comprime una foto antes de subirla ---------------- */
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
