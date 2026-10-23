import { useEffect, useMemo, useState } from 'react';
import { Board } from '../board/Board';
import { alleyPath, pathLength, pointAlong, squareCenter } from '../../services/demo/alley-path';
import { SHOWCASE_START, buildShowcase } from '../../services/demo/showcase';
import type { MotionEvent } from '../../types/events';
import type { Square } from '../../types/game';

const SPEED = 4.2; // casillas por segundo: más pausado que el robot real para que se aprecie el imán
const REST_MS = 520;

/** Portada: una partida histórica que se juega sola, con el imán recorriendo los pasillos bajo el tablero. */
export function Showcase() {
  const frames = useMemo(buildShowcase, []);
  const [index, setIndex] = useState(-1); // -1 = posición inicial
  const [motion, setMotion] = useState<MotionEvent | null>(null);
  const fen = index < 0 ? SHOWCASE_START : frames[index]!.fen;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const play = (i: number) => {
      if (cancelled) return;
      if (i >= frames.length) {
        timer = setTimeout(() => {
          setIndex(-1);
          setMotion(null);
          timer = setTimeout(() => play(0), 1400);
        }, 2600);
        return;
      }
      const frame = frames[i]!;
      if (reduce) {
        setIndex(i);
        timer = setTimeout(() => play(i + 1), 1400);
        return;
      }
      const path = alleyPath(frame.from, frame.to);
      const approach: [number, number][] = [i === 0 ? [8.2, 7.6] : squareCenter(frames[i - 1]!.to), squareCenter(frame.from)];
      const legs = [
        { points: approach, phase: 'seeking' as const, magnet: false },
        { points: path, phase: 'carrying' as const, magnet: true },
      ];
      const start = performance.now();
      const durations = legs.map((l) => Math.max(260, (pathLength(l.points) / SPEED) * 1000));
      const total = durations[0]! + durations[1]!;
      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = now - start;
        if (elapsed >= total) {
          setIndex(i);
          setMotion(null);
          timer = setTimeout(() => play(i + 1), REST_MS);
          return;
        }
        const legIndex = elapsed < durations[0]! ? 0 : 1;
        const leg = legs[legIndex]!;
        const local = legIndex === 0 ? elapsed / durations[0]! : (elapsed - durations[0]!) / durations[1]!;
        setMotion({
          commandId: `show-${i}`,
          status: 'running',
          from: frame.from,
          to: frame.to,
          phase: leg.phase,
          waypoints: leg.points,
          position: pointAlong(leg.points, local),
          magnet: leg.magnet,
          errorCode: null,
        });
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    timer = setTimeout(() => play(0), 900);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [frames]);

  const lastMove: { from: Square; to: Square } | null = index >= 0 ? { from: frames[index]!.from, to: frames[index]!.to } : null;

  return (
    <figure className="cb-showcase">
      <Board fen={fen} bottom="w" lastMove={lastMove} motion={motion} size="hero" />
      <figcaption>
        <strong>Morphy contra el Duque de Brunswick</strong>
        <span>París, 1858. Partida de demostración: el punto de cobre es el imán que mueve cada pieza desde abajo.</span>
      </figcaption>
    </figure>
  );
}
