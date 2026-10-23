@echo off
chcp 65001 >nul
title ChessBot - Pantalla web
cd /d "%~dp0apps\web"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Falta Node.js, que es lo unico que hay que instalar.
  echo  Se abre la pagina de descarga: instala la version "LTS" con todo por defecto,
  echo  cierra esta ventana y vuelve a hacer doble clic en iniciar-web.bat.
  echo.
  start "" https://nodejs.org/en/download
  pause
  exit /b 1
)

if not exist node_modules (
  echo Primera vez: instalando dependencias ^(puede tardar un par de minutos^)...
  call npm install
  if errorlevel 1 (
    echo.
    echo  No se pudo instalar. Revisa tu conexion a internet y vuelve a intentarlo.
    pause
    exit /b 1
  )
)

echo.
echo  Abriendo ChessBot en http://localhost:5173  ^(Ctrl+C para detener^)
echo.
call npm run dev -- --open
pause
