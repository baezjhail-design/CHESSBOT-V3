import { useEffect, useState } from 'react';
import type { GameSnapshot } from '../types/game';

export interface ClockView {
  w: number | null;
  b: number | null;
  running: 'w' | 'b' | null;
}

/** Reloj local que avanza entre snapshots. El servidor sigue siendo la fuente de verdad. */
export function useClock(snapshot: GameSnapshot | null, snapshotAt: number): ClockView {
  const [now, setNow] = useState(() => Date.now());
  const live = snapshot !== null && snapshot.clocks.running !== null && snapshot.phase !== 'PAUSED' && snapshot.phase !== 'GAME_OVER' && snapshot.phase !== 'RECOVERY_REQUIRED';

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [live]);

  if (!snapshot) return { w: null, b: null, running: null };
  const elapsed = live ? Math.max(0, now - snapshotAt) : 0;
  const at = (c: 'w' | 'b'): number | null => {
    const base = snapshot.clocks[c];
    if (base === null) return null;
    return snapshot.clocks.running === c ? Math.max(0, base - elapsed) : base;
  };
  return { w: at('w'), b: at('b'), running: live ? snapshot.clocks.running : null };
}

export function formatClock(ms: number | null): string {
  if (ms === null) return '—';
  const total = Math.max(0, ms);
  if (total < 10_000) return `0:${(total / 1000).toFixed(1).padStart(4, '0')}`;
  const seconds = Math.ceil(total / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
