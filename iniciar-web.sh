#!/usr/bin/env bash
# Arranca la pantalla web de ChessBot. Solo requiere Node.js (https://nodejs.org).
set -e
cd "$(dirname "$0")/apps/web"

if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js. Instala la versión LTS desde https://nodejs.org y vuelve a ejecutar este script."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Primera vez: instalando dependencias (puede tardar un par de minutos)..."
  npm install
fi

echo "Abriendo ChessBot en http://localhost:5173  (Ctrl+C para detener)"
exec npm run dev -- --open
