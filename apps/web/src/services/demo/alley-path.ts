import type { Point, } from '../../types/events';
import type { Square } from '../../types/game';

/** Centro de una casilla en unidades de tablero con blancas abajo: (0,0) = esquina de a8. */
export function squareCenter(square: Square): Point {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return [file + 0.5, 8 - rank + 0.5];
}

const sign = (n: number): number => (n > 0 ? 1 : n < 0 ? -1 : 0);

/**
 * Ruta del imán entre dos casillas por los pasillos (las líneas entre casillas), como hace el PathPlanner
 * del robot. Sale del centro hacia una esquina, recorre el pasillo y entra a la casilla destino.
 */
export function alleyPath(from: Square, to: Square): Point[] {
  const s = squareCenter(from);
  const t = squareCenter(to);
  const sx = sign(t[0] - s[0]) || 1;
  const sy = sign(t[1] - s[1]) || 1;
  const c1: Point = [s[0] + 0.5 * sx, s[1] + 0.5 * sy];
  const c4: Point = [t[0] - 0.5 * sx, t[1] - 0.5 * sy];
  const c2: Point = [c4[0], c1[1]];
  const raw: Point[] = [s, c1, c2, c4, t];
  return raw.filter((p, i) => i === 0 || p[0] !== raw[i - 1]![0] || p[1] !== raw[i - 1]![1]);
}

export function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  return total;
}

/** Punto a una fracción (0-1) del recorrido total. */
export function pointAlong(points: Point[], fraction: number): Point {
  const total = pathLength(points);
  if (total === 0 || points.length === 1) return points[0] ?? [0, 0];
  let remaining = Math.min(Math.max(fraction, 0), 1) * total;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (remaining <= seg) {
      const k = seg === 0 ? 0 : remaining / seg;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    remaining -= seg;
  }
  return points[points.length - 1]!;
}
