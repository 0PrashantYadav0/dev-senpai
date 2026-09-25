// Original score for the reel, written to the edit.
// 128 BPM, 8 bars of 4/4 = exactly 15.000 s. F minor: i - VI - III - VII.
// Everything is synthesized here except a few Pixabay-licensed one-shots from
// the media-use bundle (impacts, whooshes, key presses, glitch texture).
//
//   node audio/score.mjs            -> assets/audio/score.wav
//
// Cue times mirror the scene timings in compositions/*.html (global seconds).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SFX = path.join(
  process.env.HOME,
  ".claude/skills/media-use/audio/assets/sfx",
);
const OUT = path.join(ROOT, "assets/audio/score.wav");

const SR = 48000;
const DUR = 15.0;
const N = Math.round(SR * DUR);
const BPM = 128;
const BEAT = 60 / BPM; // 0.46875
const BAR = 4 * BEAT; // 1.875
const S8 = BEAT / 2;
const S16 = BEAT / 4;
const S32 = BEAT / 8;

// ---------------------------------------------------------------- utilities
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260925);
const noise = () => rnd() * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const db = (d) => Math.pow(10, d / 20);

function bus() {
  return { L: new Float32Array(N), R: new Float32Array(N) };
}
const B = {
  drums: bus(),
  bass: bus(),
  pad: bus(),
  pluck: bus(),
  fx: bus(),
  sfx: bus(),
  rev: bus(),
  dly: bus(),
};
function add(b, i, l, r) {
  if (i >= 0 && i < N) {
    b.L[i] += l;
    b.R[i] += r;
  }
}
function pan(p) {
  const a = ((clamp(p, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(a), Math.sin(a)];
}

class Biquad {
  constructor(type, f, q = 0.707, gainDb = 0) {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(type, f, q, gainDb);
  }
  set(type, f, q = 0.707, gainDb = 0) {
    const w = (2 * Math.PI * clamp(f, 10, SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const sn = Math.sin(w);
    const al = sn / (2 * q);
    const A = Math.pow(10, gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === "lp") {
      b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2;
      a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al;
    } else if (type === "hp") {
      b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2;
      a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al;
    } else if (type === "bp") {
      b0 = al; b1 = 0; b2 = -al;
      a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al;
    } else if (type === "peak") {
      b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A;
      a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A;
    } else if (type === "hs") {
      const sq = 2 * Math.sqrt(A) * al;
      b0 = A * (A + 1 + (A - 1) * cs + sq);
      b1 = -2 * A * (A - 1 + (A + 1) * cs);
      b2 = A * (A + 1 + (A - 1) * cs - sq);
      a0 = A + 1 - (A - 1) * cs + sq;
      a1 = 2 * (A - 1 - (A + 1) * cs);
      a2 = A + 1 - (A - 1) * cs - sq;
    } else throw new Error(type);
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// Zavalishin TPT state-variable filter; safe under per-sample modulation.
class SVF {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
  }
  run(x, f, q) {
    const g = Math.tan((Math.PI * clamp(f, 20, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.ic2;
    const v1 = a1 * this.ic1 + a2 * v3;
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.bp = v1;
    return v2; // low-pass
  }
}

function polyblep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

// ------------------------------------------------------------------ samples
function loadSample(name) {
  const buf = execFileSync("ffmpeg", [
    "-v", "error", "-i", path.join(SFX, name),
    "-f", "f32le", "-ac", "2", "-ar", String(SR), "-",
  ], { maxBuffer: 64 * 1024 * 1024 });
  const f = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  const len = f.length / 2;
  const L = new Float32Array(len);
  const R = new Float32Array(len);
  let peak = 0;
  let peakAt = 0;
  for (let i = 0; i < len; i++) {
    L[i] = f[2 * i];
    R[i] = f[2 * i + 1];
    const a = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (a > peak) {
      peak = a;
      peakAt = i;
    }
  }
  let onset = 0;
  for (let i = 0; i < len; i++) {
    if (Math.max(Math.abs(L[i]), Math.abs(R[i])) > peak * 0.2) {
      onset = i;
      break;
    }
  }
  return { L, R, len, peak, peakAt, onset };
}

// Place a sample so its onset / peak / slice start / slice end lands at time t.
// from/to slice the source in seconds; rate != 1 varispeeds it.
function place(s, t, { g = 1, align = "onset", rate = 1, bus = B.sfx, from: fromS = 0, to = null, fadeOut = 0.01, pan: p = 0, rev = 0 } = {}) {
  const from = Math.round(fromS * SR);
  const end = to == null ? s.len : Math.min(s.len, Math.round(to * SR));
  const anchor = align === "peak" ? s.peakAt : align === "start" ? from : align === "end" ? end : s.onset;
  const start = Math.round(t * SR - (anchor - from) / rate);
  const outLen = Math.floor((end - from) / rate);
  const fo = Math.max(1, Math.round(fadeOut * SR));
  const [pl, pr] = pan(p);
  for (let j = 0; j < outLen; j++) {
    const pos = from + j * rate;
    const i0 = Math.floor(pos);
    const fr = pos - i0;
    if (i0 + 1 >= s.len) break;
    let l = s.L[i0] * (1 - fr) + s.L[i0 + 1] * fr;
    let r = s.R[i0] * (1 - fr) + s.R[i0 + 1] * fr;
    const tail = outLen - j;
    const e = tail < fo ? tail / fo : 1;
    l *= g * e * pl * 1.4142;
    r *= g * e * pr * 1.4142;
    add(bus, start + j, l, r);
    if (rev) add(B.rev, start + j, l * rev, r * rev);
  }
}

// ---------------------------------------------------------------- instruments
function kick(t0, g = 1) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round(0.42 * SR);
  const hp = new Biquad("hp", 1200, 0.7);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 46 + 150 * Math.exp(-t / 0.026) + 26 * Math.exp(-t / 0.16);
    ph += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / 0.0012) * Math.exp(-t / 0.26);
    let s = Math.sin(ph) * env;
    s += hp.run(noise()) * Math.exp(-t / 0.005) * 0.3;
    s = Math.tanh(1.9 * s) * 0.92 * g;
    add(B.drums, i0 + i, s, s);
  }
}

function clap(t0, g = 1, revAmt = 0.22) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round(0.4 * SR);
  const bp = new Biquad("bp", 1250, 0.8);
  const hp = new Biquad("hp", 700, 0.7);
  const offs = [0, 0.0085, 0.017, 0.028];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let e = 0;
    for (const o of offs) if (t >= o) e = Math.max(e, Math.exp(-(t - o) / 0.0055));
    const tail = t > 0.028 ? Math.exp(-(t - 0.028) / 0.1) * 0.55 : 0;
    const s = hp.run(bp.run(noise())) * (e + tail) * 2.2 * g;
    add(B.drums, i0 + i, s * 0.95, s);
    add(B.rev, i0 + i, s * revAmt, s * revAmt);
  }
}

const HAT_F = [205.3, 304.4, 369.6, 522.7, 540, 800];
function hat(t0, { open = false, g = 1, p = 0 } = {}) {
  const i0 = Math.round(t0 * SR);
  const decay = open ? 0.13 : 0.028;
  const len = Math.round((open ? 0.45 : 0.1) * SR);
  const bp = new Biquad("bp", 10500, 0.9);
  const hp = new Biquad("hp", 7200, 0.7);
  const ph = HAT_F.map(() => rnd());
  const [pl, pr] = pan(p);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let m = 0;
    for (let k = 0; k < 6; k++) {
      ph[k] = (ph[k] + (HAT_F[k] * 2.0) / SR) % 1;
      m += ph[k] < 0.5 ? 1 : -1;
    }
    m /= 6;
    const s = hp.run(bp.run(m * 0.55 + noise() * 0.45)) * Math.exp(-t / decay) * 1.6 * g;
    add(B.drums, i0 + i, s * pl, s * pr);
  }
}

function crash(t0, g = 1) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round(2.6 * SR);
  const hpL = new Biquad("hp", 4200, 0.6);
  const hpR = new Biquad("hp", 4200, 0.6);
  const pkL = new Biquad("peak", 8500, 1.2, 5);
  const pkR = new Biquad("peak", 8500, 1.2, 5);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = (Math.exp(-t / 0.05) * 0.6 + Math.exp(-t / 0.95)) * Math.min(1, t / 0.002);
    const l = pkL.run(hpL.run(noise())) * env * 0.55 * g;
    const r = pkR.run(hpR.run(noise())) * env * 0.55 * g;
    add(B.drums, i0 + i, l, r);
    add(B.rev, i0 + i, l * 0.3, r * 0.3);
  }
}

