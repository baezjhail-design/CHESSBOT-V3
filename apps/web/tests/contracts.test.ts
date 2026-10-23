import { describe, expect, it } from 'vitest';
import { gameSnapshotSchema } from '../src/types/game';
import { serverMessageSchema } from '../src/types/events';
import { errorCopy } from '../src/types/errors';
import { capturedBy, resultText } from '../src/features/game/game-helpers';
import { formatClock } from '../src/hooks/useClock';

const snapshot = {
  schemaVersion: 1,
  gameId: 'g1',
  revision: 3,
  phase: 'WAITING_FOR_HUMAN',
  mode: 'human-vs-robot',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  humanColor: 'w',
  moves: [],
  clocks: { w: 600000, b: 600000, running: 'w', at: 1 },
  opponent: { masterId: 'capablanca', elo: 1500 },
  result: null,
};

describe('contratos', () => {
  it('acepta un snapshot válido y completa los valores por defecto', () => {
    const parsed = gameSnapshotSchema.parse(snapshot);
    expect(parsed.legalTargets).toEqual({});
    expect(parsed.promotionRequired).toBeNull();
  });
  it('rechaza una fase desconocida y una versión no soportada', () => {
    expect(gameSnapshotSchema.safeParse({ ...snapshot, phase: 'MAGIA' }).success).toBe(false);
    expect(gameSnapshotSchema.safeParse({ ...snapshot, schemaVersion: 2 }).success).toBe(false);
  });
  it('rechaza casillas fuera de rango', () => {
    expect(gameSnapshotSchema.safeParse({ ...snapshot, legalTargets: { z9: ['e4'] } }).success).toBe(false);
  });
  it('valida los mensajes del WebSocket por tipo', () => {
    expect(serverMessageSchema.safeParse({ type: 'game.snapshot', data: snapshot }).success).toBe(true);
    expect(serverMessageSchema.safeParse({ type: 'desconocido', data: {} }).success).toBe(false);
    expect(serverMessageSchema.safeParse({ type: 'system.error', data: { code: 'X' } }).success).toBe(false);
  });
});

describe('textos', () => {
  it('cada código de error conocido explica qué hacer', () => {
    for (const code of ['SENSOR_READ_FAILED', 'BOARD_STATE_MISMATCH', 'MOTION_TIMEOUT', 'EMERGENCY_STOP_ACTIVE']) {
      const c = errorCopy(code);
      expect(c.title.length).toBeGreaterThan(5);
      expect(c.fix.length).toBeGreaterThan(10);
    }
    expect(errorCopy('NO_EXISTE').fix).toContain('NO_EXISTE');
  });
  it('formatea el reloj', () => {
    expect(formatClock(600000)).toBe('10:00');
    expect(formatClock(65000)).toBe('1:05');
    expect(formatClock(9400)).toBe('0:09.4');
    expect(formatClock(null)).toBe('—');
  });
  it('calcula material capturado y el resultado desde el punto de vista de la persona', () => {
    const moves = [
      { san: 'exd5', from: 'e4', to: 'd5', color: 'w', piece: 'p', captured: 'p', check: false },
      { san: 'Qxd5', from: 'd8', to: 'd5', color: 'b', piece: 'q', captured: 'p', check: false },
      { san: 'Nxd5', from: 'c3', to: 'd5', color: 'w', piece: 'n', captured: 'q', check: false },
    ] as never;
    const c = capturedBy(moves);
    expect(c.w).toEqual(['q', 'p']);
    expect(c.diff).toBe(9);
    const snap = gameSnapshotSchema.parse(snapshot);
    expect(resultText({ winner: 'w', reason: 'checkmate' }, snap).title).toBe('Ganaste');
    expect(resultText({ winner: 'b', reason: 'timeout' }, snap).title).toBe('Perdiste');
    expect(resultText({ winner: 'draw', reason: 'stalemate' }, snap).title).toBe('Tablas');
  });
});
