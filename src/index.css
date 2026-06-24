@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply bg-ivory text-ink antialiased;
  }
  body {
    @apply font-body;
  }
  /* Visible keyboard focus, brand-toned */
  :focus-visible {
    outline: 2px solid #5b5170;
    outline-offset: 3px;
    border-radius: 2px;
  }
  ::selection {
    background: #e9e5f0;
  }
}

@layer components {
  .eyebrow {
    @apply text-[11px] font-bold uppercase tracking-wider2 text-stone2;
  }
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-full bg-iris px-7 py-3.5 font-body text-sm font-bold tracking-wide text-ivory transition-colors hover:bg-iris-deep active:bg-iris-deep disabled:opacity-40;
  }
  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-ink/50 disabled:opacity-40;
  }
  .field {
    @apply w-full rounded-xl border border-ink/15 bg-white/70 px-4 py-3 text-[15px] text-ink placeholder:text-stone2/70 focus:border-iris focus:outline-none;
  }
  .label {
    @apply mb-1.5 block text-[13px] font-bold text-ink/80;
  }
  .card {
    @apply rounded-2xl border border-ink/10 bg-white/60 p-5;
  }
}

/* Gentle pulse for the current clothesline peg */
@keyframes peg-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
.peg-current {
  animation: peg-breathe 2.4s ease-in-out infinite;
  transform-origin: center;
}
@media (prefers-reduced-motion: reduce) {
  .peg-current {
    animation: none;
  }
}
