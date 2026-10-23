// Simulador del sistema completo (API + núcleo + robot). Permite usar y enseñar la interfaz sin hardware.
// Hace lo que haría el núcleo C++: valida, decide, planifica y confirma. La UI nunca lo hace.
import { Chess, type Move } from 'chess.js';
import type { GameGateway, GatewayHandlers } from '../gateway';
import type { Catalog } from '../../types/catalog';
import type { Color, GameResult, GameSnapshot, MoveRecord, MoveRequest, NewGameRequest, PieceType, Square } from '../../types/game';
import type { DeviceStatus, Point, ServerMessage } from '../../types/events';
import { DEMO_CATALOG, DEMO_COMMENTS } from './catalog';
import { chooseMove } from './engine';
import { alleyPath, pathLength, pointAlong, squareCenter } from './alley-path';

const HOME: Point = [0, 8];
const SPEED = 5; // casillas por segundo
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]!;

export class DemoGateway implements GameGateway {
  readonly kind = 'demo' as const;

  private handlers: GatewayHandlers | null = null;
  private game = new Chess();
  private request: NewGameRequest | null = null;
  private humanColor: Color | null = null;
  private revision = 0;
  private gameId = '';
  private generation = 0;
  private phase: GameSnapshot['phase'] = 'IDLE';
  private paused = false;
  private pausedFrom: GameSnapshot['phase'] = 'WAITING_FOR_HUMAN';
  private result: GameResult | null = null;
  private promotion: { from: Square; to: Square } | null = null;
  private errorCode: string | null = null;
  private fault: Square[] = [];
  private carriage: Point = HOME;
  private liftedSquare: Square | null = null;
  private remaining: { w: number | null; b: number | null } = { w: null, b: null };
  private running: Color | null = null;
  private clockAt = Date.now();
  private timers: ReturnType<typeof setInterval>[] = [];

  // ── Conexión ────────────────────────────────────────────────────────────────
  connect(handlers: GatewayHandlers): () => void {
    this.handlers = handlers;
    handlers.onState('connecting');
    const boot = setTimeout(() => {
      handlers.onState('online');
      this.emitDevices();
      this.emitSensors();
      if (this.request) this.emitSnapshot();
    }, 350);
    this.timers.push(
      setInterval(() => this.emitDevices(), 2500),
      setInterval(() => this.emitSensors(), 1000),
      setInterval(() => this.tickClock(), 250),
    );
    return () => {
      clearTimeout(boot);
      this.timers.forEach(clearInterval);
      this.timers = [];
      this.generation += 1;
      this.handlers = null;
    };
  }
  retry(): void {
    this.handlers?.onState('online');
  }

  // ── Consultas ───────────────────────────────────────────────────────────────
  async getCatalog(): Promise<Catalog> {
    await sleep(120);
    return DEMO_CATALOG;
  }
  async getGame(): Promise<GameSnapshot | null> {
    return this.request ? this.snapshot() : null;
  }

  // ── Comandos ────────────────────────────────────────────────────────────────
  async createGame(request: NewGameRequest): Promise<void> {
    this.generation += 1;
    const gen = this.generation;
    this.request = request;
    this.game = new Chess();
    this.gameId = `demo-${Date.now().toString(36)}`;
    this.revision = 0;
    this.result = null;
    this.promotion = null;
    this.errorCode = null;
    this.fault = [];
    this.paused = false;
    this.liftedSquare = null;
    this.carriage = HOME;
    this.humanColor = request.mode === 'robot-demo' ? null : request.mode === 'two-humans' ? 'w' : request.humanColor === 'random' ? pick<Color>(['w', 'b']) : request.humanColor;
    const ms = request.minutes === null ? null : request.minutes * 60_000;
    this.remaining = { w: ms, b: ms };
    this.running = null;
    this.clockAt = Date.now();
    this.phase = 'READY';
    this.emitSnapshot();
    await sleep(500);
    if (gen !== this.generation) return;
    this.startClock('w');
    this.afterMove(gen);
  }

