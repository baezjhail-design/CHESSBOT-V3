# apps/web — Pantalla del usuario

Esta carpeta contiene todo lo que ve y usa la persona que juega al ajedrez.

## Qué incluye

- **Pantalla del tablero:** Muestra las piezas y el tablero.
- **Menú de juego:** Empezar partida, pausar, reiniciar.
- **Historial:** Jugadas ya hechas.
- **Diagnósticos:** Estado de conexión con el servidor y las ESP32.

## Cómo se comunica

Habla con `services/api` mediante HTTP y WebSocket. No se conecta directamente a las ESP32 ni decide si una jugada es válida.

## Tecnología

React + TypeScript.