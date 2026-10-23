# Chess Bot — Architecture & Development Rules

**Estado:** Propuesta inicial
**Arquitectura:** Modular por capas, orientada a eventos y puertos y adaptadores
**Frontend:** React + TypeScript
**Backend API:** Node.js + TypeScript + Fastify
**Núcleo de control:** C++ en Raspberry Pi
**Firmware:** C++ con ESP-IDF en ESP32
**Comunicación:** HTTP REST, WebSocket y MQTT
**Build system:** CMake para C++

---

## 1. Objetivo del documento

Este documento define las reglas arquitectónicas, la organización del repositorio, las responsabilidades de cada componente y los estándares de desarrollo del Chess Bot.

El sistema debe permitir:

- Detectar la posición de las piezas mediante sensores Hall.
- Mantener un estado lógico consistente del tablero.
- Validar las jugadas realizadas por el usuario.
- Calcular respuestas mediante un motor de ajedrez.
- Ejecutar movimientos físicos mediante motores controlados por ESP32.
- Mostrar el estado del tablero y de los dispositivos en una interfaz React.
- Comunicar componentes mediante protocolos definidos.
- Detectar errores de hardware, comunicación y ejecución.
- Probar la lógica sin necesitar el tablero físico.
- Permitir futuras modificaciones sin reescribir todo el sistema.

## 2. Principios arquitectónicos

Las siguientes reglas son obligatorias para todos los módulos.

### 2.1 Responsabilidad única

Cada módulo debe tener una responsabilidad claramente delimitada.

Por ejemplo, el módulo de sensores detecta cambios físicos, pero no decide qué jugada debe realizar el motor de ajedrez.

### 2.2 Separación de responsabilidades

La interfaz, la API, la lógica del juego y el hardware deben permanecer separados.

Una modificación en React no debería requerir cambios en el firmware de las ESP32 si los contratos de comunicación permanecen iguales.

### 2.3 Dependencias explícitas

Los módulos deben comunicarse mediante interfaces, contratos o eventos definidos.

Se deben evitar dependencias directas entre componentes que no necesitan conocerse.

### 2.4 Una fuente de verdad

El núcleo C++ de la Raspberry Pi será responsable del estado lógico autorizado de la partida.

React mantendrá una representación visual de ese estado, pero no será su autoridad.

Las ESP32 serán responsables de informar el estado de sus operaciones físicas y mediciones. No decidirán el estado completo de la partida.

### 2.5 Confirmación de operaciones

Enviar un comando no significa que se haya ejecutado correctamente.

Cada operación física debe distinguir, como mínimo, entre recepción, ejecución, finalización y error.

### 2.6 Diseño orientado a fallos

El sistema debe contemplar desconexiones, errores de sensores, movimientos incompletos, reinicios y estados inconsistentes.

No se debe continuar automáticamente si el estado físico del tablero no coincide con el estado lógico esperado.

### 2.7 Testabilidad

Los módulos de aplicación deben poder probarse utilizando simuladores de sensores, motores y dispositivos externos.

---

## 3. Arquitectura general

Se utilizará una arquitectura modular por capas, combinada con eventos internos y puertos y adaptadores.

```text
┌──────────────────────────────────────────────┐
│             FRONTEND — REACT                 │
│                                              │
│  Tablero · Historial · Configuración         │
│  Estado de conexión · Diagnósticos            │
└──────────────────────┬───────────────────────┘
                       │
              HTTP REST / WebSocket
                       │
┌──────────────────────▼───────────────────────┐
│         API — NODE.JS + TYPESCRIPT            │
│                                              │
│  Rutas · Validación · API REST                │
│  WebSocket · Adaptador MQTT                  │
│  Traducción de eventos para la UI             │
└──────────────────────┬───────────────────────┘
                       │
                Contrato interno
                       │
┌──────────────────────▼───────────────────────┐
│          NÚCLEO — C++ / RASPBERRY PI          │
│                                              │
│  Game Controller · Estado de partida          │
│  Reglas · Chess Engine Adapter                │
│  Motion Planner · Coordinación de hardware   │
└──────────────────────┬───────────────────────┘
                       │
                      MQTT
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
┌────────────────────┐ ┌────────────────────┐
│ ESP32 — SENSORES   │ │ ESP32 — MOTORES    │
│                    │ │                    │
│ Sensores Hall      │ │ Control de motores │
│ Observaciones      │ │ Ejecución local    │
│ Estado del tablero │ │ Confirmaciones     │
└────────────────────┘ └────────────────────┘
```

