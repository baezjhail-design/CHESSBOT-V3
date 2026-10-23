import type { CSSProperties } from 'react';
import { Segmented, Switch } from '../../components/Ui';
import { usePrefs, type Accent, type BoardTheme, type Corners, type PieceStyle, type Source, type TextSize, type UiTheme } from '../../state/prefs-store';
import './settings.css';

const THEMES: Array<{ id: BoardTheme; label: string }> = [
  { id: 'cobalto', label: 'Cobalto' },
  { id: 'celadon', label: 'Celadón' },
  { id: 'nogal', label: 'Nogal' },
  { id: 'pizarra', label: 'Pizarra' },
  { id: 'amatista', label: 'Amatista' },
  { id: 'coral', label: 'Coral' },
];

const ACCENTS: Array<{ id: Exclude<Accent, 'custom'>; label: string; color: string }> = [
  { id: 'cobre', label: 'Cobre', color: '#f0a04b' },
  { id: 'esmeralda', label: 'Esmeralda', color: '#3fcf9a' },
  { id: 'violeta', label: 'Violeta', color: '#a78bfa' },
  { id: 'rosa', label: 'Rosa', color: '#f472b6' },
  { id: 'cielo', label: 'Cielo', color: '#4cc2ff' },
  { id: 'limon', label: 'Limón', color: '#d4e157' },
];

const UI_THEMES: Array<{ id: UiTheme; label: string; bg: string; card: string }> = [
  { id: 'medianoche', label: 'Medianoche', bg: '#0d1424', card: '#1b2744' },
  { id: 'grafito', label: 'Grafito', bg: '#121214', card: '#242429' },
  { id: 'bosque', label: 'Bosque', bg: '#0c1812', card: '#19321f' },
  { id: 'ciruela', label: 'Ciruela', bg: '#170f20', card: '#2c1d40' },
  { id: 'claro', label: 'Claro', bg: '#eef1f7', card: '#d5dcec' },
];

export function SettingsScreen() {
  const prefs = usePrefs();
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'el mismo servidor que esta página';

  return (
    <div className="cb-settings">
      <header>
        <h1 className="cb-page-title">Ajustes</h1>
        <p className="cb-page-sub">Se guardan en este navegador.</p>
      </header>

      <section className="cb-card cb-set" aria-labelledby="s-look">
        <h2 className="cb-card__title" id="s-look">Aspecto</h2>

        <fieldset className="cb-field">
          <legend className="cb-field__label">Color de acento</legend>
          <div className="cb-swatches" role="radiogroup" aria-label="Color de acento">
            {ACCENTS.map((a) => (
              <button key={a.id} type="button" role="radio" aria-checked={prefs.accent === a.id} aria-label={a.label} title={a.label} className="cb-swatch" style={{ '--sw': a.color } as CSSProperties} onClick={() => prefs.set({ accent: a.id })} />
            ))}
            <label className="cb-swatch cb-swatch--custom" title="Color personalizado" data-checked={prefs.accent === 'custom'} style={{ '--sw': prefs.customAccent } as CSSProperties}>
              <input type="color" value={prefs.customAccent} aria-label="Color personalizado" onChange={(e) => prefs.set({ accent: 'custom', customAccent: e.target.value })} />
            </label>
          </div>
        </fieldset>

        <fieldset className="cb-field">
          <legend className="cb-field__label">Tema de la interfaz</legend>
          <div className="cb-uithemes" role="radiogroup" aria-label="Tema de la interfaz">
            {UI_THEMES.map((u) => (
              <button key={u.id} type="button" role="radio" aria-checked={prefs.uiTheme === u.id} className="cb-theme" onClick={() => prefs.set({ uiTheme: u.id })}>
                <span className="cb-uitheme__sw" aria-hidden style={{ '--ub': u.bg, '--uc': u.card } as CSSProperties} />
                <span>{u.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <Segmented<PieceStyle>
          label="Estilo de piezas"
          value={prefs.pieceStyle}
          options={[
            { value: 'clasico', label: 'Clásico' },
            { value: 'marfil', label: 'Marfil' },
            { value: 'neon', label: 'Neón' },
            { value: 'mono', label: 'Blanco y negro' },
          ]}
          onChange={(pieceStyle) => prefs.set({ pieceStyle })}
        />
        <Segmented<Corners>
          label="Esquinas"
          value={prefs.corners}
          options={[
            { value: 'recto', label: 'Rectas' },
            { value: 'normal', label: 'Normales' },
            { value: 'redondo', label: 'Redondas' },
          ]}
          onChange={(corners) => prefs.set({ corners })}
        />
        <Segmented<TextSize>
          label="Tamaño del texto"
          value={prefs.textSize}
          options={[
            { value: 'pequeno', label: 'Pequeño' },
            { value: 'normal', label: 'Normal' },
            { value: 'grande', label: 'Grande' },
          ]}
          onChange={(textSize) => prefs.set({ textSize })}
        />
        <Switch checked={prefs.animations} onChange={(animations) => prefs.set({ animations })}>Animaciones</Switch>
        <button type="button" className="cb-btn cb-btn--ghost cb-btn--small" onClick={prefs.resetLook}>Restablecer aspecto</button>
      </section>

      <section className="cb-card cb-set" aria-labelledby="s-board">
        <h2 className="cb-card__title" id="s-board">Tablero</h2>
        <div className="cb-themes" role="radiogroup" aria-labelledby="s-board">
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={prefs.boardTheme === t.id} className="cb-theme" data-board={t.id} onClick={() => prefs.set({ boardTheme: t.id })}>
              <span className="cb-theme__sw" aria-hidden>
                <i /><i /><i /><i />
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <Switch checked={prefs.showHints} onChange={(showHints) => prefs.set({ showHints })}>Mostrar las jugadas posibles al elegir una pieza</Switch>
        <Switch checked={prefs.showSensors} onChange={(showSensors) => prefs.set({ showSensors })}>Mostrar siempre lo que ven los sensores sobre el tablero</Switch>
      </section>

      <section className="cb-card cb-set" aria-labelledby="s-sound">
        <h2 className="cb-card__title" id="s-sound">Sonido</h2>
        <Switch checked={prefs.sound} onChange={(sound) => prefs.set({ sound })}>Sonido al confirmarse una jugada</Switch>
        <Switch checked={prefs.voice} onChange={(voice) => prefs.set({ voice })}>Leer en voz alta los comentarios del maestro</Switch>
      </section>

      <section className="cb-card cb-set" aria-labelledby="s-src">
        <h2 className="cb-card__title" id="s-src">Conexión</h2>
        <Segmented<Source>
          label="Origen de datos"
          value={prefs.source}
          options={[
            { value: 'real', label: 'Robot real' },
            { value: 'demo', label: 'Simulador' },
          ]}
          onChange={(source) => prefs.set({ source })}
        />
        <p className="cb-field__note">
          {prefs.source === 'demo'
            ? 'El simulador juega sin hardware: sirve para probar la interfaz y para demostraciones.'
            : `La interfaz habla con la API en ${apiUrl}. Nunca se conecta directamente a las ESP32.`}
        </p>
      </section>
    </div>
  );
}
