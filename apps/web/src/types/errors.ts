/**
 * Códigos de error de softwarerules §11 traducidos a lo que la persona puede hacer.
 * Un error explica qué pasó y cómo seguir; no pide perdón ni es vago.
 */
export interface ErrorCopy {
  title: string;
  fix: string;
  /** `true` si la partida automática está detenida hasta que alguien intervenga. */
  blocking: boolean;
}

const COPY: Record<string, ErrorCopy> = {
  SENSOR_READ_FAILED: {
    title: 'No se pudo leer el tablero',
    fix: 'Revisa el cable de los sensores y que la ESP32 del tablero tenga corriente.',
    blocking: true,
  },
  BOARD_STATE_MISMATCH: {
    title: 'Las piezas no coinciden con la partida',
    fix: 'Coloca las piezas marcadas en su casilla y pulsa Verificar tablero.',
    blocking: true,
  },
  INVALID_MOVE: {
    title: 'Jugada no válida',
    fix: 'Devuelve la pieza a su casilla y elige otra jugada.',
    blocking: false,
  },
  ENGINE_UNAVAILABLE: {
    title: 'El motor de ajedrez no responde',
    fix: 'Espera unos segundos. Si sigue igual, reinicia el servicio del motor.',
    blocking: true,
  },
  MOTION_COMMAND_REJECTED: {
    title: 'El robot rechazó el movimiento',
    fix: 'Comprueba que no haya piezas fuera de lugar y vuelve a intentarlo.',
    blocking: true,
  },
  MOTION_TIMEOUT: {
    title: 'El robot tardó demasiado en mover',
    fix: 'Revisa que el carro se mueva libre y verifica el tablero antes de seguir.',
    blocking: true,
  },
  DEVICE_OFFLINE: {
    title: 'Un dispositivo está desconectado',
    fix: 'Abre Diagnóstico para ver cuál y comprueba su alimentación.',
    blocking: true,
  },
  MQTT_DISCONNECTED: {
    title: 'Se perdió la conexión con el broker',
    fix: 'La API reconecta sola. Si pasa de un minuto, reinicia el broker.',
    blocking: false,
  },
  EMERGENCY_STOP_ACTIVE: {
    title: 'Parada de emergencia activa',
    fix: 'Libera el botón de parada del tablero y verifica las piezas antes de reanudar.',
    blocking: true,
  },
};

export function errorCopy(code: string): ErrorCopy {
  return (
    COPY[code] ?? {
      title: 'Error del sistema',
      fix: `Código ${code}. Anótalo y revisa Diagnóstico.`,
      blocking: false,
    }
  );
}
