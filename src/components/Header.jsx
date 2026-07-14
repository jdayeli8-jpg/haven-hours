import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'

const link = ({ isActive }) =>
  'rounded-full px-2.5 py-1.5 text-[12px] font-bold transition-colors whitespace-nowrap sm:px-3.5 sm:text-[13px] ' +
  (isActive ? 'bg-iris text-ivory' : 'text-ink/70 hover:text-ink')

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 shrink-0" />
          <span className="font-display text-base leading-none tracking-tight sm:text-lg">
            Haven <span className="italic text-iris">&amp;</span> Hours
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main">
          <NavLink to="/" className={link} end>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={link}>
            My Order
          </NavLink>
          <NavLink to="/business" className={link}>
            For Business
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