function boom(t0, g = 1, len = 1.6) {
  const i0 = Math.round(t0 * SR);
  const n = Math.round(len * SR);
  let ph = 0;
  const lp = new Biquad("lp", 180, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 34 + 70 * Math.exp(-t / 0.09);
    ph += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.55);
    let s = Math.sin(ph) * env + lp.run(noise()) * Math.exp(-t / 0.05) * 0.6;
    s = Math.tanh(1.6 * s) * g;
    add(B.fx, i0 + i, s, s);
  }
}

function bassNote(t0, dur, m, g = 1) {
  const i0 = Math.round(t0 * SR);
  const f = midi(m);
  const dt = f / SR;
  const svf = new SVF();
  let ph = 0;
  let ph2 = 0;
  const len = Math.round((dur + 0.04) * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    ph2 += dt;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const sub = Math.sin(2 * Math.PI * ph2);
    const cutoff = 170 + 1500 * Math.exp(-t / 0.06);
    const y = svf.run(saw, cutoff, 0.95);
    const rel = t < dur ? 1 : Math.exp(-(t - dur) / 0.012);
    const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.4) * rel;
    const s = Math.tanh((y * 0.9 + sub * 0.75) * 1.25) * env * g;
    add(B.bass, i0 + i, s, s);
  }
}

