import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, Segmented, Switch } from '../../components/Ui';
import { MasterCrest } from '../../components/MasterCrest';
import { useGame } from '../../state/game-store';
import { usePrefs } from '../../state/prefs-store';
import type { GameMode, NewGameRequest } from '../../types/game';
import { Showcase } from './Showcase';
import './lobby.css';

const MODES: Array<{ value: GameMode; label: string }> = [
  { value: 'human-vs-robot', label: 'Contra robot' },
  { value: 'two-humans', label: 'Dos personas' },
  { value: 'robot-demo', label: 'Robot vs robot' },
];

const TIMES = [
  { value: 'none', label: 'Sin reloj', minutes: null, inc: 0 },
  { value: '3', label: '3 min', minutes: 3, inc: 0 },
  { value: '10', label: '10 min', minutes: 10, inc: 0 },
  { value: '15+10', label: '15 + 10', minutes: 15, inc: 10 },
  { value: '30', label: '30 min', minutes: 30, inc: 0 },
];

function KingGlyph({ color }: { color: 'w' | 'b' }) {
  return (
    <svg viewBox="0 0 100 100" width="52" height="52" className={`cb-piece--${color}`} aria-hidden>
      <use href="#cb-piece-k" width="100" height="100" />
    </svg>
  );
}

