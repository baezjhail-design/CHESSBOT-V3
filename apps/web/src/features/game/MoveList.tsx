import { useEffect, useRef } from 'react';
import type { MoveRecord } from '../../types/game';

export function MoveList({ moves }: { moves: MoveRecord[] }) {
  const endRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [moves.length]);

  if (moves.length === 0) {
    return <p className="cb-empty">Aún no hay jugadas. Las blancas abren la partida.</p>;
  }

  const rows: Array<{ n: number; w?: MoveRecord; b?: MoveRecord; wi: number; bi: number }> = [];
  moves.forEach((m, i) => {
    if (m.color === 'w') rows.push({ n: rows.length + 1, w: m, wi: i, bi: -1 });
    else if (rows.length && !rows[rows.length - 1]!.b) {
      rows[rows.length - 1]!.b = m;
      rows[rows.length - 1]!.bi = i;
    } else rows.push({ n: rows.length + 1, b: m, wi: -1, bi: i });
  });
  const last = moves.length - 1;

  return (
    <ol className="cb-moves" aria-label="Jugadas">
      {rows.map((r) => (
        <li key={r.n} ref={r.wi === last || r.bi === last ? endRef : undefined} className="cb-moves__row">
          <span className="cb-moves__n">{r.n}</span>
          <span className={`cb-moves__m${r.wi === last ? ' is-last' : ''}`}>{r.w?.san ?? '…'}</span>
          <span className={`cb-moves__m${r.bi === last ? ' is-last' : ''}`}>{r.b?.san ?? ''}</span>
        </li>
      ))}
    </ol>
  );
}
