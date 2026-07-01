// netlify/functions/send-welcome-email.js
//
// Envía el correo de bienvenida con el cupón de Grand Opening ($15) usando Resend.
//
// La llave RESEND_API_KEY vive SOLO en Netlify (Project configuration >
// Environment variables) — NUNCA en el código del navegador.
//
// MODO PRUEBA (sin dominio verificado): Resend solo entrega de verdad al
// correo de tu cuenta Resend. Cuando verifiques un dominio propio:
//   1. Cambia FROM por tu dirección (ej. 'Haven & Hours <hola@tudominio.com>')
//   2. A partir de ahí le llega a CUALQUIER cliente.

const FALLBACK_CODE = 'HAVEN15'
const FROM = 'Haven & Hours <hello@havenandhours.com>'

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' }, headers)
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // El sistema no truena: solo avisa que falta configurar la llave.
    return json(500, { error: 'Email no configurado (falta RESEND_API_KEY).' }, headers)
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Cuerpo JSON inválido.' }, headers)
  }

  const email = String(body.email || '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    return json(400, { error: 'Se requiere un `email` válido.' }, headers)
  }

  // Código del cupón (único por persona). Si no viene o trae algo raro, usamos el de respaldo.
  const rawCode = String(body.code || '').trim().toUpperCase()
  const code = /^[A-Z0-9-]{4,20}$/.test(rawCode) ? rawCode : FALLBACK_CODE

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: 'Your $15 Grand Opening coupon — Haven & Hours',
        html: welcomeHtml(code),
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      // Resend rechazó el envío (común en modo prueba si el correo no es
      // el de tu cuenta). No rompemos nada: devolvemos el detalle.
      return json(res.status, { sent: false, error: data?.message || 'Resend rechazó el envío.' }, headers)
    }

    return json(200, { sent: true, id: data?.id || null }, headers)
  } catch (e) {
    return json(502, { sent: false, error: 'Error de red al contactar Resend.' }, headers)
  }
}

function welcomeHtml(code) {
  return `
  <div style="margin:0;padding:0;background:#F4F1EA;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="background:#FBF9F4;border-radius:20px;padding:40px 36px;border:1px solid #E7E0D3;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8B8276;">Welcome to Haven &amp; Hours</p>
        <h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#23201C;">Your $15 Grand Opening coupon is here.</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4A453E;">
          Thank you for choosing Haven &amp; Hours. Here is your coupon for
          <strong>$15 off your first wash</strong> with us — our Grand Opening gift to welcome you.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <div style="display:inline-block;background:#5B4B8A;color:#FBF9F4;font-family:monospace;font-size:22px;letter-spacing:3px;padding:14px 28px;border-radius:12px;">
            ${code}
          </div>
        </div>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6B655C;text-align:center;">
          Use this code at checkout on your first Atelier Wash. New clients only · one per household · valid through July 31, 2026.
        </p>
        <div style="text-align:center;margin-top:8px;">
          <a href="https://haven-hours.netlify.app/dashboard"
             style="display:inline-block;background:#5B4B8A;color:#FBF9F4;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;padding:14px 30px;border-radius:999px;">
            Start my first pickup
          </a>
        </div>
        <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#8B8276;text-align:center;border-top:1px solid #E7E0D3;padding-top:20px;">
          Haven &amp; Hours — Riverside, CA<br>
          <em>Your home, a haven. Your day, restored.</em>
        </p>
      </div>
    </div>
  </div>`
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
