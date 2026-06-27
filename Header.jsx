import { STATUS_STEPS } from '../context/StoreContext.jsx'

/**
 * The signature element: order status as a clothesline.
 * A gently sagging line with one wooden peg per phase; completed pegs turn iris,
 * the current one breathes. Sized for a 375px viewport and up.
 */
export default function ClotheslineTracker({ statusIndex }) {
  const n = STATUS_STEPS.length
  // Peg x-positions along the 340-wide viewBox
  const xs = Array.from({ length: n }, (_, i) => 28 + (i * (340 - 56)) / (n - 1))
  // Sag: a soft quadratic curve
  const sagY = (x) => {
    const t = (x - 28) / (340 - 56) // 0..1
    return 26 + 18 * 4 * t * (1 - t) // peaks (lowest point) mid-line
  }

  return (
    <div aria-label={`Order status: ${STATUS_STEPS[statusIndex]}`} role="img">
      <svg viewBox="0 0 340 64" className="w-full" aria-hidden="true">
        {/* line posts */}
        <line x1="10" y1="8" x2="10" y2="60" stroke="#C9C0AE" strokeWidth="3" strokeLinecap="round" />
        <line x1="330" y1="8" x2="330" y2="60" stroke="#C9C0AE" strokeWidth="3" strokeLinecap="round" />
        {/* the rope */}
        <path d="M10 24 Q 170 48 330 24" fill="none" stroke="#8B8276" strokeWidth="1.6" />
        {/* pegs */}
        {xs.map((x, i) => {
          const y = sagY(x)
          const done = i < statusIndex
          const current = i === statusIndex
          const fill = done || current ? '#5B5170' : '#D8D0C0'
          return (
            <g key={i} className={current ? 'peg-current' : undefined} style={{ transformBox: 'fill-box' }}>
              {/* clothespin: two small rounded bars with a gap */}
              <rect x={x - 3.6} y={y - 9} width="3" height="16" rx="1.5" fill={fill} />
              <rect x={x + 0.6} y={y - 9} width="3" height="16" rx="1.5" fill={fill} />
              {current && (
                <circle cx={x} cy={y + 13} r="2.2" fill="#5B5170" />
              )}
            </g>
          )
        })}
      </svg>

      <ol
        className="mt-1 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {STATUS_STEPS.map((label, i) => {
          const done = i < statusIndex
          const current = i === statusIndex
          return (
            <li
              key={label}
              aria-current={current ? 'step' : undefined}
              className={
                'text-center text-[10px] leading-tight ' +
                (current
                  ? 'font-bold text-iris'
                  : done
                    ? 'font-bold text-ink/70'
                    : 'text-stone2')
              }
            >
              {label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
