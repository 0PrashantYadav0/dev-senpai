/**
 * The showreel's timing, shared by the site's motion kit. Pure functions
 * and constants with no DOM, so they run under `node --test` and every frame
 * is a function of time: the same inputs always draw the same thing.
 *
 * The numbers come from videos/prashant-showreel: 128 BPM, GSAP's eases, the
 * chrome's label decoder, the stack scene's slot reel, the stdlib scene's
 * odometer and the wins scene's three entrances.
 */

/** One beat at the reel's 128 BPM, in seconds. */
export const BEAT = 60 / 128;

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/* GSAP's curves of the same names. GSAP counts powers from Quad, so power3
   is a quartic and power4 a quintic. */
export const power3Out = (t: number): number => 1 - Math.pow(1 - clamp01(t), 4);
export const power4Out = (t: number): number => 1 - Math.pow(1 - clamp01(t), 5);
export const expoOut = (t: number): number => {
  const p = clamp01(t);
  return p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
};
export const backOut =
  (s = 1.70158) =>
  (t: number): number => {
    // Ends pinned: the polynomial leaves ~2e-16 at 0 for some overshoots.
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const p = t - 1;
    return 1 + (s + 1) * p * p * p + s * p * p;
  };

/** The reel's integer hash, mapped to [0, 1). */
export function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

/** A stable seed for a string (FNV-1a), so each label flickers its own way. */
export function seedFor(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>";

/**
 * The reel's label decoder. At progress p (0..1) characters settle left to
 * right; the rest flicker through GLYPHS, re-seeded 20 times over the run.
 * Spaces always pass through so the word shapes hold.
 */
export function scramble(target: string, p: number, seed: number): string {
  const q = Math.floor(clamp01(p) * 20);
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (ch === " " || i < p * target.length * 1.15) out += ch;
    else out += GLYPHS[Math.floor(hash(seed * 131 + i * 17 + q) * GLYPHS.length)];
  }
  return out;
}

export interface TypeOptions {
  /** When the first character appears, in seconds. */
  start?: number;
  /** Seconds between characters. */
  step?: number;
  /** Extra seconds after punctuation. */
  pause?: number;
}

const PAUSE_AFTER = new Set([",", ".", "!", "?", ":"]);

/**
 * When each character of `text` appears, in seconds: `step` per character,
 * an extra `pause` after punctuation, and up to ±4ms of jitter from a hash,
 * so it reads as typed yet plays the same every time. Strictly increasing.
 */
export function typeTimes(
  text: string,
  { start = 0.3, step = 0.04, pause = 0.04 }: TypeOptions = {},
): number[] {
  const amp = Math.min(0.004, step / 4);
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    if (i > 0) t += step + (PAUSE_AFTER.has(text[i - 1]) ? pause : 0);
    const jitter = i === 0 ? 0 : (hash(i * 7919 + text.length) * 2 - 1) * amp;
    times.push(t + jitter);
  }
  return times;
}

/**
 * Click times for a slot reel of n steps: the first at 0.075s, each gap
 * 12.5% longer than the last, so the reel slows the way the stack scene's
 * does ([0.075, 0.16, 0.25, 0.35, 0.465, 0.6, 0.76, 0.935] for eight).
 */
export function reelClicks(n: number): number[] {
  const out: number[] = [];
  let t = 0;
  for (let k = 0; k < n; k++) {
    t += 0.075 * Math.pow(1.125, k);
    out.push(t);
  }
  return out;
}

/**
 * The reel's fractional word index at time t: each click eases the next word
 * on with power3.out over min(70ms, 0.7 × the gap); the last click overshoots
 * with back.out(2.2) over 0.34s and settles on clicks.length.
 */
export function reelPos(t: number, clicks: number[]): number {
  let pos = 0;
  for (let j = 0; j < clicks.length; j++) {
    if (t < clicks[j]) break;
    const last = j === clicks.length - 1;
    const dur = last ? 0.34 : Math.min(0.07, (clicks[j + 1] - clicks[j]) * 0.7);
    const ease = last ? backOut(2.2) : power3Out;
    pos = j + ease((t - clicks[j]) / dur);
  }
  return pos;
}

/** How long a reel with these clicks runs, in seconds. */
export const reelDuration = (clicks: number[]): number =>
  clicks.length ? clicks[clicks.length - 1] + 0.34 : 0;

