import type { Catalog } from '../../types/catalog';

// Catálogo del simulador. En producción lo entrega la API (GET /api/v1/catalog).
export const DEMO_CATALOG: Catalog = {
  schemaVersion: 1,
  defaultMasterId: 'capablanca',
  defaultElo: 1500,
  masters: [
    { id: 'capablanca', name: 'Capablanca', style: 'Claro, limpio y sin riesgos innecesarios.', hue: 205, emblem: 'k' },
    { id: 'tal', name: 'Tal', style: 'Sacrifica piezas para enredar la partida.', hue: 8, emblem: 'n' },
    { id: 'petrosian', name: 'Petrosian', style: 'Levanta un muro y espera tu error.', hue: 160, emblem: 'r' },
    { id: 'morphy', name: 'Morphy', style: 'Desarrolla rápido y ataca el centro.', hue: 275, emblem: 'b' },
    { id: 'fischer', name: 'Fischer', style: 'Directo, exacto y sin concesiones.', hue: 38, emblem: 'q' },
  ],
  difficulties: [
    { id: 'principiante', label: 'Principiante', elo: 800, hint: 'Comete errores a la vista.' },
    { id: 'aficionado', label: 'Aficionado', elo: 1200, hint: 'Ve amenazas simples.' },
    { id: 'club', label: 'Club', elo: 1500, hint: 'Un rival de club, regular.' },
    { id: 'avanzado', label: 'Avanzado', elo: 1800, hint: 'Castiga las imprecisiones.' },
    { id: 'experto', label: 'Experto', elo: 2100, hint: 'Pocas oportunidades de ganar.' },
    { id: 'maestro', label: 'Maestro', elo: 2400, hint: 'Juego de nivel de torneo.' },
  ],
};

export const DEMO_COMMENTS: Record<string, { open: string[]; capture: string[]; check: string[]; win: string; lose: string; draw: string }> = {
  capablanca: {
    open: ['Desarrollo simple y centro firme.', 'La posición pide orden antes que prisa.', 'Cambiar piezas me favorece.'],
    capture: ['Un cambio limpio. Sigo con ventaja de estructura.', 'Tomo y simplifico.'],
    check: ['Jaque. Sin adornos.'],
    win: 'Una partida ordenada. Gracias por jugarla.',
    lose: 'Bien jugado. Encontraste el plan correcto.',
    draw: 'Tablas. La posición estaba equilibrada.',
  },
  tal: {
    open: ['Aquí hay algo en el aire…', 'Compliquemos esto un poco.', 'Una pieza por el ataque, ¿por qué no?'],
    capture: ['¡Capturo! Veamos si sobrevives al ataque.', 'Material por iniciativa.'],
    check: ['¡Jaque! Y esto apenas empieza.'],
    win: 'El caos tenía razón.',
    lose: 'Me defendiste mejor de lo que esperaba.',
    draw: 'Tablas. Quedó demasiado tranquila para mi gusto.',
  },
  petrosian: {
    open: ['Primero seguridad. Luego, veremos.', 'Cierro la posición. Paciencia.', 'Tu ataque no tiene por dónde entrar.'],
    capture: ['Tomo. Mi estructura sigue intacta.'],
    check: ['Jaque. Necesario, no brillante.'],
    win: 'La defensa fue suficiente.',
    lose: 'Rompiste el muro. Bien hecho.',
    draw: 'Tablas. Nadie cedió terreno.',
  },
  morphy: {
    open: ['¡Piezas al centro, rápido!', 'El desarrollo lo es todo.', 'Abramos líneas.'],
    capture: ['Capturo y mantengo la iniciativa.'],
    check: ['¡Jaque! El rey sigue en el centro.'],
    win: 'Ataque directo. Así se juega.',
    lose: 'Me alcanzaste el rey a tiempo. Bien jugado.',
    draw: 'Tablas. Esperaba más fuego.',
  },
  fischer: {
    open: ['La mejor jugada suele ser la más directa.', 'Preciso y sin dudar.', 'Presión constante.'],
    capture: ['Tomo. Es lo correcto.'],
    check: ['Jaque.'],
    win: 'Sin comentarios. El tablero habló.',
    lose: 'Buena partida. Revísala.',
    draw: 'Tablas. No estoy conforme.',
  },
};
