// Service worker — siempre fresco tras cada deploy.
// - HTML, manifest, íconos → NETWORK-FIRST (online siempre trae lo último).
// - Assets con hash de Vite (/assets/…) → CACHE-FIRST (son inmutables: rápidos y seguros).
// Sube VERSION para purgar cachés viejos en cada publicación.
const VERSION = 'v2'
const CACHE = `haven-hours-${VERSION}`

self.addEventListener('install', (e) => {
  self.skipWaiting() // activa la versión nueva de inmediato
  e.waitUntil(caches.open(CACHE).then((c) => c.add('/')).catch(() => {}))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()) // toma control de las pestañas abiertas
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // deja pasar Square, fuentes, etc.
  if (url.pathname.startsWith('/api/')) return // nunca cachear el backend

  // Assets con hash → cache-first (inmutables)
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
            return res
          })
      )
    )
    return
  }

  // HTML y demás → network-first (siempre lo nuevo online; caché solo respaldo offline)
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
  )
})
