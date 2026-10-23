import type { Color, GameResult, GameSnapshot, MoveRecord, PieceType } from '../../types/game';
import { parsePlacement } from '../board/piece-tracker';
import type { Square } from '../../types/game';

const VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

/** Piezas capturadas por cada bando y diferencia de material. Es presentación derivada del historial. */
export function capturedBy(moves: MoveRecord[]): { w: PieceType[]; b: PieceType[]; diff: number } {
  const w: PieceType[] = [];
  const b: PieceType[] = [];
  for (const m of moves) if (m.captured) (m.color === 'w' ? w : b).push(m.captured);
  const sort = (list: PieceType[]) => list.sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y));
  const sum = (list: PieceType[]) => list.reduce((t, p) => t + VALUE[p], 0);
  return { w: sort(w), b: sort(b), diff: sum(w) - sum(b) };
}

export function kingSquare(fen: string, color: Color): Square | null {
  for (const [sq, piece] of parsePlacement(fen)) if (piece.type === 'k' && piece.color === color) return sq;
  return null;
}

const REASON: Record<GameResult['reason'], string> = {
  checkmate: 'por jaque mate',
  stalemate: 'por ahogado',
  timeout: 'por tiempo',
  resignation: 'por abandono',
  insufficient: 'por material insuficiente',
  repetition: 'por repetición de posición',
  'fifty-move': 'por la regla de las 50 jugadas',
  agreement: 'de común acuerdo',
};

export function resultText(result: GameResult, snapshot: GameSnapshot): { title: string; detail: string } {
  const reason = REASON[result.reason];
  if (result.winner === 'draw') return { title: 'Tablas', detail: `La partida terminó en tablas ${reason}.` };
  const side = result.winner === 'w' ? 'las blancas' : 'las negras';
  if (snapshot.humanColor && snapshot.mode === 'human-vs-robot') {
    return result.winner === snapshot.humanColor
      ? { title: 'Ganaste', detail: `Ganaste ${reason}.` }
      : { title: 'Perdiste', detail: `Ganó el robot ${reason}.` };
  }
  return { title: `Ganan ${side}`, detail: `La partida terminó ${reason}.` };
}

export function phaseCopy(snapshot: GameSnapshot, masterName: string, levelLabel: string | null): { title: string; detail: string; step: number | null } {
  const side = snapshot.turn === 'w' ? 'blancas' : 'negras';
  const robotGame = snapshot.mode !== 'two-humans';
  switch (snapshot.phase) {
    case 'READY':
      return { title: 'Preparando el tablero', detail: 'Los sensores confirman la posición inicial.', step: null };
    case 'WAITING_FOR_HUMAN':
      return snapshot.mode === 'two-humans'
        ? { title: `Juegan las ${side}`, detail: 'Mueve una pieza en el tablero físico o arrástrala aquí.', step: null }
        : { title: 'Tu turno', detail: 'Mueve una pieza en el tablero físico o arrástrala aquí.', step: 0 };
    case 'VALIDATING_HUMAN_MOVE':
      return { title: 'Comprobando tu jugada', detail: 'Se valida antes de mover nada.', step: 0 };
    case 'THINKING':
      return { title: `${masterName} está pensando`, detail: levelLabel ? `Nivel ${levelLabel}.` : 'Eligiendo jugada.', step: 1 };
    case 'PLANNING_ROBOT_MOVE':
      return { title: 'Planificando la ruta', detail: 'Calcula el camino del imán por los pasillos del tablero.', step: 2 };
    case 'EXECUTING_ROBOT_MOVE':
      return { title: 'Moviendo la pieza', detail: 'Se da por hecha cuando los sensores la ven en su casilla.', step: 3 };
    case 'RECOVERY_REQUIRED':
      return { title: 'Hace falta tu ayuda', detail: 'La partida automática está detenida.', step: null };
    case 'PAUSED':
      return { title: 'Partida en pausa', detail: 'El reloj está detenido.', step: null };
    case 'GAME_OVER':
      return { title: 'Partida terminada', detail: '', step: null };
    default:
      return { title: robotGame ? 'Sin partida' : 'Sin partida', detail: '', step: null };
  }
}