  async pause(): Promise<void> {
    if (this.paused || !this.request || this.result) return;
    this.settleClock();
    this.paused = true;
    this.pausedFrom = this.phase;
    this.phase = 'PAUSED';
    this.emitSnapshot();
  }
  async resume(): Promise<void> {
    if (!this.paused) return;
    this.paused = false;
    this.phase = this.pausedFrom;
    this.clockAt = Date.now();
    this.emitSnapshot();
  }
  async reset(): Promise<void> {
    this.generation += 1;
    this.request = null;
    this.game = new Chess();
    this.phase = 'IDLE';
    this.running = null;
    this.paused = false;
    this.fault = [];
    this.send({ type: 'game.snapshot', data: { ...this.snapshot(), phase: 'IDLE', moves: [], fen: this.game.fen() } });
  }
  async resign(): Promise<void> {
    if (!this.request || this.result) return;
    const loser = this.humanColor ?? this.game.turn();
    this.finish({ winner: other(loser), reason: 'resignation' });
  }
  async stopMotion(): Promise<void> {
    this.generation += 1;
    this.errorCode = 'EMERGENCY_STOP_ACTIVE';
    this.phase = 'RECOVERY_REQUIRED';
    this.settleClock();
    this.liftedSquare = null;
    this.send({
      type: 'motion.progress',
      data: { commandId: 'stop', status: 'cancelled', from: 'a1', to: 'a1', phase: 'returning', waypoints: [], position: this.carriage, magnet: false, errorCode: null },
    });
    this.emitSnapshot();
    this.send({ type: 'system.error', data: { code: 'EMERGENCY_STOP_ACTIVE', severity: 'error', correlationId: null, at: Date.now() } });
  }
  async verifyBoard(): Promise<void> {
    await sleep(700);
    this.fault = [];
    this.errorCode = null;
    if (this.phase !== 'RECOVERY_REQUIRED' || !this.request) {
      this.emitSensors();
      return;
    }
    this.generation += 1;
    this.phase = 'WAITING_FOR_HUMAN';
    this.clockAt = Date.now();
    this.afterMove(this.generation);
  }
  async home(): Promise<void> {
    await this.travel([this.carriage, HOME], false, 'a1', 'a1', 'returning', 'home', this.generation);
  }
  injectFault(): void {
    if (!this.request || this.result) return;
    const squares: Square[] = ['e4', 'd5'];
    this.generation += 1;
    this.fault = squares;
    this.errorCode = 'BOARD_STATE_MISMATCH';
    this.settleClock();
    this.phase = 'RECOVERY_REQUIRED';
    this.emitSnapshot();
    this.emitSensors();
    this.send({ type: 'system.error', data: { code: 'BOARD_STATE_MISMATCH', severity: 'error', correlationId: `cmd-${this.revision}`, at: Date.now() } });
  }

  async requestMove(move: MoveRequest): Promise<void> {
    if (!this.request || this.result || this.paused || this.phase !== 'WAITING_FOR_HUMAN') return;
    const candidates = this.game.moves({ verbose: true }).filter((m) => m.from === move.from && m.to === move.to);
    if (candidates.length === 0) {
      this.send({ type: 'system.error', data: { code: 'INVALID_MOVE', severity: 'warning', correlationId: null, at: Date.now() } });
      return;
    }
    if (candidates.some((m) => m.promotion) && !move.promotion) {
      this.promotion = { from: move.from, to: move.to };
      this.emitSnapshot();
      return;
    }
    const gen = this.generation;
    this.promotion = null;
    this.phase = 'VALIDATING_HUMAN_MOVE';
    this.emitSnapshot();
    await sleep(260);
    if (gen !== this.generation) return;
    this.applyMove(this.game.move({ from: move.from, to: move.to, promotion: move.promotion }));
    this.afterMove(gen);
  }

  // ── Flujo de la partida ─────────────────────────────────────────────────────
  private afterMove(gen: number): void {
    if (gen !== this.generation) return;
    if (this.checkEnd()) return;
    const turn = this.game.turn();
    this.startClock(turn);
    const robotMoves = this.request?.mode === 'robot-demo' || (this.request?.mode === 'human-vs-robot' && turn !== this.humanColor);
    if (robotMoves) {
      void this.robotTurn(gen);
    } else {
      this.phase = 'WAITING_FOR_HUMAN';
      this.emitSnapshot();
    }
  }

