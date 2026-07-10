/*
  Datos oficiales del negocio en UN SOLO LUGAR.
  Cambia aquí los horarios, teléfonos o la ubicación y se actualiza en toda la app
  (Landing, Dashboard, Footer y el asistente usan estos textos).
*/

// Ubicación pública — SOLO ciudad + ZIP. Nunca mostramos dirección de calle.
export const LOCATION = 'Riverside, CA 92507'

// Teléfonos (mismos horarios que recolección/entrega).
export const PHONES = [
  { name: 'Kimberly', display: '(714) 260-2637', tel: '+17142602637' },
  { name: 'Elizabeth', display: '(714) 610-6933', tel: '+17146106933' },
]

// Encabezado de "agendar en línea".
export const BOOKING_HEADLINE = 'Book online: 24/7 — Schedule your pickup anytime'

// Horario de recolecciones y entregas (y de atención telefónica).
export const PICKUP_HOURS = [
  { days: 'Mon–Fri', time: '7 AM – 6 PM' },
  { days: 'Sat', time: '8 AM – 12 PM' },
  { days: 'Sun', time: 'Closed' },
]
