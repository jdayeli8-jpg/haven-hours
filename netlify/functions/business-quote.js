// netlify/functions/business-quote.js
//
// Formularios de la página /business:
//   - source 'business_page'  → contacto: guarda en `leads` + AVISA por correo (Resend)
//   - source 'service_vote'   → voto: guarda en `leads` (email opcional), SIN correo
//
// Protección anti-spam (básica, desde el inicio):
//   - Validación: formato de email, campos requeridos, y límites de tamaño.
//   - Honeypot: si el campo oculto `hp` viene lleno, es un bot → se descarta.
//   - Rate limit: máximo 5 envíos por IP por hora (tabla `rate_limits` en Supabase).
//
// Llaves SECRETAS (solo en Netlify):
//   SUPABASE_SERVICE_KEY  — guardar el lead y el rate limit
//   RESEND_API_KEY        — enviar el aviso (solo contacto)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const FROM = 'Haven & Hours <hello@havenandhours.com>'
const NOTIFY_TO = 'hello@havenandhours.com'

const ALLOWED_SOURCES = new Set(['business_page', 'service_vote', 'business_inquiry'])
const CONTACT_SOURCES = new Set(['business_page', 'business_inquiry']) // estos SÍ mandan correo

const RATE_MAX = 5 // máximo de envíos...
const RATE_WINDOW_MS = 60 * 60 * 1000 // ...por IP por hora

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))
const esc = (s) =>
  String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function clientIp(event) {
  const h = event.headers || {}
  return (
    h['x-nf-client-connection-ip'] ||
    (h['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'
  )
}

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body.' }, headers)
  }

  // --- Honeypot: si el campo oculto trae texto, es un bot. Fingimos éxito y salimos. ---
  if (String(body.hp || '').trim() !== '') {
    return json(200, { ok: true, discarded: true }, headers)
  }

  const source = ALLOWED_SOURCES.has(body.source) ? body.source : 'business_page'
  const isVote = source === 'service_vote'

  // --- Campos, recortados a un tamaño razonable ---
  const company = String(body.company || '').trim().slice(0, 200)
  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const phone = String(body.phone || '').trim().slice(0, 40)
  const message = String(body.message || '').trim().slice(0, 2000)
  const vote = String(body.vote || '').trim().slice(0, 500)

  // --- Validación por tipo ---
  if (isVote) {
    if (!vote) return json(400, { ok: false, error: 'Please tell us what service you need.' }, headers)
    if (email && !isEmail(email)) {
      return json(400, { ok: false, error: 'Please enter a valid email, or leave it blank.' }, headers)
    }
  } else {
    if (!company) return json(400, { ok: false, error: 'Please add your salon name.' }, headers)
    if (!name) return json(400, { ok: false, error: 'Please add your name.' }, headers)
    if (!isEmail(email)) return json(400, { ok: false, error: 'Please add a valid email address.' }, headers)
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const supabase = supabaseKey ? createClient(SUPABASE_URL, supabaseKey) : null

  // --- Rate limit: máx 5 por IP por hora. Best-effort: si la tabla no existe o
  //     la BD falla, NO bloqueamos a clientes reales (solo se registra un aviso). ---
  const ip = clientIp(event)
  if (supabase && ip !== 'unknown') {
    try {
      const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
      const { count, error } = await supabase
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('scope', 'business_quote')
        .eq('key', ip)
        .gte('created_at', since)
      if (!error && typeof count === 'number' && count >= RATE_MAX) {
        return json(429, { ok: false, error: 'Too many requests. Please try again in a little while, or call us.' }, headers)
      }
      // Registrar este intento (si falla, no rompe nada).
      await supabase.from('rate_limits').insert({ scope: 'business_quote', key: ip })
    } catch (e) {
      console.warn('[business-quote] rate limit skipped:', e)
    }
  }

  const details = isVote
    ? `Vote: ${vote}`
    : `Salon: ${company}` + (phone ? ` | Phone: ${phone}` : '') + (message ? ` | Msg: ${message}` : '')

  // --- Guardar el prospecto/voto en Supabase (leads) con la llave de servidor ---
  let saved = false
  if (supabase) {
    try {
      const { error } = await supabase.from('leads').insert({
        email: email || null,
        name: name || null,
        phone: phone || null,
        source,
        notes: details,
      })
      if (error) console.warn('[business-quote] lead insert error:', error.message)
      else saved = true
    } catch (e) {
      console.warn('[business-quote] supabase error:', e)
    }
  }

  // --- Avisar por correo SOLO en el formulario de contacto (no en votos) ---
  let emailed = false
  if (CONTACT_SOURCES.has(source)) {
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM,
            to: [NOTIFY_TO],
            reply_to: email,
            subject: `New business quote request — ${company}`,
            html: notifyHtml({ company, name, email, phone, message }),
          }),
        })
        emailed = res.ok
        if (!res.ok) console.warn('[business-quote] resend status:', res.status)
      } catch (e) {
        console.warn('[business-quote] resend error:', e)
      }
    }
  }

  return json(200, { ok: true, saved, emailed }, headers)
}

function notifyHtml({ company, name, email, phone, message }) {
  const row = (label, value) =>
    `<tr>
      <td style="padding:6px 14px 6px 0;color:#7a736b;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 0;color:#2A2622;font-weight:600">${esc(value) || '—'}</td>
    </tr>`
  return `<!doctype html><html><body style="margin:0;background:#F3EFE8;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#2A2622">
      <img src="https://havenandhours.com/icons/icon-192.png" alt="Haven &amp; Hours" width="52" height="52" style="display:block;border:0;margin:0 0 14px" />
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7a736b;font-weight:700;margin:0">Haven &amp; Hours · For business</p>
      <h1 style="font-size:22px;margin:8px 0 4px">New custom quote request</h1>
      <p style="font-size:14px;color:#7a736b;margin:0 0 18px">A salon just asked for a quote on the website.</p>
      <div style="background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:16px 18px">
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          ${row('Salon', company)}
          ${row('Contact', name)}
          ${row('Email', email)}
          ${row('Phone', phone)}
          ${row('Message', message)}
        </table>
      </div>
      <p style="font-size:13px;color:#7a736b;margin:18px 0 0">Reply to this email to answer ${esc(name)} directly.</p>
    </div>
  </body></html>`
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