### 3.1 Responsabilidad de cada tecnología

- **React:** presentación e interacción con el usuario.
- **TypeScript/Node.js:** API web, conexiones en tiempo real y adaptación de mensajes.
- **C++ en Raspberry Pi:** lógica central del juego, coordinación y planificación.
- **ESP32:** adquisición de datos y control local del hardware.
- **HTTP REST:** solicitudes y consultas explícitas.
- **WebSocket:** actualizaciones en tiempo real hacia la interfaz.
- **MQTT:** comunicación entre servicios y dispositivos.
- **CMake:** configuración y compilación del código C++.

### 3.2 Decisión sobre el backend

Node.js no debe duplicar las reglas de ajedrez ni mantener una segunda fuente de verdad.

La API valida las solicitudes, gestiona las conexiones y comunica los comandos al núcleo C++.

El núcleo C++ decide si una operación es válida dentro del estado actual del sistema.

El firmware ESP32 conserva la responsabilidad de aplicar las restricciones locales necesarias para controlar el hardware de forma segura.

---

## 4. Distribución de carpetas

Se utilizará un monorepo para mantener los componentes relacionados en un único repositorio.

```text
chess-bot/
│
├── apps/
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── features/
│       │   │   ├── board/
│       │   │   ├── game/
│       │   │   ├── settings/
│       │   │   └── diagnostics/
│       │   ├── hooks/
│       │   ├── services/
│       │   │   ├── api-client.ts
│       │   │   └── realtime.ts
│       │   ├── state/
│       │   ├── types/
│       │   └── main.tsx
│       ├── tests/
│       └── package.json
│
├── services/
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── schemas/
│       │   ├── services/
│       │   ├── realtime/
│       │   ├── messaging/
│       │   │   ├── mqtt-client.ts
│       │   │   ├── subscriptions.ts
│       │   │   └── event-mapper.ts
│       │   ├── security/
│       │   ├── app.ts
│       │   └── main.ts
│       ├── tests/
│       └── package.json
│
├── core/
│   ├── include/
│   │   └── chessbot/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── ports/
│   │       ├── engine/
│   │       ├── motion/
│   │       └── infrastructure/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── engine/
│   │   ├── motion/
│   │   └── infrastructure/
│   ├── tests/
│   └── CMakeLists.txt
│
├── firmware/
│   ├── common/
│   ├── sensor-esp32/
│   │   ├── src/
│   │   ├── include/
│   │   └── CMakeLists.txt
│   └── motor-esp32/
│       ├── src/
│       ├── include/
│       └── CMakeLists.txt
│
├── contracts/
│   ├── http/
│   ├── events/
│   ├── examples/
│   └── mqtt-topics.md
│
├── tests/
│   ├── integration/
│   ├── contract/
│   └── simulation/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── HARDWARE.md
│   ├── PROTOCOL.md
│   ├── OPERATIONS.md
│   └── ADR/
│
├── scripts/
├── .editorconfig
├── .gitignore
├── README.md
└── compose.yaml
```

Esta estructura es una guía inicial. No es necesario crear archivos o directorios vacíos antes de que exista una necesidad concreta.

### 4.1 `apps/web`

Contiene exclusivamente el frontend React.

