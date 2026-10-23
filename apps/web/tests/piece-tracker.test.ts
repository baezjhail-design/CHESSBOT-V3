import { describe, expect, it } from 'vitest';
import { parsePlacement, trackPieces } from '../src/features/board/piece-tracker';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let n = 0;
const id = () => `n${++n}`;

describe('parsePlacement', () => {
  it('lee la posición inicial con 32 piezas', () => {
    const p = parsePlacement(START);
    expect(p.size).toBe(32);
    expect(p.get('e1')).toEqual({ color: 'w', type: 'k' });
    expect(p.get('d8')).toEqual({ color: 'b', type: 'q' });
  });
  it('ignora basura sin lanzar', () => {
    expect(parsePlacement('zzz').size).toBe(0);
  });
});

describe('trackPieces', () => {
  const first = trackPieces([], parsePlacement(START), id).pieces;

  it('conserva la identidad de una pieza que se mueve', () => {
    const e2 = first.find((p) => p.square === 'e2')!;
    const next = trackPieces(first, parsePlacement('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'), id);
    expect(next.pieces.find((p) => p.id === e2.id)?.square).toBe('e4');
    expect(next.removed).toHaveLength(0);
  });

  it('separa la pieza capturada', () => {
    const afterE4 = trackPieces(first, parsePlacement('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'), id);
    const e4 = afterE4.pieces.find((p) => p.square === 'e4')!;
    const captured = trackPieces(afterE4.pieces, parsePlacement('rnbqkbnr/pppp1ppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2'), id);
    expect(captured.pieces.find((p) => p.id === e4.id)?.square).toBe('e5');
    expect(captured.removed).toHaveLength(1);
    expect(captured.removed[0]?.color).toBe('b');
  });

  it('mueve rey y torre en un enroque', () => {
    const base = trackPieces([], parsePlacement('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), id).pieces;
    const king = base.find((p) => p.square === 'e1')!;
    const rook = base.find((p) => p.square === 'h1')!;
    const next = trackPieces(base, parsePlacement('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1'), id);
    expect(next.pieces.find((p) => p.id === king.id)?.square).toBe('g1');
    expect(next.pieces.find((p) => p.id === rook.id)?.square).toBe('f1');
  });

  it('crea una pieza nueva al coronar', () => {
    const base = trackPieces([], parsePlacement('4k3/P7/8/8/8/8/8/4K3 w - - 0 1'), id).pieces;
    const next = trackPieces(base, parsePlacement('Q3k3/8/8/8/8/8/8/4K3 b - - 0 1'), id);
    expect(next.pieces.find((p) => p.type === 'q')).toBeDefined();
    expect(next.removed.some((p) => p.type === 'p')).toBe(true);
  });
});
