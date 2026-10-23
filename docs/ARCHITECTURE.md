# Arquitectura del Chess Bot

## Partes del sistema

Hay cuatro piezas principales:

1. **Pantalla (React):** Muestra el tablero al usuario. No decide nada por sí sola.
2. **Servidor (Node.js):** Recibe mensajes de la pantalla y los reenvía al cerebro. No guarda reglas de ajedrez.
3. **Cerebro (C++, Raspberry Pi):** Es la autoridad. Sabe el estado del tablero y valida jugadas.
4. **ESP32:** Una lee los sensores del tablero. La otra mueve los motores.

## Cómo se comunican

- Pantalla ↔ Servidor: HTTP y WebSocket.
- Servidor ↔ Cerebro: Mensajes internos.
- Cerebro ↔ ESP32: MQTT.

## Reglas importantes

- El servidor no duplica las reglas del ajedrez.
- La pantalla no se conecta directamente a MQTT.
- Ninguna parte asume que algo se hizo hasta recibir una confirmación.
- Si el tablero físico no coincide con lo esperado, se detiene todo.

## Decisiones pendientes

Ver `docs/ADR/` para futuras decisiones (motor de ajedrez, broker MQTT, etc.).