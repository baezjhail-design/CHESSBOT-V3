import { Icon } from '../../components/Icon';

const STEPS = ['Tu jugada', 'Piensa', 'Ruta', 'Mueve'];

/** Los cuatro tiempos de un turno contra el robot. La pieza no se da por movida hasta el último. */
export function PhaseTrack({ step, busy }: { step: number | null; busy: boolean }) {
  if (step === null) return null;
  return (
    <ol className="cb-track" aria-label="Progreso del turno">
      {STEPS.map((label, i) => {
        const state = i < step ? 'done' : i === step ? 'now' : 'next';
        return (
          <li key={label} className={`cb-track__step is-${state}${state === 'now' && busy ? ' is-busy' : ''}`} aria-current={state === 'now' ? 'step' : undefined}>
            <span className="cb-track__node">{state === 'done' ? <Icon name="check" size={12} /> : null}</span>
            <span className="cb-track__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
