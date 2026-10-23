import { describe, expect, it } from 'vitest';
import { alleyPath, pathLength, pointAlong, squareCenter } from '../src/services/demo/alley-path';
import { boardPointToSvg, isDark, squareOrigin, squaresInViewOrder } from '../src/features/board/geometry';

describe('alleyPath', () => {
  it('empieza en el centro del origen y termina en el del destino', () => {
    const path = alleyPath('e2', 'e4');
    expect(path[0]).toEqual(squareCenter('e2'));
    expect(path[path.length - 1]).toEqual(squareCenter('e4'));
  });
  it('se mantiene dentro del tablero para cualquier par de casillas', () => {
    const files = 'abcdefgh';
    for (const a of files) for (const b of files) {
      for (const [r1, r2] of [[1, 8], [8, 1], [4, 5], [2, 2]] as const) {
        for (const p of alleyPath(`${a}${r1}` as never, `${b}${r2}` as never)) {
          expect(p[0]).toBeGreaterThanOrEqual(0);
          expect(p[0]).toBeLessThanOrEqual(8);
          expect(p[1]).toBeGreaterThanOrEqual(0);
          expect(p[1]).toBeLessThanOrEqual(8);
        }
      }
    }
  });
  it('pointAlong recorre la ruta de extremo a extremo', () => {
    const path = alleyPath('a1', 'h8');
    expect(pointAlong(path, 0)).toEqual(path[0]);
    expect(pointAlong(path, 1)).toEqual(path[path.length - 1]);
    const mid = pointAlong(path, 0.5);
    expect(pathLength([path[0]!, mid]) + pathLength([mid, path[path.length - 1]!])).toBeGreaterThan(0);
  });
});

describe('geometría del tablero', () => {
  it('a1 es oscura y h1 clara', () => {
    expect(isDark('a1')).toBe(true);
    expect(isDark('h1')).toBe(false);
  });
  it('girar el tablero invierte las casillas', () => {
    expect(squareOrigin('a1', 'w')).toEqual({ x: 0, y: 700 });
    expect(squareOrigin('a1', 'b')).toEqual({ x: 700, y: 0 });
    expect(boardPointToSvg([1, 2], 'b')).toEqual({ x: 700, y: 600 });
  });
  it('el orden de vista cambia con la orientación', () => {
    expect(squaresInViewOrder('w')[0]).toBe('a8');
    expect(squaresInViewOrder('b')[0]).toBe('h1');
    expect(squaresInViewOrder('w')).toHaveLength(64);
  });
});
