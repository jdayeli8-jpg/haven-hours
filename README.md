# Haven & Hours Laundry

> *Your home, a haven. Your day, restored.*

Premium laundry pickup & delivery PWA for Riverside, California (zips **92507**, **92506** and nearby).
Built mobile-first with **React 18 + Vite**, **Tailwind CSS**, **React Router** and **Netlify Functions** — no external component libraries.

---

## Routes

| Route | Who | What |
|---|---|---|
| `/` | Public | Landing: hero, How it Works, rates, coverage area |
| `/dashboard` | Customer | Pickup form → live 4-phase clothesline status tracker → incident approval (Approve & Wash / Return Unwashed) → receipt |
| `/admin` | Staff | Passcode-gated panel: today's order, advance status, final pounds → live total ($35 minimum), simulate incident photo, charge via serverless function |

**Demo admin passcode: `92507`** (hard-coded for the demo — replace with real auth before production).

State lives in a React Context (`src/context/StoreContext.jsx`) acting as an in-memory database, so the full admin ↔ customer flow can be demonstrated in a single browser session: advance the status in `/admin` and watch `/dashboard` update; send an incident from `/admin` and approve it from `/dashboard`. Refreshing the page resets the demo data (by design).

## Pricing rules

- Wash & Fold: **$2.25 / lb**, **$35 order minimum**
- Ironing: **$3.55 / piece**
- Bedding: **$28** King / Cal-King · **$26** Queen / Full · **$18** Twin (per piece)
- Dry cleaning run: priced separately at the partner cleaner’s rates

The Netlify Function **recalculates the price on the server** and applies the minimum — the client's total is never trusted. Examples: `10 lb → $35.00` (minimum applied), `20 lb → $45.00`.

## Local development

Use the Netlify CLI so the SPA **and** the functions run together (the `/api/*` redirect only exists inside Netlify's runtime):

```bash
npm install
npm install -g netlify-cli   # if you don't have it
netlify dev                   # serves Vite + functions at http://localhost:8888
```

`netlify dev` reads `netlify.toml`, so `/api/process-payment` proxies to
`netlify/functions/process-payment.js` exactly like in production.

> `npm run dev` alone also works for pure UI work, but the **Charge** button in `/admin`
> will fail because no function server is running — the UI explains this if it happens.

### Test the payment function directly

```bash
curl -s -X POST http://localhost:8888/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{"pounds": 10}'        # → total: 35  (minimum applied)

curl -s -X POST http://localhost:8888/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{"pounds": 20}'        # → total: 45
```

## Deploy to Netlify

**Option A — Git:** push this repo to GitHub/GitLab and "Import from Git" in Netlify.
`netlify.toml` already declares everything (build `npm run build`, publish `dist`, functions `netlify/functions`, the `/api/*` redirect, and the SPA fallback so `/dashboard` and `/admin` survive a hard refresh).

**Option B — CLI:**

```bash
npm run build
netlify deploy --prod
```

## Going live with real Stripe

1. `npm install stripe`
2. In Netlify → *Site settings → Environment variables*, add `STRIPE_SECRET_KEY`.
3. Uncomment the marked block in `netlify/functions/process-payment.js`.

The simulated path keeps working as a fallback when the key is absent.

## Project structure

```
haven-hours/
├── netlify.toml                  # build, functions dir, /api/* + SPA redirects
├── package.json
├── vite.config.js
├── tailwind.config.js            # brand tokens: ivory / linen / ink / iris
├── postcss.config.js
├── index.html                    # fonts (Fraunces + Karla), manifest, PWA meta
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   ├── sw.js                     # minimal service worker (installability)
│   ├── favicon.svg
│   └── icons/                    # 192 / 512 / 512-maskable
├── netlify/functions/
│   └── process-payment.js        # simulated Stripe charge, server-side pricing
└── src/
    ├── main.jsx                  # router + provider + SW registration
    ├── App.jsx                   # routes + layout
    ├── index.css                 # Tailwind layers, focus styles, reduced motion
    ├── context/StoreContext.jsx  # in-memory shared "database" + pricing
    ├── components/
    │   ├── Header.jsx
    │   ├── Footer.jsx
    │   └── ClotheslineTracker.jsx  # signature 4-phase status tracker
    └── pages/
        ├── Landing.jsx
        ├── Dashboard.jsx
        └── Admin.jsx
```

## Design notes

Boutique-minimal: warm neutrals (ivory `#F7F4ED`, linen `#EAE4D8`, ink `#23201C`) with a single muted **iris** accent `#5B5170` — a nod to lavender, laundry's own scent. Fraunces (serif, headlines only) + Karla (body). The signature element is the status tracker rendered as a **clothesline**: a sagging rope with wooden pegs (one per phase) that turn iris as the order progresses. Keyboard focus is visible everywhere and animation respects `prefers-reduced-motion`.
