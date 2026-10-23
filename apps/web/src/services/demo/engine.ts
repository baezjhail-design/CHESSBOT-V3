import type { Chess, Move } from 'chess.js';

// Motor mínimo SOLO para el simulador (sin hardware ni Stockfish). La UI real no usa ni valida reglas.
const VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function material(game: Chess): number {
  let score = 0;
  for (const row of game.board()) for (const cell of row) if (cell) score += (cell.color === 'w' ? 1 : -1) * VALUE[cell.type]!;
  return score;
}

function search(game: Chess, depth: number): number {
  if (depth === 0) return material(game);
  if (game.isCheckmate()) return game.turn() === 'w' ? -99999 : 99999;
  const moves = game.moves();
  if (moves.length === 0) return 0;
  const white = game.turn() === 'w';
  let best = white ? -Infinity : Infinity;
  for (const m of moves) {
    game.move(m);
    const v = search(game, depth - 1);
    game.undo();
    best = white ? Math.max(best, v) : Math.min(best, v);
  }
  return best;
}

/** Elige una jugada: a menor ELO, más ruido. Devuelve `null` si no hay jugadas. */
export function chooseMove(game: Chess, elo: number): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  const white = game.turn() === 'w';
  const depth = elo >= 1800 ? 2 : 1;
  const scored = moves.map((move) => {
    game.move(move);
    const raw = search(game, depth - 1);
    game.undo();
    return { move, score: (white ? raw : -raw) + Math.random() * Math.max(0, (2400 - elo) / 4) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.move;
}
