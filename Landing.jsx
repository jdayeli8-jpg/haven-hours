import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PromoCapture from './components/PromoCapture.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ForBusiness from './pages/ForBusiness.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin'
  return (
    <div className="flex min-h-screen flex-col">
      {!isAdmin && <PromoCapture />}
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/business" element={<ForBusiness />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-md px-6 py-24 text-center">
                <h1 className="font-display text-4xl">Nothing on this line.</h1>
                <p className="mt-3 text-stone2">That page doesn’t exist. Try the menu above.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
