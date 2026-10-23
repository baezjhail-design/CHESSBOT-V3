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

export type BoardTheme = 'cobalto' | 'celadon' | 'nogal';
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
  source: Source;
  sound: boolean;
  voice: boolean;
  showHints: boolean;
  showSensors: boolean;
  setup: SetupChoice;
  set: (patch: Partial<Omit<PrefsState, 'set' | 'setSetup'>>) => void;
  setSetup: (patch: Partial<SetupChoice>) => void;
}

const hasApi = Boolean(import.meta.env.VITE_API_URL);

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      boardTheme: 'cobalto',
      source: hasApi ? 'real' : 'demo',
      sound: true,
      voice: false,
      showHints: true,
      showSensors: false,
      setup: { mode: 'human-vs-robot', humanColor: 'w', masterId: null, elo: null, minutes: 10, incrementSeconds: 0, commentary: true },
      set: (patch) => set(patch),
      setSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
    }),
    { name: 'chessbot.prefs.v1', storage: createJSONStorage(() => safeStorage) },
  ),
);
