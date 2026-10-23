import { z } from 'zod';
import { gameSnapshotSchema, squareSchema } from './game';

/** Posición en unidades de casilla: (0,0) es la esquina de a8, (8,8) la de h1. Puede ser fraccionaria. */
export const pointSchema = z.tuple([z.number(), z.number()]);
export type Point = z.infer<typeof pointSchema>;

export const motionStatusSchema = z.enum(['accepted', 'running', 'completed', 'failed', 'cancelled', 'timeout']);
export type MotionStatus = z.infer<typeof motionStatusSchema>;

export const motionEventSchema = z.object({
  commandId: z.string(),
  status: motionStatusSchema,
  from: squareSchema,
  to: squareSchema,
  /** `seeking`: el imán va a recoger la pieza. `carrying`: la lleva. `returning`: vuelve al origen. */
  phase: z.enum(['seeking', 'carrying', 'returning']),
  waypoints: z.array(pointSchema),
  /** Posición actual del imán bajo el tablero. */
  position: pointSchema,
  magnet: z.boolean(),
  errorCode: z.string().nullable().default(null),
});
export type MotionEvent = z.infer<typeof motionEventSchema>;

export const deviceStatusSchema = z.object({
  id: z.string(),
  kind: z.enum(['api', 'mqtt', 'core', 'sensors', 'motors', 'engine']),
  state: z.enum(['online', 'offline', 'degraded']),
  /** Marca de tiempo (ms epoch) del último mensaje recibido. */
  lastSeen: z.number().nullable(),
  latencyMs: z.number().nullable(),
  firmware: z.string().nullable().default(null),
});
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;

export const sensorObservationSchema = z.object({
  /** Casillas donde los sensores detectan una pieza ahora mismo. */
  occupied: z.array(squareSchema),
  /** Pieza levantada (sensor inactivo en una casilla que debería estar ocupada). */
  lifted: squareSchema.nullable(),
  /** Casillas donde el sensor no coincide con la posición confirmada. */
  mismatches: z.array(squareSchema),
  at: z.number(),
});
export type SensorObservation = z.infer<typeof sensorObservationSchema>;

export const commentarySchema = z.object({
  id: z.string(),
  masterId: z.string(),
  text: z.string(),
  at: z.number(),
});
export type Commentary = z.infer<typeof commentarySchema>;

export const errorEventSchema = z.object({
  code: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  correlationId: z.string().nullable().default(null),
  at: z.number(),
});
export type ErrorEvent = z.infer<typeof errorEventSchema>;

/** Mensajes del WebSocket (softwarerules §7.2). */
export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('game.snapshot'), data: gameSnapshotSchema }),
  z.object({ type: z.literal('motion.progress'), data: motionEventSchema }),
  z.object({ type: z.literal('devices.status'), data: z.array(deviceStatusSchema) }),
  z.object({ type: z.literal('sensors.observation'), data: sensorObservationSchema }),
  z.object({ type: z.literal('game.commentary'), data: commentarySchema }),
  z.object({ type: z.literal('system.error'), data: errorEventSchema }),
]);
export type ServerMessage = z.infer<typeof serverMessageSchema>;
