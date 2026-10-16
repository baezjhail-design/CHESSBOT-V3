# Chess Bot V3

Sistema de robot de ajedrez con detección de piezas, motor de ajedrez y ejecución física mediante ESP32.

## Arquitectura

- **Frontend:** React + TypeScript (`apps/web`)
- **API:** Node.js + TypeScript + Fastify (`services/api`)
- **Núcleo:** C++ en Raspberry Pi (`core`)
- **Firmware:** C++ con ESP-IDF en ESP32 (`firmware`)
- **Comunicación:** HTTP REST, WebSocket y MQTT
- **Build C++:** CMake

## Estructura del repositorio

```
apps/web/         # Frontend React
services/api/     # Backend API Node.js
core/             # Núcleo C++ (lógica del juego)
firmware/         # Firmware ESP32 (sensores y motores)
contracts/        # Contratos compartidos (HTTP, MQTT, eventos)
tests/            # Pruebas de integración y simulación
docs/             # Documentación y ADR
scripts/          # Scripts de utilidad
```

## Reglas de desarrollo

Consultar `softwarerules.md` para las reglas completas de arquitectura, dependencias, comunicación y pruebas.

## Principio fundamental

> La UI presenta y solicita; la API valida y comunica; el núcleo C++ decide el estado de la partida y coordina; las ESP32 ejecutan tareas locales y reportan resultados. Ninguna capa debe asumir que otra completó una operación sin una confirmación verificable.