- `app/`: composición de la aplicación y rutas.
- `components/`: componentes visuales reutilizables.
- `features/board/`: tablero y representación de las piezas.
- `features/game/`: controles y estado visual de la partida.
- `features/settings/`: configuración de usuario.
- `features/diagnostics/`: estado de conexión y dispositivos.
- `services/api-client.ts`: comunicación HTTP.
- `services/realtime.ts`: conexión WebSocket.
- `state/`: estado de presentación de la UI.
- `types/`: tipos utilizados por el frontend.

### 4.2 `services/api`

Contiene el servidor Node.js.

- `routes/`: definición de endpoints.
- `controllers/`: traducción de solicitudes HTTP a operaciones de aplicación.
- `schemas/`: validación de entrada y salida.
- `services/`: coordinación de casos de uso propios de la API.
- `realtime/`: gestión de conexiones WebSocket.
- `messaging/`: comunicación MQTT y traducción de mensajes.
- `security/`: autorización, límites y controles de acceso.
- `config/`: configuración validada del servidor.

Los controladores no deben implementar reglas de ajedrez ni controlar motores directamente.

### 4.3 `core`

Contiene la lógica central en C++.

- `domain/`: tipos, reglas y estados del juego.
- `application/`: casos de uso y coordinación.
- `ports/`: interfaces hacia sistemas externos.
- `engine/`: integración con el motor de ajedrez.
- `motion/`: planificación y seguimiento de movimientos físicos.
- `infrastructure/`: implementaciones de comunicación, almacenamiento y acceso a hardware.

### 4.4 `firmware`

Contiene el código de las ESP32.

Cada firmware debe tener un punto de entrada, configuración, control de errores y pruebas apropiadas para su función.

El firmware de sensores no debe depender del firmware de motores para poder leer y reportar mediciones.

### 4.5 `contracts`

Define los contratos compartidos por los distintos lenguajes.

Los mensajes deben documentarse en un formato independiente del lenguaje, como JSON Schema, OpenAPI o Protocol Buffers cuando corresponda.

No se deben mantener contratos duplicados y divergentes en TypeScript y C++.

---

## 5. Responsabilidades por capa

### 5.1 Frontend

El frontend debe:

- Mostrar el estado confirmado del tablero.
- Mostrar el turno actual y el historial.
- Enviar comandos de usuario a través de la API.
- Mostrar el estado de conexión.
- Presentar operaciones en curso y resultados.
- Manejar errores de red y reconexiones.
- Solicitar una nueva instantánea del estado después de una reconexión.

El frontend no debe:

- Conectarse directamente a MQTT.
- Controlar motores.
- Determinar de forma autoritativa la validez de una jugada física.
- Suponer que un movimiento se completó sin confirmación.
- Sobrescribir el estado del backend con datos locales no confirmados.

### 5.2 API TypeScript

La API debe:

- Exponer REST y WebSocket.
- Validar las solicitudes en tiempo de ejecución.
- Gestionar conexiones de clientes.
- Traducir eventos del sistema a eventos para la interfaz.
- Enviar comandos al núcleo C++.
- Gestionar errores de transporte, límites de solicitudes y autorización.
- Validar los mensajes MQTT recibidos.
- Correlacionar comandos con sus resultados.

La API no debe:

- Duplicar las reglas centrales del juego.
- Convertirse en una segunda autoridad sobre el estado de la partida.
- Considerar que publicar un comando equivale a ejecutarlo.
- Exponer el broker MQTT a redes no autorizadas.

### 5.3 Núcleo C++

El núcleo debe:

- Mantener el estado lógico de la partida.
- Validar las jugadas.
- Coordinar el motor de ajedrez.
- Interpretar observaciones del tablero.
- Gestionar transiciones de estado.
- Planificar los movimientos físicos.
- Enviar comandos a los controladores de hardware.
- Esperar confirmaciones y gestionar tiempos de espera.
- Detectar discrepancias entre el tablero esperado y el observado.
- Publicar eventos relevantes.
- Permitir pruebas mediante simuladores.

El núcleo no debe depender de React ni de la implementación concreta de HTTP o WebSocket.

### 5.4 Firmware ESP32

El firmware debe:

