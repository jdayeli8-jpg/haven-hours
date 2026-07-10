import { LOCATION, PHONES, BOOKING_HEADLINE, PICKUP_HOURS } from '../lib/businessInfo.js'

/**
 * Sección de horarios + contacto. Se usa igual en la Landing y en el Dashboard,
 * así los textos son idénticos y se editan en un solo lugar (src/lib/businessInfo.js).
 */
export default function HoursSection() {
  return (
    <section className="card">
      <p className="eyebrow">Hours &amp; contact</p>

      {/* Agendar en línea 24/7 */}
      <h3 className="mt-2 font-display text-2xl">{BOOKING_HEADLINE}</h3>

      {/* Recolecciones y entregas */}
      <div className="mt-5">
        <p className="text-[12px] font-bold uppercase tracking-wide text-stone2">
          Pickups &amp; deliveries
        </p>
        <table className="mt-2 w-full text-[14px]">
          <tbody>
            {PICKUP_HOURS.map((row) => (
              <tr key={row.days} className="border-b border-ink/10 last:border-0">
                <td className="py-2 font-bold text-ink">{row.days}</td>
                <td className="py-2 text-right text-ink/80">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Teléfono */}
      <div className="mt-5">
        <p className="text-[12px] font-bold uppercase tracking-wide text-stone2">Phone support</p>
        <p className="mt-1 text-[13px] text-stone2">Same hours as pickups &amp; deliveries.</p>
        <ul className="mt-2 space-y-1 text-[14px]">
          {PHONES.map((p) => (
            <li key={p.tel}>
              <span className="font-bold text-ink">{p.name}</span>{' '}
              <a href={`tel:${p.tel}`} className="text-iris underline underline-offset-2">
                {p.display}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Ubicación */}
      <div className="mt-5">
        <p className="text-[12px] font-bold uppercase tracking-wide text-stone2">Location</p>
        <p className="mt-1 text-[14px] font-bold text-ink">{LOCATION}</p>
      </div>
    </section>
  )
}
