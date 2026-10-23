# CHESSBOT V3

Robot de ajedrez que detecta piezas, valida jugadas y mueve piezas físicamente con motores.

## ¿Qué hace cada parte?

- **apps/web:** Pantalla donde el usuario ve el tablero y juega (React).
- **services/api:** Servidor que recibe pedidos de la pantalla y los envía al núcleo (Node.js).
- **core:** Cerebro del ajedrez en C++ (Raspberry Pi). Decide si una jugada es válida.
- **firmware:** Código para las ESP32. Una lee sensores, la otra mueve motores.
- **contracts:** Reglas de cómo se hablan las partes (mensajes HTTP y MQTT).
- **tests:** Pruebas para verificar que todo funcione.
- **docs:** Documentación y decisiones de arquitectura.

## Estructura del repositorio

`	ext
apps/web/         # Frontend React
services/api/     # Backend API Node.js
core/             # Núcleo C++ (lógica del juego)
firmware/         # Firmware ESP32 (sensores y motores)
contracts/        # Contratos compartidos (HTTP, MQTT, eventos)
tests/            # Pruebas de integración y simulación
docs/             # Documentación y ADR
scripts/          # Scripts de utilidad
`

## Reglas básicas

1. La pantalla muestra y pide.
2. El servidor valida y comunica.
3. El núcleo C++ decide el estado de la partida.
4. Las ESP32 ejecutan y reportan.
5. Nada se asume como hecho hasta que haya una confirmación.

## Principio fundamental

> La UI presenta y solicita; la API valida y comunica; el núcleo C++ decide el estado de la partida y coordina; las ESP32 ejecutan tareas locales y reportan resultados. Ninguna capa debe asumir que otra completó una operación sin una confirmación verificable.

Más detalles en docs/ARCHITECTURE.md y softwarerules.md.
