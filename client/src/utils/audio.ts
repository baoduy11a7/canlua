// Web Audio API beep synthesizer for rapid feedback without external audio files
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playBeep = (freq = 880, duration = 0.08, type: OscillatorType = 'sine') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors in restricted browser contexts
  }
};

export const playSuccessChime = () => {
  try {
    playBeep(523.25, 0.1, 'sine'); // C5
    setTimeout(() => playBeep(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => playBeep(783.99, 0.18, 'sine'), 200); // G5
  } catch {
    //
  }
};

export const playWarningTone = () => {
  try {
    playBeep(330, 0.2, 'triangle');
  } catch {
    //
  }
};