/**
 * The words for "fluent in ___": the languages in data order with `last`
 * moved to the end, and a full stop on whichever word ends the reel.
 */
export function reelWords(languages: string[], last = "Go"): string[] {
  const words = languages.filter((l) => l !== last);
  if (languages.includes(last)) words.push(last);
  if (words.length) words[words.length - 1] += ".";
  return words;
}

/** How long a count runs, in seconds (the reel's merge sequence). */
export const COUNT_SECONDS = 1.06;

const K = 66.7;

/** The reel's count curve: fast off the mark, long settle. 0 → 0, 1 → 1. */
export function countCurve(p: number): number {
  const x = clamp01(p);
  return x === 1 ? 1 : (1 - Math.pow(K, -x)) / (1 - 1 / K);
}

/**
 * Strip offsets (0..10) per place of a mechanical odometer showing v, ones
 * first. The ones strip turns continuously; a higher place only turns while
 * every place below it rolls from 9 to 0. For whole numbers each offset is
 * that place's digit (145 gives [5, 4, 1]).
 */
export function digitPositions(v: number, places: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < places; k++) {
    if (k === 0) {
      out.push(v % 10);
      continue;
    }
    const unit = Math.pow(10, k);
    const carry = Math.max(0, (v % unit) - (unit - 1));
    out.push((Math.floor(v / unit) % 10) + carry);
  }
  return out;
}

export interface OdometerCell {
  /** The character shown once the count has landed. */
  ch: string;
  /** Place value for digits (0 = ones); -1 for separators and signs. */
  place: number;
  /** For separators: the place of the digit to their left, whose fade they follow. */
  after: number;
}

/** The cells of an odometer for `value`, formatted as en-US ("1,234"). */
export function odometerCells(value: number): OdometerCell[] {
  const text = Math.round(value).toLocaleString("en-US");
  let place = text.replace(/\D/g, "").length;
  let last = -1;
  return [...text].map((ch) => {
    if (/\d/.test(ch)) {
      place -= 1;
      last = place;
      return { ch, place, after: -1 };
    }
    return { ch, place: -1, after: last };
  });
}

/**
 * When a line unzipping outwards with power3.out over `duration` seconds
 * reaches `fraction` (0..1) of its half-length.
 */
export function unzipTime(fraction: number, duration: number): number {
  return duration * (1 - Math.pow(1 - clamp01(fraction), 1 / 4));
}

export interface Pose {
  x: number; // px
  y: number; // px
  scale: number;
  rotate: number; // deg
  skewX: number; // deg
  blur: number; // px
}

export const REST: Pose = { x: 0, y: 0, scale: 1, rotate: 0, skewX: 0, blur: 0 };

export interface Entrance {
  from: Partial<Pose>;
  duration: number;
  ease: (t: number) => number;
}

/** The wins scene's three entrances, scaled from 1080p to the column. */
export const SLAMS: Entrance[] = [
  { from: { scale: 1.5, blur: 14 }, duration: 0.24, ease: power4Out },
  { from: { x: -40, skewX: -16 }, duration: 0.3, ease: expoOut },
  { from: { y: 28, rotate: 6 }, duration: 0.36, ease: backOut(1.6) },
];

/** Where an entrance is `t` seconds in: its `from` pose at 0, REST at the end. */
export function poseAt(e: Entrance, t: number): Pose {
  const k = e.ease(t / e.duration);
  const from: Pose = { ...REST, ...e.from };
  const mix = (a: number, b: number) => a + (b - a) * k;
  return {
    x: mix(from.x, REST.x),
    y: mix(from.y, REST.y),
    scale: mix(from.scale, REST.scale),
    rotate: mix(from.rotate, REST.rotate),
    skewX: mix(from.skewX, REST.skewX),
    blur: Math.max(0, mix(from.blur, REST.blur)),
  };
}

/** A pose as CSS transform and filter values. */
export function poseCss(p: Pose): { transform: string; filter: string } {
  return {
    transform:
      `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${p.rotate.toFixed(3)}deg) ` +
      `skewX(${p.skewX.toFixed(3)}deg) scale(${p.scale.toFixed(4)})`,
    filter: p.blur > 0.05 ? `blur(${p.blur.toFixed(2)}px)` : "none",
  };
}