  private async robotTurn(gen: number): Promise<void> {
    const request = this.request;
    if (!request) return;
    this.phase = 'THINKING';
    this.emitSnapshot();
    await this.wait(700 + Math.random() * 900, gen);
    if (gen !== this.generation) return;
    const chosen = chooseMove(this.game, request.elo);
    if (!chosen) return;
    this.phase = 'PLANNING_ROBOT_MOVE';
    this.emitSnapshot();
    await this.wait(350, gen);
    if (gen !== this.generation) return;
    this.phase = 'EXECUTING_ROBOT_MOVE';
    this.emitSnapshot();
    const commandId = `cmd-${this.revision + 1}`;
    this.liftedSquare = chosen.from;
    const ok =
      (await this.travel([this.carriage, squareCenter(chosen.from)], false, chosen.from, chosen.to, 'seeking', commandId, gen)) &&
      (await this.travel(alleyPath(chosen.from, chosen.to), true, chosen.from, chosen.to, 'carrying', commandId, gen));
    this.liftedSquare = null;
    if (!ok || gen !== this.generation) return;
    this.send({
      type: 'motion.progress',
      data: { commandId, status: 'completed', from: chosen.from, to: chosen.to, phase: 'carrying', waypoints: [], position: this.carriage, magnet: false, errorCode: null },
    });
    const san = this.game.move(chosen);
    this.applyMove(san);
    this.speak(san, request);
    await this.wait(request.mode === 'robot-demo' ? 900 : 200, gen);
    this.afterMove(gen);
  }

  /** Mueve el imán por una ruta emitiendo progreso. Devuelve `false` si se canceló. */
  private async travel(path: Point[], magnet: boolean, from: Square, to: Square, phase: 'seeking' | 'carrying' | 'returning', commandId: string, gen: number): Promise<boolean> {
    const total = pathLength(path);
    const duration = Math.max(250, (total / SPEED) * 1000);
    const start = performance.now();
    while (true) {
      await sleep(50);
      if (gen !== this.generation) return false;
      if (this.paused) continue;
      const f = Math.min((performance.now() - start) / duration, 1);
      this.carriage = pointAlong(path, f);
      this.send({
        type: 'motion.progress',
        data: { commandId, status: 'running', from, to, phase, waypoints: path, position: this.carriage, magnet, errorCode: null },
      });
      if (f >= 1) return true;
    }
  }

  private async wait(ms: number, gen: number): Promise<void> {
    let left = ms;
    while (left > 0 && gen === this.generation) {
      await sleep(Math.min(left, 100));
      if (!this.paused) left -= 100;
    }
  }

  private applyMove(move: Move): void {
    this.revision += 1;
    if (this.running) this.settleClock();
    const inc = (this.request?.incrementSeconds ?? 0) * 1000;
    if (inc && this.remaining[move.color] !== null) this.remaining[move.color] = (this.remaining[move.color] ?? 0) + inc;
    this.emitSnapshot();
  }

  private checkEnd(): boolean {
    const g = this.game;
    if (g.isCheckmate()) return this.finish({ winner: other(g.turn()), reason: 'checkmate' });
    if (g.isStalemate()) return this.finish({ winner: 'draw', reason: 'stalemate' });
    if (g.isInsufficientMaterial()) return this.finish({ winner: 'draw', reason: 'insufficient' });
    if (g.isThreefoldRepetition()) return this.finish({ winner: 'draw', reason: 'repetition' });
    if (g.isDrawByFiftyMoves()) return this.finish({ winner: 'draw', reason: 'fifty-move' });
    return false;
  }

  private finish(result: GameResult): true {
    this.generation += 1;
    this.settleClock();
    this.running = null;
    this.result = result;
    this.phase = 'GAME_OVER';
    this.emitSnapshot();
    const request = this.request;
    if (request?.commentary && request.mode === 'human-vs-robot') {
      const lines = DEMO_COMMENTS[request.masterId] ?? DEMO_COMMENTS['capablanca']!;
      const robot = other(this.humanColor ?? 'w');
      const text = result.winner === 'draw' ? lines.draw : result.winner === robot ? lines.win : lines.lose;
      this.send({ type: 'game.commentary', data: { id: `c-${Date.now()}`, masterId: request.masterId, text, at: Date.now() } });
    }
    return true;
  }

  private speak(move: Move, request: NewGameRequest): void {
    if (!request.commentary || request.mode !== 'human-vs-robot') return;
    const lines = DEMO_COMMENTS[request.masterId] ?? DEMO_COMMENTS['capablanca']!;
    let text: string | null = null;
    if (this.game.isCheck()) text = pick(lines.check);
    else if (move.captured) text = pick(lines.capture);
    else if (this.game.history().length < 12 && Math.random() < 0.55) text = pick(lines.open);
    if (text) this.send({ type: 'game.commentary', data: { id: `c-${Date.now()}`, masterId: request.masterId, text, at: Date.now() } });
  }

