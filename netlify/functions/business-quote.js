// netlify/functions/business-quote.js
//
// Formulario "Request a custom quote" de /business.
//   1) Guarda el prospecto en Supabase (tabla `leads`) con la llave de servidor.
//   2) Avisa por correo a hello@havenandhours.com con los datos (Resend).
//
// Llaves SECRETAS (solo en Netlify):
//   SUPABASE_SERVICE_KEY  — guardar el lead
//   RESEND_API_KEY        — enviar el aviso

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const FROM = 'Haven & Hours <hello@havenandhours.com>'
const NOTIFY_TO = 'hello@havenandhours.com'

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))
const esc = (s) =>
  String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

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

  const company = String(body.company || '').trim().slice(0, 200)
  const name = String(body.name || '').trim().slice(0, 120)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
  const phone = String(body.phone || '').trim().slice(0, 40)
  const type = String(body.type || '').trim().slice(0, 120)
  const notes = String(body.notes || '').trim().slice(0, 2000)

  if (!company) return json(400, { ok: false, error: 'Please add your business name.' }, headers)
  if (!name) return json(400, { ok: false, error: 'Please add your name.' }, headers)
  if (!isEmail(email)) return json(400, { ok: false, error: 'Please add a valid email address.' }, headers)

  const details = `Empresa: ${company} | Tipo: ${type || '—'}` + (notes ? ` | Notas: ${notes}` : '')

  // 1) Guardar el prospecto en Supabase (leads), con la llave de servidor.
  let saved = false
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (supabaseKey) {
    try {
      const supabase = createClient(SUPABASE_URL, supabaseKey)
      const { error } = await supabase.from('leads').insert({
        email,
        name,
        phone: phone || null,
        source: 'business_inquiry',
        notes: details,
      })
      if (error) console.warn('[business-quote] lead insert error:', error.message)
      else saved = true
    } catch (e) {
      console.warn('[business-quote] supabase error:', e)
    }
  }

  // 2) Avisar por correo a Haven & Hours con los datos del prospecto (Resend).
  let emailed = false
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
          html: notifyHtml({ company, name, email, phone, type, notes }),
        }),
      })
      emailed = res.ok
      if (!res.ok) console.warn('[business-quote] resend status:', res.status)
    } catch (e) {
      console.warn('[business-quote] resend error:', e)
    }
  }

  return json(200, { ok: true, saved, emailed }, headers)
}

function notifyHtml({ company, name, email, phone, type, notes }) {
  const row = (label, value) =>
    `<tr>
      <td style="padding:6px 14px 6px 0;color:#7a736b;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 0;color:#2A2622;font-weight:600">${esc(value) || '—'}</td>
    </tr>`
  return `<!doctype html><html><body style="margin:0;background:#F3EFE8;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#2A2622">
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7a736b;font-weight:700;margin:0">Haven &amp; Hours · For business</p>
      <h1 style="font-size:22px;margin:8px 0 4px">New custom quote request</h1>
      <p style="font-size:14px;color:#7a736b;margin:0 0 18px">A business just asked for a quote on the website.</p>
      <div style="background:#fff;border:1px solid #e7e3dd;border-radius:14px;padding:16px 18px">
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          ${row('Business', company)}
          ${row('Contact', name)}
          ${row('Email', email)}
          ${row('Phone', phone)}
          ${row('Type', type)}
          ${row('Notes', notes)}
        </table>
      </div>
      <p style="font-size:13px;color:#7a736b;margin:18px 0 0">Reply to this email to answer ${esc(name)} directly.</p>
    </div>
  </body></html>`
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
