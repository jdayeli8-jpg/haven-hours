import { useEffect } from 'react'

/**
 * Garment Care & Claims Policy — elegant, readable modal.
 * Controlled by a parent via `open` / `onClose`.
 */

const POLICY = [
  {
    h: 'Damaged or missing items',
    b: 'We exercise the utmost care with every garment. However, any claims for damaged or missing items must be reported within 48 hours of delivery.',
  },
  {
    h: 'Liability limit',
    b: 'Our liability with respect to any damaged or lost item shall not exceed 10 times our charge for cleaning that specific item, regardless of brand.',
  },
  {
    h: 'Items left in pockets',
    b: 'Haven & Hours is not responsible for items left in pockets, or for any damage caused by them.',
  },
  {
    h: 'Normal wear & shrinkage',
    b: 'We are not liable for normal wear, color bleeding, or shrinkage inherent to the washing process.',
  },
  {
    h: 'Dry cleaning & special care',
    b: 'We follow the manufacturer’s care label and cannot be held liable for damage that occurs when following those explicitly stated instructions.',
  },
]

export default function PolicyModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-title"
    >
      <div
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-ivory p-7 shadow-2xl sm:rounded-3xl sm:p-9"
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

        <p className="eyebrow">Haven &amp; Hours</p>
        <h2 id="policy-title" className="mt-2 font-display text-3xl leading-tight">
          Garment Care &amp; Claims Policy
        </h2>
        <p className="mt-2 text-[13px] text-stone2">
          The care we promise, and the terms that protect us both.
        </p>

        <ol className="mt-6 space-y-5">
          {POLICY.map((item, i) => (
            <li key={item.h} className="flex gap-4">
              <span className="font-display text-xl leading-none text-iris">{i + 1}</span>
              <div>
                <h3 className="text-[15px] font-bold">{item.h}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{item.b}</p>
              </div>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onClose} className="btn-primary mt-8 w-full">
          Got it
        </button>
      </div>
    </div>
  )
}
