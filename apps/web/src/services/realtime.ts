// Conexión WebSocket con reconexión limitada y validación de cada mensaje (softwarerules §7.2, §10.2).
import { serverMessageSchema, type ServerMessage } from '../types/events';
import { API_BASE } from './api-client';

export type ConnectionState = 'connecting' | 'online' | 'reconnecting' | 'offline';

export interface RealtimeHandlers {
  onState: (state: ConnectionState) => void;
  onMessage: (message: ServerMessage) => void;
  /** Se llama en cada apertura. La UI debe pedir una instantánea: no sabe qué eventos se perdió. */
  onOpen: (isReconnect: boolean) => void;
}

const MAX_ATTEMPTS = 8;

function wsUrl(): string {
  const path = '/ws';
  if (API_BASE) return API_BASE.replace(/^http/, 'ws') + path;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${path}`;
}

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private attempts = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private hasOpened = false;

  constructor(private readonly handlers: RealtimeHandlers) {}

  start(): void {
    this.closed = false;
    this.attempts = 0;
    this.open();
  }

  /** Reintento manual después de que se agotaron los automáticos. */
  retry(): void {
    this.attempts = 0;
    this.open();
  }

  stop(): void {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    this.socket?.close();
    this.socket = null;
  }

  private open(): void {
    this.handlers.onState(this.hasOpened ? 'reconnecting' : 'connecting');
    let socket: WebSocket;
    try {
      socket = new WebSocket(wsUrl());
    } catch {
      this.scheduleRetry();
      return;
    }
    this.socket = socket;
    socket.onopen = () => {
      const isReconnect = this.hasOpened;
      this.hasOpened = true;
      this.attempts = 0;
      this.handlers.onState('online');
      this.handlers.onOpen(isReconnect);
    };
    socket.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== 'string') return;
      let json: unknown;
      try {
        json = JSON.parse(event.data);
      } catch {
        return;
      }
      const parsed = serverMessageSchema.safeParse(json);
      if (parsed.success) this.handlers.onMessage(parsed.data);
    };
    socket.onclose = () => {
      if (!this.closed) this.scheduleRetry();
    };
    socket.onerror = () => socket.close();
  }

  private scheduleRetry(): void {
    if (this.closed) return;
    this.attempts += 1;
    if (this.attempts > MAX_ATTEMPTS) {
      this.handlers.onState('offline');
      return;
    }
    this.handlers.onState('reconnecting');
    const delay = Math.min(500 * 2 ** (this.attempts - 1), 10_000);
    this.timer = setTimeout(() => this.open(), delay);
  }
}