// Pad: three detuned saws per note through a low-pass; cutoff may be a function.
function padChord(t0, dur, notes, { g = 1, cutoff = 1600, attack = 0.25, release = 0.5, revAmt = 0.35 } = {}) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round((dur + release) * SR);
  const det = [-9, 0, 9];
  const pans = [-0.65, 0, 0.65];
  const voices = [];
  for (const m of notes)
    for (let v = 0; v < 3; v++)
      voices.push({ dt: midi(m + det[v] / 100) / SR, ph: rnd(), p: pan(pans[v]) });
  const fL = new SVF();
  const fR = new SVF();
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    for (const vo of voices) {
      vo.ph += vo.dt;
      if (vo.ph >= 1) vo.ph -= 1;
      const s = 2 * vo.ph - 1 - polyblep(vo.ph, vo.dt);
      l += s * vo.p[0];
      r += s * vo.p[1];
    }
    const c = typeof cutoff === "function" ? cutoff(t0 + t) : cutoff;
    l = fL.run(l, c, 0.8);
    r = fR.run(r, c, 0.8);
    const a = Math.min(1, t / attack);
    const rl = t < dur ? 1 : Math.exp(-(t - dur) / (release / 4));
    const e = (a * a * (3 - 2 * a)) * rl * g * 0.08;
    add(B.pad, i0 + i, l * e, r * e);
    add(B.rev, i0 + i, l * e * revAmt, r * e * revAmt);
  }
}

function pluck(t0, m, { g = 1, p = 0, dly = 0.28, revAmt = 0.18, bright = 1 } = {}) {
  const i0 = Math.round(t0 * SR);
  const f = midi(m);
  const dt = f / SR;
  const svf = new SVF();
  let ph = rnd();
  const len = Math.round(0.5 * SR);
  const [pl, pr] = pan(p);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const sq = (ph < 0.5 ? 1 : -1) + polyblep(ph, dt) - polyblep((ph + 0.5) % 1, dt);
    const cutoff = 260 + 5200 * bright * Math.exp(-t / 0.055);
    const y = svf.run(saw * 0.6 + sq * 0.4, cutoff, 1.1);
    const s = y * Math.min(1, t / 0.002) * Math.exp(-t / 0.15) * g * 0.5;
    add(B.pluck, i0 + i, s * pl, s * pr);
    add(B.dly, i0 + i, s * pl * dly, s * pr * dly);
    add(B.rev, i0 + i, s * pl * revAmt, s * pr * revAmt);
  }
}

// FM bell for UI moments; pitched into the chord of the bar.
function bell(t0, m, { g = 1, p = 0, decay = 0.45, ratio = 3.5, index = 2.2, revAmt = 0.3 } = {}) {
  const i0 = Math.round(t0 * SR);
  const f = midi(m);
  const len = Math.round((decay * 4 + 0.05) * SR);
  const [pl, pr] = pan(p);
  let pc = 0;
  let pm = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    pm += (2 * Math.PI * f * ratio) / SR;
    const idx = index * Math.exp(-t / (decay * 0.35));
    pc += (2 * Math.PI * f) / SR;
    const s = Math.sin(pc + idx * Math.sin(pm)) * Math.min(1, t / 0.0015) * Math.exp(-t / decay) * g * 0.32;
    add(B.fx, i0 + i, s * pl, s * pr);
    add(B.rev, i0 + i, s * pl * revAmt, s * pr * revAmt);
  }
}

function tick(t0, { g = 1, f = 3200, p = 0 } = {}) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round(0.03 * SR);
  const hp = new Biquad("hp", 2500, 0.7);
  const [pl, pr] = pan(p);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * f) / SR;
    const s = (Math.sin(ph) * Math.exp(-t / 0.004) + hp.run(noise()) * Math.exp(-t / 0.0015) * 0.7) * g * 0.35;
    add(B.fx, i0 + i, s * pl, s * pr);
  }
}

