import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PieceDefs } from '../features/board/pieces';
import { NewGameScreen } from '../features/game/NewGameScreen';
import { GameScreen } from '../features/game/GameScreen';
import { DiagnosticsScreen } from '../features/diagnostics/DiagnosticsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useGame } from '../state/game-store';
import { usePrefs } from '../state/prefs-store';
import { applyLook } from '../styles/apply-look';
import { AppShell } from './AppShell';

export function App() {
  const source = usePrefs((s) => s.source);
  const boardTheme = usePrefs((s) => s.boardTheme);
  const accent = usePrefs((s) => s.accent);
  const customAccent = usePrefs((s) => s.customAccent);
  const uiTheme = usePrefs((s) => s.uiTheme);
  const pieceStyle = usePrefs((s) => s.pieceStyle);
  const corners = usePrefs((s) => s.corners);
  const textSize = usePrefs((s) => s.textSize);
  const animations = usePrefs((s) => s.animations);
  const boot = useGame((s) => s.boot);

  // Cada vez que cambia el origen de datos (robot real / simulador) se reconecta desde cero.
  useEffect(() => boot(source), [boot, source]);
  useEffect(() => {
    document.documentElement.dataset.board = boardTheme;
  }, [boardTheme]);

  useEffect(() => {
    applyLook({ accent, customAccent, uiTheme, pieceStyle, corners, textSize, animations });
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#0d1424');
  }, [accent, customAccent, uiTheme, pieceStyle, corners, textSize, animations]);

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
