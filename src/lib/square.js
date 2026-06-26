/*
  HAVEN & HOURS — Configuración de Square (datos PÚBLICOS, viven en el navegador).
  El Application ID y el Location ID NO son secretos (son públicos por diseño).
  La llave SECRETA (Access Token) vive solo en Netlify, nunca aquí.

  ──────────────────────────────────────────────────────────────────────────
  PARA PASAR A DINERO REAL (Producción), haz solo esto:
    1) Pega abajo tu App ID y Location ID de PRODUCCIÓN (en el bloque "production").
    2) Cambia esta línea:  SQUARE_ENV = 'sandbox'  →  SQUARE_ENV = 'production'
    3) En index.html, cambia el script del SDK a la versión de producción
       (ahí está comentado cuál es). Debe coincidir con el modo de aquí.
    4) En Netlify (variables de entorno) pon las de Producción:
         SQUARE_ACCESS_TOKEN = (tu token de Producción)
         SQUARE_API_BASE     = https://connect.squareup.com/v2
         SQUARE_LOCATION_ID  = (tu Location ID de Producción)
  ──────────────────────────────────────────────────────────────────────────
*/

// 👇 EL ÚNICO INTERRUPTOR: 'sandbox' (prueba) o 'production' (dinero real)
const SQUARE_ENV = 'production'

const SQUARE_CONFIG = {
  sandbox: {
    appId: 'sandbox-sq0idb-lEP4buV_MSPt4NW32tl-Kg',
    locationId: 'L3X56QS01NHW6',
    sdkUrl: 'https://sandbox.web.squarecdn.com/v1/square.js',
  },
  production: {
    appId: 'sq0idp-yPwP5UznUeRmP0sqVN_Dqg',
    locationId: 'LSGM5HV2V8KRA',
    sdkUrl: 'https://web.squarecdn.com/v1/square.js',
  },
}

const active = SQUARE_CONFIG[SQUARE_ENV]

export const SQUARE_ENVIRONMENT = SQUARE_ENV
export const SQUARE_APP_ID = active.appId
export const SQUARE_LOCATION_ID = active.locationId
export const SQUARE_SDK_URL = active.sdkUrl
