// netlify/functions/assistant.js
//
// Recepcionista de AI (24/7) para los clientes. Responde dudas al instante
// usando SOLO la información real de Haven & Hours, con candados de seguridad.
//
// Llave SECRETA (solo en Netlify): ANTHROPIC_API_KEY
//   → Saca tu llave en https://platform.claude.com  (cuenta nueva = $5 gratis)
//
// Modelo: Claude Haiku (el más económico). ~⅓ de centavo por pregunta.
// Para cambiar el contacto o un precio, edita las constantes de abajo.

const MODEL = 'claude-haiku-4-5-20251001'
const CONTACT = 'hello@havenandhours.com' // cámbialo por tu WhatsApp/teléfono si quieres
const MAX_TURNS = 12 // cuántos mensajes recientes recordar (controla el costo)
const MAX_CHARS = 1500 // largo máximo por mensaje del cliente (evita abuso)

const SYSTEM_PROMPT = `You are the friendly customer assistant for "Haven & Hours", a premium laundry pickup & delivery service in Riverside, California. You help customers on the website by answering questions instantly so they feel confident booking a pickup.

== HOW YOU BEHAVE ==
- Be warm, brief, and helpful. Keep replies to 2–4 short sentences.
- Reply in the SAME language the customer writes in (Spanish or English).
- Gently encourage them to tap "Schedule a pickup" on the site.
- ONLY talk about Haven & Hours laundry service using the facts below.
- NEVER invent or guess prices, times, service areas, or policies that are not listed here. If you don't know or it's not covered, say so honestly and suggest they reach us at ${CONTACT}.
- NEVER offer discounts, freebies, price cuts, or special deals beyond the standard $10 welcome offer below.
- NEVER promise or guarantee an exact pickup or delivery time — invite them to schedule on the site to pick their window.
- Do NOT ask for or accept credit card numbers or any sensitive payment details. Payment is handled securely on the website.
- If asked something off-topic (not laundry), kindly steer back to how we can help with their laundry.

== THE SERVICE ==
Premium laundry that we pick up from your door, clean, and deliver back — typically next day. Every order is washed separately, never mixed with other customers' laundry.

== PRICES ==
- Wash & Fold: $2.25 per pound, with a $35 minimum per order.
- Ironing / pressing: $3.55 per piece.
- Bedding & comforters (per piece): Twin $18, Queen/Full $26, King/Cal-King $28.
- Dry cleaning (itemized per piece, added to your ONE order total — single charge): 2-Piece Suit $18.25, Dress Shirt $3.50, Pants/Jeans $8.25, Formal Dress $16.50, Comforter (Queen/King) $40.50.
Wash & Fold is priced by weight, so the EXACT total is known after we weigh it — but the rate is $2.25/lb with a $35 minimum, and the customer always sees the exact total before any charge.

== HOW IT WORKS ==
1. Schedule a pickup on the website: choose a day and a time block (Morning 8 AM–12 PM, or Afternoon 2 PM–6 PM).
2. Save your card to confirm — you are NOT charged yet.
3. We pick up your laundry at your window.
4. We weigh it and you see the exact total + an itemized receipt BEFORE we charge.
5. We deliver your clean laundry, usually the next day.

== PAYMENT ==
- Secure card on file (handled by Square). You are charged ONLY after we weigh your laundry.
- $35 minimum applies. You always see the exact total first — no surprises.

== CANCELLATIONS ==
- The $35 minimum applies to completed orders.
- If you cancel after we've already picked up your laundry: the first time is free as a courtesy; repeat cancellations after pickup are a $20 return-trip fee.

== NEW CUSTOMERS ==
- There's a one-time $10 welcome offer: sign up with your email on the site to get a $10-off coupon.

== SERVICE AREA ==
- We serve Riverside, CA and nearby areas. Tell customers to enter their ZIP code on the website to confirm they're in our area (don't guess specific ZIP codes).

== HANDOFF ==
For anything you can't answer, or special requests, tell them to email ${CONTACT} and we'll get back to them.`

export async function handler(event) {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' }, headers)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return json(500, { ok: false, error: 'Assistant not configured (missing API key).' }, headers)
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body.' }, headers)
  }

  // Sanea el historial: solo roles válidos, texto recortado, y los últimos N turnos.
  const raw = Array.isArray(body.messages) ? body.messages : []
  let messages = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS)

  // La API requiere que el historial empiece con un mensaje del cliente ('user').
  while (messages.length && messages[0].role === 'assistant') messages.shift()

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return json(400, { ok: false, error: 'No customer message to answer.' }, headers)
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('Anthropic API error:', res.status, detail)
      return json(502, { ok: false, error: 'Assistant is unavailable right now.' }, headers)
    }

    const data = await res.json()
    const reply = Array.isArray(data.content)
      ? data.content
          .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
          .map((b) => b.text)
          .join('\n')
          .trim()
      : ''

    if (!reply) {
      return json(502, { ok: false, error: 'Empty reply from assistant.' }, headers)
    }

    return json(200, { ok: true, reply }, headers)
  } catch (err) {
    console.error('assistant.js error:', err)
    return json(500, { ok: false, error: 'Something went wrong reaching the assistant.' }, headers)
  }
}

function json(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) }
}