- Leer sensores o controlar actuadores.
- Validar comandos locales.
- Respetar límites de movimiento y restricciones físicas.
- Publicar estados y errores.
- Identificar el dispositivo y su versión de firmware.
- Manejar pérdidas de conexión y reinicios.
- Aplicar el comportamiento seguro definido para cada fallo.

Las ESP32 no deben calcular la estrategia de ajedrez ni depender de la UI para operar de manera segura.

---

## 6. Reglas de dependencias

1. `domain` no debe importar bibliotecas de red, React, MQTT ni controladores físicos.
2. `application` debe depender de interfaces y modelos de dominio.
3. `infrastructure` debe implementar las interfaces del núcleo.
4. Los controladores HTTP deben delegar la lógica de aplicación.
5. React debe centralizar la comunicación de red en sus servicios.
6. No se permiten dependencias circulares entre módulos.
7. Los datos recibidos por red deben validarse aunque TypeScript los describa mediante tipos.
8. Los contratos compartidos deben estar versionados y tener pruebas de compatibilidad.
9. Los módulos deben exponer interfaces pequeñas y explícitas.
10. No se deben crear abstracciones sin una responsabilidad real.

---

## 7. Comunicación entre componentes

Cada tecnología tiene una responsabilidad concreta.

### 7.1 HTTP REST

Se utilizará para consultas y operaciones explícitas.

Endpoints iniciales propuestos:

| Método | Endpoint              | Responsabilidad                   |
| ------ | --------------------- | --------------------------------- |
| GET    | `/api/v1/status`      | Consultar el estado general       |
| GET    | `/api/v1/game`        | Consultar el estado de la partida |
| POST   | `/api/v1/games`       | Solicitar una nueva partida       |
| POST   | `/api/v1/game/pause`  | Solicitar pausa                   |
| POST   | `/api/v1/game/resume` | Solicitar reanudación             |
| POST   | `/api/v1/game/reset`  | Solicitar reinicio validado       |
| POST   | `/api/v1/motion/stop` | Solicitar parada del movimiento   |

Los endpoints definitivos deben documentarse en OpenAPI.

Una solicitud HTTP de parada no sustituye una parada de emergencia física independiente cuando el diseño del hardware la requiera.

### 7.2 WebSocket

Se utilizará para notificar a la interfaz:

- Cambios confirmados del tablero.
- Cambios de turno.
- Progreso de operaciones físicas.
- Conexión y desconexión de dispositivos.
- Errores y advertencias.
- Resultado de comandos.
- Cambios de estado de la partida.

Al reconectarse, la UI debe solicitar una instantánea actual del estado. No debe asumir que recibió todos los eventos mientras estuvo desconectada.

### 7.3 MQTT

Se utilizará para comunicar la Raspberry Pi y las ESP32.

Tópicos iniciales propuestos:

```text
chessbot/v1/device/{deviceId}/telemetry
chessbot/v1/device/{deviceId}/status
chessbot/v1/sensors/board/observation
chessbot/v1/motion/command
chessbot/v1/motion/result
chessbot/v1/system/event
```

Los tópicos definitivos, publicadores, suscriptores, QoS y esquemas deben registrarse en `contracts/mqtt-topics.md`.

Reglas:

- Cada dispositivo debe tener un `clientId` único.
- El broker debe utilizar autenticación y listas de control de acceso.
- No se deben retener comandos de movimiento como mensajes MQTT retenidos.
- El nivel QoS debe seleccionarse según las necesidades de cada mensaje.
- QoS no garantiza por sí solo que una acción física se ejecute exactamente una vez.
- Los mensajes deben incluir versión del esquema y un identificador de correlación cuando corresponda.
- La API web no debe depender de que las ESP32 estén siempre conectadas.

---

## 8. Contratos de mensajes

Todos los comandos y eventos deben tener un esquema definido y versionado.

Ejemplo de comando de movimiento:

```json
{
  "schemaVersion": 1,
  "commandId": "uuid",
  "deviceId": "motor-controller-01",
  "type": "motion.execute",
  "payload": {
    "from": "e2",
    "to": "e4"
  }
}
```

