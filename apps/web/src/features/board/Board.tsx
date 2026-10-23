import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Color, Square } from '../../types/game';
import type { MotionEvent, SensorObservation } from '../../types/events';
import { FILES, SQ, boardPointToSvg, fileIndex, isDark, rankNumber, squareOrigin, squaresInViewOrder } from './geometry';
import { PieceGlyph, pieceLabel } from './pieces';
import { parsePlacement } from './piece-tracker';
import { useTrackedPieces } from './useTrackedPieces';
import './board.css';

export interface BoardProps {
  fen: string;
  /** Quién queda abajo. Igual que la GUI anterior: si juegas con negras, el tablero gira. */
  bottom: Color;
  lastMove?: { from: Square; to: Square } | null;
  /** Casilla del rey en jaque, si la hay. */
  checkSquare?: Square | null;
  selected?: Square | null;
  targets?: Square[];
  interactive?: boolean;
  onSquare?: (square: Square) => void;
  /** Movimiento físico en curso: el imán bajo el tablero y la pieza que arrastra. */
  motion?: MotionEvent | null;
  sensors?: SensorObservation | null;
  showSensors?: boolean;
  /** Jugada ya enviada y todavía sin confirmar: se muestra translúcida, nunca como hecha. */
  pendingMove?: { from: Square; to: Square } | null;
  /** Casillas con pieza que se puede arrastrar. */
  draggable?: Square[];
  onDrop?: (from: Square, to: Square) => void;
  onPickUp?: (square: Square) => void;
  size?: 'fill' | 'hero';
}

const PIECE_PAD = 2;

