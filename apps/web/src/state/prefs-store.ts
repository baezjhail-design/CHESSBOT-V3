import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { GameMode } from '../types/game';

// El almacenamiento del navegador puede no existir o fallar (modo privado, datos bloqueados): nunca debe romper la app.
const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* sin persistencia */
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* sin persistencia */
    }
  },
};

export type BoardTheme = 'cobalto' | 'celadon' | 'nogal' | 'pizarra' | 'amatista' | 'coral';
export type Accent = 'cobre' | 'esmeralda' | 'violeta' | 'rosa' | 'cielo' | 'limon' | 'custom';
export type UiTheme = 'medianoche' | 'grafito' | 'bosque' | 'ciruela' | 'claro';
export type PieceStyle = 'clasico' | 'marfil' | 'neon' | 'mono';
export type Corners = 'recto' | 'normal' | 'redondo';
export type TextSize = 'pequeno' | 'normal' | 'grande';
export type Source = 'real' | 'demo';

export interface SetupChoice {
  mode: GameMode;
  humanColor: 'w' | 'b' | 'random';
  masterId: string | null;
  elo: number | null;
  minutes: number | null;
  incrementSeconds: number;
  commentary: boolean;
}

interface PrefsState {
  boardTheme: BoardTheme;
  accent: Accent;
  customAccent: string;
  uiTheme: UiTheme;
  pieceStyle: PieceStyle;
  corners: Corners;
  textSize: TextSize;
  animations: boolean;
  source: Source;
  sound: boolean;
  voice: boolean;
  showHints: boolean;
  showSensors: boolean;
  setup: SetupChoice;
  set: (patch: Partial<Omit<PrefsState, 'set' | 'setSetup' | 'resetLook'>>) => void;
  resetLook: () => void;
  setSetup: (patch: Partial<SetupChoice>) => void;
}

export const LOOK_DEFAULTS = {
  boardTheme: 'cobalto' as BoardTheme,
  accent: 'cobre' as Accent,
  customAccent: '#f0a04b',
  uiTheme: 'medianoche' as UiTheme,
  pieceStyle: 'clasico' as PieceStyle,
  corners: 'normal' as Corners,
  textSize: 'normal' as TextSize,
  animations: true,
};

const hasApi = Boolean(import.meta.env.VITE_API_URL);

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ...LOOK_DEFAULTS,
      source: hasApi ? 'real' : 'demo',
      sound: true,
      voice: false,
      showHints: true,
      showSensors: false,
      setup: { mode: 'human-vs-robot', humanColor: 'w', masterId: null, elo: null, minutes: 10, incrementSeconds: 0, commentary: true },
      set: (patch) => set(patch),
      resetLook: () => set({ ...LOOK_DEFAULTS }),
      setSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
    }),
    { name: 'chessbot.prefs.v1', storage: createJSONStorage(() => safeStorage) },
  ),
);
