import { useEffect, useState } from 'react';
import { Button, StatusDot } from '../../components/Ui';
import { useGame } from '../../state/game-store';
import { parsePlacement } from '../board/piece-tracker';
import { FILES } from '../board/geometry';
import type { DeviceStatus } from '../../types/events';
import type { Square } from '../../types/game';
import './diagnostics.css';

const KIND: Record<DeviceStatus['kind'], string> = {
  api: 'Servidor web',
  mqtt: 'Broker de mensajes',
  core: 'Núcleo del juego',
  sensors: 'Sensores del tablero',
  motors: 'Motores del imán',
  engine: 'Motor de ajedrez',
};
const STATE: Record<DeviceStatus['state'], string> = { online: 'En línea', offline: 'Desconectado', degraded: 'Con fallos' };

function ago(ms: number | null, now: number): string {
  if (ms === null) return 'sin datos';
  const s = Math.max(0, Math.round((now - ms) / 1000));
  return s < 2 ? 'ahora' : `hace ${s} s`;
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const INITIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';

function SensorGrid() {
  const snapshot = useGame((s) => s.snapshot);
  const sensors = useGame((s) => s.sensors);
  const expected = new Set<Square>([...parsePlacement(snapshot?.fen ?? INITIAL).keys()]);
  const seen = new Set<Square>(sensors?.occupied ?? []);
  const bad = new Set<Square>(sensors?.mismatches ?? []);
  const cells: Array<{ sq: Square; state: 'ok' | 'missing' | 'extra' | 'empty' }> = [];
  for (let rank = 8; rank >= 1; rank--) {
    for (const f of FILES) {
      const sq = `${f}${rank}` as Square;
      const state = expected.has(sq) && seen.has(sq) ? 'ok' : expected.has(sq) ? 'missing' : seen.has(sq) ? 'extra' : 'empty';
      cells.push({ sq, state });
    }
  }
  return (
    <div className="cb-sensors">
      <div className="cb-sensors__grid" role="img" aria-label={`Sensores: ${seen.size} piezas detectadas, ${bad.size} discrepancias`}>
        {cells.map(({ sq, state }) => (
          <span key={sq} className={`cb-sensors__cell is-${state}${bad.has(sq) ? ' is-bad' : ''}`} title={`${sq}: ${state === 'ok' ? 'detectada' : state === 'missing' ? 'falta la pieza' : state === 'extra' ? 'hay una pieza de más' : 'vacía'}`} />
        ))}
      </div>
      <ul className="cb-sensors__legend">
        <li><i className="is-ok" /> Pieza detectada donde debe estar</li>
        <li><i className="is-missing" /> Falta una pieza</li>
        <li><i className="is-extra" /> Sobra una pieza</li>
      </ul>
      <p className="cb-sensors__sum">
        {seen.size} de {expected.size} piezas detectadas{bad.size ? ` · ${bad.size} por revisar` : ''}
      </p>
    </div>
  );
}

export function DiagnosticsScreen() {
  const devices = useGame((s) => s.devices);
  const log = useGame((s) => s.log);
  const gateway = useGame((s) => s.gateway);
  const connection = useGame((s) => s.connection);
  const run = useGame((s) => s.run);
  const pending = useGame((s) => s.pending);
  const now = useNow();

  return (
    <div className="cb-diag">
      <header>
        <h1 className="cb-page-title">Diagnóstico</h1>
        <p className="cb-page-sub">Qué está conectado y qué ve el tablero ahora mismo.</p>
      </header>

      <section aria-labelledby="dev-title">
        <h2 className="cb-card__title" id="dev-title">Dispositivos</h2>
        {devices.length === 0 ? (
          <p className="cb-empty">{connection === 'online' ? 'Esperando el primer informe de estado.' : 'Sin conexión: no hay estado que mostrar.'}</p>
        ) : (
          <ul className="cb-devices">
            {devices.map((d) => (
              <li key={d.id} className={`cb-device is-${d.state}`}>
                <div className="cb-device__top">
                  <StatusDot state={d.state} />
                  <strong>{KIND[d.kind]}</strong>
                  <span className="cb-device__state">{STATE[d.state]}</span>
                </div>
                <dl>
                  <div><dt>Id</dt><dd>{d.id}</dd></div>
                  <div><dt>Latencia</dt><dd>{d.latencyMs === null ? '—' : `${d.latencyMs} ms`}</dd></div>
                  <div><dt>Versión</dt><dd>{d.firmware ?? '—'}</dd></div>
                  <div><dt>Último mensaje</dt><dd>{ago(d.lastSeen, now)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="cb-diag__cols">
        <section className="cb-card" aria-labelledby="sens-title">
          <h2 className="cb-card__title" id="sens-title">Tablero físico</h2>
          <SensorGrid />
        </section>

        <section className="cb-card" aria-labelledby="tools-title">
          <h2 className="cb-card__title" id="tools-title">Herramientas</h2>
          <div className="cb-tools">
            <Button variant="ghost" onClick={() => void run('verify', (g) => g.verifyBoard())} disabled={pending === 'verify'}>Verificar tablero</Button>
            <p>Compara los sensores con la posición de la partida.</p>
            <Button variant="ghost" onClick={() => void run('home', (g) => g.home())} disabled={pending === 'home'}>Calibrar origen</Button>
            <p>Lleva el carro al origen con los finales de carrera. Hazlo con el tablero vacío o sin piezas en la ruta.</p>
            <Button variant="danger" icon="stop" onClick={() => void run('stop', (g) => g.stopMotion())}>Detener movimiento</Button>
            <p>Pide al robot que pare. No sustituye a la parada de emergencia física.</p>
            {gateway?.injectFault && (
              <>
                <Button variant="ghost" onClick={() => gateway.injectFault?.()}>Simular fallo del tablero</Button>
                <p>Solo en el simulador: provoca una discrepancia para ver cómo se recupera la partida.</p>
              </>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="log-title">
        <h2 className="cb-card__title" id="log-title">Registro de eventos</h2>
        <ol className="cb-log">
          {log.length === 0 && <li className="cb-empty">Todavía no llegó ningún evento.</li>}
          {log.slice(0, 40).map((e, i) => (
            <li key={`${e.at}-${i}`} className={e.kind === 'error' ? 'is-error' : ''}>
              <time>{new Date(e.at).toLocaleTimeString('es', { hour12: false })}</time>
              <span className="cb-chip">{e.kind}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
