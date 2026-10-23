import type { Color, PieceType } from '../../types/game';

// Juego de piezas original de ChessBot. Todas comparten una base con un anillo de cobre: el imán
// que las arrastra desde debajo del tablero. Colores por variables CSS: --pf relleno, --ps trazo, --pd detalle.

interface Shape {
  body: string;
  detail?: string;
  dots?: Array<[number, number, number]>;
  eye?: [number, number];
}

const SHAPES: Record<PieceType, Shape> = {
  p: {
    body: 'M41 77 C42 66 44 57 47 48 H53 C56 57 58 66 59 77 Z M38 42 H62 a3 3 0 0 1 0 6 H38 a3 3 0 0 1 0 -6 Z',
    dots: [[50, 30, 11.5]],
  },
  r: {
    body: 'M30 77 L34 57 L36 41 H28 V19 H39 V27 H45.5 V19 H54.5 V27 H61 V19 H72 V41 H64 L66 57 L70 77 Z',
    detail: 'M28 41 H72 M34 57 H66',
  },
  n: {
    body: 'M30 77 C30 63 34 53 43 45 C37 45 31 48 27 53 L22 47 C23 36 33 24 46 20 L47 10 L55 19 C69 22 77 36 75 56 L72 77 Z',
    detail: 'M58 25 C67 33 69 46 67 62',
    eye: [45, 31],
  },
  b: {
    body: 'M50 16 C62 25 66 37 61 47 C59 51 57 53 57 57 H43 C43 53 41 51 39 47 C34 37 38 25 50 16 Z M34 57 H66 a2.5 2.5 0 0 1 0 5 H34 a2.5 2.5 0 0 1 0 -5 Z M40 62 H60 L64 77 H36 Z',
    detail: 'M46 29 L56 40',
    dots: [[50, 12, 4.5]],
  },
  q: {
    body: 'M30 77 L26 56 L22 25 L32 39 L37 19 L44 37 L50 15 L56 37 L63 19 L68 39 L78 25 L74 56 L70 77 Z',
    detail: 'M26 56 H74 M28 64 H72',
    dots: [[22, 22, 3.8], [37, 16, 3.8], [50, 12, 3.8], [63, 16, 3.8], [78, 22, 3.8]],
  },
  k: {
    body: 'M47 7 H53 V13 H59 V19 H53 V26 H47 V19 H41 V13 H47 Z M50 28 C66 30 77 42 73 57 L70 77 H30 L27 57 C23 42 34 30 50 28 Z',
    detail: 'M27 57 H73 M29 66 H71',
  },
};

const BASE = 'M21 90 L26 80 Q27.5 77 31 77 H69 Q72.5 77 74 80 L79 90 Z';

const NAMES: Record<Color, string> = { w: 'blancas', b: 'negras' };
export const PIECE_NAMES: Record<PieceType, string> = { p: 'peón', n: 'caballo', b: 'alfil', r: 'torre', q: 'dama', k: 'rey' };
export const pieceLabel = (color: Color, type: PieceType) => `${PIECE_NAMES[type]} ${NAMES[color]}`;

/** Definiciones compartidas. Se montan una sola vez en la aplicación. */
export function PieceDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        {(Object.keys(SHAPES) as PieceType[]).map((type) => {
          const s = SHAPES[type];
          return (
            <symbol key={type} id={`cb-piece-${type}`} viewBox="0 0 100 100">
              <path d={BASE} style={{ fill: 'var(--pf)', stroke: 'var(--ps)' }} strokeWidth="2.4" strokeLinejoin="round" />
              <path d={s.body} style={{ fill: 'var(--pf)', stroke: 'var(--ps)' }} strokeWidth="2.4" strokeLinejoin="round" />
              {s.dots?.map(([cx, cy, r]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} style={{ fill: 'var(--pf)', stroke: 'var(--ps)' }} strokeWidth="2.4" />
              ))}
              {s.detail && <path d={s.detail} fill="none" style={{ stroke: 'var(--pd)' }} strokeWidth="2" strokeLinecap="round" />}
              {s.eye && <circle cx={s.eye[0]} cy={s.eye[1]} r="2.6" style={{ fill: 'var(--ps)' }} />}
              <path d="M24.5 84.2 H75.5" style={{ stroke: 'var(--magnet)' }} strokeWidth="3.2" strokeLinecap="round" />
            </symbol>
          );
        })}
      </defs>
    </svg>
  );
}

interface PieceProps {
  color: Color;
  type: PieceType;
  x: number;
  y: number;
  size: number;
  className?: string;
}

/** Pieza dibujada en coordenadas de tablero. Se anima con la transición CSS de `transform`. */
export function PieceGlyph({ color, type, x, y, size, className }: PieceProps) {
  return (
    <use
      href={`#cb-piece-${type}`}
      width={size}
      height={size}
      className={`cb-piece cb-piece--${color} ${className ?? ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    />
  );
}
