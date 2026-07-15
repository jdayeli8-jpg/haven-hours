import { useSyncExternalStore } from 'react'
import { BIZ_CONTENT } from './businessContent.js'

// Idioma de la página /business.
//  - Detección automática: si el navegador está en español, arranca en 'es'.
//  - Memoria de PÁGINA: se guarda en esta variable de módulo, así se respeta al
//    navegar dentro de la app y volver (no usa localStorage).
function detect() {
  try {
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']
    return langs.some((l) => /^es/i.test(l)) ? 'es' : 'en'
  } catch {
    return 'en'
  }
}

let lang = detect()
const listeners = new Set()

export function setBizLang(next) {
  if (next !== 'en' && next !== 'es') return
  if (next === lang) return
  lang = next
  listeners.forEach((fn) => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useBizLang() {
  return useSyncExternalStore(subscribe, () => lang, () => lang)
}

// Contenido del idioma activo, reactivo.
export function useBiz() {
  const l = useBizLang()
  return BIZ_CONTENT[l] || BIZ_CONTENT.en
}