function riser(t0, t1, { g = 1, f0 = 350, f1 = 9000, tone = true } = {}) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round((t1 - t0) * SR);
  const sL = new SVF();
  const sR = new SVF();
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    const f = f0 * Math.pow(f1 / f0, p);
    const amp = Math.pow(p, 2.1) * g;
    sL.run(noise(), f, 2.2);
    sR.run(noise(), f * 1.03, 2.2);
    let l = sL.bp * amp * 1.6;
    let r = sR.bp * amp * 1.6;
    if (tone) {
      ph += (2 * Math.PI * (160 * Math.pow(9, p))) / SR;
      const s = Math.sin(ph) * Math.pow(p, 3) * g * 0.18;
      l += s;
      r += s;
    }
    add(B.fx, i0 + i, l, r);
    add(B.rev, i0 + i, l * 0.25, r * 0.25);
  }
}

function whoosh(t0, dur, { g = 1, p0 = -0.8, p1 = 0.8, fLo = 500, fHi = 3400 } = {}) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  const svf = new SVF();
  for (let i = 0; i < len; i++) {
    const p = i / len;
    const shape = Math.pow(Math.sin(Math.PI * p), 1.6);
    const f = fLo + (fHi - fLo) * Math.sin(Math.PI * Math.min(1, p * 1.15));
    svf.run(noise(), f, 1.4);
    const s = svf.bp * shape * g * 1.3;
    const [pl, pr] = pan(p0 + (p1 - p0) * p);
    add(B.fx, i0 + i, s * pl, s * pr);
    add(B.rev, i0 + i, s * pl * 0.2, s * pr * 0.2);
  }
}

// A short saw-chord stab (slam accents).
function stab(t0, notes, { g = 1, dur = 0.22 } = {}) {
  const i0 = Math.round(t0 * SR);
  const len = Math.round((dur + 0.3) * SR);
  const vs = [];
  for (const m of notes) for (const d of [-7, 7]) vs.push({ dt: midi(m + d / 100) / SR, ph: rnd(), p: pan(d < 0 ? -0.5 : 0.5) });
  const fl = new SVF();
  const fr = new SVF();
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    for (const v of vs) {
      v.ph += v.dt;
      if (v.ph >= 1) v.ph -= 1;
      const s = 2 * v.ph - 1 - polyblep(v.ph, v.dt);
      l += s * v.p[0];
      r += s * v.p[1];
    }
    const c = 400 + 6000 * Math.exp(-t / 0.08);
    const env = Math.min(1, t / 0.002) * (t < dur ? Math.exp(-t / 0.35) : Math.exp(-dur / 0.35) * Math.exp(-(t - dur) / 0.05)) * g * 0.09;
    l = fl.run(l, c, 0.9) * env;
    r = fr.run(r, c, 0.9) * env;
    add(B.pluck, i0 + i, l, r);
    add(B.rev, i0 + i, l * 0.35, r * 0.35);
  }
}

// --------------------------------------------------------------- arrangement
const F = { F3: 53, Ab3: 56, C4: 60, Db4: 61, Eb3: 51, G3: 55, Bb3: 58, Db3: 49, G4: 67, Eb4: 63, F4: 65 };
const CHORDS = [
  // pad voicing, bass root, arp tones (octave 4-5)
  { pad: [F.F3, F.Ab3, F.C4, F.G4], root: 41, arp: [65, 68, 72, 77, 80] }, // bar 0 intro Fm(add9)
  { pad: [F.F3, F.Ab3, F.C4], root: 41, arp: [65, 68, 72, 77, 80] }, // bar 1 Fm
  { pad: [F.F3, F.Ab3, F.Db4, 60], root: 37, arp: [61, 65, 68, 73, 77] }, // bar 2 Db(maj7)
  { pad: [F.Eb3, F.Ab3, F.C4], root: 44, arp: [63, 68, 72, 75, 80] }, // bar 3 Ab
  { pad: [F.Eb3, F.G3, F.Bb3], root: 39, arp: [63, 67, 70, 75, 79] }, // bar 4 Eb
  { pad: [F.F3, F.Ab3, F.C4], root: 41, arp: [65, 68, 72, 77, 80] }, // bar 5 Fm
  { pad: [F.F3, F.Ab3, F.Db4], root: 37, arp: [61, 65, 68, 73, 77] }, // bar 6 Db -> Eb
  { pad: [F.F3, F.Ab3, F.C4, F.G4], root: 41, arp: [65, 68, 72, 79, 84] }, // bar 7 Fm(add9)
];
const barT = (b) => b * BAR;

