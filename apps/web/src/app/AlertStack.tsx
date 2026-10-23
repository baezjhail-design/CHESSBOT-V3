import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/Ui';
import { Icon } from '../components/Icon';
import { errorCopy } from '../types/errors';
import { useGame } from '../state/game-store';
import { usePrefs } from '../state/prefs-store';

/** Avisos que explican qué pasó y qué hacer. Los bloqueantes no se descartan hasta que se resuelven. */
export function AlertStack() {
  const connection = useGame((s) => s.connection);
  const errors = useGame((s) => s.errors);
  const snapshot = useGame((s) => s.snapshot);
  const dismiss = useGame((s) => s.dismissError);
  const retry = useGame((s) => s.retry);
  const setPrefs = usePrefs((s) => s.set);
  const source = usePrefs((s) => s.source);
  const { pathname } = useLocation();

  const items: ReactElement[] = [];

  if (connection === 'offline') {
    items.push(
      <div className="cb-alert cb-alert--error" role="alert" key="offline">
        <Icon name="plug" />
        <div>
          <strong>No hay conexión con el robot</strong>
          <p>La interfaz no puede confirmar nada mientras está desconectada. Comprueba que la API esté encendida y vuelve a intentar.</p>
        </div>
        <div className="cb-alert__actions">
          <Button size="small" onClick={retry}>Reintentar</Button>
          {source === 'real' && (
            <Button size="small" variant="ghost" onClick={() => setPrefs({ source: 'demo' })}>Usar simulador</Button>
          )}
        </div>
      </div>,
    );
  } else if (connection === 'reconnecting') {
    items.push(
      <div className="cb-alert cb-alert--warn" role="status" key="reconnecting">
        <Icon name="plug" />
        <div>
          <strong>Reconectando…</strong>
          <p>Al volver se pedirá el estado actual del tablero. No se asume nada de lo ocurrido mientras estuvo desconectado.</p>
        </div>
      </div>,
    );
  }

  // Error bloqueante de la partida (por código del snapshot) o el último aviso recibido.
  const blockingCode = snapshot?.phase === 'RECOVERY_REQUIRED' ? (snapshot.errorCode ?? 'BOARD_STATE_MISMATCH') : null;
  if (blockingCode && pathname !== '/partida') {
    const copy = errorCopy(blockingCode);
    items.push(
      <div className="cb-alert cb-alert--error" role="alert" key="blocking">
        <Icon name="alert" />
        <div>
          <strong>{copy.title}</strong>
          <p>{copy.fix}</p>
        </div>
        <div className="cb-alert__actions">
          <Link className="cb-btn cb-btn--small" to="/partida">Ir a la partida</Link>
        </div>
      </div>,
    );
  }

  const latest = errors[0];
  if (latest && (!blockingCode || latest.code !== blockingCode)) {
    const copy = errorCopy(latest.code);
    items.push(
      <div className={`cb-alert cb-alert--${latest.severity === 'error' ? 'error' : 'warn'}`} role="alert" key={latest.at}>
        <Icon name="alert" />
        <div>
          <strong>{copy.title}</strong>
          <p>{copy.fix}</p>
        </div>
        <div className="cb-alert__actions">
          <Button size="small" variant="ghost" onClick={() => dismiss(latest.at)} aria-label="Cerrar aviso">
            <Icon name="close" size={16} />
          </Button>
        </div>
      </div>,
    );
  }

  return items.length ? <div className="cb-alerts">{items}</div> : null;
}
