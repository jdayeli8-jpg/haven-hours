// Genera TODOS los íconos desde la ÚNICA fuente: src/assets/logo.svg
// Para regenerar tras cambiar el logo:
//   npm i -D sharp   (una vez)
//   node scripts/generate-icons.cjs
//
// Produce, desde ese único archivo:
//   public/icons/icon-192.png, icon-512.png          (fondo transparente en esquinas)
//   public/icons/icon-512-maskable.png               (morado a sangre)
//   public/apple-touch-icon.png                      (morado a sangre, opaco)
//   public/favicon.svg                               (copia del fuente)
//   brand/logo-1024-transparent.png                  (para Canva, fondo transparente)
//   brand/logo-1024-purple.png                       (para Canva, fondo morado)

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'src', 'assets', 'logo.svg')
const PUB = path.join(ROOT, 'public')
const BRAND = path.join(ROOT, 'brand')
const PURPLE = '#5C5470'

const svg = fs.readFileSync(SRC)
fs.mkdirSync(path.join(PUB, 'icons'), { recursive: true })
fs.mkdirSync(BRAND, { recursive: true })

// density alto = rasteriza grande y luego reduce → nítido en cualquier tamaño.
const base = () => sharp(svg, { density: 512 })
const asIs = (size, out) => base().resize(size, size).png().toFile(out)
const onPurple = (size, out) => base().resize(size, size).flatten({ background: PURPLE }).png().toFile(out)

;(async () => {
  await asIs(192, path.join(PUB, 'icons', 'icon-192.png'))
  await asIs(512, path.join(PUB, 'icons', 'icon-512.png'))
  await onPurple(512, path.join(PUB, 'icons', 'icon-512-maskable.png'))
  await onPurple(180, path.join(PUB, 'apple-touch-icon.png'))
  fs.copyFileSync(SRC, path.join(PUB, 'favicon.svg'))
  await asIs(1024, path.join(BRAND, 'logo-1024-transparent.png'))
  await onPurple(1024, path.join(BRAND, 'logo-1024-purple.png'))
  console.log('✓ Íconos y exports generados desde src/assets/logo.svg')
})()
