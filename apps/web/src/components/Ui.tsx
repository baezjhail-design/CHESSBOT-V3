import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './ui.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'normal' | 'big';
  icon?: IconName;
}

export function Button({ variant = 'secondary', size = 'normal', icon, className = '', children, type = 'button', ...rest }: ButtonProps) {
  const cls = ['cb-btn', variant !== 'secondary' && `cb-btn--${variant}`, size !== 'normal' && `cb-btn--${size}`, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === 'small' ? 16 : 20} />}
      {children}
    </button>
  );
}

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="cb-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} className="cb-seg__opt" onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  const id = useId();
  return (
    <label className="cb-switch" htmlFor={id}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function StatusDot({ state }: { state: 'online' | 'offline' | 'degraded' | 'busy' | 'idle' }) {
  return <span className={`cb-dot${state === 'idle' ? '' : ` cb-dot--${state}`}`} aria-hidden />;
}

interface DialogProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
}

/** Diálogo modal nativo: foco atrapado, Escape y fondo bloqueado vienen del navegador. */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog ref={ref} className="cb-dialog" onClose={onClose} onCancel={onClose} aria-label={title}>
      <div className="cb-dialog__body">
        <h2 className="cb-card__title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
