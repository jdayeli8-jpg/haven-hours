/**
 * Dispara el correo de bienvenida (cupón $10) llamando a la función segura
 * de Netlify (/api/send-welcome-email), que es quien guarda la llave secreta.
 *
 * Es "a prueba de fallos": si algo falla, NO rompe la experiencia del
 * cliente — el cupón se desbloquea igual y solo se deja una nota en consola.
 */
export async function sendWelcomeEmail(email, code) {
  const clean = String(email || '').trim().toLowerCase()
  if (!clean) return { ok: false }

  try {
    const res = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean, code: code || undefined }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok || data?.sent === false) {
      console.warn(
        '[Haven & Hours] El correo de bienvenida no se entregó:',
        data?.error || res.status,
        '— (normal en modo prueba si no es tu correo de Resend o falta el dominio).'
      )
      return { ok: false }
    }
    return { ok: true }
  } catch (e) {
    console.warn('[Haven & Hours] Error de red al enviar el correo de bienvenida:', e)
    return { ok: false }
  }
}
