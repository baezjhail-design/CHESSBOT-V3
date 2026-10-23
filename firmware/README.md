# firmware — Código para las ESP32

Esta carpeta contiene el programa que corre en las dos placas ESP32.

## Qué incluye

- **sensor-esp32:** Lee los sensores Hall del tablero y reporta qué piezas están en cada casilla.
- **motor-esp32:** Controla los motores que mueven las piezas físicamente.

## Qué hace cada una

- El sensor solo detecta y reporta. No decide jugadas.
- El motor solo ejecuta movimientos y reporta si terminó o si hubo error.
- Ninguna calcula estrategia de ajedrez.

## Tecnología

C++ con ESP-IDF.