export function NewGameScreen() {
  const navigate = useNavigate();
  const catalog = useGame((s) => s.catalog);
  const connection = useGame((s) => s.connection);
  const snapshot = useGame((s) => s.snapshot);
  const pending = useGame((s) => s.pending);
  const createGame = useGame((s) => s.createGame);
  const setup = usePrefs((s) => s.setup);
  const setSetup = usePrefs((s) => s.setSetup);
  const [confirming, setConfirming] = useState(false);

  const masterId = setup.masterId ?? catalog?.defaultMasterId ?? null;
  const elo = setup.elo ?? catalog?.defaultElo ?? null;
  const master = useMemo(() => catalog?.masters.find((m) => m.id === masterId) ?? catalog?.masters[0] ?? null, [catalog, masterId]);
  const level = useMemo(() => catalog?.difficulties.find((d) => d.elo === elo) ?? catalog?.difficulties[0] ?? null, [catalog, elo]);
  const timeValue = TIMES.find((t) => t.minutes === setup.minutes && t.inc === setup.incrementSeconds)?.value ?? '10';

  const hasRobot = setup.mode !== 'two-humans';
  const hasHuman = setup.mode !== 'robot-demo';
  const gameInProgress = snapshot !== null && snapshot.phase !== 'IDLE' && snapshot.phase !== 'GAME_OVER';
  const ready = connection === 'online' && catalog !== null && master !== null && level !== null;

  const start = async () => {
    if (!master || !level) return;
    const request: NewGameRequest = {
      mode: setup.mode,
      humanColor: setup.humanColor,
      masterId: master.id,
      elo: level.elo,
      minutes: setup.minutes,
      incrementSeconds: setup.incrementSeconds,
      commentary: setup.commentary && setup.mode === 'human-vs-robot',
    };
    setConfirming(false);
    if (await createGame(request)) navigate('/partida');
  };

  return (
    <div className="cb-lobby">
      <div className="cb-lobby__board">
        <Showcase />
      </div>

      <div className="cb-lobby__side">
        <header className="cb-lobby__title">
          <h1>ChessBot</h1>
          <p>Un tablero de verdad. Un rival que mueve las piezas por ti.</p>
        </header>

        <section className="cb-card cb-setup" aria-labelledby="setup-title">
          <h2 className="cb-card__title" id="setup-title">Nueva partida</h2>

          <div className="cb-field">
            <span className="cb-field__label" id="f-mode">Modo</span>
            <Segmented label="Modo" value={setup.mode} options={MODES} onChange={(mode) => setSetup({ mode })} />
          </div>

          {hasHuman && (
            <div className="cb-field">
              <span className="cb-field__label" id="f-color">Juegas con</span>
              <div className="cb-colors" role="radiogroup" aria-labelledby="f-color">
                {(
                  [
                    ['w', 'Blancas'],
                    ['b', 'Negras'],
                    ['random', 'Al azar'],
                  ] as const
                ).map(([value, label]) => (
                  <button key={value} type="button" role="radio" aria-checked={setup.humanColor === value} className="cb-color" onClick={() => setSetup({ humanColor: value })}>
                    {value === 'random' ? (
                      <span className="cb-color__pair"><KingGlyph color="w" /><KingGlyph color="b" /></span>
                    ) : (
                      <KingGlyph color={value} />
                    )}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              {setup.mode === 'human-vs-robot' && setup.humanColor === 'b' && <p className="cb-field__note">El tablero se gira para que tus piezas queden abajo.</p>}
            </div>
          )}

          {hasRobot && catalog && master && (
            <div className="cb-field">
              <span className="cb-field__label" id="f-master">Maestro</span>
              <div className="cb-masters" role="radiogroup" aria-labelledby="f-master">
                {catalog.masters.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={m.id === master.id} className="cb-master" onClick={() => setSetup({ masterId: m.id })}>
                    <MasterCrest hue={m.hue} emblem={m.emblem} size={52} />
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
              <p className="cb-field__note"><strong>{master.name}.</strong> {master.style}</p>
            </div>
          )}

          {hasRobot && catalog && level && (
            <div className="cb-field">
              <span className="cb-field__label" id="f-level">Dificultad</span>
              <div className="cb-levels" role="radiogroup" aria-labelledby="f-level">
                {catalog.difficulties.map((d, i) => (
                  <button key={d.id} type="button" role="radio" aria-checked={d.elo === level.elo} aria-label={`${d.label}, ${d.elo}`} className={`cb-level${d.elo <= level.elo ? ' is-filled' : ''}`} onClick={() => setSetup({ elo: d.elo })}>
                    <span className="cb-level__bar" style={{ height: `${22 + i * 9}px` }} />
                  </button>
                ))}
              </div>
              <p className="cb-field__note"><strong>{level.label} · {level.elo}.</strong> {level.hint}</p>
            </div>
          )}

          <div className="cb-field">
            <span className="cb-field__label" id="f-time">Tiempo por jugador</span>
            <Segmented
              label="Tiempo por jugador"
              value={timeValue}
              options={TIMES.map((t) => ({ value: t.value, label: t.label }))}
              onChange={(v) => {
                const t = TIMES.find((x) => x.value === v)!;
                setSetup({ minutes: t.minutes, incrementSeconds: t.inc });
              }}
            />
          </div>

          {setup.mode === 'human-vs-robot' && (
            <Switch checked={setup.commentary} onChange={(commentary) => setSetup({ commentary })}>
              El maestro comenta la partida
            </Switch>
          )}

          <div className="cb-setup__go">
            <Button variant="primary" size="big" disabled={!ready || pending === 'createGame'} onClick={() => (gameInProgress ? setConfirming(true) : void start())}>
              {pending === 'createGame' ? 'Preparando el tablero…' : 'Empezar partida'}
            </Button>
            {!ready && <p className="cb-field__note">{connection === 'online' ? 'Cargando maestros…' : 'Esperando conexión con el robot.'}</p>}
            {gameInProgress && ready && (
              <button type="button" className="cb-link" onClick={() => navigate('/partida')}>Volver a la partida en curso</button>
            )}
          </div>
        </section>
      </div>

      <Dialog open={confirming} title="Ya hay una partida en curso" onClose={() => setConfirming(false)}>
        <p>Si empiezas otra, la partida actual termina sin resultado y el robot espera a que el tablero esté listo.</p>
        <div className="cb-dialog__actions">
          <Button variant="ghost" onClick={() => setConfirming(false)}>Seguir con la actual</Button>
          <Button variant="primary" onClick={() => void start()}>Empezar otra</Button>
        </div>
      </Dialog>
    </div>
  );
}
