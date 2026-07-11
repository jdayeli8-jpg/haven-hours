// Todos los textos y precios de la página /business en UN SOLO LUGAR.
// Preparado para el español: cuando agreguemos el toggle, este objeto se
// divide en { en: {...}, es: {...} }. Los NÚMEROS no cambian por idioma.

/* ---------- Contacto ---------- */
export const BIZ_PHONES = [
  { name: 'Kimberly', display: '(714) 260-2637', tel: '+17142602637' },
  { name: 'Elizabeth', display: '(714) 610-6933', tel: '+17146106933' },
]
export const BIZ_LOCATION = 'Riverside, CA 92507'

/* ---------- Calculadora (números, iguales en cualquier idioma) ---------- */
// Opción A — traes tus toallas: precio por toalla según toallas/semana.
export const OPTION_A_TIERS = [
  { max: 130, price: 0.75 },
  { max: 224, price: 0.6 },
  { max: 274, price: 0.55 },
  { max: Infinity, price: 0.5 },
]
// Opción B — compras toallas + lavado semanal: precio de LAVADO por toalla.
// (Bajo 131 no hay precio: se muestra el mensaje "llámanos".)
export const OPTION_B_WASH_TIERS = [
  { max: 130, price: null },
  { max: 224, price: 0.44 },
  { max: 274, price: 0.42 },
  { max: Infinity, price: 0.4 },
]
// Opción B — costo único de las toallas (setup) según cantidad.
export const OPTION_B_SETUP = [
  { max: 224, setup: 450 },
  { max: 274, setup: 570 },
  { max: Infinity, setup: 675 },
]

/* ---------- Colores ---------- */
export const COLORS = [
  { name: 'Black', hex: '#1c1c1c', note: 'bleach & dye proof — our star' },
  { name: 'White', hex: '#f4f1ea', note: 'spas & facials', ring: true },
  { name: 'Charcoal', hex: '#3f4247' },
  { name: 'Burgundy', hex: '#6b2b3a' },
  { name: 'Navy', hex: '#1f2a44' },
]

