import { useEffect, useRef, useState } from 'react';
import { parsePlacement, trackPieces, type TrackedPiece } from './piece-tracker';

interface State {
  fen: string;
  pieces: TrackedPiece[];
  ghosts: TrackedPiece[];
}

/** Piezas con identidad estable y las recién capturadas, que se desvanecen en su casilla. */
export function useTrackedPieces(fen: string): { pieces: TrackedPiece[]; ghosts: TrackedPiece[] } {
  const counter = useRef(0);
  const newId = () => `p${(counter.current += 1)}`;
  const [state, setState] = useState<State>(() => ({ fen, pieces: trackPieces([], parsePlacement(fen), newId).pieces, ghosts: [] }));

  if (state.fen !== fen) {
    const { pieces, removed } = trackPieces(state.pieces, parsePlacement(fen), newId);
    setState({ fen, pieces, ghosts: removed });
  }

  useEffect(() => {
    if (state.ghosts.length === 0) return;
    const timer = setTimeout(() => setState((s) => ({ ...s, ghosts: [] })), 320);
    return () => clearTimeout(timer);
  }, [state.ghosts]);

  return { pieces: state.pieces, ghosts: state.ghosts };
}
