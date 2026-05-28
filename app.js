// Stillpoint — meditation timer
// MIT License

const STORAGE_KEY = 'stillpoint-theme';
const DEFAULT_MINUTES = 10;
const CIRCUMFERENCE = 2 * Math.PI * 92; // matches dial r=92

const els = {
  root: document.documentElement,
  timer: document.querySelector('.timer'),
  dialButton: document.getElementById('dialButton'),
  dialProgress: document.getElementById('dialProgress'),
  time: document.getElementById('time'),
  hint: document.getElementById('hint'),
  themeToggle: document.getElementById('themeToggle'),
  chips: document.querySelectorAll('.chip[data-minutes]'),
  customInput: document.getElementById('customMinutes'),
  resetBtn: document.getElementById('resetBtn'),
};

// State
const state = {
  totalSeconds: DEFAULT_MINUTES * 60,
  remainingMs: DEFAULT_MINUTES * 60 * 1000,
  running: false,
  endAt: 0, // wall-clock target timestamp when running
  rafId: 0,
};

// ----- Time formatting -----
function format(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ----- Render -----
function render() {
  els.time.textContent = format(state.remainingMs);
  const totalMs = state.totalSeconds * 1000;
  const fraction = totalMs > 0 ? state.remainingMs / totalMs : 0;
  els.dialProgress.style.strokeDashoffset = String(CIRCUMFERENCE * (fraction - 1));
}

// ----- Loop (rAF, drift-free via wall clock) -----
function tick() {
  const now = performance.now();
  state.remainingMs = Math.max(0, state.endAt - now);
  render();

  if (state.remainingMs <= 0) {
    complete();
    return;
  }
  state.rafId = requestAnimationFrame(tick);
}

// ----- Controls -----
function start() {
  if (state.running) return;
  state.running = true;
  state.endAt = performance.now() + state.remainingMs;
  els.timer.classList.add('is-running');
  els.timer.classList.remove('is-complete');
  els.resetBtn.classList.add('is-visible');
  els.dialButton.setAttribute('aria-label', 'Pause timer');
  els.hint.style.opacity = ''; // let CSS class control visibility again
  state.rafId = requestAnimationFrame(tick);
}

function pause() {
  if (!state.running) return;
  state.running = false;
  cancelAnimationFrame(state.rafId);
  els.timer.classList.remove('is-running');
  els.dialButton.setAttribute('aria-label', 'Resume timer');
  els.hint.textContent = 'paused';
  els.hint.style.opacity = '1';
}

function toggle() {
  if (state.running) {
    pause();
  } else {
    if (state.remainingMs <= 0) reset();
    start();
  }
}

function reset() {
  state.running = false;
  cancelAnimationFrame(state.rafId);
  state.remainingMs = state.totalSeconds * 1000;
  els.timer.classList.remove('is-running', 'is-complete');
  els.hint.textContent = 'tap to begin';
  els.hint.style.opacity = '';
  els.dialButton.setAttribute('aria-label', 'Start timer');
  els.resetBtn.classList.remove('is-visible');
  render();
}

function complete() {
  state.running = false;
  state.remainingMs = 0;
  cancelAnimationFrame(state.rafId);
  els.timer.classList.remove('is-running');
  els.timer.classList.add('is-complete');
  els.hint.textContent = 'complete';
  els.hint.style.opacity = '1';
  els.dialButton.setAttribute('aria-label', 'Start timer');
  render();
  ring();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
}

// ----- Duration selection -----
function setDuration(minutes, fromCustom = false) {
  const m = Math.max(1, Math.min(180, Math.round(minutes)));
  state.totalSeconds = m * 60;
  state.remainingMs = state.totalSeconds * 1000;
  els.chips.forEach((c) => {
    c.classList.toggle('is-active', !fromCustom && Number(c.dataset.minutes) === m);
  });
  reset();
}

els.chips.forEach((chip) => {
  chip.addEventListener('click', () => setDuration(Number(chip.dataset.minutes)));
});

els.customInput.addEventListener('input', (e) => {
  const val = Number(e.target.value);
  if (val >= 1 && val <= 180) setDuration(val, true);
});

els.customInput.addEventListener('click', (e) => e.stopPropagation());

// ----- Inner-circle interactions -----
els.dialButton.addEventListener('click', toggle);
els.dialButton.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    toggle();
  }
});

els.resetBtn.addEventListener('click', reset);

// Global spacebar shortcut
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    toggle();
  }
});

// ----- Theme -----
function setTheme(theme, persist = true) {
  els.root.dataset.theme = theme;
  if (persist) localStorage.setItem(STORAGE_KEY, theme);
}

els.themeToggle.addEventListener('click', () => {
  const next = els.root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
});

// Follow system if user has not set a preference
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', (e) => {
  if (!localStorage.getItem(STORAGE_KEY)) setTheme(e.matches ? 'dark' : 'light', false);
});

// ----- Completion bell (Web Audio API, no assets) -----
let audioCtx;
function ring() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    // A soft singing-bowl chord: fundamental + perfect fifth, slow attack/decay
    [528, 792].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const peak = i === 0 ? 0.22 : 0.11;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 4.3);
    });
  } catch (e) {
    // silent fallback
  }
}

// Pre-resume audio on first interaction (mobile autoplay policies)
document.addEventListener(
  'click',
  () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  },
  { once: true }
);

// ----- Init -----
render();
