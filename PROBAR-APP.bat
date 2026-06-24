@echo off
rem ============================================================
rem  HAVEN & HOURS - Probar la app en esta computadora
rem  Doble clic; se abrira el navegador solo.
rem  Deja esta ventana abierta mientras usas la app.
rem ============================================================
cd /d "%~dp0"
echo.
echo  ==========================================
echo   HAVEN ^& HOURS - Modo de prueba local
echo  ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [ERROR] No se encontro Node.js en esta computadora.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Primera vez en esta carpeta: instalando piezas...
  echo  (1-2 minutos, solo esta vez)
  echo.
  call npm install --no-audit --no-fund
)

echo.
echo  Encendiendo la app... el navegador se abrira solo.
echo  DEJA ESTA VENTANA ABIERTA mientras usas la app.
echo  Para apagarla: cierra esta ventana.
echo.
start "" http://localhost:5173
call npm run dev
pause