const kicks = [];
const K = (t, g = 1) => {
  kicks.push(t);
  kick(t, g);
};

// -- samples
const S = {
  impact1: loadSample("impact-bass-1.mp3"),
  impact2: loadSample("impact-bass-2.mp3"),
  whooshS: loadSample("whoosh-short.mp3"),
  whooshC: loadSample("whoosh-cinematic.mp3"),
  key: loadSample("key-press.mp3"),
  glitch1: loadSample("glitch-1.mp3"),
  glitch3: loadSample("glitch-3.mp3"),
  clickSoft: loadSample("click-soft.mp3"),
  riser: loadSample("riser.mp3"),
};

// ===== Bar 0 — S1 HELLO (0 - 1.875): intimate. typing, the cursor pops, the line unzips.
padChord(0.0, 1.8, CHORDS[0].pad, { g: 0.55, attack: 0.9, release: 0.08, cutoff: (t) => 500 + 1500 * clamp(t / 1.8, 0, 1), revAmt: 0.5 });
const TYPE_T = [0.3, 0.345, 0.392, 0.47, 0.512, 0.55, 0.59, 0.628, 0.668, 0.705, 0.745, 0.786, 0.84, 0.88, 0.918, 0.957, 0.996];
TYPE_T.forEach((t, i) => place(S.key, t, { g: 0.55, rate: 0.94 + 0.12 * rnd(), pan: -0.35 + (0.7 * i) / 16 }));
bell(1.15, 84, { g: 0.55, decay: 0.12, ratio: 2, index: 1.2 }); // cursor -> dot
tick(1.15, { g: 0.8, f: 2400 });
whoosh(1.2, 0.5, { g: 0.55, p0: 0, p1: 0, fLo: 700, fHi: 4200 }); // line unzips both ways
place(S.whooshS, 1.43, { g: 0.35, align: "peak" });
riser(1.05, 1.845, { g: 0.55, f0: 300, f1: 8000 });
place(S.riser, 1.845, { g: 0.35, align: "end", from: S.riser.len / SR - 1.3, fadeOut: 0.02 });
for (let k = 0; k < 14; k++) {
  const t = 1.40625 + k * S32;
  if (t > 1.83) break;
  clap(t, 0.2 + 0.55 * (k / 13), 0.05);
}

// ===== Bars 1-6 groove
for (let b = 1; b <= 6; b++) {
  const t0 = barT(b);
  const ch = CHORDS[b];
  for (let q = 0; q < 4; q++) {
    const tb = t0 + q * BEAT;
    const lastBuild = b === 6 && q === 3;
    if (!lastBuild) K(tb, 1);
    if (q === 1 || q === 3) if (!lastBuild) clap(tb, 0.75);
    // off-beat bass
    if (!lastBuild) {
      const root = b === 6 && q >= 2 ? 39 : ch.root;
      bassNote(tb + S8, S8 * 0.82, root, 0.8);
    }
    // hats: 16ths, open on the off-beat
    for (let s = 0; s < 4; s++) {
      const th = tb + s * S16;
      if (s === 2) hat(th, { open: true, g: b === 6 ? 0.55 : 0.42, p: 0.15 });
      else hat(th, { g: (s === 0 ? 0.22 : 0.3) * (b === 6 ? 1.3 : 1), p: s % 2 ? -0.3 : 0.25 });
    }
  }
  // pad (bar 6 splits Db | Eb)
  if (b === 6) {
    padChord(t0, 2 * BEAT, ch.pad, { g: 0.7 });
    padChord(t0 + 2 * BEAT, 2 * BEAT - 0.06, [F.G3, F.Bb3, F.Eb4], { g: 0.75, cutoff: (t) => 1600 + 5000 * clamp((t - t0 - 2 * BEAT) / (2 * BEAT), 0, 1) });
  } else padChord(t0, BAR, ch.pad, { g: 0.7 });
  // pluck arp: 16ths, 3-3-3-3-4 accent pattern
  const pat = [0, 1, 2, 3, 2, 1, 0, 2, 4, 3, 2, 1, 3, 2, 1, 0];
  for (let s = 0; s < 16; s++) {
    if (b === 6 && s >= 12) break;
    const acc = [0, 3, 6, 9, 12].includes(s) ? 1 : 0.55;
    const arp = b === 6 && s >= 8 ? CHORDS[4].arp : ch.arp;
    pluck(t0 + s * S16, arp[pat[s]], { g: 0.5 * acc, p: s % 2 ? 0.35 : -0.35, bright: 0.6 + 0.4 * acc });
  }
}

