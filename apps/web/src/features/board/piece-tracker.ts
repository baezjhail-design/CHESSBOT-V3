import type { Color, PieceType, Square } from '../../types/game';

export interface TrackedPiece {
  id: string;
  color: Color;
  type: PieceType;
  square: Square;
}

export type Placement = Map<Square, { color: Color; type: PieceType }>;

const FILES = 'abcdefgh';

/** Lee solo la parte de colocación de un FEN. Es presentación: no valida reglas. */
export function parsePlacement(fen: string): Placement {
  const out: Placement = new Map();
  const rows = (fen.split(' ')[0] ?? '').split('/');
  rows.forEach((row, i) => {
    let file = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch);
      } else {
        const lower = ch.toLowerCase();
        if ('pnbrqk'.includes(lower) && file < 8) {
          out.set(`${FILES[file]}${8 - i}` as Square, { color: ch === lower ? 'b' : 'w', type: lower as PieceType });
        }
        file += 1;
      }
    }
  });
  return out;
}

const distance = (a: Square, b: Square): number =>
  Math.max(Math.abs(a.charCodeAt(0) - b.charCodeAt(0)), Math.abs(Number(a[1]) - Number(b[1])));

/**
 * Conserva la identidad de cada pieza entre dos posiciones para poder animar su desplazamiento.
 * Sirve para cualquier movimiento (enroque y captura incluidos) sin conocer las reglas.
 */
export function trackPieces(prev: TrackedPiece[], next: Placement, newId: () => string): { pieces: TrackedPiece[]; removed: TrackedPiece[] } {
  const kept = new Map<Square, TrackedPiece>();
  const loose: TrackedPiece[] = [];
  for (const piece of prev) {
    const at = next.get(piece.square);
    if (at && at.color === piece.color && at.type === piece.type) kept.set(piece.square, piece);
    else loose.push(piece);
  }
  const pieces: TrackedPiece[] = [...kept.values()];
  for (const [square, info] of next) {
    if (kept.has(square)) continue;
    let bestIndex = -1;
    let bestDistance = Infinity;
    loose.forEach((candidate, index) => {
      if (candidate.color !== info.color || candidate.type !== info.type) return;
      const d = distance(candidate.square, square);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = index;
      }
    });
    if (bestIndex >= 0) {
      const [match] = loose.splice(bestIndex, 1);
      pieces.push({ ...match!, square });
    } else {
      pieces.push({ id: newId(), color: info.color, type: info.type, square });
    }
  }
  return { pieces, removed: loose };
}
