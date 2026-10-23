// Frontera entre la UI y "el sistema": la API real o el simulador. La UI solo conoce esta interfaz.
import type { Catalog } from '../types/catalog';
import type { GameSnapshot, MoveRequest, NewGameRequest } from '../types/game';
import type { ServerMessage } from '../types/events';
import * as api from './api-client';
import { RealtimeClient, type ConnectionState } from './realtime';
import { DemoGateway } from './demo/demo-gateway';

export interface GatewayHandlers {
  onState: (state: ConnectionState) => void;
  onMessage: (message: ServerMessage) => void;
}

export interface GameGateway {
  readonly kind: 'real' | 'demo';
  connect(handlers: GatewayHandlers): () => void;
  retry(): void;
  getCatalog(): Promise<Catalog>;
  getGame(): Promise<GameSnapshot | null>;
  createGame(request: NewGameRequest): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  reset(): Promise<void>;
  resign(): Promise<void>;
  stopMotion(): Promise<void>;
  requestMove(move: MoveRequest): Promise<void>;
  verifyBoard(): Promise<void>;
  home(): Promise<void>;
  /** Solo el simulador: provoca un fallo para ver los estados de error. */
  injectFault?(): void;
}

const done = <T,>(p: Promise<T>): Promise<void> => p.then(() => undefined);

export class RealGateway implements GameGateway {
  readonly kind = 'real' as const;
  private client: RealtimeClient | null = null;

  connect(handlers: GatewayHandlers): () => void {
    this.client = new RealtimeClient({
      onState: handlers.onState,
      onMessage: handlers.onMessage,
      onOpen: () => {
        // Siempre se pide una instantánea al abrir: nunca se asume que se recibieron todos los eventos.
        void api.getGame().then((game) => {
          if (game) handlers.onMessage({ type: 'game.snapshot', data: game });
        }).catch(() => undefined);
        void api.getStatus().then((devices) => handlers.onMessage({ type: 'devices.status', data: devices })).catch(() => undefined);
      },
    });
    this.client.start();
    return () => this.client?.stop();
  }
  retry = () => this.client?.retry();
  getCatalog = () => api.getCatalog();
  getGame = () => api.getGame();
  createGame = (r: NewGameRequest) => done(api.createGame(r));
  pause = () => done(api.pauseGame());
  resume = () => done(api.resumeGame());
  reset = () => done(api.resetGame());
  resign = () => done(api.resignGame());
  stopMotion = () => done(api.stopMotion());
  requestMove = (m: MoveRequest) => done(api.requestMove(m));
  verifyBoard = () => done(api.verifyBoard());
  home = () => done(api.homeMotion());
}

export function createGateway(kind: 'real' | 'demo'): GameGateway {
  return kind === 'demo' ? new DemoGateway() : new RealGateway();
}
