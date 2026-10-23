import { MasterCrest } from '../../components/MasterCrest';
import type { Color, PieceType } from '../../types/game';
import { formatClock } from '../../hooks/useClock';

interface Props {
  name: string;
  subtitle: string;
  color: Color;
  crest: { hue: number; emblem: PieceType };
  captured: PieceType[];
  /** Ventaja de material de este jugador (puede ser 0 o negativa). */
  advantage: number;
  ms: number | null;
  active: boolean;
  /** Si hay reloj en la partida. */
  hasClock: boolean;
}

function Mini({ type, color }: { type: PieceType; color: Color }) {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22" className={`cb-piece--${color}`} aria-hidden>
      <use href={`#cb-piece-${type}`} width="100" height="100" />
    </svg>
  );
}

export function PlayerCard({ name, subtitle, color, crest, captured, advantage, ms, active, hasClock }: Props) {
  const low = ms !== null && ms < 30_000;
  const taken: Color = color === 'w' ? 'b' : 'w';
  return (
    <div className={`cb-player${active ? ' is-active' : ''}`}>
      <MasterCrest hue={crest.hue} emblem={crest.emblem} size={46} />
      <div className="cb-player__who">
        <span className="cb-player__name">{name}</span>
        <span className="cb-player__sub">{subtitle}</span>
      </div>
      <div className="cb-player__captured" aria-label={captured.length ? `Piezas capturadas: ${captured.length}` : undefined}>
        {captured.map((t, i) => (
          <Mini key={`${t}-${i}`} type={t} color={taken} />
        ))}
        {advantage > 0 && <span className="cb-player__adv">+{advantage}</span>}
      </div>
      {hasClock && (
        <div className={`cb-clock${active ? ' is-active' : ''}${low ? ' is-low' : ''}`} role="timer" aria-label={`Tiempo de ${name}`}>
          {formatClock(ms)}
        </div>
      )}
    </div>
  );
}
