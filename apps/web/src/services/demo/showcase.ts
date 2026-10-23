import { Chess } from 'chess.js';
import type { Square } from '../../types/game';

// Partida de exhibición para la portada: Morphy contra el Duque de Brunswick y el conde Isouard, París 1858 (dominio público).
const OPERA = '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#';

export interface ShowcaseFrame {
  fen: string;
  from: Square;
  to: Square;
  san: string;
  check: boolean;
}

export const SHOWCASE_START = new Chess().fen();

export function buildShowcase(): ShowcaseFrame[] {
  const game = new Chess();
  const sans = OPERA.replace(/\d+\.\s*/g, '').split(/\s+/).filter(Boolean);
  const frames: ShowcaseFrame[] = [];
  for (const san of sans) {
    const move = game.move(san);
    frames.push({ fen: game.fen(), from: move.from as Square, to: move.to as Square, san: move.san, check: game.isCheck() });
  }
  return frames;
}
