import type { PieceType } from '../types/game';

interface Props {
  hue: number;
  emblem: PieceType;
  size?: number;
  label?: string;
}

/** Escudo del maestro: un color propio y la pieza que lo representa. Sin retratos. */
export function MasterCrest({ hue, emblem, size = 56, label }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="cb-crest">
      <path d="M32 3 L57 15 V36 C57 49 46 58 32 61 C18 58 7 49 7 36 V15 Z" fill={`hsl(${hue} 42% 24%)`} stroke={`hsl(${hue} 62% 64%)`} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 9 L51 18 V35 C51 45 43 52 32 55 C21 52 13 45 13 35 V18 Z" fill={`hsl(${hue} 40% 30%)`} />
      <svg x="12" y="11" width="40" height="40" viewBox="0 0 100 100" className="cb-piece--w">
        <use href={`#cb-piece-${emblem}`} width="100" height="100" />
      </svg>
    </svg>
  );
}
