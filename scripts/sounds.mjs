// Synthesizes the original sound set used by app/audio/soundManager.js.
// Deterministic (seeded noise, no downloads, no dependencies): re-running produces
// byte-identical WAV files (16-bit PCM, mono, 22050 Hz) in public/sounds/.
//
//   npm run sounds
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');
const TAU = Math.PI * 2;

// Small seeded PRNG (mulberry32) so noise is reproducible.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const buffer = (seconds) => new Float32Array(Math.round(seconds * RATE));

// Attack / exponential decay envelope.
const envelope = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));

function normalize(samples, peak) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max === 0) return samples;
  const gain = peak / max;
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  return samples;
}

// One-pole low-pass, used to soften noise.
function lowPass(samples, cutoff) {
  const k = 1 - Math.exp((-TAU * cutoff) / RATE);
  let y = 0;
  for (let i = 0; i < samples.length; i++) {
    y += k * (samples[i] - y);
    samples[i] = y;
  }
  return samples;
}

// Seamless pastel pad: every partial and LFO completes an integer number of cycles
// over the loop length, so the last sample flows into the first.
function ambience(seconds = 10) {
  const out = buffer(seconds);
  const snap = (hz) => Math.round(hz * seconds) / seconds;
  // Soft major-ninth voicing (C3 G3 C4 E4 B4 D5).
  const notes = [130.81, 196.0, 261.63, 329.63, 493.88, 587.33].map(snap);
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    let s = 0;
    notes.forEach((f, n) => {
      // Slow swell per voice (1–3 cycles per loop) and a gently detuned twin.
      const swell = 0.55 + 0.45 * Math.sin((TAU * (n % 3 + 1) * t) / seconds + n);
      const detune = snap(f + 0.4 + n * 0.1);
      s += (swell * (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * detune * t))) / (1 + n * 0.35);
      s += (0.12 * swell * Math.sin(TAU * 2 * f * t)) / (1 + n);
    });
    out[i] = s;
  }
  return normalize(out, 0.5);
}

// Bubble "blop": a sine whose pitch rises quickly, with a short decay.
function blop(f0, f1, seconds, seed) {
  const out = buffer(seconds);
  const noise = rng(seed);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const f = f0 + (f1 - f0) * (1 - Math.exp(-t / 0.03));
    phase += (TAU * f) / RATE;
    out[i] = envelope(t, 0.004, 0.05) * (Math.sin(phase) + 0.02 * (noise() - 0.5));
  }
  return normalize(out, 0.6);
}

// Bubble pop (noise burst + blop) followed by a shimmer of high partials.
function pop(baseHz, seed) {
  const seconds = 0.7;
  const out = buffer(seconds);
  const noise = rng(seed);
  const burst = lowPass(Float32Array.from(out, () => noise() * 2 - 1), 3500);
  const body = blop(baseHz, baseHz * 2.2, seconds, seed + 1);
  const shimmer = [3, 4.5, 6, 8].map((m) => baseHz * m);
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    let s = burst[i] * envelope(t, 0.001, 0.012) * 0.8 + body[i];
    const shimmerEnv = t < 0.05 ? 0 : envelope(t - 0.05, 0.03, 0.18);
    shimmer.forEach((f, n) => {
      s += (0.12 * shimmerEnv * Math.sin(TAU * f * t + n)) / (n + 1);
    });
    out[i] = s;
  }
  return normalize(out, 0.7);
}

// Airy whoosh: low-passed noise with a sweeping cutoff and a bell envelope.
function whoosh(seconds = 1.1, seed = 71) {
  const out = buffer(seconds);
  const noise = rng(seed);
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const p = t / seconds;
    const cutoff = 300 + 2600 * Math.sin(Math.PI * p);
    const k = 1 - Math.exp((-TAU * cutoff) / RATE);
    y1 += k * (noise() * 2 - 1 - y1);
    y2 += k * (y1 - y2);
    out[i] = y2 * Math.sin(Math.PI * p) ** 2;
  }
  return normalize(out, 0.55);
}

// Soft close: a falling two-note sine.
function close(seconds = 0.45) {
  const out = buffer(seconds);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const f = 660 - 260 * Math.min(1, t / 0.25);
    phase += (TAU * f) / RATE;
    out[i] = envelope(t, 0.01, 0.11) * (Math.sin(phase) + 0.25 * Math.sin(2 * phase));
  }
  return normalize(out, 0.5);
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const SOUNDS = {
  ambience: ambience(10),
  'hover-1': blop(420, 760, 0.22, 11),
  'hover-2': blop(500, 880, 0.2, 12),
  'hover-3': blop(370, 690, 0.24, 13),
  'click-1': pop(330, 21),
  'click-2': pop(392, 31),
  whoosh: whoosh(),
  close: close(),
};

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [name, samples] of Object.entries(SOUNDS)) {
  const bytes = wav(samples);
  writeFileSync(join(OUT, `${name}.wav`), bytes);
  total += bytes.length;
  console.log(`${name}.wav  ${(bytes.length / 1024).toFixed(1)} KB`);
}
console.log(`total ${(total / 1024).toFixed(1)} KB -> ${OUT}`);
