// netlify/functions/update-status.js
//
// FUNCIÓN A — Cambia el estatus de una orden REAL y le avisa al cliente por correo.
//
// Llaves SECRETAS (solo en Netlify):
//   SUPABASE_SERVICE_KEY  — para leer/actualizar la orden
//   RESEND_API_KEY        — para enviar el correo
//   ADMIN_PASSCODE        — candado de admin

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'
const FROM = 'Haven & Hours <hello@havenandhours.com>'

// Las etapas que puede marcar la dueña, con el texto que verá el cliente.
const STAGES = {
  collected: {
    label: 'Collected',
    subject: 'We’ve picked up your laundry — Haven & Hours',
    line: 'Good news — we’ve collected your laundry and it’s on its way to our atelier.',
  },
  washing: {
    label: 'In the wash',
    subject: 'Your laundry is being cleaned — Haven & Hours',
    line: 'Your laundry is now being washed and folded with care.',
  },
  ready: {
    label: 'Ready',
    subject: 'Your laundry is ready — Haven & Hours',
    line: 'Your laundry is clean, folded, and ready. We’ll be in touch about delivery.',
  },
  delivered: {
    label: 'Delivered',
    subject: 'Your laundry has been delivered — Haven & Hours',
    line: 'Your laundry has been delivered. Thank you for trusting Haven & Hours.',
  },
}

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE
  if (!supabaseKey) return json(500, { ok: false, error: 'Supabase (servidor) no configurado.' }, headers)
  if (!ADMIN_PASSCODE) return json(500, { ok: false, error: 'Admin sin configurar (ADMIN_PASSCODE).' }, headers)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Cuerpo JSON inválido.' }, headers)
  }

  if (String(body.passcode || '') !== ADMIN_PASSCODE) {
    return json(401, { ok: false, error: 'Código de admin incorrecto.' }, headers)
  }

  const orderId = body.orderId
  const status = String(body.status || '')
  if (!orderId) return json(400, { ok: false, error: 'Falta el ID de la orden.' }, headers)
  if (!STAGES[status]) return json(400, { ok: false, error: 'Estatus no válido.' }, headers)

  const supabase = createClient(SUPABASE_URL, supabaseKey)

  // Actualizar el estatus de cumplimiento y traer el correo del cliente.
  const { data: order, error: updErr } = await supabase
    .from('orders')
    .update({ fulfillment_status: status, fulfillment_updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('name, email')
    .single()

  if (updErr || !order) return json(404, { ok: false, error: 'No encontré esa orden.' }, headers)

  // Avisar al cliente por correo (best-effort: si el correo falla, el estatus YA quedó).
  let emailed = false
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey && order.email) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [order.email],
          subject: STAGES[status].subject,
          html: statusHtml(order.name, STAGES[status]),
        }),
      })
      emailed = res.ok
    } catch {
      emailed = false
    }
  }

  return json(200, { ok: true, status, label: STAGES[status].label, emailed }, headers)
}

function statusHtml(name, stage) {
  const hi = name ? `Hi ${escapeHtml(name)},` : 'Hi there,'
  return `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:28px;color:#2B2A29;">
    <img src="https://havenandhours.com/icons/icon-192.png" alt="Haven &amp; Hours" width="56" height="56" style="display:block;border:0;margin:0 0 14px" />
    <h1 style="font-size:24px;color:#5B4B8A;margin:0 0 6px;">Haven &amp; Hours</h1>
    <p style="font-size:15px;line-height:1.6;">${hi}</p>
    <p style="font-size:15px;line-height:1.6;">${escapeHtml(stage.line)}</p>
    <div style="margin:18px 0;padding:12px 18px;background:#EFEBF5;border-radius:12px;color:#5B4B8A;font-weight:bold;">
      Status: ${escapeHtml(stage.label)}
    </div>
    <p style="font-size:13px;color:#8A8580;line-height:1.6;">Your home, a haven. Your day, restored.</p>
  </div>`
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  )
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