Ejemplo de resultado:

```json
{
  "schemaVersion": 1,
  "commandId": "uuid",
  "deviceId": "motor-controller-01",
  "type": "motion.result",
  "status": "completed",
  "errorCode": null
}
```

Los ejemplos son ilustrativos. El formato final debe contemplar marcas de tiempo, validación, límites y metadatos de ejecución.

### Reglas de los comandos

- Cada comando debe tener un identificador único.
- El resultado debe permitir identificar el comando al que corresponde.
- Los estados iniciales serán `accepted`, `running`, `completed`, `failed`, `cancelled` y `timeout`.
- `accepted` significa recibido o aceptado, no ejecutado.
- Los comandos con efectos físicos deben tener una política de idempotencia.
- Si se pierde una confirmación, se debe consultar el estado antes de repetir un movimiento.
- Se deben rechazar versiones no soportadas y parámetros fuera de rango.
- No se utilizarán mensajes de texto libre como protocolo de control.
- Nunca se incluirán credenciales en eventos.

---

## 9. Modelo de estado de la partida

El controlador central debe utilizar una máquina de estados explícita.

Estados iniciales:

```text
IDLE
  └── start → READY

READY
  └── game_started → WAITING_FOR_HUMAN

WAITING_FOR_HUMAN
  └── board_changed → VALIDATING_HUMAN_MOVE

VALIDATING_HUMAN_MOVE
  ├── invalid_or_incomplete → WAITING_FOR_HUMAN
  └── valid → THINKING

THINKING
  └── engine_result → PLANNING_ROBOT_MOVE

PLANNING_ROBOT_MOVE
  └── plan_accepted → EXECUTING_ROBOT_MOVE

EXECUTING_ROBOT_MOVE
  ├── execution_confirmed → WAITING_FOR_HUMAN
  └── discrepancy_or_error → RECOVERY_REQUIRED

RECOVERY_REQUIRED
  └── verified_recovery → State determined by controller
```

Se podrán añadir estados para pausa, fin de partida, desconexión y apagado seguro.

### Reglas de consistencia

- Las transiciones deben centralizarse.
- Cada transición debe tener condiciones de entrada y salida definidas.
- Los eventos duplicados no deben provocar transiciones duplicadas.
- Una jugada incompleta no debe interpretarse automáticamente como una jugada válida.
- Si el estado físico no coincide con el esperado, se debe detener la secuencia automática.
- El sistema debe resolver la discrepancia antes de continuar.

---

## 10. Reglas de desarrollo por lenguaje

### 10.1 TypeScript

- Activar `strict: true`.
- Evitar `any`; utilizar `unknown` y validación explícita cuando sea necesario.
- Validar los datos externos en tiempo de ejecución.
- Mantener rutas, controladores, servicios y adaptadores separados.
- Validar la configuración al iniciar.
- Usar variables de entorno para la configuración.
- No almacenar secretos en el repositorio.
- Ejecutar lint, formato y comprobación de tipos en CI.
- Evitar lógica de hardware directamente en las rutas HTTP.

### 10.2 React

- Utilizar componentes pequeños con responsabilidades claras.
- Separar presentación, estado visual y comunicación.
- Centralizar las llamadas HTTP y WebSocket.
- Tratar los mensajes de red como datos externos no confiables.
- Gestionar carga, desconexión, error y reconexión.
- No mostrar una operación física como completada antes de recibir confirmación.
- Evitar duplicar innecesariamente el estado completo de la partida.
- Mantener las reglas de negocio fuera de los componentes visuales.

### 10.3 C++

- Utilizar C++ moderno; objetivo inicial C++20 si la toolchain y las dependencias lo permiten.
- Utilizar CMake como sistema de construcción.
- Habilitar advertencias del compilador.
- Utilizar RAII y gestión segura de recursos.
- Evitar estado global mutable.
- Definir límites de tiempo y manejo de errores.
- No bloquear innecesariamente el hilo de comunicación con operaciones largas.
- Separar planificación y ejecución de movimientos.
- Mantener las reglas de ajedrez independientes del hardware.
- Permitir sustituir sensores y motores por simuladores.