// ===== S2 VOICE (1.875 - 3.75): the drop
boom(1.875, 0.9);
crash(1.875, 0.9);
place(S.impact1, 1.875, { g: 0.55, align: "onset" });
[2.344, 2.578, 2.813, 3.047].forEach((t, i) => bell(t, [77, 80, 84, 89][i], { g: 0.55, p: -0.5 + i * 0.33, decay: 0.28, ratio: 3, index: 1.6 }));
whoosh(3.5, 0.3, { g: 0.25, p0: 0.5, p1: -0.5, fLo: 900, fHi: 2400 });

// ===== S3 ON THE LINE (3.75 - 5.625): node blips as the call is routed
[3.75, 3.867, 3.984].forEach((t) => tick(t, { g: 0.45, f: 2600 })); // the three headline lines
[4.219, 4.453, 4.688, 4.922, 5.156].forEach((t, i) => bell(t, [73, 77, 80, 84, 85][i], { g: 0.5, p: -0.6 + i * 0.3, decay: 0.16, ratio: 1.0, index: 0.9 }));

// ===== S4 OBSERVABILITY (5.625 - 7.5): split, scan, lock
whoosh(5.625, 0.28, { g: 0.35, p0: 0, p1: 0, fLo: 1200, fHi: 5200 });
riser(5.95, 6.55, { g: 0.22, f0: 1500, f1: 7000, tone: false });
bell(6.563, 80, { g: 0.6, decay: 0.55, ratio: 3.5, index: 2.0 });
bell(6.563, 87, { g: 0.4, decay: 0.55, ratio: 3.5, index: 2.0, p: 0.3 });
tick(6.563, { g: 0.9, f: 3600 });
place(S.whooshS, 7.47, { g: 0.55, align: "peak", pan: 0.2 }); // whip into S5
whoosh(7.33, 0.3, { g: 0.4, p0: 0.8, p1: -0.8, fLo: 800, fHi: 4800 });

// ===== S5 STDLIB (7.5 - 9.375): merges tick with the count-up, lands on 145+
{
  const t0 = 7.6;
  const t1 = 8.66;
  const MERGES = 38;
  for (let k = 0; k < MERGES; k++) {
    // count follows expo.out, so merges thin out as the counter slows
    const u = k / (MERGES - 1);
    const t = t0 + (t1 - t0) * (-Math.log(1 - u * 0.985) / Math.log(1 / 0.015)) ;
    tick(t, { g: 0.35 + 0.25 * rnd(), f: 2600 + 1600 * (k / MERGES), p: -0.6 + 1.2 * rnd() });
  }
}
bell(8.672, 87, { g: 0.7, decay: 0.6, ratio: 2, index: 2.5 });
bell(8.672, 75, { g: 0.45, decay: 0.6, ratio: 2, index: 2.5 });
place(S.impact2, 8.672, { g: 0.35, align: "peak" });

// ===== S6 STACK (9.375 - 11.25): rotate, reel of languages, type wall
whoosh(9.3, 0.35, { g: 0.5, p0: -0.7, p1: 0.7, fLo: 600, fHi: 3800 });
[9.45, 9.535, 9.625, 9.725, 9.84, 9.975, 10.135, 10.31].forEach((t, i) =>
  place(S.clickSoft, t, { g: 0.55, rate: 0.9 + i * 0.05, pan: 0.2 }),
);
place(S.glitch3, 10.38, { g: 0.22, from: 0, to: 0.7, fadeOut: 0.2 });
riser(10.85, 11.24, { g: 0.3, f0: 600, f1: 6000, tone: false });

// ===== S7 WINS (11.25 - 13.125): three slams, then the build
const SLAMS = [11.25, 11.719, 12.188];
const STABS = [[F.F3, F.Ab3, F.Db4], [F.F3, F.Ab3, F.Db4], [F.G3, F.Bb3, F.Eb4]];
SLAMS.forEach((t, i) => {
  place(S.impact1, t, { g: 0.42 + 0.08 * i, align: "onset" });
  stab(t, STABS[i], { g: 0.85 });
  place(S.glitch1, t, { g: 0.14, from: 0, to: 0.16, fadeOut: 0.04, pan: i - 1 });
});
for (let k = 0; k < 16; k++) {
  const t = 12.65625 + k * (S32 * 0.85);
  if (t > 13.05) break;
  clap(t, 0.25 + 0.6 * (k / 15), 0.05);
}
riser(12.45, 13.06, { g: 0.5, f0: 400, f1: 9500 });

