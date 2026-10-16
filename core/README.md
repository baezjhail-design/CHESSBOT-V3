# core — Cerebro del ajedrez (C++)

Esta carpeta contiene la lógica central del juego, que corre en la Raspberry Pi.

## Qué hace

- Mantiene el estado lógico del tablero (la fuente de verdad).
- Valida si una jugada del humano es correcta.
- Decide la respuesta del motor de ajedrez.
- Planifica los movimientos físicos del robot.
- Espera confirmaciones de las ESP32 antes de continuar.
- Detecta si el tablero físico no coincide con lo esperado.

## Qué NO hace

- No depende de React ni de la pantalla.
- No conoce los detalles de HTTP o WebSocket.

## Tecnología

C++ moderno (C++20) con CMake.