### 10.4 ESP32

- Utilizar C++ con ESP-IDF, salvo que una decisión documentada justifique otra plataforma.
- Validar límites de comandos localmente.
- Gestionar watchdog y fallos de comunicación.
- No depender de conectividad permanente.
- Informar errores mediante códigos estables.
- Probar límites físicos y comportamiento de parada antes de habilitar automatización completa.

---

## 11. Manejo de errores y recuperación

Códigos de error iniciales:

- `SENSOR_READ_FAILED`
- `BOARD_STATE_MISMATCH`
- `INVALID_MOVE`
- `ENGINE_UNAVAILABLE`
- `MOTION_COMMAND_REJECTED`
- `MOTION_TIMEOUT`
- `DEVICE_OFFLINE`
- `MQTT_DISCONNECTED`
- `EMERGENCY_STOP_ACTIVE`

Reglas:

1. No ignorar errores de sensores, actuadores ni comunicación.
2. No reintentar indefinidamente.
3. Establecer tiempos de espera para operaciones externas.
4. Registrar identificadores de correlación.
5. Distinguir errores recuperables de fallos que requieren intervención humana.
6. Ante una posición física incierta, detener la secuencia automática.
7. Definir el comportamiento seguro de parada según el hardware real.
8. No asumir que una desconexión significa que el movimiento se detuvo.
9. Tras un reinicio, verificar el estado físico antes de reanudar una partida.

---

## 12. Seguridad

Aunque el sistema funcione en una red local:

- No exponer MQTT ni puertos de control a Internet sin protección explícita.
- Restringir el acceso a la UI y a los comandos de control.
- Utilizar autenticación y autorización cuando corresponda.
- Aplicar ACL por dispositivo en el broker MQTT.
- Validar comandos tanto en el backend como en el firmware.
- Mantener secretos fuera de Git.
- Limitar tamaño y frecuencia de las solicitudes.
- Registrar operaciones importantes sin almacenar credenciales.
- Considerar segmentación de red.
- No utilizar la UI como mecanismo de seguridad.
- Diseñar una parada de emergencia independiente cuando el riesgo mecánico lo requiera.

---

## 13. Estrategia de pruebas

### 13.1 Pruebas unitarias

Deben cubrir:

- Reglas del ajedrez.
- Validación de jugadas.
- Transiciones de estado.
- Interpretación de sensores.
- Planificación de movimientos.
- Validación de contratos.
- Timeouts y recuperación de errores.

### 13.2 Pruebas de integración

Deben cubrir:

- API REST con el núcleo simulado.
- WebSocket y sincronización del estado.
- MQTT con un broker de pruebas.
- Núcleo C++ con sensores y actuadores simulados.
- Comunicación Raspberry Pi–ESP32.
- Compatibilidad entre versiones de contratos.

### 13.3 Pruebas físicas

Deben comprobar:

- Lectura y calibración de sensores Hall.
- Detección de movimientos incompletos.
- Correcciones manuales de piezas.
- Límites mecánicos.
- Parada de emergencia.
- Desconexión de red durante una operación.
- Reinicio de una ESP32 durante una partida.
- Reinicio de la Raspberry Pi.
- Verificación de la posición final después de cada movimiento.

Los escenarios de fallo deben probarse progresivamente en un entorno controlado.

---

## 14. Git y calidad de código

### Estrategia de ramas

- `main`: versión estable.
- Ramas cortas por funcionalidad o corrección.
- Pull Requests para revisar cambios antes de integrarlos.

Ejemplos de nombres:

```text
feat/hall-sensor-detection
feat/board-state-reconciliation
feat/websocket-game-events
fix/motion-timeout
test/game-state-transitions
```

### Convención de commits

Se recomienda Conventional Commits:

