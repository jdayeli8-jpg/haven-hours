import logoUrl from '../assets/logo.svg'

// Logo oficial de Haven & Hours (gancho + sonrisa sobre círculo morado).
// Fuente única: src/assets/logo.svg — cámbialo ahí y se actualiza en toda la app.
export default function Logo({ className = 'h-9 w-9' }) {
  return <img src={logoUrl} alt="Haven & Hours" className={className} draggable={false} />
}
