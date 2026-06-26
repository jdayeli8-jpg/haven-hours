import { useState } from 'react'
import PolicyModal from './PolicyModal.jsx'
import { TermsModal, PrivacyModal } from './LegalDocs.jsx'

export default function Footer() {
  const [policyOpen, setPolicyOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto max-w-5xl px-5 py-10 text-center">
        <p className="font-display text-xl">
          Haven <span className="italic text-iris">&amp;</span> Hours
        </p>
        <p className="mt-2 text-sm italic text-stone2">
          Your home, a haven. Your day, restored.
        </p>
        <p className="mt-5 text-[12px] text-stone2">
          Riverside, California · Serving 92507, 92506 &amp; nearby
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => setPolicyOpen(true)}
            className="text-[12px] font-bold text-stone2 underline underline-offset-4 hover:text-ink"
          >
            Garment Care &amp; Claims Policy
          </button>
          <button
            type="button"
            onClick={() => setTermsOpen(true)}
            className="text-[12px] font-bold text-stone2 underline underline-offset-4 hover:text-ink"
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="text-[12px] font-bold text-stone2 underline underline-offset-4 hover:text-ink"
          >
            Privacy Policy
          </button>
        </div>

        <p className="mt-3 text-[12px] text-stone2/70">
          © {new Date().getFullYear()} Haven &amp; Hours Laundry · Build v51
        </p>
      </div>
      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </footer>
  )
}