  // ── Reloj ───────────────────────────────────────────────────────────────────
  private startClock(color: Color): void {
    this.settleClock();
    this.running = this.remaining[color] === null ? null : color;
    this.clockAt = Date.now();
  }
  private settleClock(): void {
    const now = Date.now();
    if (this.running && !this.paused) {
      const left = this.remaining[this.running];
      if (left !== null) this.remaining[this.running] = Math.max(0, left - (now - this.clockAt));
    }
    this.clockAt = now;
  }
  private tickClock(): void {
    if (!this.running || this.paused || this.result) return;
    const left = (this.remaining[this.running] ?? 0) - (Date.now() - this.clockAt);
    if (left <= 0) {
      this.remaining[this.running] = 0;
      this.finish({ winner: other(this.running), reason: 'timeout' });
    }
  }

  // ── Mensajes hacia la UI ────────────────────────────────────────────────────
  private snapshot(): GameSnapshot {
    const history = this.game.history({ verbose: true });
    const moves: MoveRecord[] = history.map((m) => ({
      san: m.san,
      from: m.from,
      to: m.to,
      color: m.color,
      piece: m.piece as PieceType,
      captured: (m.captured as PieceType | undefined) ?? null,
      promotion: (m.promotion as PieceType | undefined) ?? null,
      check: m.san.includes('+') || m.san.includes('#'),
    }));
    const request = this.request;
    const humanTurn = this.phase === 'WAITING_FOR_HUMAN' && !this.paused && !this.promotion;
    const legalTargets: Record<string, string[]> = {};
    if (humanTurn) for (const m of this.game.moves({ verbose: true })) (legalTargets[m.from] ??= []).push(m.to);
    const now = Date.now();
    const live = (c: Color): number | null => {
      const v = this.remaining[c];
      return v !== null && this.running === c && !this.paused ? Math.max(0, v - (now - this.clockAt)) : v;
    };
    return {
      schemaVersion: 1,
      gameId: this.gameId,
      revision: this.revision,
      phase: this.phase,
      mode: request?.mode ?? 'human-vs-robot',
      fen: this.game.fen(),
      turn: this.game.turn(),
      humanColor: this.humanColor,
      moves,
      clocks: { w: live('w'), b: live('b'), running: this.running, at: now },
      opponent: request && request.mode === 'human-vs-robot' ? { masterId: request.masterId, elo: request.elo } : request?.mode === 'robot-demo' ? { masterId: request.masterId, elo: request.elo } : null,
      legalTargets,
      promotionRequired: this.promotion,
      result: this.result,
      errorCode: this.errorCode,
    } as GameSnapshot;
  }

  private emitSnapshot(): void {
    this.send({ type: 'game.snapshot', data: this.snapshot() });
    this.emitSensors();
  }

  private emitSensors(): void {
    const occupied: Square[] = [];
    for (const row of this.game.board()) for (const cell of row) if (cell && cell.square !== this.liftedSquare) occupied.push(cell.square);
    const shown = this.fault.length ? occupied.filter((s) => s !== this.fault[0]).concat(this.fault[1] && !occupied.includes(this.fault[1]) ? [this.fault[1]] : []) : occupied;
    this.send({ type: 'sensors.observation', data: { occupied: shown, lifted: this.liftedSquare, mismatches: this.fault, at: Date.now() } });
  }

  private emitDevices(): void {
    const now = Date.now();
    const jitter = (base: number) => Math.round(base + Math.random() * 6);
    const devices: DeviceStatus[] = [
      { id: 'api-01', kind: 'api', state: 'online', lastSeen: now, latencyMs: jitter(4), firmware: null },
      { id: 'mosquitto', kind: 'mqtt', state: 'online', lastSeen: now, latencyMs: jitter(7), firmware: '2.0.18' },
      { id: 'chess-core', kind: 'core', state: 'online', lastSeen: now, latencyMs: jitter(11), firmware: '0.3.1' },
      { id: 'sensor-esp32-01', kind: 'sensors', state: this.fault.length ? 'degraded' : 'online', lastSeen: now, latencyMs: jitter(18), firmware: '1.2.0' },
      { id: 'motor-esp32-01', kind: 'motors', state: 'online', lastSeen: now, latencyMs: jitter(22), firmware: '1.1.4' },
      { id: 'engine', kind: 'engine', state: 'online', lastSeen: now, latencyMs: jitter(9), firmware: 'sim-0.1' },
    ];
    this.send({ type: 'devices.status', data: devices });
  }

  private send(message: ServerMessage): void {
    this.handlers?.onMessage(message);
  }
}
