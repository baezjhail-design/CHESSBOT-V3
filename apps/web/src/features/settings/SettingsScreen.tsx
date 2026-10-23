import { Segmented, Switch } from '../../components/Ui';
import { usePrefs, type BoardTheme, type Source } from '../../state/prefs-store';
import './settings.css';

const THEMES: Array<{ id: BoardTheme; label: string }> = [
  { id: 'cobalto', label: 'Cobalto' },
  { id: 'celadon', label: 'Celadón' },
  { id: 'nogal', label: 'Nogal' },
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
