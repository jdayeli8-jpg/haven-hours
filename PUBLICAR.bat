@echo off
rem ============================================================
rem  HAVEN & HOURS - Publicar la app en internet (Netlify)
rem  Doble clic y sigue las instrucciones en pantalla.
rem ============================================================
cd /d "%~dp0"
echo.
echo  ==========================================
echo   HAVEN ^& HOURS - Publicar en internet
echo  ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] No se encontro Node.js en esta computadora.
  echo  Instala Node.js y vuelve a intentar.
  pause
  exit /b 1
)

echo  Paso 1 de 2: preparando las piezas de la app...
echo  (esto puede tardar 1-2 minutos, es normal)
echo.
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo  [ERROR] La instalacion fallo. Toma una foto de esta
  echo  ventana y mandasela a Claude para que te ayude.
  pause
  exit /b 1
)

echo.
echo  Paso 2 de 2: publicando en Netlify...
echo.
echo  OJO: la primera vez se abrira tu navegador para que
echo  autorices a Netlify (boton "Authorize"). Despues, esta
echo  ventana te hara unas preguntas; usa las flechas del
echo  teclado y Enter para responder.
echo.
call npx --yes netlify-cli deploy --prod --build
if errorlevel 1 (
  echo.
  echo  [AVISO] Algo no salio bien. Toma una foto de esta
  echo  ventana y mandasela a Claude.
  pause
  exit /b 1
)

echo.
echo  ==========================================
echo   LISTO. Busca arriba la linea que dice
echo   "Website URL" - esa es la direccion de
echo   tu app en internet. Compartela!
echo  ==========================================
echo.
pause
