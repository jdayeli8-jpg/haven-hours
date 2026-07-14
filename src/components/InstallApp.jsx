import { useState, useEffect } from 'react'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS
  )
}
function isIos() {
  const ua = window.navigator.userAgent || ''
  return /iphone|ipad|ipod/i.test(ua) && !window.MSStream
}

export default function InstallApp() {
  const [deferred, setDeferred] = useState(() => window.__deferredInstallPrompt || null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [iosHelp, setIosHelp] = useState(false)
  const ios = isIos()

  useEffect(() => {
    const onInstallable = () => setDeferred(window.__deferredInstallPrompt || null)
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      window.__deferredInstallPrompt = null
    }
    window.addEventListener('pwa-installable', onInstallable)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('pwa-installable', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null // ya instalada → no mostrar
  if (!deferred && !ios) return null // no hay forma de instalar → no mostrar

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt() // Android/Chrome: instalador REAL
      try {
        await deferred.userChoice
      } catch {}
      setDeferred(null)
      window.__deferredInstallPrompt = null
      return
    }
    setIosHelp(true) // iPhone: instrucciones
  }

  return (
    <section className="card mt-6 border-iris/30 bg-iris-tint/25">
      <button type="button" onClick={handleClick} className="btn-primary w-full">
        📲 Get our app — book your pickup in 2 taps
      </button>

      {ios && iosHelp && (
        <div className="mt-4 rounded-xl border border-iris/20 bg-white/70 px-4 py-3 text-[14px] leading-relaxed text-ink/80">
          <p className="font-bold text-ink">Add Haven &amp; Hours to your iPhone:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Tap the <span className="font-bold">Share</span> button{' '}
              <span className="text-iris">↑</span> at the bottom of Safari.
            </li>
            <li>
              Then tap <span className="font-bold">“Add to Home Screen”</span>.
            </li>
            <li>
              Tap <span className="font-bold">Add</span> — done!
            </li>
          </ol>
        </div>
      )}
      <p className="mt-2 text-center text-[12px] text-stone2">Installs like an app — no App Store needed.</p>
    </section>
  )
}
