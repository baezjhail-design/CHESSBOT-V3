import type { Color, Square } from '../../types/game';
import type { Point } from '../../types/events';

export const SQ = 100; // unidades SVG por casilla
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export const fileIndex = (sq: Square): number => sq.charCodeAt(0) - 97;
export const rankNumber = (sq: Square): number => Number(sq[1]);

/** Casilla oscura: a1 es oscura (la misma convención de la GUI anterior). */
export const isDark = (sq: Square): boolean => (fileIndex(sq) + rankNumber(sq)) % 2 === 1;

/** Esquina superior izquierda de la casilla en unidades SVG, según quién queda abajo. */
export function squareOrigin(sq: Square, bottom: Color): { x: number; y: number } {
  const f = fileIndex(sq);
  const r = rankNumber(sq);
  return bottom === 'w' ? { x: f * SQ, y: (8 - r) * SQ } : { x: (7 - f) * SQ, y: (r - 1) * SQ };
}

/** Punto en unidades de tablero (blancas abajo, (0,0) = a8) a unidades SVG para la orientación dada. */
export function boardPointToSvg([x, y]: Point, bottom: Color): { x: number; y: number } {
  return bottom === 'w' ? { x: x * SQ, y: y * SQ } : { x: (8 - x) * SQ, y: (8 - y) * SQ };
}

/** Casillas en el orden en que se dibujan, de arriba a abajo y de izquierda a derecha. */
export function squaresInViewOrder(bottom: Color): Square[] {
  const out: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = bottom === 'w' ? 8 - row : row + 1;
      const file = bottom === 'w' ? col : 7 - col;
      out.push(`${FILES[file]}${rank}` as Square);
    }
  }
  return out;
}
