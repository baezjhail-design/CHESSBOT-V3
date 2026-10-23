import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { StatusDot } from '../components/Ui';
import { useGame } from '../state/game-store';
import { usePrefs } from '../state/prefs-store';
import { AlertStack } from './AlertStack';
import './shell.css';

const NAV: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Jugar', icon: 'home' },
  { to: '/partida', label: 'Partida', icon: 'board' },
  { to: '/diagnostico', label: 'Diagnóstico', icon: 'pulse' },
  { to: '/ajustes', label: 'Ajustes', icon: 'sliders' },
];

function Mark() {
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="var(--surface-2)" />
      <rect x="10" y="10" width="22" height="22" fill="var(--sq-light)" />
      <rect x="32" y="32" width="22" height="22" fill="var(--sq-light)" />
      <rect x="32" y="10" width="22" height="22" fill="var(--sq-dark)" />
      <rect x="10" y="32" width="22" height="22" fill="var(--sq-dark)" />
      <circle cx="32" cy="32" r="9" fill="var(--magnet)" stroke="var(--bg)" strokeWidth="3" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const connection = useGame((s) => s.connection);
  const snapshot = useGame((s) => s.snapshot);
  const source = usePrefs((s) => s.source);
  const inGame = snapshot !== null && snapshot.phase !== 'IDLE' && snapshot.phase !== 'GAME_OVER';
  const label = connection === 'online' ? (source === 'demo' ? 'Simulador' : 'Conectado') : connection === 'offline' ? 'Sin conexión' : 'Conectando';
  const dot = connection === 'online' ? 'online' : connection === 'offline' ? 'offline' : 'busy';

  return (
    <div className="cb-shell">
      <nav className="cb-nav" aria-label="Principal">
        <div className="cb-nav__brand" aria-label="ChessBot">
          <Mark />
        </div>
        <ul className="cb-nav__list">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => `cb-nav__link${isActive ? ' is-active' : ''}`}>
                <Icon name={item.icon} size={22} />
                <span>{item.label}</span>
                {item.to === '/partida' && inGame && <i className="cb-nav__live" aria-label="Partida en curso" />}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="cb-nav__status" title={`Estado: ${label}`}>
          <StatusDot state={dot} />
          <span>{label}</span>
        </div>
      </nav>
      <main className="cb-main">
        <AlertStack />
        {children}
      </main>
    </div>
  );
}
