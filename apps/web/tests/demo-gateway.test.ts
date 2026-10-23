import { describe, expect, it } from 'vitest';
import { DemoGateway } from '../src/services/demo/demo-gateway';
import type { ServerMessage } from '../src/types/events';
import type { GameSnapshot, NewGameRequest } from '../src/types/game';

const request: NewGameRequest = { mode: 'human-vs-robot', humanColor: 'w', masterId: 'capablanca', elo: 800, minutes: null, incrementSeconds: 0, commentary: false };

function start() {
  const gateway = new DemoGateway();
  const messages: ServerMessage[] = [];
  const stop = gateway.connect({ onState: () => undefined, onMessage: (m) => messages.push(m) });
  const snapshots = () => messages.filter((m): m is Extract<ServerMessage, { type: 'game.snapshot' }> => m.type === 'game.snapshot').map((m) => m.data);
  const until = async (test: (s: GameSnapshot) => boolean, ms = 12000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const s = snapshots().at(-1);
      if (s && test(s)) return s;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('tiempo agotado esperando el estado');
  };
  return { gateway, messages, snapshots, until, stop };
}

describe('simulador', () => {
  it('juega un turno completo: valida, piensa, mueve el imán y confirma', async () => {
    const t = start();
    await t.gateway.createGame(request);
    const ready = await t.until((s) => s.phase === 'WAITING_FOR_HUMAN');
    expect(Object.keys(ready.legalTargets)).toHaveLength(10); // 8 peones + 2 caballos
    await t.gateway.requestMove({ from: 'e2', to: 'e4' });
    await t.until((s) => s.moves.length === 2 && s.phase === 'WAITING_FOR_HUMAN');
    const motion = t.messages.filter((m) => m.type === 'motion.progress');
    expect(motion.length).toBeGreaterThan(5);
    expect(motion.some((m) => m.data.phase === 'carrying' && m.data.magnet)).toBe(true);
    expect(motion.at(-1)?.data.status).toBe('completed');
    t.stop();
  }, 20000);

  it('rechaza una jugada ilegal sin cambiar la posición', async () => {
    const t = start();
    await t.gateway.createGame(request);
    await t.until((s) => s.phase === 'WAITING_FOR_HUMAN');
    await t.gateway.requestMove({ from: 'e2', to: 'e5' });
    expect(t.messages.some((m) => m.type === 'system.error' && m.data.code === 'INVALID_MOVE')).toBe(true);
    expect(t.snapshots().at(-1)?.moves).toHaveLength(0);
    t.stop();
  });

  it('entra en recuperación ante una discrepancia y sale al verificar', async () => {
    const t = start();
    await t.gateway.createGame(request);
    await t.until((s) => s.phase === 'WAITING_FOR_HUMAN');
    t.gateway.injectFault();
    const bad = await t.until((s) => s.phase === 'RECOVERY_REQUIRED');
    expect(bad.errorCode).toBe('BOARD_STATE_MISMATCH');
    await t.gateway.verifyBoard();
    await t.until((s) => s.phase === 'WAITING_FOR_HUMAN');
    t.stop();
  });

  it('termina la partida al rendirse', async () => {
    const t = start();
    await t.gateway.createGame(request);
    await t.until((s) => s.phase === 'WAITING_FOR_HUMAN');
    await t.gateway.resign();
    const end = await t.until((s) => s.phase === 'GAME_OVER');
    expect(end.result).toEqual({ winner: 'b', reason: 'resignation' });
    t.stop();
  });

  it('pide la pieza al coronar', async () => {
    const t = start();
    await t.gateway.createGame({ ...request, mode: 'two-humans' });
    await t.until((s) => s.phase === 'WAITING_FOR_HUMAN');
    const play = async (from: string, to: string) => {
      const n = t.snapshots().at(-1)!.moves.length;
      await t.gateway.requestMove({ from, to } as never);
      await t.until((s) => s.moves.length === n + 1 && s.phase === 'WAITING_FOR_HUMAN');
    };
    for (const [a, b] of [['a2', 'a4'], ['b7', 'b5'], ['a4', 'b5'], ['a7', 'a6'], ['b5', 'a6'], ['c7', 'c6'], ['a6', 'a7'], ['c6', 'c5']]) await play(a!, b!);
    await t.gateway.requestMove({ from: 'a7', to: 'b8' });
    const s = await t.until((x) => x.promotionRequired !== null);
    expect(s.promotionRequired).toEqual({ from: 'a7', to: 'b8' });
    t.stop();
  }, 20000);
});