/* ---------- Textos de todas las secciones ---------- */
export const BIZ = {
  // 1. HERO
  hero: {
    title: 'Fresh towels. Frozen prices. Local owners.',
    subtitle:
      'Haven & Hours is a towel service for salons, barbershops & spas, owned and run by Elizabeth & Kimberly right here in Riverside. The owners answer the phone — in English o en español.',
    ctaTrial: 'Get my free trial load',
    ctaPrice: 'See my price in 30 seconds',
    spanish: 'Se habla español 🇲🇽',
  },

  // 2. THREE WAYS
  ways: {
    heading: 'Three ways to work with us',
    a: {
      badge: 'Most popular way to start',
      title: 'We wash YOUR towels',
      body: 'Keep your own towels. We pick up, wash separately, fold beautifully and deliver every week.',
      rows: [
        ['Up to 130 / week', 'from $0.75/towel (~$392 per 4 weeks)'],
        ['200', '$0.60 (~$480)'],
        ['250', '$0.55 (~$552)'],
        ['300', '$0.50 (~$600)'],
      ],
    },
    b: {
      badge: 'Best long-term value',
      title: 'Buy our towels + weekly wash',
      body: 'Premium bleach-proof towels in black, white or your color. And unlike the big companies: after you pay for them, the towels are YOURS — not rented forever. Or split into 12 easy weekly payments.',
      rows: [
        ['200 towels', '$450 setup + $87/week wash (~$348 per 4 weeks)'],
        ['250', '$570 + $105/week (~$420)'],
        ['300', '$675 + $120/week (~$480)'],
      ],
      note: 'Worn towels replaced at just $3 each — only with your approval.',
    },
    c: {
      title: 'Rent our towels',
      body: "Don't want to own or bring anything? We supply, rotate, wash and deliver. Ask us for a same-day custom quote.",
    },
    footnote:
      "Every price is approximate — your final quote is personalized to YOUR salon and it's always ONE flat price: pickup, wash, fold & delivery included. No fuel fees, no service fees, no surprises. Ever. Price frozen in writing for 6 months.",
  },

  // 3. CALCULATOR
  calc: {
    heading: 'Know your price in 30 seconds',
    towelsPerDay: 'Towels per day',
    daysOpen: 'Days open per week',
    iWantTo: 'I want to:',
    optA: 'Bring my own towels',
    optB: 'Buy towels + weekly wash',
    towelsWeek: 'Towels per week',
    weeklyCost: 'Weekly cost',
    per4: 'Per 4 weeks',
    setup: 'One-time towels (setup)',
    or12: 'or 12 weekly payments',
    under200: 'Under 200 towels? Price drops — just call us for a custom quote.',
    lock: 'Lock this price for 6 months →',
  },

  // 4. COLORS
  colors: {
    heading: 'Your towels, your brand',
    more: 'More colors on request',
    tagline: 'Big companies give you two colors. We match YOUR brand.',
  },

  // 5. NEIGHBOR PROMISE
  promise: {
    heading: 'Our neighbor promise',
    items: [
      { icon: '🚨', title: 'Towel 911', body: 'Ran out on a busy Saturday? Call us. We live 15 minutes away, not 3 states away. Emergency packs delivered same day for active clients.' },
      { icon: '🧾', title: 'Free invoice audit', body: "Bring us your current provider's invoice. In 10 minutes we'll circle every hidden fee with a pen. No strings." },
      { icon: '📋', title: 'Monthly sanitization letter', body: 'Every month you get a signed letter certifying your towels are professionally hot-washed and sanitized weekly — keep it next to your license for State Board inspections.' },
      { icon: '🧺', title: 'Shelf-ready delivery', body: "We don't drop a bag at the door. We place your folded towels right on your shelf and take the dirty ones with us." },
      { icon: '🗣️', title: 'Truly bilingual', body: "Contract, receipts, texts and support in English or Spanish. Whichever YOU prefer. No 'press 2', no call centers." },
    ],
  },

  // 6. QUOTE VS BILL
  compare: {
    heading: 'The quote is not the bill',
    sub: 'Illustrative example for a salon using 240 towels/week.',
    big: {
      title: 'Big company',
      quote: 'Quotes $0.42/towel',
      rows: [
        ['Towel service', '$437'],
        ['Fuel surcharge', '$18'],
        ['Environmental fee', '$12'],
        ['Service & delivery', '$25'],
        ['"Lost towel" replacements', '$29'],
      ],
      total: '$521',
      note: '…and it usually goes up every year, on a 3–5 year auto-renewing contract.',
    },
    us: {
      title: 'Haven & Hours',
      quote: 'Quotes $0.47/towel',
      rows: [
        ['Towel service', '$489'],
        ['Hidden fees', '$0'],
      ],
      total: '$489',
      note: 'Frozen in writing for 6 months. Month 6 bill = month 1 bill.',
    },
    foot: 'Illustrative example. Never sign ANY towel contract without asking: How long is the term? Does it auto-renew? Can the bill grow?',
  },

  // 7. WHAT'S NEXT + VOTE
  next: {
    heading: "What's next — you vote",
    body: 'Coming soon: cutting capes & smocks wash, facial bed sheets, manicure towels, laser engraved logo towels, and more.',
    voteTitle: "What service do you need that nobody offers you? Tell us and we'll build it.",
    votePlaceholder: 'e.g. weekly cutting capes…',
    voteEmail: 'Email (optional)',
    voteBtn: 'Send my vote',
    voteThanks: 'Got it! You just helped decide our next service 💛',
  },

  // 8. CLOSE + PROMOS + CONTACT
  close: {
    promosHeading: 'Ways to start saving today',
    promos: [
      { title: 'Free trial load', body: 'No cost, no commitment.' },
      { title: 'Week 5 free', body: 'Your 5th week is on us when you join.' },
      { title: 'Founding Partner', body: "Lock today's price for 12 MONTHS + 6 towels laser engraved with your logo FREE (first salons only — limited spots)." },
      { title: 'Refer a neighbor', body: '$25 credit for you, $25 for them.' },
    ],
    formHeading: 'Get my free trial load',
    formSub: "Tell us about your salon and we'll send a personalized, flat-price quote — frozen for 6 months.",
    fSalon: 'Salon name',
    fName: 'Your name',
    fPhone: 'Phone',
    fEmail: 'Email',
    fMessage: 'Message (optional)',
    submit: 'Get my free trial load',
    sending: 'Sending…',
    thanks: "Thank you! We'll contact you within 24 hours with your custom quote.",
  },
}
