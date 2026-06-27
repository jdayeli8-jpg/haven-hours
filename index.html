import { createClient } from '@supabase/supabase-js'

/* ============================================================
   HAVEN & HOURS — Conexión con tu base de datos (Supabase)

   👉 SOLO TIENES QUE LLENAR LAS DOS LÍNEAS DE ABAJO.
   Los valores están en Supabase → Settings → API Keys.

   ⚠️  NUNCA pongas aquí la llave "service_role" / "secret".
       Esa es la llave maestra y jamás va en la app.
   ============================================================ */

// 1) Tu Project URL  (algo como: https://xxxxxxxx.supabase.co)
const SUPABASE_URL = 'https://kjzvdbawpqioluirxkir.supabase.co'

// 2) Tu llave PÚBLICA  (la "anon public" — empieza con eyJ...
//    o la nueva "Publishable key" — empieza con sb_publishable_...)
const SUPABASE_KEY = 'sb_publishable_DUlDffVCIEIMjqMefYW-7Q_in0R4n5j'

/* ------------------------------------------------------------
   No necesitas tocar NADA debajo de esta línea.
   ------------------------------------------------------------ */

const isConfigured =
  SUPABASE_URL.startsWith('http') && !SUPABASE_KEY.startsWith('PEGA_')

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

if (!supabase && typeof window !== 'undefined') {
  console.warn(
    '[Haven & Hours] Supabase aún no está configurado. ' +
      'La app funciona en modo demo y los correos NO se están guardando todavía. ' +
      'Llena SUPABASE_URL y SUPABASE_KEY en src/lib/supabase.js.'
  )
}

/**
 * Guarda un lead (correo capturado) en la tabla `leads` de Supabase.
 * Es "a prueba de fallos": si Supabase no está configurado o falla la red,
 * NO rompe la experiencia del cliente — solo deja una nota en la consola.
 */
export async function saveLead({
  email,
  name = null,
  phone = null,
  zip = null,
  source = 'welcome_coupon',
  referralCode = null,
  notes = null,
}) {
  if (!supabase) return { ok: false, skipped: true }

  const clean = String(email || '').trim().toLowerCase()
  if (!clean) return { ok: false, error: 'empty email' }

  try {
    const { error } = await supabase.from('leads').insert({
      email: clean,
      name,
      phone,
      zip,
      source,
      referral_code: referralCode,
      notes,
    })
    if (error) {
      console.warn('[Haven & Hours] No se pudo guardar el lead:', error.message)
      return { ok: false, error }
    }
    return { ok: true }
  } catch (e) {
    console.warn('[Haven & Hours] Error de red al guardar el lead:', e)
    return { ok: false, error: e }
  }
}
