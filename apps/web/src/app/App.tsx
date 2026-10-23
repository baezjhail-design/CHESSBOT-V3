import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PieceDefs } from '../features/board/pieces';
import { NewGameScreen } from '../features/game/NewGameScreen';
import { GameScreen } from '../features/game/GameScreen';
import { DiagnosticsScreen } from '../features/diagnostics/DiagnosticsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useGame } from '../state/game-store';
import { usePrefs } from '../state/prefs-store';
import { AppShell } from './AppShell';

export function App() {
  const source = usePrefs((s) => s.source);
  const boardTheme = usePrefs((s) => s.boardTheme);
  const boot = useGame((s) => s.boot);

  // Cada vez que cambia el origen de datos (robot real / simulador) se reconecta desde cero.
  useEffect(() => boot(source), [boot, source]);
  useEffect(() => {
    document.documentElement.dataset.board = boardTheme;
  }, [boardTheme]);

  return (
    <HashRouter>
      <PieceDefs />
      <AppShell>
        <Routes>
          <Route path="/" element={<NewGameScreen />} />
          <Route path="/partida" element={<GameScreen />} />
          <Route path="/diagnostico" element={<DiagnosticsScreen />} />
          <Route path="/ajustes" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