export function Board(props: BoardProps) {
  const { fen, bottom, lastMove, checkSquare, selected, targets = [], interactive = false, onSquare, motion, sensors, showSensors, pendingMove, draggable = [], onDrop, onPickUp } = props;
  const { pieces, ghosts } = useTrackedPieces(fen);
  const placement = useMemo(() => parsePlacement(fen), [fen]);
  const order = useMemo(() => squaresInViewOrder(bottom), [bottom]);
  const [cursor, setCursor] = useState<Square>('e2');
  const gridRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ from: Square; x: number; y: number } | null>(null);
  const press = useRef<{ from: Square; x: number; y: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);

  const carrying = motion && motion.status === 'running' && motion.phase === 'carrying' ? motion : null;
  const magnet = motion && motion.status === 'running' ? boardPointToSvg(motion.position, bottom) : null;
  const trace = motion && motion.status === 'running' && motion.waypoints.length > 1 ? motion.waypoints.map((p) => boardPointToSvg(p, bottom)) : null;

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const dx = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const dy = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    if (!dx && !dy) return;
    event.preventDefault();
    const sign = bottom === 'w' ? 1 : -1;
    const file = Math.min(7, Math.max(0, fileIndex(cursor) + dx * sign));
    const rank = Math.min(8, Math.max(1, rankNumber(cursor) + dy * sign));
    const next = `${FILES[file]}${rank}` as Square;
    setCursor(next);
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-square="${next}"]`)?.focus());
  };

  const toSvg = (clientX: number, clientY: number) => {
    const rect = boardRef.current!.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * SQ * 8, y: ((clientY - rect.top) / rect.height) * SQ * 8 };
  };
  const squareAt = (clientX: number, clientY: number): Square | null => {
    const { x, y } = toSvg(clientX, clientY);
    const col = Math.floor(x / SQ);
    const row = Math.floor(y / SQ);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return order[row * 8 + col] ?? null;
  };
  const onPointerDown = (sq: Square, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || !draggable.includes(sq)) return;
    press.current = { from: sq, x: e.clientX, y: e.clientY, active: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.active && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 7) return;
    if (!p.active) {
      p.active = true;
      onPickUp?.(p.from);
    }
    setDrag({ from: p.from, ...toSvg(e.clientX, e.clientY) });
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    press.current = null;
    if (!p?.active) return;
    suppressClick.current = true;
    setDrag(null);
    const target = squareAt(e.clientX, e.clientY);
    if (target && target !== p.from) onDrop?.(p.from, target);
  };
  const onPointerCancel = () => {
    press.current = null;
    setDrag(null);
  };

  const mismatch = new Set(sensors?.mismatches ?? []);
  const occupied = new Set(sensors?.occupied ?? []);

  return (
    <div ref={boardRef} className={`cb-board cb-board--${props.size ?? 'fill'}${magnet ? ' cb-board--moving' : ''}${drag ? ' cb-board--dragging' : ''}`}>
      <svg className="cb-board__svg" viewBox={`0 0 ${SQ * 8} ${SQ * 8}`} role="img" aria-label="Tablero de ajedrez">
        <defs>
          <radialGradient id="cb-magnet-glow">
            <stop offset="0" stopColor="var(--magnet)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--magnet)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cb-check-glow">
            <stop offset="0" stopColor="var(--danger)" stopOpacity="0.95" />
            <stop offset="0.7" stopColor="var(--danger)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--danger)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {order.map((sq) => {
          const o = squareOrigin(sq, bottom);
          const rowEdge = bottom === 'w' ? rankNumber(sq) === 1 : rankNumber(sq) === 8;
          const colEdge = bottom === 'w' ? sq[0] === 'a' : sq[0] === 'h';
          const dark = isDark(sq);
          return (
            <g key={sq}>
              <rect x={o.x} y={o.y} width={SQ} height={SQ} className={dark ? 'cb-sq cb-sq--dark' : 'cb-sq cb-sq--light'} />
              {lastMove && (sq === lastMove.from || sq === lastMove.to) && <rect x={o.x} y={o.y} width={SQ} height={SQ} className="cb-hl cb-hl--last" />}
              {selected === sq && <rect x={o.x} y={o.y} width={SQ} height={SQ} className="cb-hl cb-hl--selected" />}
              {checkSquare === sq && <circle cx={o.x + SQ / 2} cy={o.y + SQ / 2} r={SQ * 0.62} fill="url(#cb-check-glow)" />}
              {colEdge && (
                <text x={o.x + 6} y={o.y + 20} className={dark ? 'cb-coord cb-coord--on-dark' : 'cb-coord cb-coord--on-light'}>
                  {rankNumber(sq)}
                </text>
              )}
              {rowEdge && (
                <text x={o.x + SQ - 7} y={o.y + SQ - 8} textAnchor="end" className={dark ? 'cb-coord cb-coord--on-dark' : 'cb-coord cb-coord--on-light'}>
                  {sq[0]}
                </text>
              )}
            </g>
          );
        })}

        {trace && (
          <>
            <polyline className="cb-trace" points={trace.map((p) => `${p.x},${p.y}`).join(' ')} />
            {motion && motion.phase === 'carrying' && (() => {
              const o = squareOrigin(motion.to, bottom);
              return <rect x={o.x + 5} y={o.y + 5} width={SQ - 10} height={SQ - 10} rx="12" className="cb-pending" />;
            })()}
          </>
        )}
        {pendingMove && !trace && (() => {
          const o = squareOrigin(pendingMove.to, bottom);
          return <rect x={o.x + 5} y={o.y + 5} width={SQ - 10} height={SQ - 10} rx="12" className="cb-pending" />;
        })()}

        {magnet && <circle cx={magnet.x} cy={magnet.y} r={SQ * 0.9} fill="url(#cb-magnet-glow)" className="cb-magnet-glow" />}

        {ghosts.map((p) => {
          const o = squareOrigin(p.square, bottom);
          return <PieceGlyph key={`g-${p.id}`} color={p.color} type={p.type} x={o.x + PIECE_PAD} y={o.y + PIECE_PAD} size={SQ - PIECE_PAD * 2} className="cb-piece--ghost" />;
        })}

        {pieces.map((p) => {
          const o = squareOrigin(p.square, bottom);
          const isCarried = carrying !== null && p.square === carrying.from;
          const isDragged = drag !== null && p.square === drag.from;
          const isPending = !isDragged && pendingMove !== null && pendingMove !== undefined && p.square === pendingMove.from;
          let x = o.x;
          let y = o.y;
          if (isCarried && magnet) {
            x = magnet.x - SQ / 2;
            y = magnet.y - SQ / 2;
          } else if (isDragged && drag) {
            x = drag.x - SQ / 2;
            y = drag.y - SQ / 2;
          } else if (isPending && pendingMove) {
            const t = squareOrigin(pendingMove.to, bottom);
            x = t.x;
            y = t.y;
          }
          const cls = isCarried || isDragged ? 'cb-piece--carried' : isPending ? 'cb-piece--pending' : '';
          return <PieceGlyph key={p.id} color={p.color} type={p.type} x={x + PIECE_PAD} y={y + PIECE_PAD} size={SQ - PIECE_PAD * 2} className={cls} />;
        })}

        {showSensors &&
          order.map((sq) => {
            const o = squareOrigin(sq, bottom);
            if (mismatch.has(sq)) {
              return <rect key={sq} x={o.x + 6} y={o.y + 6} width={SQ - 12} height={SQ - 12} rx="10" className="cb-sensor-mismatch" />;
            }
            return occupied.has(sq) ? <circle key={sq} cx={o.x + SQ - 16} cy={o.y + 16} r={8} className="cb-sensor cb-sensor--on" /> : null;
          })}

        {targets.map((sq) => {
          const o = squareOrigin(sq, bottom);
          const capture = placement.has(sq);
          return capture ? (
            <circle key={sq} cx={o.x + SQ / 2} cy={o.y + SQ / 2} r={SQ * 0.46} className="cb-target cb-target--capture" />
          ) : (
            <circle key={sq} cx={o.x + SQ / 2} cy={o.y + SQ / 2} r={SQ * 0.16} className="cb-target" />
          );
        })}

        {magnet && (
          <g className={`cb-magnet${motion?.magnet ? ' cb-magnet--on' : ''}`} transform={`translate(${magnet.x} ${magnet.y})`}>
            <circle r="15" className="cb-magnet__ring" />
            <circle r="7" className="cb-magnet__core" />
          </g>
        )}
      </svg>

      <div className="cb-board__grid" ref={gridRef} role="group" aria-label="Casillas" onKeyDown={onKey}>
        {order.map((sq) => {
          const piece = placement.get(sq);
          const label = `${sq}${piece ? `, ${pieceLabel(piece.color, piece.type)}` : ', vacía'}${targets.includes(sq) ? ', destino posible' : ''}${selected === sq ? ', seleccionada' : ''}`;
          return (
            <button
              key={sq}
              type="button"
              data-square={sq}
              className={`cb-board__cell${draggable.includes(sq) ? ' is-draggable' : ''}`}
              tabIndex={sq === cursor ? 0 : -1}
              aria-label={label}
              disabled={!interactive}
              onFocus={() => setCursor(sq)}
              onPointerDown={(e) => onPointerDown(sq, e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onSquare?.(sq);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
