import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In local dev without `netlify dev`, /api/* has nothing behind it.
// `netlify dev` (recommended) proxies both Vite and the functions together.
export default defineConfig({
  plugins: [react()],
})
