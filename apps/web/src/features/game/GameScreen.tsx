import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '../board/Board';
import { Button, Dialog, StatusDot, Switch } from '../../components/Ui';
import { MasterCrest } from '../../components/MasterCrest';
import { useClock } from '../../hooks/useClock';
import { playSound, speak } from '../../services/sound';
import { useGame } from '../../state/game-store';
import { usePrefs } from '../../state/prefs-store';
import { errorCopy } from '../../types/errors';
import type { Commentary } from '../../types/events';
import type { Color, PieceType, PromotionPiece, Square } from '../../types/game';
import { capturedBy, kingSquare, phaseCopy, resultText } from './game-helpers';
import { MoveList } from './MoveList';
import { PhaseTrack } from './PhaseTrack';
import { PlayerCard } from './PlayerCard';
import { PIECE_NAMES } from '../board/pieces';
import './game.css';

const YOU: { hue: number; emblem: PieceType } = { hue: 215, emblem: 'p' };

export function GameScreen() {
  const navigate = useNavigate();
  const snapshot = useGame((s) => s.snapshot);
  const snapshotAt = useGame((s) => s.snapshotAt);
  const catalog = useGame((s) => s.catalog);
  const motion = useGame((s) => s.motion);
  const sensors = useGame((s) => s.sensors);
  const commentary = useGame((s) => s.commentary);
  const errors = useGame((s) => s.errors);
  const pending = useGame((s) => s.pending);
  const run = useGame((s) => s.run);
  const requestMove = useGame((s) => s.requestMove);
  const prefs = usePrefs();

  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
  const [flip, setFlip] = useState(false);
  const [tab, setTab] = useState<'moves' | 'master'>('moves');
  const [confirmResign, setConfirmResign] = useState(false);
  const [dismissedResult, setDismissedResult] = useState<string | null>(null);
  const [history, setHistory] = useState<Commentary[]>([]);
  const clock = useClock(snapshot, snapshotAt);

  const prevMoves = useRef(0);
  const revision = snapshot?.revision;
  const gameId = snapshot?.gameId;

  // Cada confirmación del sistema reemplaza lo que la pantalla suponía: se limpian selección y jugada pendiente.
  useEffect(() => {
    setPendingMove(null);
    setSelected(null);
  }, [revision, gameId]);
  useEffect(() => {
    if (errors[0]?.code === 'INVALID_MOVE') setPendingMove(null);
  }, [errors]);
  useEffect(() => {
    setHistory([]);
    setFlip(false);
    prevMoves.current = 0;
  }, [gameId]);

  // Sonido al confirmarse una jugada.
  const moveCount = snapshot?.moves.length ?? 0;
  useEffect(() => {
    if (snapshot && moveCount > prevMoves.current && prefs.sound) {
      const last = snapshot.moves[moveCount - 1]!;
      playSound(last.check ? 'check' : last.captured ? 'capture' : 'move');
    }
    prevMoves.current = moveCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveCount]);

  useEffect(() => {
    if (!commentary) return;
    setHistory((h) => (h.some((c) => c.id === commentary.id) ? h : [commentary, ...h].slice(0, 30)));
    if (prefs.voice) speak(commentary.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentary?.id]);

  const master = useMemo(() => catalog?.masters.find((m) => m.id === snapshot?.opponent?.masterId) ?? null, [catalog, snapshot?.opponent?.masterId]);
  const level = useMemo(() => {
    if (!catalog || !snapshot?.opponent) return null;
    const elo = snapshot.opponent.elo;
    return [...catalog.difficulties].sort((a, b) => Math.abs(a.elo - elo) - Math.abs(b.elo - elo))[0] ?? null;
  }, [catalog, snapshot?.opponent]);

  if (!snapshot || snapshot.phase === 'IDLE') {
    return (
      <div className="cb-game-empty">
        <h1 className="cb-card__title">No hay una partida en curso</h1>
        <p>Elige cómo quieres jugar y el robot prepara el tablero.</p>
        <Button variant="primary" size="big" onClick={() => navigate('/')}>Nueva partida</Button>
      </div>
    );
  }

  const bottom: Color = flip ? (snapshot.humanColor === 'b' ? 'w' : 'b') : snapshot.humanColor === 'b' ? 'b' : 'w';
  const top: Color = bottom === 'w' ? 'b' : 'w';
  const last = snapshot.moves[snapshot.moves.length - 1] ?? null;
  const checkSquare = last?.check ? kingSquare(snapshot.fen, snapshot.turn) : null;
  const recovery = snapshot.phase === 'RECOVERY_REQUIRED';
  const interactive = snapshot.phase === 'WAITING_FOR_HUMAN' && !snapshot.promotionRequired && pendingMove === null && pending !== 'move';
  const lifted = sensors?.lifted ?? null;
  const shownSelected = selected ?? (lifted && snapshot.legalTargets[lifted] ? lifted : null);
  const targets = prefs.showHints && shownSelected ? (snapshot.legalTargets[shownSelected] ?? []) : [];
  const draggable = interactive ? (Object.keys(snapshot.legalTargets) as Square[]) : [];
  const captured = capturedBy(snapshot.moves);
  const hasClock = snapshot.clocks.w !== null;
  const robotColor: Color | null = snapshot.mode === 'human-vs-robot' && snapshot.humanColor ? (snapshot.humanColor === 'w' ? 'b' : 'w') : null;

  const submit = async (from: Square, to: Square) => {
    setPendingMove({ from, to });
    setSelected(null);
    if (!(await requestMove({ from, to }))) setPendingMove(null);
  };
  const onSquare = (sq: Square) => {
    if (!interactive) return;
    if (selected && (snapshot.legalTargets[selected] ?? []).includes(sq)) {
      void submit(selected, sq);
      return;
    }
    if (snapshot.legalTargets[sq]) {
      setSelected(sq === selected ? null : sq);
      return;
    }
    setSelected(null);
  };
  const onDrop = (from: Square, to: Square) => {
    if ((snapshot.legalTargets[from] ?? []).includes(to)) void submit(from, to);
    else setSelected(null);
  };
  const choosePromotion = (piece: PromotionPiece) => {
    const p = snapshot.promotionRequired;
    if (p) void requestMove({ from: p.from, to: p.to, promotion: piece });
  };

  const nameOf = (color: Color): { name: string; subtitle: string; crest: { hue: number; emblem: PieceType } } => {
    const colorName = color === 'w' ? 'Blancas' : 'Negras';
    if (snapshot.mode === 'two-humans') return { name: colorName, subtitle: 'Jugador', crest: { hue: color === 'w' ? 215 : 255, emblem: 'p' } };
    const isRobot = snapshot.mode === 'robot-demo' || color === robotColor;
    if (isRobot && master) return { name: master.name, subtitle: `${colorName} · ${snapshot.opponent?.elo ?? ''}`, crest: { hue: master.hue, emblem: master.emblem } };
    return { name: 'Tú', subtitle: colorName, crest: YOU };
  };

  const copy = phaseCopy(snapshot, master?.name ?? 'El maestro', level?.label ?? null);
  const finished = snapshot.phase === 'GAME_OVER' && snapshot.result;
  const result = finished ? resultText(snapshot.result!, snapshot) : null;
  const errCopy = recovery ? errorCopy(snapshot.errorCode ?? 'BOARD_STATE_MISMATCH') : null;
  const mismatches = sensors?.mismatches ?? [];
  const paused = snapshot.phase === 'PAUSED';
  const executing = snapshot.phase === 'EXECUTING_ROBOT_MOVE';
  const busy = ['VALIDATING_HUMAN_MOVE', 'THINKING', 'PLANNING_ROBOT_MOVE', 'EXECUTING_ROBOT_MOVE'].includes(snapshot.phase);
  const detail =
    executing && motion
      ? motion.phase === 'seeking'
        ? `El imán va a por la pieza en ${motion.from}.`
        : `Llevando la pieza de ${motion.from} a ${motion.to}. Se da por hecha cuando los sensores la ven allí.`
      : copy.detail;
  const title = executing && motion ? `Moviendo ${motion.from} a ${motion.to}` : copy.title;

  const card = (color: Color) => {
    const who = nameOf(color);
    return (
      <PlayerCard
        name={who.name}
        subtitle={who.subtitle}
        color={color}
        crest={who.crest}
        captured={color === 'w' ? captured.w : captured.b}
        advantage={color === 'w' ? Math.max(0, captured.diff) : Math.max(0, -captured.diff)}
        ms={color === 'w' ? clock.w : clock.b}
        active={snapshot.phase !== 'GAME_OVER' && snapshot.turn === color}
        hasClock={hasClock}
      />
    );
  };

  return (
    <div className="cb-game">
      <section className="cb-game__stage" aria-label="Tablero">
        {card(top)}
        <Board
          fen={snapshot.fen}
          bottom={bottom}
          lastMove={last ? { from: last.from, to: last.to } : null}
          checkSquare={checkSquare}
          selected={shownSelected}
          targets={targets}
          interactive={interactive}
          onSquare={onSquare}
          onPickUp={(sq) => setSelected(sq)}
          onDrop={onDrop}
          draggable={draggable}
          pendingMove={pendingMove}
          motion={motion}
          sensors={sensors}
          showSensors={prefs.showSensors || recovery}
        />
        {card(bottom)}
      </section>

      <aside className="cb-game__side">
        <section className={`cb-status${recovery ? ' is-error' : ''}${paused ? ' is-paused' : ''}`} aria-live="polite">
          <div className="cb-status__head">
            <StatusDot state={recovery ? 'offline' : busy ? 'busy' : paused ? 'degraded' : 'online'} />
            <h2>{result ? result.title : recovery && errCopy ? errCopy.title : title}</h2>
          </div>
          <p>{result ? result.detail : recovery && errCopy ? errCopy.fix : detail}</p>
          {snapshot.mode !== 'two-humans' && !recovery && !result && <PhaseTrack step={copy.step} busy={busy} />}
          {recovery && mismatches.length > 0 && (
            <p className="cb-status__squares">
              Casillas por revisar: <strong>{mismatches.join(', ')}</strong>
            </p>
          )}
          {recovery && (
            <Button variant="primary" onClick={() => void run('verify', (g) => g.verifyBoard())} disabled={pending === 'verify'}>
              {pending === 'verify' ? 'Verificando…' : 'Verificar tablero'}
            </Button>
          )}
        </section>

        <section className="cb-panel">
          <div className="cb-tabs" role="tablist" aria-label="Información de la partida">
            <button role="tab" id="tab-moves" aria-selected={tab === 'moves'} aria-controls="pane-moves" className="cb-tabs__tab" onClick={() => setTab('moves')}>Jugadas</button>
            {snapshot.mode !== 'two-humans' && (
              <button role="tab" id="tab-master" aria-selected={tab === 'master'} aria-controls="pane-master" className="cb-tabs__tab" onClick={() => setTab('master')}>Maestro</button>
            )}
          </div>
          {tab === 'moves' || snapshot.mode === 'two-humans' ? (
            <div role="tabpanel" id="pane-moves" aria-labelledby="tab-moves" className="cb-panel__body">
              <MoveList moves={snapshot.moves} />
            </div>
          ) : (
            <div role="tabpanel" id="pane-master" aria-labelledby="tab-master" className="cb-panel__body cb-master-pane">
              {master && (
                <header className="cb-master-pane__head">
                  <MasterCrest hue={master.hue} emblem={master.emblem} size={64} label={master.name} />
                  <div>
                    <h3>{master.name}</h3>
                    <p>{master.style}</p>
                    <p className="cb-master-pane__lvl">{level ? `${level.label} · ${snapshot.opponent?.elo}` : snapshot.opponent?.elo}</p>
                  </div>
                </header>
              )}
              {history.length === 0 ? (
                <p className="cb-empty">{prefs.setup.commentary ? 'El maestro comentará cuando haya algo que decir.' : 'Los comentarios están desactivados para esta partida.'}</p>
              ) : (
                <ul className="cb-says">
                  {history.map((c, i) => (
                    <li key={c.id} className={i === 0 ? 'is-new' : ''}>{c.text}</li>
                  ))}
                </ul>
              )}
              <Switch checked={prefs.voice} onChange={(voice) => prefs.set({ voice })}>Leer los comentarios en voz alta</Switch>
            </div>
          )}
        </section>

        <section className="cb-controls" aria-label="Controles">
          {paused ? (
            <Button icon="play" onClick={() => void run('resume', (g) => g.resume())}>Reanudar</Button>
          ) : (
            <Button icon="pause" disabled={!!finished || recovery || executing} onClick={() => void run('pause', (g) => g.pause())}>Pausar</Button>
          )}
          <Button icon="flip" variant="ghost" onClick={() => setFlip((f) => !f)}>Girar tablero</Button>
          <Button icon="eye" variant="ghost" aria-pressed={prefs.showSensors} onClick={() => prefs.set({ showSensors: !prefs.showSensors })}>
            {prefs.showSensors ? 'Ocultar sensores' : 'Ver sensores'}
          </Button>
          {executing && (
            <Button icon="stop" variant="danger" onClick={() => void run('stop', (g) => g.stopMotion())}>Detener robot</Button>
          )}
          <Button icon="flag" variant="danger" disabled={!!finished} onClick={() => setConfirmResign(true)}>Rendirse</Button>
        </section>
      </aside>

      <Dialog open={snapshot.promotionRequired !== null} title="Corona tu peón">
        <p>Elige la pieza que sustituye al peón.</p>
        <div className="cb-promo">
          {(['q', 'r', 'b', 'n'] as const).map((p) => (
            <button key={p} type="button" className="cb-promo__opt" onClick={() => choosePromotion(p)}>
              <svg viewBox="0 0 100 100" width="64" height="64" className={`cb-piece--${snapshot.humanColor ?? snapshot.turn}`} aria-hidden>
                <use href={`#cb-piece-${p}`} width="100" height="100" />
              </svg>
              <span>{PIECE_NAMES[p]}</span>
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog open={confirmResign} title="¿Rendirte?" onClose={() => setConfirmResign(false)}>
        <p>La partida termina y se da como perdida.</p>
        <div className="cb-dialog__actions">
          <Button variant="ghost" onClick={() => setConfirmResign(false)}>Seguir jugando</Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmResign(false);
              void run('resign', (g) => g.resign());
            }}
          >
            Rendirme
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!result && dismissedResult !== snapshot.gameId} title={result?.title ?? ''} onClose={() => setDismissedResult(snapshot.gameId)}>
        <p>{result?.detail}</p>
        {history[0] && snapshot.mode === 'human-vs-robot' && (
          <blockquote className="cb-quote">
            <span>{master?.name}</span>
            “{history[0].text}”
          </blockquote>
        )}
        <div className="cb-dialog__actions">
          <Button variant="ghost" onClick={() => setDismissedResult(snapshot.gameId)}>Ver el tablero</Button>
          <Button variant="primary" onClick={() => navigate('/')}>Nueva partida</Button>
        </div>
      </Dialog>
    </div>
  );
}