// ===== S8 CONTACT (13.125 - 15): resolve on Fm(add9) and let it ring
K(13.125, 1.05);
boom(13.125, 1.0, 2.0);
crash(13.125, 1.0);
place(S.impact2, 13.125, { g: 0.6, align: "peak" });
stab(13.125, [F.F3, F.Ab3, F.C4, F.G4], { g: 0.7, dur: 0.5 });
bassNote(13.125, 1.2, 29, 0.7);
padChord(13.125, 1.4, CHORDS[7].pad, { g: 0.8, attack: 0.02, release: 0.5, cutoff: (t) => 3200 - 2400 * clamp((t - 13.125) / 1.8, 0, 1), revAmt: 0.6 });
[0, 1, 2, 3, 4].forEach((k) => pluck(13.125 + 0.1 + k * S16, CHORDS[7].arp[k], { g: 0.5, p: -0.4 + k * 0.2, dly: 0.45, revAmt: 0.35 }));
whoosh(13.14, 0.44, { g: 0.32, p0: 0, p1: 0, fLo: 900, fHi: 5200 }); // the final line unzips both ways
[13.76, 13.8, 13.84, 13.88, 13.93, 13.97, 14.01].forEach((t, i) => place(S.key, t, { g: 0.28, rate: 1.0 + 0.04 * (i % 3) }));
bell(14.4, 96, { g: 0.18, decay: 0.2, ratio: 2, index: 0.8 });

// ------------------------------------------------------------------ effects
// Sidechain: pad, bass and plucks duck under every kick.
kicks.sort((a, b) => a - b);
let kp = -1;
for (let i = 0; i < N; i++) {
  while (kp + 1 < kicks.length && kicks[kp + 1] * SR <= i) kp++;
  const d = kp < 0 ? 10 : i / SR - kicks[kp];
  const e = d < 0.004 ? d / 0.004 : Math.exp(-(d - 0.004) / 0.13);
  const gp = 1 - 0.65 * e;
  const gb = 1 - 0.5 * e;
  const gl = 1 - 0.35 * e;
  B.pad.L[i] *= gp; B.pad.R[i] *= gp;
  B.bass.L[i] *= gb; B.bass.R[i] *= gb;
  B.pluck.L[i] *= gl; B.pluck.R[i] *= gl;
}

// Ping-pong delay, 3/16 note.
{
  const d = Math.round(3 * S16 * SR);
  const bufL = new Float32Array(N);
  const bufR = new Float32Array(N);
  const lp = new Biquad("lp", 4200, 0.7);
  const lp2 = new Biquad("lp", 4200, 0.7);
  for (let i = 0; i < N; i++) {
    const inL = B.dly.L[i];
    const inR = B.dly.R[i];
    const fbL = i >= d ? bufR[i - d] : 0;
    const fbR = i >= d ? bufL[i - d] : 0;
    bufL[i] = lp.run(inL + (inR * 0.5) + fbL * 0.38);
    bufR[i] = lp2.run(fbR * 0.38 + inR * 0.5);
    B.fx.L[i] += bufL[i] * 0.55;
    B.fx.R[i] += bufR[i] * 0.55;
  }
}

// Freeverb (Jezar), stereo.
function freeverb(inL, inR, { room = 0.84, damp = 0.35, wet = 1 } = {}) {
  const scale = SR / 44100;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((x) => Math.round(x * scale));
  const apT = [556, 441, 341, 225].map((x) => Math.round(x * scale));
  const spread = Math.round(23 * scale);
  const mk = (t) => ({ buf: new Float32Array(t), i: 0, store: 0 });
  const cl = combT.map(mk);
  const cr = combT.map((t) => mk(t + spread));
  const al = apT.map(mk);
  const ar = apT.map((t) => mk(t + spread));
  const oL = new Float32Array(N);
  const oR = new Float32Array(N);
  const comb = (c, x) => {
    const y = c.buf[c.i];
    c.store = y * (1 - damp) + c.store * damp;
    c.buf[c.i] = x + c.store * room;
    c.i = (c.i + 1) % c.buf.length;
    return y;
  };
  const ap = (a, x) => {
    const b = a.buf[a.i];
    const y = -x + b;
    a.buf[a.i] = x + b * 0.5;
    a.i = (a.i + 1) % a.buf.length;
    return y;
  };
  for (let i = 0; i < N; i++) {
    const x = (inL[i] + inR[i]) * 0.015;
    let l = 0;
    let r = 0;
    for (const c of cl) l += comb(c, x);
    for (const c of cr) r += comb(c, x);
    for (const a of al) l = ap(a, l);
    for (const a of ar) r = ap(a, r);
    oL[i] = l * wet;
    oR[i] = r * wet;
  }
  return [oL, oR];
}
const [rvL, rvR] = freeverb(B.rev.L, B.rev.R, { room: 0.86, damp: 0.3, wet: 2.6 });

