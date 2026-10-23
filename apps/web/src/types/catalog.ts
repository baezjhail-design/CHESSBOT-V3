import { z } from 'zod';

export const masterSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Frase corta que describe cómo juega. */
  style: z.string(),
  /** Matiz 0-359 para el escudo del maestro. */
  hue: z.number().min(0).max(359),
  /** Pieza que lo representa. */
  emblem: z.enum(['p', 'n', 'b', 'r', 'q', 'k']),
});
export type Master = z.infer<typeof masterSchema>;

export const difficultySchema = z.object({
  id: z.string(),
  label: z.string(),
  elo: z.number().int(),
  hint: z.string(),
});
export type Difficulty = z.infer<typeof difficultySchema>;

export const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  masters: z.array(masterSchema).min(1),
  difficulties: z.array(difficultySchema).min(1),
  defaultMasterId: z.string(),
  defaultElo: z.number().int(),
});
export type Catalog = z.infer<typeof catalogSchema>;
