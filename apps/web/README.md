# apps/web — Pantalla del usuario

Frontend de ChessBot: React 19 + TypeScript estricto + Vite. Muestra el estado **confirmado** del tablero y envía solicitudes a la API. No decide si una jugada es válida, no habla con MQTT ni con las ESP32 (ver `softwarerules.md` §5.1).

## Arrancar

```bash
cd apps/web
npm install
npm run dev        # http://localhost:5173
npm test           # 24 pruebas (lógica pura + simulador)
npm run build      # comprueba tipos y genera dist/
```

Sin `VITE_API_URL` arranca en **modo simulador**: un sistema completo falso (validación, motor, imán, sensores, fallos) para desarrollar y hacer demostraciones sin hardware. Con `VITE_API_URL` apunta a la API real. Se cambia en Ajustes > Conexión.

## Pantallas

| Ruta | Qué hace |
| --- | --- |
| `#/` Jugar | Portada con una partida de exhibición y configuración: modo, color, maestro, dificultad, tiempo, comentarios. |
| `#/partida` | Tablero con arrastrar/clic, relojes, estado del turno, jugadas, panel del maestro, pausa, girar, sensores, rendirse, detener robot, coronación, recuperación de errores. |
| `#/diagnostico` | Estado de dispositivos, rejilla de sensores contra posición esperada, herramientas y registro de eventos. |
| `#/ajustes` | Tema del tablero, sonido, voz, ayudas, origen de datos. |

## Estructura (softwarerules §4.1)

```
src/
  app/            composición, rutas, avisos de error
  components/     botones, diálogos, iconos, escudo de maestro
  features/
    board/        tablero SVG, piezas propias, seguimiento de piezas, geometría
    game/         portada/configuración, partida, estado, jugadas
    diagnostics/  dispositivos, sensores, registro
    settings/
  hooks/          reloj local
  services/
    api-client.ts HTTP (única puerta de salida), respuestas validadas con zod
    realtime.ts   WebSocket con reconexión limitada; pide snapshot al reconectar
    gateway.ts    interfaz UI <-> sistema (real o simulador)
    demo/         simulador (aquí, y solo aquí, vive chess.js)
  state/          zustand: partida y preferencias
  types/          esquemas zod = contratos
```

## Decisiones de diseño que importan

- **La UI no muestra nada como hecho sin confirmación.** Una jugada enviada se ve translúcida con un borde punteado hasta que llega el snapshot. La pieza que mueve el robot sigue al imán y solo "aterriza" al confirmarse.
- **Las reglas viven fuera.** Los destinos legales llegan en el snapshot (`legalTargets`); la UI no calcula jugadas.
- **Los datos de red son no confiables.** Cada respuesta y cada mensaje WebSocket se valida con zod; los inválidos se descartan. Un snapshot con revisión anterior se ignora.
- **Reconexión:** hasta 8 reintentos con espera creciente; después, estado "Sin conexión" con reintento manual. Al reabrir siempre se pide el estado actual.
- **Errores:** los códigos de §11 se traducen a "qué pasó + qué hacer" (`types/errors.ts`).
- **Identidad:** el imán de cobre como protagonista (anillo de cobre en cada pieza, recorrido por pasillos bajo el tablero), paleta azul medianoche + cobre, Big Shoulders Display + Hanken Grotesk. Juego de piezas y escudos de maestros propios, sin retratos ni activos de terceros.

## Pendiente con otros módulos

Ver `contracts/http/web-requirements.md`.
