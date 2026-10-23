// Toda la comunicación HTTP vive aquí (softwarerules §6.5). Las respuestas se validan en tiempo de ejecución.
import { z } from 'zod';
import { gameSnapshotSchema, type GameSnapshot, type MoveRequest, type NewGameRequest } from '../types/game';
import { catalogSchema, type Catalog } from '../types/catalog';
import { deviceStatusSchema, type DeviceStatus } from '../types/events';

export const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const errorBodySchema = z.object({ code: z.string().optional(), message: z.string().optional() });

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const parsed = errorBodySchema.safeParse(body);
      throw new ApiError(parsed.success ? (parsed.data.message ?? res.statusText) : res.statusText, res.status, parsed.success ? (parsed.data.code ?? null) : null);
    }
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') throw new ApiError('La API no respondió a tiempo', 0, 'TIMEOUT');
    if (err instanceof z.ZodError) throw new ApiError('La API respondió con un formato no reconocido', 0, 'BAD_CONTRACT');
    throw new ApiError('No se pudo conectar con la API', 0, 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

const ack = z.object({ ok: z.boolean().optional() }).passthrough();
const post = (path: string, body?: unknown) =>
  request(path, ack, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

// Endpoints de softwarerules §7.1.
export const getStatus = (): Promise<DeviceStatus[]> => request('/api/v1/status', z.array(deviceStatusSchema));
export const getGame = (): Promise<GameSnapshot | null> => request('/api/v1/game', gameSnapshotSchema.nullable());
export const createGame = (req: NewGameRequest) => post('/api/v1/games', req);
export const pauseGame = () => post('/api/v1/game/pause');
export const resumeGame = () => post('/api/v1/game/resume');
export const resetGame = () => post('/api/v1/game/reset');
export const stopMotion = () => post('/api/v1/motion/stop');

// Propuestos (aún no están en §7.1; ver contracts/http/web-requirements.md).
export const getCatalog = (): Promise<Catalog> => request('/api/v1/catalog', catalogSchema);
export const requestMove = (move: MoveRequest) => post('/api/v1/game/move', move);
export const resignGame = () => post('/api/v1/game/resign');
export const verifyBoard = () => post('/api/v1/board/verify');
export const homeMotion = () => post('/api/v1/motion/home');