```text
feat(board): detect occupied squares
fix(motion): handle execution timeout
test(api): validate invalid command payloads
docs(architecture): define mqtt contracts
refactor(core): separate game state transitions
```

### Integración continua

La CI debe ejecutar, según el componente modificado:

- Formato y lint de TypeScript.
- Comprobación de tipos.
- Pruebas del frontend y API.
- Compilación C++ con CMake.
- Pruebas unitarias C++.
- Validación de contratos.
- Pruebas de integración sin hardware.
- Análisis de dependencias.
- Detección de secretos.

### Definición de terminado

Una tarea estará terminada cuando:

1. Cumpla los requisitos definidos.
2. Valide las entradas y gestione los errores.
3. Incluya pruebas pertinentes.
4. Respete las fronteras arquitectónicas.
5. Actualice la documentación y los contratos cuando corresponda.
6. No introduzca secretos ni datos sensibles.
7. Pueda compilarse y ejecutarse siguiendo la documentación del repositorio.

---

## 15. Configuración y despliegue

Se mantendrán configuraciones distintas para desarrollo, pruebas y producción.

La configuración debe definir explícitamente:

- Dirección y puerto HTTP.
- Ruta WebSocket.
- Dirección del broker MQTT.
- Credenciales y permisos.
- Identificadores de dispositivos.
- Tiempos de espera.
- Nivel de logs.
- Dirección del servicio C++.
- Versiones de firmware y contratos.

Ejemplo de variables de entorno:

```text
NODE_ENV=
HTTP_HOST=
HTTP_PORT=
WEBSOCKET_PATH=
MQTT_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
CHESS_CORE_ADDRESS=
LOG_LEVEL=
```

Los valores reales no deben guardarse en Git.

Los procesos de la Raspberry Pi deben ejecutarse con privilegios mínimos, supervisión y rotación de logs.

La caída de la API web no debe causar que el sistema de movimiento continúe de forma insegura.

No se deben desplegar cambios de protocolo sin verificar su compatibilidad con el firmware instalado.

---

## 16. Decisiones pendientes

Las siguientes decisiones deben documentarse mediante Architecture Decision Records (ADR) en `docs/ADR/`.

1. Motor de ajedrez: Stockfish como proceso externo u otra integración.
2. Comunicación entre Node.js y C++: MQTT, gRPC, socket local u otro protocolo documentado.
3. Broker MQTT y configuración de seguridad.
4. Distribución definitiva de las ESP32.
5. Controladores de motores y sensores de posición.
6. Tiempos máximos de ejecución y tolerancias físicas.
7. Necesidad de persistencia del historial y recuperación de partidas.
8. Acceso exclusivamente local o remoto.
9. Estrategia de actualización del firmware.
10. Mecanismo de parada de emergencia.

Las decisiones deben basarse en latencia, fiabilidad, recursos disponibles, seguridad y facilidad de pruebas, no únicamente en popularidad.

---

## 17. Resumen de decisiones

| Área                   | Decisión inicial                              |
| ---------------------- | --------------------------------------------- |
| Arquitectura           | Capas + eventos + puertos y adaptadores       |
| Repositorio            | Monorepo                                      |
| Frontend               | React + TypeScript                            |
| API                    | Node.js + TypeScript + Fastify                |
| Comunicación UI        | HTTP REST + WebSocket                         |
| Núcleo                 | C++ en Raspberry Pi                           |
| Firmware               | C++ con ESP-IDF                               |
| Comunicación con ESP32 | MQTT                                          |
| Construcción C++       | CMake                                         |
| Contratos              | OpenAPI y/o JSON Schema                       |
| Pruebas                | Unitarias, integración, simulación y hardware |
| Microservicios         | No inicialmente                               |

## Regla final

**La UI presenta y solicita; la API valida y comunica; el núcleo C++ decide el estado de la partida y coordina; las ESP32 ejecutan tareas locales y reportan resultados.**

Ninguna capa debe asumir que otra completó una operación sin una confirmación verificable.
