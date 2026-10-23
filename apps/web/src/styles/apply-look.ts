import type { Accent, Corners, PieceStyle, TextSize, UiTheme } from '../state/prefs-store';

export interface Look {
  accent: Accent;
  customAccent: string;
  uiTheme: UiTheme;
  pieceStyle: PieceStyle;
  corners: Corners;
  textSize: TextSize;
  animations: boolean;
}

const SCALE: Record<TextSize, string> = { pequeno: '0.9', normal: '1', grande: '1.14' };

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (c: [number, number, number]) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function luminance([r, g, b]: [number, number, number]) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Deriva los tres tonos del imán (base, intenso, tinta del texto encima) a partir de un solo color. */
export function accentFromHex(hex: string) {
  const base = parseHex(hex);
  if (!base) return null;
  const strong = mix(base, [255, 255, 255], 0.28);
  const ink = luminance(base) > 0.36 ? mix(base, [0, 0, 0], 0.88) : ([250, 250, 250] as [number, number, number]);
  return { magnet: toHex(base), strong: toHex(strong), ink: toHex(ink) };
}

/** Pone el aspecto elegido en <html>. Solo toca atributos y variables CSS: no afecta a la lógica. */
export function applyLook(look: Look, root: HTMLElement = document.documentElement) {
  const d = root.dataset;
  d.accent = look.accent;
  d.ui = look.uiTheme;
  d.pieces = look.pieceStyle;
  d.radius = look.corners;
  d.motion = look.animations ? 'on' : 'off';
  root.style.setProperty('--ui-scale', SCALE[look.textSize]);

  const custom = look.accent === 'custom' ? accentFromHex(look.customAccent) : null;
  for (const [name, value] of [['--magnet', custom?.magnet], ['--magnet-strong', custom?.strong], ['--magnet-ink', custom?.ink]] as const) {
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
}
