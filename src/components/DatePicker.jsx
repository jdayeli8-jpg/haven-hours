import { useState } from 'react'

// Calendario propio (sin librerías). Reglas: domingos en gris y no seleccionables,
// fechas pasadas también deshabilitadas. Trabaja con fechas Y-M-D (texto).
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const pad = (n) => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m es 0-indexado

export default function DatePicker({ value, min, onPick }) {
  const seed = value || min || ''
  const [vy, setVy] = useState(() => Number(seed.slice(0, 4)) || 2026)
  const [vm, setVm] = useState(() => (Number(seed.slice(5, 7)) || 1) - 1)

  const firstDow = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const minYm = (min || '').slice(0, 7)
  const viewYm = `${vy}-${pad(vm + 1)}`
  const canPrev = viewYm > minYm // comparación de texto YYYY-MM (funciona)

  const goPrev = () => {
    if (!canPrev) return
    const d = new Date(vy, vm - 1, 1)
    setVy(d.getFullYear()); setVm(d.getMonth())
  }
  const goNext = () => {
    const d = new Date(vy, vm + 1, 1)
    setVy(d.getFullYear()); setVm(d.getMonth())
  }

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="rounded-xl border border-ink/15 bg-white p-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={goPrev} disabled={!canPrev} aria-label="Previous month"
          className="h-8 w-8 rounded-full text-lg leading-none text-ink/70 hover:bg-ink/5 disabled:opacity-30">‹</button>
        <p className="text-[14px] font-bold">{MONTHS[vm]} {vy}</p>
        <button type="button" onClick={goNext} aria-label="Next month"
          className="h-8 w-8 rounded-full text-lg leading-none text-ink/70 hover:bg-ink/5">›</button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-stone2">
        {DOW.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const ds = ymd(vy, vm, d)
          const isSunday = new Date(vy, vm, d).getDay() === 0
          const isPast = min && ds < min
          const disabled = isSunday || isPast
          const selected = ds === value
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={ds}
              onClick={() => onPick(ds)}
              className={
                'h-9 rounded-lg transition ' +
                (selected ? 'bg-iris font-bold text-white ' : '') +
                (disabled ? 'cursor-not-allowed text-stone2/40 ' : 'text-ink hover:bg-iris-tint ')
              }
            >
              {d}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-[12px] text-stone2">Closed Sundays · Saturdays mornings only.</p>
    </div>
  )
}