// ------------------------------------------------------------------- master
const GAINS = { drums: db(-3), bass: db(-5), pad: db(-4), pluck: db(-7), fx: db(-4), sfx: db(-3) };
const mL = new Float32Array(N);
const mR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  let l = 0;
  let r = 0;
  for (const k of Object.keys(GAINS)) {
    l += B[k].L[i] * GAINS[k];
    r += B[k].R[i] * GAINS[k];
  }
  l += rvL[i] * db(-9);
  r += rvR[i] * db(-9);
  mL[i] = l;
  mR[i] = r;
}
// Rumble filter + a touch of air.
{
  const hl = new Biquad("hp", 26, 0.7), hr = new Biquad("hp", 26, 0.7);
  const al = new Biquad("hs", 9000, 0.7, 1.5), ar = new Biquad("hs", 9000, 0.7, 1.5);
  for (let i = 0; i < N; i++) {
    mL[i] = al.run(hl.run(mL[i]));
    mR[i] = ar.run(hr.run(mR[i]));
  }
}
// Glue compressor (RMS detector), then a soft-knee clipper.
{
  let env = 0;
  let gainDb = 0;
  const thr = -16;
  const ratio = 2.2;
  const atk = Math.exp(-1 / (0.012 * SR));
  const rel = Math.exp(-1 / (0.15 * SR));
  const rmsA = Math.exp(-1 / (0.01 * SR));
  for (let i = 0; i < N; i++) {
    const x = Math.max(Math.abs(mL[i]), Math.abs(mR[i]));
    env = rmsA * env + (1 - rmsA) * x * x;
    const lvl = 10 * Math.log10(env + 1e-12);
    const over = lvl - thr;
    const target = over > 0 ? -over * (1 - 1 / ratio) : 0;
    gainDb = target < gainDb ? atk * gainDb + (1 - atk) * target : rel * gainDb + (1 - rel) * target;
    const g = db(gainDb + 2.5);
    mL[i] *= g;
    mR[i] *= g;
  }
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(mL[i]), Math.abs(mR[i]));
const pre = 1.15 / peak;
for (let i = 0; i < N; i++) {
  mL[i] = Math.tanh(mL[i] * pre * 1.1) / Math.tanh(1.1 * 1.15);
  mR[i] = Math.tanh(mR[i] * pre * 1.1) / Math.tanh(1.1 * 1.15);
}
peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(mL[i]), Math.abs(mR[i]));
const norm = db(-1.0) / peak;
// Tail: the last half second breathes out to silence.
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fin = t < 0.004 ? t / 0.004 : 1;
  const fout = t > 14.55 ? Math.pow(clamp((15.0 - t) / 0.45, 0, 1), 2) : 1;
  mL[i] *= norm * fin * fout;
  mR[i] *= norm * fin * fout;
}

// --------------------------------------------------------------- write wav
function writeWav(file, L, R) {
  const bytes = 44 + N * 4;
  const buf = Buffer.alloc(bytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(bytes - 8, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(N * 4, 40);
  const d = mulberry32(7);
  for (let i = 0; i < N; i++) {
    const tl = (d() - d()) / 32768;
    const tr = (d() - d()) / 32768;
    buf.writeInt16LE(Math.round(clamp(L[i] + tl, -1, 1) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(clamp(R[i] + tr, -1, 1) * 32767), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}
writeWav(OUT, mL, mR);

// Loudness snapshot per bar, for a quick balance check.
const rows = [];
for (let b = 0; b < 8; b++) {
  let s = 0;
  let p = 0;
  const a = Math.round(b * BAR * SR);
  const z = Math.min(N, Math.round((b + 1) * BAR * SR));
  for (let i = a; i < z; i++) {
    s += mL[i] * mL[i] + mR[i] * mR[i];
    p = Math.max(p, Math.abs(mL[i]), Math.abs(mR[i]));
  }
  rows.push(`bar ${b}: rms ${(10 * Math.log10(s / (2 * (z - a)) + 1e-12)).toFixed(1)} dBFS, peak ${(20 * Math.log10(p + 1e-12)).toFixed(1)}`);
}
console.log(`wrote ${path.relative(ROOT, OUT)} (${DUR}s, ${SR} Hz)`);
console.log(rows.join("\n"));
