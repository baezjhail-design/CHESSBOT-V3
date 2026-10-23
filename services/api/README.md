# services/api — Servidor intermedio

Esta carpeta contiene el servidor que recibe pedidos de la pantalla y los envía al núcleo C++.

## Qué hace

- Recibe solicitudes de la pantalla (React).
- Valida que los datos lleguen bien.
- Reenvía comandos al núcleo C++ (Raspberry Pi).
- Recibe eventos del núcleo y los muestra en la pantalla por WebSocket.
- Gestiona la conexión MQTT con las ESP32.

## Qué NO hace

- No duplica las reglas del ajedrez.
- No es la autoridad del estado de la partida (eso lo decide `core`).

## Tecnología

Node.js + TypeScript + Fastify.