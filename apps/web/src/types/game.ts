import { z } from 'zod';

// Todo lo que llega por red es dato externo: se valida aunque TypeScript lo describa (softwarerules §6.7).

export const SCHEMA_VERSION = 1;

export const colorSchema = z.enum(['w', 'b']);
export type Color = z.infer<typeof colorSchema>;

export const squareSchema = z.string().regex(/^[a-h][1-8]$/);
export type Square = z.infer<typeof squareSchema>;

/** Estados de la máquina de estados del núcleo (softwarerules §9) más los previstos allí. */
export const gamePhaseSchema = z.enum([
  'IDLE',
  'READY',
  'WAITING_FOR_HUMAN',
  'VALIDATING_HUMAN_MOVE',
  'THINKING',
  'PLANNING_ROBOT_MOVE',
  'EXECUTING_ROBOT_MOVE',
  'RECOVERY_REQUIRED',
  'PAUSED',
  'GAME_OVER',
]);
export type GamePhase = z.infer<typeof gamePhaseSchema>;

export const pieceTypeSchema = z.enum(['p', 'n', 'b', 'r', 'q', 'k']);
export type PieceType = z.infer<typeof pieceTypeSchema>;

export const moveRecordSchema = z.object({
  san: z.string(),
  from: squareSchema,
  to: squareSchema,
  color: colorSchema,
  piece: pieceTypeSchema,
  captured: pieceTypeSchema.nullish(),
  promotion: pieceTypeSchema.nullish(),
  check: z.boolean().default(false),
});
export type MoveRecord = z.infer<typeof moveRecordSchema>;

export const gameResultSchema = z.object({
  winner: z.union([colorSchema, z.literal('draw')]),
  reason: z.enum(['checkmate', 'stalemate', 'timeout', 'resignation', 'insufficient', 'repetition', 'fifty-move', 'agreement']),
});
export type GameResult = z.infer<typeof gameResultSchema>;

export const clocksSchema = z.object({
  /** Milisegundos restantes. `null` = partida sin reloj. */
  w: z.number().nullable(),
  b: z.number().nullable(),
  running: colorSchema.nullable(),
  /** Marca de tiempo del servidor (ms epoch) en que se midieron los valores. */
  at: z.number(),
});
export type Clocks = z.infer<typeof clocksSchema>;

export const gameModeSchema = z.enum(['human-vs-robot', 'two-humans', 'robot-demo']);
export type GameMode = z.infer<typeof gameModeSchema>;

export const gameSnapshotSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  gameId: z.string(),
  /** Número creciente. Un snapshot con revisión menor que la actual se descarta. */
  revision: z.number().int().nonnegative(),
  phase: gamePhaseSchema,
  mode: gameModeSchema,
  fen: z.string(),
  turn: colorSchema,
  /** Color de la persona. `null` cuando no hay persona humana (demo robot contra robot). */
  humanColor: colorSchema.nullable(),
  moves: z.array(moveRecordSchema),
  clocks: clocksSchema,
  opponent: z.object({ masterId: z.string(), elo: z.number() }).nullable(),
  /** Destinos legales por casilla de origen, calculados por el núcleo (la UI no valida jugadas). */
  legalTargets: z.record(squareSchema, z.array(squareSchema)).default({}),
  /** Si hay una promoción pendiente, la UI debe preguntar la pieza. */
  promotionRequired: z.object({ from: squareSchema, to: squareSchema }).nullable().default(null),
  result: gameResultSchema.nullable(),
  errorCode: z.string().nullable().default(null),
});
export type GameSnapshot = z.infer<typeof gameSnapshotSchema>;

export const newGameRequestSchema = z.object({
  mode: gameModeSchema,
  humanColor: z.union([colorSchema, z.literal('random')]),
  masterId: z.string(),
  elo: z.number().int(),
  /** Minutos por jugador. `null` = sin reloj. */
  minutes: z.number().nullable(),
  incrementSeconds: z.number().int().nonnegative(),
  commentary: z.boolean(),
});
export type NewGameRequest = z.infer<typeof newGameRequestSchema>;

export const promotionPieceSchema = z.enum(['q', 'r', 'b', 'n']);
export type PromotionPiece = z.infer<typeof promotionPieceSchema>;

export const moveRequestSchema = z.object({
  from: squareSchema,
  to: squareSchema,
  promotion: promotionPieceSchema.optional(),
});
export type MoveRequest = z.infer<typeof moveRequestSchema>;
