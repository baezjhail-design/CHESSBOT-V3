// Sonidos sintetizados (sin archivos) y voz del navegador. Todo es opcional y falla en silencio.
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, gain: number, type: OscillatorType, delay = 0) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t0 + duration);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export type SoundKind = 'move' | 'capture' | 'check' | 'end';

export function playSound(kind: SoundKind): void {
  switch (kind) {
    case 'move':
      tone(190, 0.09, 0.22, 'triangle');
      break;
    case 'capture':
      tone(150, 0.14, 0.3, 'triangle');
      tone(320, 0.06, 0.12, 'square', 0.01);
      break;
    case 'check':
      tone(420, 0.1, 0.18, 'sine');
      tone(560, 0.16, 0.18, 'sine', 0.1);
      break;
    case 'end':
      tone(330, 0.3, 0.2, 'sine');
      tone(220, 0.5, 0.2, 'sine', 0.2);
      break;
  }
}

export function speak(text: string): void {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.98;
    window.speechSynthesis.speak(u);
  } catch {
    /* sin voz */
  }
}
