# Lo que el frontend necesita de la API

El frontend (`apps/web`) ya implementa estos contratos con esquemas zod en `apps/web/src/types/`. La API debe cumplirlos, o este documento y los esquemas deben cambiar juntos. Los esquemas zod deben pasar a JSON Schema/OpenAPI en esta carpeta (softwarerules §4.5) para no mantener dos versiones.

## Endpoints

Los de `softwarerules.md` §7.1 se usan tal cual:

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/api/v1/status` | `DeviceStatus[]` |
| GET | `/api/v1/game` | `GameSnapshot` o `null` |
| POST | `/api/v1/games` | acepta `NewGameRequest`; el resultado llega como snapshot |
| POST | `/api/v1/game/pause`, `/resume`, `/reset` | `{ ok }` |
| POST | `/api/v1/motion/stop` | `{ ok }` |

**Propuestos** (no están en §7.1 y la UI los necesita):

| Método | Ruta | Para qué |
| --- | --- | --- |
| GET | `/api/v1/catalog` | Maestros y dificultades (reemplaza `persona_system` de la GUI antigua). |
| POST | `/api/v1/game/move` | Jugada hecha desde la pantalla: `{ from, to, promotion? }`. El núcleo valida. |
| POST | `/api/v1/game/resign` | Rendición. |
| POST | `/api/v1/board/verify` | Comparar sensores con la posición y salir de `RECOVERY_REQUIRED`. |
| POST | `/api/v1/motion/home` | Homing (equivale al "Go Home" de la GUI antigua). |

**Discrepancia a resolver:** `services/api/src/routes/partida.ts` expone `/api/v1/partida/estado` y `/partida/nueva`, que no coinciden con §7.1 (`/game`, `/games`). El frontend sigue §7.1.

Errores HTTP: `{ "code": "INVALID_MOVE", "message": "..." }` con los códigos de §11.

## WebSocket `/ws`

Mensajes `{ type, data }`: `game.snapshot`, `motion.progress`, `devices.status`, `sensors.observation`, `game.commentary`, `system.error`. Formas exactas en `apps/web/src/types/game.ts` y `events.ts`.

Puntos que importan:

- `game.snapshot.revision` crece con cada cambio; la UI descarta revisiones menores.
- `legalTargets` lo calcula el núcleo; la UI no valida jugadas. Solo hace falta cuando es turno de una persona.
- `motion.progress.waypoints` y `position` van en unidades de casilla con blancas abajo: `(0,0)` es la esquina de a8 y `(8,8)` la de h1. Los pasillos están en múltiplos de 0.5.
- `sensors.observation.lifted` permite mostrar los destinos legales al levantar una pieza (como hacía la GUI antigua).
- Al conectar, la UI hace `GET /api/v1/game` y `GET /api/v1/status`; no depende de haber recibido eventos anteriores.

## CORS

Si `VITE_API_URL` apunta a otro origen (como en `compose.yaml`), la API debe permitir ese origen.
