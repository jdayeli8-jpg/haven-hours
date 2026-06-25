import { useEffect } from 'react'

/**
 * LegalDocs — plain-language Terms of Service & Privacy Policy modals.
 *
 * NOTE FOR THE OWNER (not shown to customers):
 * These are starter drafts in plain English. Have a California attorney review
 * them before relying on them. A few things to confirm/fill: your registered
 * legal business name (once you have your EIN/entity), the abandoned-garment
 * holding period, and whether CCPA applies to you.
 */

const UPDATED = 'June 2026'
const CONTACT = 'hello@havenandhours.com'

const TERMS = [
  {
    h: 'Who we are',
    b: 'Haven & Hours Laundry is a laundry pickup and delivery service based in Riverside, California, serving ZIP codes 92507, 92506, and nearby areas. By placing an order, you agree to these Terms of Service.',
  },
  {
    h: 'Our service',
    b: 'We collect your laundry at a scheduled time, clean it with care, and return it to you. Service availability, timing, and coverage area may vary and are not guaranteed.',
  },
  {
    h: 'Pricing & payment',
    b: 'Prices are shown in the app. Because some services are billed by weight or by item, your final total may differ from the initial estimate. Payments are processed securely through Square. When you save a card, you authorize us to charge it for the final amount of your order, including any agreed extras.',
  },
  {
    h: 'Scheduling, access & missed visits',
    b: 'You are responsible for providing an accurate address and ensuring your laundry is accessible at the scheduled time. Missed pickups or deliveries that require a return trip may incur an additional fee.',
  },
  {
    h: 'Cancellations & minimums',
    b: 'A $35 minimum applies to every completed wash & fold order. If you decline service after we have already collected your laundry, we’ll waive any fee the first time as a courtesy; repeat cancellations after pickup incur a $20 return-trip fee, charged to the card on file. You’ll always see your exact total before any charge is made.',
  },
  {
    h: 'Garment care',
    b: 'We follow the manufacturer’s care label on each garment. We are not liable for normal wear, color bleeding, or shrinkage inherent to the cleaning process, or for damage that occurs while following a garment’s stated care instructions.',
  },
  {
    h: 'Damaged or lost items & claims',
    b: 'We treat every garment with the utmost care. Any claim for a damaged or lost item must be reported within 48 hours of delivery. Our liability for any damaged or lost item shall not exceed 10 times our cleaning charge for that specific item, regardless of brand or purchase price.',
  },
  {
    h: 'Pre-existing conditions',
    b: 'If we notice possible damage or a pre-existing condition during intake, we may send you a photo and ask how to proceed. If you ask us to continue cleaning, you accept the condition shown and release us from responsibility for that pre-existing condition or its change during normal cleaning.',
  },
  {
    h: 'Items left in pockets',
    b: 'Haven & Hours is not responsible for items left in pockets, or for any damage caused by them. Please empty all pockets before pickup.',
  },
  {
    h: 'Prohibited & special items',
    b: 'You agree not to submit hazardous, biohazardous, or unsafe items, or items needing special handling, without telling us in advance. We may decline to clean certain items.',
  },
  {
    h: 'Unclaimed garments',
    b: 'If we are unable to deliver your laundry after reasonable attempts to reach you, we will hold it for 60 days. After that period, unclaimed items may be donated or discarded.',
  },
  {
    h: 'Changes to these terms',
    b: 'We may update these Terms from time to time. The date below reflects the latest update, and continued use of our service means you accept the current Terms.',
  },
  {
    h: 'Governing law & contact',
    b: `These Terms are governed by the laws of the State of California. Questions? Email us at ${CONTACT}.`,
  },
]

const PRIVACY = [
  {
    h: 'Overview',
    b: 'This Privacy Policy explains what information Haven & Hours Laundry collects, how we use it, and the choices you have. It applies to our website and laundry service.',
  },
  {
    h: 'Information we collect',
    b: 'We collect the details you give us to provide the service: your name, email, phone number, pickup and delivery address, and order details. Payment information is handled by Square; we do not store full card numbers on our systems.',
  },
  {
    h: 'How we use your information',
    b: 'We use your information to schedule pickups and deliveries, process payments, send order updates and service messages, respond to you, and improve our service.',
  },
  {
    h: 'Service providers we share with',
    b: 'We share information only with the providers that help us run the service: Square (payment processing), Resend (sending email), and our hosting and database providers (such as Netlify and Supabase). We do not sell your personal information.',
  },
  {
    h: 'Cookies & local storage',
    b: 'We use minimal browser storage needed to keep the app working — for example, to remember your current order while you use the site. We do not use it to track you across other websites.',
  },
  {
    h: 'Data retention',
    b: 'We keep your order information for as long as needed to provide the service and to meet legal, accounting, and tax requirements. You can ask us to delete information we are not required to keep.',
  },
  {
    h: 'Your choices & rights',
    b: `You may ask us to access, correct, or delete your personal information by emailing ${CONTACT}. California residents may have additional rights under the California Consumer Privacy Act (CCPA) where it applies; we will honor valid requests.`,
  },
  {
    h: 'Security',
    b: 'We use reputable providers and reasonable safeguards to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
  },
  {
    h: 'Children',
    b: 'Our service is intended for adults and is not directed to children under 16. We do not knowingly collect personal information from children.',
  },
  {
    h: 'Changes & contact',
    b: `We may update this policy; the date below shows the latest update. Questions about your privacy? Email us at ${CONTACT}.`,
  },
]

function Modal({ open, onClose, eyebrow, title, subtitle, sections }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-ivory p-7 shadow-2xl sm:rounded-3xl sm:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 text-stone2 transition-colors hover:text-ink"
        >
          ✕
        </button>

        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl leading-tight">{title}</h2>
        <p className="mt-2 text-[13px] text-stone2">{subtitle}</p>

        <ol className="mt-6 space-y-5">
          {sections.map((item, i) => (
            <li key={item.h} className="flex gap-4">
              <span className="font-display text-xl leading-none text-iris">{i + 1}</span>
              <div>
                <h3 className="text-[15px] font-bold">{item.h}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{item.b}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-7 text-[12px] text-stone2">Last updated: {UPDATED}</p>

        <button type="button" onClick={onClose} className="btn-primary mt-4 w-full">
          Got it
        </button>
      </div>
    </div>
  )
}

export function TermsModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Haven & Hours"
      title="Terms of Service"
      subtitle="The terms that protect us both."
      sections={TERMS}
    />
  )
}

export function PrivacyModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Haven & Hours"
      title="Privacy Policy"
      subtitle="What we collect, and how we treat it."
      sections={PRIVACY}
    />
  )
}
