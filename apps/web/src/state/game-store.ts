import { create } from 'zustand';
import type { Catalog } from '../types/catalog';
import type { Commentary, DeviceStatus, ErrorEvent, MotionEvent, SensorObservation, ServerMessage } from '../types/events';
import type { GameSnapshot, MoveRequest, NewGameRequest } from '../types/game';
import { ApiError } from '../services/api-client';
import { createGateway, type GameGateway } from '../services/gateway';
import type { ConnectionState } from '../services/realtime';
import type { Source } from './prefs-store';

export interface LogEntry {
  at: number;
  kind: string;
  text: string;
}

interface GameStore {
  gateway: GameGateway | null;
  connection: ConnectionState;
  catalog: Catalog | null;
  snapshot: GameSnapshot | null;
  /** Cuándo llegó el snapshot a este navegador: base del reloj, sin depender de la hora del servidor. */
  snapshotAt: number;
  motion: MotionEvent | null;
  devices: DeviceStatus[];
  sensors: SensorObservation | null;
  commentary: Commentary | null;
  errors: ErrorEvent[];
  log: LogEntry[];
  /** Operación enviada y aún sin confirmar. */
  pending: string | null;

  boot: (source: Source) => () => void;
  retry: () => void;
  dispatch: (message: ServerMessage) => void;
  dismissError: (at: number) => void;
  run: (label: string, action: (gateway: GameGateway) => Promise<void>) => Promise<boolean>;
  createGame: (request: NewGameRequest) => Promise<boolean>;
  requestMove: (move: MoveRequest) => Promise<boolean>;
}

const MAX_LOG = 80;

function describe(message: ServerMessage): LogEntry {
  const at = Date.now();
  switch (message.type) {
    case 'game.snapshot':
      return { at, kind: 'partida', text: `Rev. ${message.data.revision} · ${message.data.phase} · ${message.data.moves.length} jugadas` };
    case 'motion.progress':
      return { at, kind: 'motor', text: `${message.data.status} ${message.data.phase} ${message.data.from}→${message.data.to} (${message.data.commandId})` };
    case 'devices.status':
      return { at, kind: 'dispositivos', text: `${message.data.filter((d) => d.state === 'online').length}/${message.data.length} en línea` };
    case 'sensors.observation':
      return { at, kind: 'sensores', text: `${message.data.occupied.length} piezas detectadas${message.data.mismatches.length ? ` · ${message.data.mismatches.length} discrepancias` : ''}` };
    case 'game.commentary':
      return { at, kind: 'maestro', text: message.data.text };
    case 'system.error':
      return { at, kind: 'error', text: `${message.data.code} (${message.data.severity})` };
  }
}

export const useGame = create<GameStore>((set, get) => ({
  gateway: null,
  connection: 'connecting',
  catalog: null,
  snapshot: null,
  snapshotAt: 0,
  motion: null,
  devices: [],
  sensors: null,
  commentary: null,
  errors: [],
  log: [],
  pending: null,

  boot: (source) => {
    const gateway = createGateway(source);
    set({ gateway, connection: 'connecting', snapshot: null, motion: null, devices: [], sensors: null, commentary: null, errors: [], log: [], pending: null });
    const disconnect = gateway.connect({
      onState: (connection) => set({ connection }),
      onMessage: (message) => get().dispatch(message),
    });
    gateway
      .getCatalog()
      .then((catalog) => set({ catalog }))
      .catch(() => undefined);
    return () => {
      disconnect();
      if (get().gateway === gateway) set({ gateway: null });
    };
  },

  retry: () => get().gateway?.retry(),

  dispatch: (message) => {
    set((s) => {
      const log = [describe(message), ...s.log].slice(0, MAX_LOG);
      switch (message.type) {
        case 'game.snapshot': {
          const incoming = message.data;
          // Un snapshot más viejo que el actual de la misma partida se descarta.
          if (s.snapshot && s.snapshot.gameId === incoming.gameId && incoming.revision < s.snapshot.revision) return { log };
          const finished = incoming.phase !== 'EXECUTING_ROBOT_MOVE';
          const newGame = !s.snapshot || s.snapshot.gameId !== incoming.gameId;
          return {
            snapshot: incoming,
            snapshotAt: Date.now(),
            log,
            pending: null,
            motion: finished ? null : s.motion,
            commentary: newGame ? null : s.commentary,
          };
        }
        case 'motion.progress': {
          const m = message.data;
          return { log: m.status === 'running' ? s.log : log, motion: m.status === 'running' || m.status === 'accepted' ? m : null };
        }
        case 'devices.status':
          return { devices: message.data };
        case 'sensors.observation':
          return { sensors: message.data };
        case 'game.commentary':
          return { log, commentary: message.data };
        case 'system.error':
          return { log, errors: [message.data, ...s.errors].slice(0, 12) };
      }
    });
  },

  dismissError: (at) => set((s) => ({ errors: s.errors.filter((e) => e.at !== at) })),

  run: async (label, action) => {
    const gateway = get().gateway;
    if (!gateway) return false;
    set({ pending: label });
    try {
      await action(gateway);
      // `pending` se limpia cuando llega el snapshot que confirma el resultado, no antes.
      window.setTimeout(() => {
        if (get().pending === label) set({ pending: null });
      }, 4000);
      return true;
    } catch (err) {
      const code = err instanceof ApiError ? (err.code ?? 'NETWORK') : 'NETWORK';
      get().dispatch({ type: 'system.error', data: { code: code === 'NETWORK' || code === 'TIMEOUT' ? 'DEVICE_OFFLINE' : code, severity: 'error', correlationId: null, at: Date.now() } });
      set({ pending: null });
      return false;
    }
  },

  createGame: (request) => get().run('createGame', (g) => g.createGame(request)),
  requestMove: (move) => get().run('move', (g) => g.requestMove(move)),
}));
