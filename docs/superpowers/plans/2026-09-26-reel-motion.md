# Reel Motion and Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the showreel's motion and type to the site. That means mono labels that decode, rules that draw a signal line, odometers, a typed hero intro, a packet down the experience list, wins that slam in, a language reel, a typed email and an index playhead. Each plays once and then the page sits still.

**Architecture:**
- The timing maths lives in `src/lib/motion.ts`, a pure module unit-tested with `node --test`.
- A small runtime, `src/components/motion/runtime.ts`, supplies a script that marks `<html data-motion>` before first paint.
- The shared `useReveal` hook plays each piece once.
- Every piece is a small client component. It renders its finished state on the server, then animates by writing to the DOM from requestAnimationFrame, or through CSS keyframes keyed on data attributes.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript (strict), Tailwind 3, plain CSS keyframes, requestAnimationFrame, IntersectionObserver, and Node 26's built-in test runner. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-26-reel-motion-design.md`. Read it before starting any task.

## Global Constraints

- **Branch.** Work on local `main`. Never push, never open a PR.
- **Commits.** Commit once per task. End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Staging.** Stage files by path only. Never run `git add -A`, `git add .` or `git commit -a`. The tree has a modified submodule `0PrashantYadav0`, which must not be committed. The showreel project in `videos/` is merged; leave it alone. Its renders are gitignored.
- **Dependencies.** None added, runtime or dev.
- **Colours.** Only the tokens: `hsl(var(--signal))`, `hsl(var(--foreground) / a)`, `hsl(var(--border))`, `hsl(var(--muted-foreground))`. No gradient washes, glows or card shadows. The packet's 1px trail is the only gradient.
- **Fonts.** Only the four already loaded by `next/font` in `src/app/layout.tsx`: `--font-display` (Young Serif), `--font-sans` (Instrument Sans), `--font-mono` (JetBrains Mono) and `--font-pixel` (Silkscreen).
- **Finished page first.** Every piece renders its finished state on the server. "Before" states apply only under `html[data-motion]:not([data-motion="static"])` inside `@media (prefers-reduced-motion: no-preference)`.
- **Motion behaviour.** Each piece plays once. Reduced motion is followed live. Only transform, opacity, filter or canvas drawing may animate, and every loop stops when its move ends.
- **Hands off.** Don't change the donut (`AsciiDonut.tsx`), the banner, the header, the footer, the chat dock, the contact form or the project filters.
- **Contact form.** Never submit it.
- **Builds.** `npm run build` rewrites `.next`. Before building, make sure no `next dev` is running on :3000 (`lsof -ti tcp:3000` prints nothing).
- **Copy.** The hero keeps its lowercase voice: "hi, prashant here". The contact sentence becomes exactly "Ask Dev Senpai anything about my work, or send a note and I will reply."
- **Headless checks** live outside the repo, in `V=/private/tmp/claude-501/-Users-prashantkumaryadav-Downloads-Project-dev-senpai/c8fd79a4-5a6c-4bd7-b65f-6e4c4b1255ff/scratchpad/verify`. `$V/check.sh [flags]` serves the current `.next` build on :3111, runs `$V/motion-check.mjs` in headless Chrome, then stops the server. Always build before running it. The flags:

  | Flag | What it does |
  |---|---|
  | `--quick` | Desktop motion check plus the reduced-motion check, on six pages. |
  | *(no flag)* | Full run: desktop, 390px mobile and a 1440×2400 "tall" window, plus reduced motion and JavaScript off. |
  | `--only /path` | One page only. |
  | `--hello` | Hero intro, reload, and a client-side first visit. |
  | `--live` | Reduced motion switched on mid-intro. |
  | `--slow` | Scripts held back 4s. |
  | `--skip-pages` | Only the flagged home checks. |
  | `--shots <dir>` | Full-page screenshots. |
  | `--no-marker` | Don't require `data-motion`. |

  A motion check fails if any `[data-reveal]` element still lacks `data-revealed`, or is hidden, after the page has been scrolled. It also fails on any console error or page error, which includes React hydration errors.

## Review Focus

These are the cases the spec implies but no unit test exercises. Most likely first:

1. **Short pages and tall screens.** A piece in the bottom of a page that can't scroll any further must still play. The owning task is Task 3 (`useReveal`'s at-bottom trigger), tested with `$V/check.sh --only /contact` and `--only /no-such-page` in full mode, where the 2400px-tall window can't scroll.
2. **Return visits.** On a second visit in the same tab the greeting must be there at first paint. When the first visit to home comes through a client-side link, the greeting must still type. Owner: Task 7, tested with `$V/check.sh --hello --skip-pages`.
3. **Reduced motion switched on mid-move.** Nothing may stay hidden, and `data-hello` must clear. Owners: Task 3 (`useReveal`) and Task 7 (hero), tested with `$V/check.sh --live --skip-pages`.
4. **Scripts that arrive after 3s.** By 3.3s the page must be `data-motion="static"` with nothing hidden, and nothing may hide once the scripts arrive. Owners: Task 3 (head script timer) and Task 7 (the hello marker), tested with `$V/check.sh --slow --skip-pages`.
5. **Odometer number shapes.** 0, a single digit and thousands separators must render exactly as `toLocaleString("en-US")` does, with no leading zeros. Owners: Task 1 (`odometerCells` unit tests) and Task 5 (the GitHub stats render with separators, checked in the screenshots).

---

### Task 1: Motion maths and the test runner

**Files:**
- Create: `src/lib/motion.ts`
- Test: `src/lib/motion.test.ts`
- Modify: `package.json` (add the `test` script)
- Modify: `tsconfig.json` (add `allowImportingTsExtensions`)

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `@/lib/motion`, and used by Tasks 3 to 12):
  - `BEAT: number` (0.46875)
  - `clamp01(t: number): number`
  - `power3Out(t)`, `power4Out(t)`, `expoOut(t)`: `(t: number) => number`
  - `backOut(s?: number): (t: number) => number`
  - `hash(n: number): number`, `seedFor(text: string): number`
  - `GLYPHS: string`, `scramble(target: string, p: number, seed: number): string`
  - `TypeOptions { start?: number; step?: number; pause?: number }`, `typeTimes(text: string, opts?: TypeOptions): number[]`
  - `reelClicks(n: number): number[]`, `reelPos(t: number, clicks: number[]): number`, `reelDuration(clicks: number[]): number`, `reelWords(languages: string[], last?: string): string[]`
  - `COUNT_SECONDS: number` (1.06), `countCurve(p: number): number`, `digitPositions(v: number, places: number): number[]`
  - `OdometerCell { ch: string; place: number; after: number }`, `odometerCells(value: number): OdometerCell[]`
  - `unzipTime(fraction: number, duration: number): number`
  - `Pose { x; y; scale; rotate; skewX; blur }` (all numbers), `REST: Pose`
  - `Entrance { from: Partial<Pose>; duration: number; ease: (t: number) => number }`, `SLAMS: Entrance[]`
  - `poseAt(e: Entrance, t: number): Pose`, `poseCss(p: Pose): { transform: string; filter: string }`

- [ ] **Step 1: Add the test script and the TypeScript flag**

In `package.json`, add a `test` script after `lint`:

```json
    "lint": "next lint",
    "test": "node --test \"src/**/*.test.ts\""
```

In `tsconfig.json`, add this line inside `compilerOptions`, after `"noEmit": true,`:

```json
    "allowImportingTsExtensions": true,
```

Node 26 runs `.ts` files directly by stripping their types. A test imports `./motion.ts` with its extension, and this flag lets `tsc` (run by `next build`) accept that.

- [ ] **Step 2: Write the failing tests**

Create `src/lib/motion.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BEAT,
  GLYPHS,
  REST,
  SLAMS,
  backOut,
  clamp01,
  countCurve,
  digitPositions,
  expoOut,
  odometerCells,
  poseAt,
  poseCss,
  power3Out,
  power4Out,
  reelClicks,
  reelDuration,
  reelPos,
  reelWords,
  scramble,
  seedFor,
  typeTimes,
  unzipTime,
} from "./motion.ts";

const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

test("BEAT is one beat at 128 BPM", () => {
  assert.equal(BEAT, 0.46875);
});

test("eases start at 0 and land on 1", () => {
  for (const ease of [power3Out, power4Out, expoOut, backOut(), backOut(2.4)]) {
    assert.equal(ease(0), 0);
    assert.equal(ease(1), 1);
  }
});

test("eases clamp their input", () => {
  assert.equal(clamp01(1.5), 1);
  assert.equal(clamp01(-2), 0);
  assert.equal(power3Out(-1), 0);
  assert.equal(expoOut(2), 1);
});

test("power3Out and power4Out are GSAP's quartic and quintic", () => {
  assert.ok(near(power3Out(0.5), 1 - 0.5 ** 4));
  assert.ok(near(power4Out(0.5), 1 - 0.5 ** 5));
});

test("backOut overshoots before settling", () => {
  const ease = backOut(2.2);
  const peak = Math.max(...Array.from({ length: 101 }, (_, i) => ease(i / 100)));
  assert.ok(peak > 1.1 && peak < 1.2, `peak ${peak}`);
});

test("scramble settles to the target at p = 1", () => {
  assert.equal(scramble("03 / EXPERIENCE", 1, 7), "03 / EXPERIENCE");
});

test("scramble keeps length and spaces and draws from GLYPHS", () => {
  const target = "05 / OPEN SOURCE";
  const out = scramble(target, 0, 42);
  assert.equal(out.length, target.length);
  [...out].forEach((ch, i) => {
    if (target[i] === " ") assert.equal(ch, " ");
    else assert.ok(GLYPHS.includes(ch), `glyph ${ch}`);
  });
});

test("scramble is deterministic and settles left to right", () => {
  const target = "PKY / WORK";
  assert.equal(scramble(target, 0.3, 9), scramble(target, 0.3, 9));
  // i < 0.5 * 10 * 1.15 = 5.75, so the first six characters have settled.
  assert.equal(scramble(target, 0.5, 9).slice(0, 6), target.slice(0, 6));
});

test("seedFor is stable and tells labels apart", () => {
  assert.equal(seedFor("02 / GITHUB"), seedFor("02 / GITHUB"));
  assert.notEqual(seedFor("02 / GITHUB"), seedFor("03 / EXPERIENCE"));
});

test("typeTimes gives one strictly increasing time per character", () => {
  const times = typeTimes("hi, prashant here");
  assert.equal(times.length, 17);
  assert.equal(times[0], 0.3);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1]);
});

test("typeTimes lands the greeting near the reel's 0.996s", () => {
  const last = typeTimes("hi, prashant here", { start: 0.3, step: 0.04, pause: 0.04 }).at(-1)!;
  assert.ok(last >= 0.95 && last <= 1.05, `last ${last}`);
});

test("typeTimes pauses after punctuation", () => {
  const t = typeTimes("a,bc", { start: 0, step: 0.04, pause: 0.04 });
  assert.ok(t[2] - t[1] > t[3] - t[2] + 0.02);
});

test("typeTimes at the reel's URL pace stays increasing", () => {
  const t = typeTimes("devprashantkyadav@gmail.com", { start: 0, step: 0.016, pause: 0 });
  assert.equal(t.length, 27);
  for (let i = 1; i < t.length; i++) assert.ok(t[i] > t[i - 1]);
  assert.ok(t.at(-1)! < 0.45);
});

test("reelClicks(8) matches the reel within 30ms", () => {
  const reel = [0.075, 0.16, 0.25, 0.35, 0.465, 0.6, 0.76, 0.935];
  reelClicks(8).forEach((t, i) => assert.ok(Math.abs(t - reel[i]) <= 0.03, `click ${i}: ${t}`));
});

test("reelPos starts on the first word and ends on the last", () => {
  const clicks = reelClicks(9);
  assert.equal(reelPos(0, clicks), 0);
  assert.equal(reelPos(reelDuration(clicks) + 0.01, clicks), 9);
});

test("reelPos overshoots on the last click", () => {
  const clicks = reelClicks(9);
  const last = clicks[8];
  const peak = Math.max(...Array.from({ length: 35 }, (_, i) => reelPos(last + i / 100, clicks)));
  assert.ok(peak > 9.05, `peak ${peak}`);
});

test("reelWords moves Go to the end with a full stop", () => {
  assert.deepEqual(reelWords(["Go", "Python", "C"]), ["Python", "C", "Go."]);
  assert.deepEqual(reelWords(["Python", "C"]), ["Python", "C."]);
  assert.deepEqual(reelWords([]), []);
});

test("countCurve spans 0 to 1 and rises fast", () => {
  assert.equal(countCurve(0), 0);
  assert.equal(countCurve(1), 1);
  assert.equal(countCurve(3), 1);
  assert.ok(countCurve(0.25) > 0.6);
});

test("digitPositions lands on each digit for whole numbers", () => {
  assert.deepEqual(digitPositions(145, 3), [5, 4, 1]);
  assert.deepEqual(digitPositions(0, 1), [0]);
  assert.deepEqual(digitPositions(1234, 4), [4, 3, 2, 1]);
});

test("digitPositions carries like a mechanical odometer", () => {
  const [ones, tens, hundreds] = digitPositions(99.5, 3);
  assert.ok(near(ones, 9.5) && near(tens, 9.5) && near(hundreds, 0.5));
  assert.deepEqual(digitPositions(142.5, 3), [2.5, 4, 1]);
});

test("odometerCells gives each digit its place", () => {
  assert.deepEqual(
    odometerCells(145).map((c) => [c.ch, c.place]),
    [
      ["1", 2],
      ["4", 1],
      ["5", 0],
    ],
  );
  assert.deepEqual(odometerCells(0), [{ ch: "0", place: 0, after: -1 }]);
  assert.equal(odometerCells(7).length, 1);
});

test("odometerCells keeps separators with the digit before them", () => {
  const cells = odometerCells(1234);
  assert.equal(cells.map((c) => c.ch).join(""), "1,234");
  assert.deepEqual(cells[1], { ch: ",", place: -1, after: 3 });
});

test("unzipTime inverts power3Out", () => {
  for (const f of [0, 0.25, 0.49, 1]) assert.ok(near(power3Out(unzipTime(f, 1)), f, 1e-9));
  assert.equal(unzipTime(1, 0.5), 0.5);
});

test("each slam starts from its pose and ends at rest", () => {
  for (const e of SLAMS) {
    assert.deepEqual(poseAt(e, 0), { ...REST, ...e.from });
    assert.deepEqual(poseAt(e, e.duration), REST);
  }
});

test("poseCss renders rest with no blur", () => {
  const css = poseCss(REST);
  assert.equal(css.filter, "none");
  assert.match(css.transform, /scale\(1\.0000\)/);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL. Node can't find `./motion.ts` (`ERR_MODULE_NOT_FOUND`).

- [ ] **Step 4: Write the module**

Create `src/lib/motion.ts`:

```ts
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
    const p = clamp01(t) - 1;
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS. 27 tests, 0 failures.

- [ ] **Step 6: Lint and build**

Run: `npm run lint && npm run build`
Expected: `✔ No ESLint warnings or errors`, then a successful build with the same routes as before. Next type-checks `motion.test.ts`, and the new tsconfig flag lets it through.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json src/lib/motion.ts src/lib/motion.test.ts
git commit -m "feat(motion): the reel's timing maths with node --test coverage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Type system (static)

This task applies the reel's type treatment with no motion yet: the `.label` style, numbered section labels, bigger serif headings, the mono greeting, and mono dates, tech lists, captions and PR ages. Page titles change in Task 6.

**Files:**
- Modify: `src/app/globals.css` (add `.label`)
- Modify: `src/components/home/SectionHeading.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/experience/page.tsx`
- Modify: `src/components/home/ExperienceLedger.tsx`
- Modify: `src/components/experience/Timeline.tsx`
- Modify: `src/components/home/GitHubActivity.tsx`
- Modify: `src/components/home/PullRequestTabs.tsx`
- Modify: `src/components/home/ContactStrip.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - CSS class `.label`.
  - A new `label?: string` prop on `SectionHeading`. Task 3 renders it with `Scramble`.
  - The id `achievements` on the home achievements column. Task 12 adds it to the index.

- [ ] **Step 1: Add `.label` to `src/app/globals.css`**

Insert this inside the first `@layer base { … }` that holds `.display`, right after the `.display-md { … }` rule:

```css
  /* Labels: the reel's on-screen type. Small spaced-out JetBrains Mono caps
     for section and page labels, dates, places, tech lists and captions. */
  .label {
    font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    line-height: 1.5;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;
    color: hsl(var(--muted-foreground));
  }
  @media (min-width: 640px) {
    .label {
      font-size: 12px;
    }
  }
```

- [ ] **Step 2: Give `SectionHeading` a label and a bigger title**

Replace the whole of `src/components/home/SectionHeading.tsx` with:

```tsx
import Link from "next/link";

interface Props {
  title: string;
  /** Mono index label above the title, e.g. "03 / EXPERIENCE". */
  label?: string;
  href?: string;
  linkText?: string;
  external?: boolean;
}

export default function SectionHeading({ title, label, href, linkText, external }: Props) {
  return (
    <div className="mb-5">
      {label && <p className="label mb-2">{label}</p>}
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display-md text-[1.75rem] sm:text-[2.1rem]">{title}</h2>
        {href && linkText && (
          <Link
            href={href}
            className="link text-sm"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {linkText}
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Home page labels, the mono greeting and the achievements id**

In `src/app/page.tsx`:

Replace the greeting's opening tag:

```tsx
            <h1 className="display text-[2.2rem] leading-[0.95] sm:text-[2.9rem]">
```

with

```tsx
            <h1 className="font-mono text-[2rem] leading-[1.05] sm:text-[2.5rem]">
```

Then give each heading a label. Replace

```tsx
        <SectionHeading
          title="GitHub"
```

with

```tsx
        <SectionHeading
          label="02 / GITHUB"
          title="GitHub"
```

and

```tsx
        <SectionHeading
          title="Selected projects"
```

with

```tsx
        <SectionHeading
          label="04 / PROJECTS"
          title="Selected projects"
```

and make these one-line replacements:

| Current | New |
|---|---|
| `<SectionHeading title="Experience" href="/experience" linkText="All work and education" />` | `<SectionHeading label="03 / EXPERIENCE" title="Experience" href="/experience" linkText="All work and education" />` |
| `<SectionHeading title="Open source" />` | `<SectionHeading label="05 / OPEN SOURCE" title="Open source" />` |
| `<SectionHeading title="Skills and technologies" />` | `<SectionHeading label="07 / SKILLS" title="Skills and technologies" />` |

Then replace the achievements column:

```tsx
        <div>
          <SectionHeading title="Achievements" />
          <Achievements />
        </div>
```

with

```tsx
        <div id="achievements" className="scroll-mt-20">
          <SectionHeading label="06 / ACHIEVEMENTS" title="Achievements" />
          <Achievements />
        </div>
```

- [ ] **Step 4: /experience sub-section labels**

In `src/app/experience/page.tsx`, make these four changes:

| Current | New |
|---|---|
| `<SectionHeading title="Internships" />` | `<SectionHeading label="01 / INTERNSHIPS" title="Internships" />` |
| `<SectionHeading title="Open source" />` | `<SectionHeading label="02 / OPEN SOURCE" title="Open source" />` |
| `<SectionHeading title="Education" />` | `<SectionHeading label="03 / EDUCATION" title="Education" />` |
| `<SectionHeading title="Roles at college" />` | `<SectionHeading label="04 / ROLES AT COLLEGE" title="Roles at college" />` |

- [ ] **Step 5: Mono dates and tech lists**

In `src/components/home/ExperienceLedger.tsx`, replace

```tsx
          <div className="text-sm text-muted-foreground">
            <time className="block">{job.start}</time>
```

with

```tsx
          <div className="label">
            <time className="block">{job.start}</time>
```

and replace

```tsx
            {job.tech && (
              <p className="mt-3 text-xs text-muted-foreground">
                {job.tech.join(", ")}
              </p>
            )}
```

with

```tsx
            {job.tech && <p className="label mt-3">{job.tech.join(" · ")}</p>}
```

In `src/components/experience/Timeline.tsx`, replace

```tsx
          <div className="text-sm text-muted-foreground">
            <time className="block">{item.start}</time>
```

with

```tsx
          <div className="label">
            <time className="block">{item.start}</time>
```

and replace

```tsx
              <p className="mt-3 text-xs text-muted-foreground">{item.tech.join(", ")}</p>
```

with

```tsx
              <p className="label mt-3">{item.tech.join(" · ")}</p>
```

- [ ] **Step 6: Mono captions and PR ages**

In `src/components/home/GitHubActivity.tsx`, replace

```tsx
              <dt className="mt-0.5 text-xs text-muted-foreground">{s.label}</dt>
```

with

```tsx
              <dt className="label mt-1">{s.label}</dt>
```

In `src/components/home/PullRequestTabs.tsx`, replace

```tsx
                  <span className="mx-1.5 opacity-50">#{pr.number}</span>
                  {ages[pr.url]}
```

with

```tsx
                  <span className="mx-1.5 opacity-50">#{pr.number}</span>
                  <span className="label">{ages[pr.url]}</span>
```

- [ ] **Step 7: Contact label**

In `src/components/home/ContactStrip.tsx`, insert a label directly above the heading:

```tsx
    <section className="rounded-lg border bg-card p-6 sm:p-8">
      <p className="label mb-3">08 / CONTACT</p>
      <h2 className="display-md text-2xl sm:text-3xl">Want to know more about me?</h2>
```

- [ ] **Step 8: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 9: Screenshots**

Run:

```bash
$V/check.sh --no-marker --only / --shots $V/shots/task2
$V/check.sh --no-marker --only /experience --shots $V/shots/task2
```

Expected: `all clear` both times. Then open the PNGs in `$V/shots/task2` and check:
- the labels sit above the headings;
- the dates and tech lists are small spaced-out mono caps;
- the greeting is in mono and still wraps beside the donut on desktop;
- no text overflows at 390px.

- [ ] **Step 10: Commit**

```bash
git add src/app/globals.css src/components/home/SectionHeading.tsx src/app/page.tsx src/app/experience/page.tsx src/components/home/ExperienceLedger.tsx src/components/experience/Timeline.tsx src/components/home/GitHubActivity.tsx src/components/home/PullRequestTabs.tsx src/components/home/ContactStrip.tsx
git commit -m "feat(type): the reel's type system: mono labels, dates and tech, larger serif

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Motion runtime, `useReveal`, and labels that decode

**Files:**
- Create: `src/components/motion/runtime.ts`
- Create: `src/components/motion/useReveal.ts`
- Create: `src/components/motion/Scramble.tsx`
- Modify: `src/app/layout.tsx` (boot script at the top of `<body>`)
- Modify: `src/app/globals.css` (ease tokens, the generic before-state)
- Modify: `src/components/home/SectionHeading.tsx` (label → `Scramble`)
- Modify: `src/components/home/ContactStrip.tsx` (label → `Scramble`)

**Interfaces:**
- Consumes: `scramble`, `seedFor` from `@/lib/motion`; the `label` prop from Task 2.
- Produces:
  - `MOTION_BOOT: string`, `MotionMode = "animate" | "static"` and `motionMode(): MotionMode`, all from `@/components/motion/runtime`. Task 7 extends `MOTION_BOOT` and adds session helpers.
  - `Play = (el: HTMLElement) => () => void`, `RevealOptions { on?: "view" | "mount" }` and `useReveal(ref: RefObject<HTMLElement>, play: Play, opts?: RevealOptions): void`, from `@/components/motion/useReveal`.
  - A default-exported `Scramble` with props `{ text: string; className?: string; on?: "view" | "mount"; duration?: number }`, from `@/components/motion/Scramble`. It renders a `<span class="label">`.
  - CSS ease tokens `--ease-power3-out`, `--ease-expo-out` and `--ease-back-out`, plus the `data-reveal="hide"` before-state.

- [ ] **Step 1: The runtime**

Create `src/components/motion/runtime.ts`:

```ts
/**
 * The motion kit's runtime. MOTION_BOOT runs at the top of <body>, before
 * the first paint (see layout.tsx): when the visitor has not asked for
 * reduced motion it marks <html> with data-motion="on", so the CSS "before"
 * states can hold back what is about to animate. If the kit has not started
 * 3s later it flips the marker to "static" and everything shows as it is.
 * Without scripts, or with reduced motion, the marker never appears and the
 * finished page shows from the first paint.
 */
export const MOTION_BOOT = [
  "(function(){try{",
  "var d=document.documentElement;",
  'if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;',
  'd.setAttribute("data-motion","on");',
  "setTimeout(function(){",
  'if(d.getAttribute("data-motion")==="on")d.setAttribute("data-motion","static")',
  "},3000);",
  "}catch(e){}})();",
].join("");

export type MotionMode = "animate" | "static";

/**
 * Whether the kit animates right now. The first call after hydration turns
 * the head script's "on" into "ready"; a "static" marker (the 3s failsafe
 * fired, or no marker at all) keeps the page static for this page load.
 * Reduced motion is checked live on every call.
 */
export function motionMode(): MotionMode {
  if (typeof window === "undefined") return "static";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const html = document.documentElement;
  if (html.dataset.motion === "on") html.dataset.motion = "ready";
  return html.dataset.motion === "ready" ? "animate" : "static";
}
```

- [ ] **Step 2: The hook**

Create `src/components/motion/useReveal.ts`:

```ts
import { useEffect, useRef, type RefObject } from "react";
import { motionMode } from "./runtime";

/** Draws a move's first frame, starts it, and returns stop(), which snaps it to the finished state. */
export type Play = (el: HTMLElement) => () => void;

export interface RevealOptions {
  /** "view" (default): when about a third of the element is on screen. "mount": at once. */
  on?: "view" | "mount";
}

/**
 * Plays a move once. The element renders its finished state and carries
 * data-reveal; CSS holds its "before" look under html[data-motion] until
 * data-revealed appears. When it is time, `play` draws the first frame and
 * starts the move, and data-revealed is set in the same task, so the first
 * frame and the reveal land in one paint.
 *
 * In static mode the element is revealed as it is. A page that cannot
 * scroll any further plays whatever is showing, so short pages and tall
 * screens never strand a piece. Turning on reduced motion mid-move runs
 * stop() and reveals.
 */
export function useReveal(
  ref: RefObject<HTMLElement>,
  play: Play,
  { on = "view" }: RevealOptions = {},
): void {
  const playRef = useRef(play);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.setAttribute("data-revealed", "");
    if (motionMode() === "static") {
      reveal();
      return;
    }

    let stop: (() => void) | null = null;
    let visible = false;
    const observers: IntersectionObserver[] = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function detach() {
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("scroll", atBottom);
    }
    function start() {
      if (stop) return;
      detach();
      stop = playRef.current(el!);
      reveal();
    }
    function atBottom() {
      const doc = document.documentElement;
      if (visible && window.scrollY + window.innerHeight >= doc.scrollHeight - 2) start();
    }
    function onReduce() {
      if (!reduce.matches) return;
      detach();
      if (stop) stop();
      reveal();
    }
    reduce.addEventListener("change", onReduce);

    if (on === "mount") {
      start();
    } else {
      observers.push(
        // About a third of it on screen, above the bottom sliver of the viewport.
        new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const room = e.rootBounds?.height ?? window.innerHeight;
              if (e.intersectionRatio >= 0.33 || e.intersectionRect.height >= room / 3) start();
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: [0, 0.1, 0.2, 0.33, 0.5, 1] },
        ),
        // Any of it on screen, for the at-bottom check.
        new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          atBottom();
        }),
      );
      observers.forEach((o) => o.observe(el));
      window.addEventListener("scroll", atBottom, { passive: true });
    }

    return () => {
      reduce.removeEventListener("change", onReduce);
      detach();
      if (stop) stop();
    };
  }, [ref, on]);
}
```

- [ ] **Step 3: `Scramble`**

Create `src/components/motion/Scramble.tsx`:

```tsx
"use client";

import { scramble, seedFor } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useReveal } from "./useReveal";

interface Props {
  text: string;
  className?: string;
  /** "view" for section labels, "mount" for page labels. */
  on?: "view" | "mount";
  /** Seconds to settle. */
  duration?: number;
}

/**
 * A mono label that decodes left to right out of the reel's glyphs, like the
 * scene index in the reel's chrome. The server renders the final text;
 * screen readers get it plain, and the flicker is aria-hidden.
 */
export default function Scramble({ text, className, on = "view", duration = 0.45 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useReveal(
    ref,
    (el) => {
      const node = el.querySelector("[data-glyphs]")?.firstChild;
      if (!(node instanceof Text)) return () => {};
      const seed = seedFor(text);
      const t0 = performance.now();
      let raf = 0;
      const frame = (now: number) => {
        const p = (now - t0) / 1000 / duration;
        node.data = p >= 1 ? text : scramble(text, p, seed);
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      node.data = scramble(text, 0, seed);
      raf = requestAnimationFrame(frame);
      return () => {
        cancelAnimationFrame(raf);
        node.data = text;
      };
    },
    { on },
  );

  return (
    <span ref={ref} data-reveal="hide" className={cn("label", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden data-glyphs>
        {text}
      </span>
    </span>
  );
}
```

`Scramble` changes the existing text node's `data`; it never replaces the node. That leaves React's own reference to the node valid.

- [ ] **Step 4: Boot script in the layout**

In `src/app/layout.tsx`, add the import:

```tsx
import { MOTION_BOOT } from "@/components/motion/runtime";
```

Then put the script first inside `<body>`, before `<Providers>`:

```tsx
      <body
        className={cn(
          "flex min-h-screen flex-col font-sans antialiased",
          instrument.variable,
          youngSerif.variable,
          jetbrains.variable,
          silkscreen.variable,
        )}
      >
        {/* Marks <html data-motion> before the first paint; see runtime.ts. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
        <Providers>
```

- [ ] **Step 5: Ease tokens and the generic before-state**

In `src/app/globals.css`, add three tokens to the first `:root { … }` block (the light tokens), after `--gutter: 1.25rem;`:

```css
    /* GSAP's power3.out (a quartic), expo.out and back.out as CSS curves. */
    --ease-power3-out: cubic-bezier(0.25, 1, 0.5, 1);
    --ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-back-out: cubic-bezier(0.34, 1.56, 0.64, 1);
```

Append to the end of the file:

```css
/*
  Motion kit (docs/superpowers/specs/2026-09-26-reel-motion-design.md).
  The boot script marks <html data-motion="on"> when motion is allowed; the
  kit sets "ready" when it starts, and a 3s failsafe sets "static" if it
  never does. Pieces carry data-reveal and get data-revealed when they play.
  Before states apply only while the marker is on or ready, and only when the
  visitor has not asked for reduced motion.
*/
@layer base {
  @media (prefers-reduced-motion: no-preference) {
    html[data-motion]:not([data-motion="static"]) [data-reveal="hide"]:not([data-revealed]) {
      visibility: hidden;
    }
  }
}
```

- [ ] **Step 6: Labels decode**

In `src/components/home/SectionHeading.tsx`, add `import Scramble from "@/components/motion/Scramble";` and replace

```tsx
      {label && <p className="label mb-2">{label}</p>}
```

with

```tsx
      {label && <Scramble text={label} className="mb-2 block" />}
```

In `src/components/home/ContactStrip.tsx`, add `import Scramble from "@/components/motion/Scramble";` and replace

```tsx
      <p className="label mb-3">08 / CONTACT</p>
```

with

```tsx
      <Scramble text="08 / CONTACT" className="mb-3 block" />
```

- [ ] **Step 7: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 8: Headless checks**

Run:

```bash
$V/check.sh --quick
$V/check.sh --only /contact
$V/check.sh --only /no-such-page
$V/check.sh --live --slow --skip-pages
```

Expected: `all clear` on each run.
- The `--quick` run proves the labels reveal after a scroll and nothing is hidden under reduced motion.
- `/contact` and the 404 page, in full mode, include the 2400px-tall window, where the page can't scroll. That proves the at-bottom trigger works (Review Focus 1).
- `--live` and `--slow` cover Review Focus 3 and 4.

- [ ] **Step 9: Commit**

```bash
git add src/components/motion/runtime.ts src/components/motion/useReveal.ts src/components/motion/Scramble.tsx src/app/layout.tsx src/app/globals.css src/components/home/SectionHeading.tsx src/components/home/ContactStrip.tsx
git commit -m "feat(motion): boot marker, useReveal, and labels that decode like the reel's chrome

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Rules draw a signal line

**Files:**
- Modify: `src/components/layout/Rule.tsx` (becomes a client component with the same API)
- Modify: `src/app/globals.css` (blue ticks, the line, the dot, keyframes)

**Interfaces:**
- Consumes: `useReveal` (Task 3) and `unzipTime` (Task 1).
- Produces: `Rule({ className?: string })`, the same default export as before. It's used by `src/app/page.tsx` and `src/app/layout.tsx`, which need no edits.

- [ ] **Step 1: Rewrite `Rule`**

Replace the whole of `src/components/layout/Rule.tsx` with:

```tsx
"use client";

import { useReveal } from "@/components/motion/useReveal";
import { unzipTime } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";

/**
 * A section rule that runs the full width of the viewport, with a tick
 * where it crosses each column rail. When it scrolls into view a dot lands
 * at the centre and a signal line unzips to both edges, lights the ticks as
 * it reaches them, holds a beat and fades (keyframes in globals.css). Blue
 * ticks are the finished state.
 */
export default function Rule({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useReveal(ref, (el) => {
    // The ticks sit at the rails, part of the way from the centre to the edge.
    const tick = el.querySelector("i");
    const half = window.innerWidth / 2;
    const x = tick ? tick.getBoundingClientRect().left + 2.5 : 0;
    const fraction = half > 0 ? Math.min(1, Math.abs(x - half) / half) : 1;
    el.style.setProperty("--tick-at", `${(0.08 + unzipTime(fraction, 0.5)).toFixed(3)}s`);
    el.setAttribute("data-play", "");
    return () => el.removeAttribute("data-play");
  });

  return (
    <div ref={ref} aria-hidden data-reveal="rule" className={cn("rule", className)}>
      <i />
      <i />
      <span className="rule-line" />
      <span className="rule-dot" />
    </div>
  );
}
```

- [ ] **Step 2: CSS**

In `src/app/globals.css`, inside the existing `@media (min-width: 640px) { .rule i { … } }` rule, change the tick colour from

```css
      background: hsl(var(--foreground) / 0.55);
```

to

```css
      background: hsl(var(--signal));
```

Append to the end of the file:

```css
/* Rule: a dot, a signal line unzipping to both edges, one beat's hold, a fade. */
@layer base {
  .rule-line,
  .rule-dot {
    position: absolute;
    left: 50%;
    opacity: 0;
    background: hsl(var(--signal));
    pointer-events: none;
  }
  .rule-line {
    top: -0.5px;
    width: 100vw;
    height: 2px;
    transform: translateX(-50%) scaleX(0);
  }
  .rule-dot {
    top: -2.5px;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    border-radius: 9999px;
  }
  @media (prefers-reduced-motion: no-preference) {
    html[data-motion]:not([data-motion="static"]) .rule:not([data-revealed]) i {
      background: hsl(var(--foreground) / 0.55);
    }
    .rule[data-play] i {
      animation: rule-tick 0.2s linear var(--tick-at, 0.2s) both;
    }
    .rule[data-play] .rule-dot {
      animation: rule-dot 1.45s linear both;
    }
    .rule[data-play] .rule-line {
      animation: rule-line 1.45s linear both;
    }
  }
}

@keyframes rule-tick {
  from {
    background: hsl(var(--foreground) / 0.55);
  }
  to {
    background: hsl(var(--signal));
  }
}
/* 0.08s dot, 0.5s unzip (power3.out), a beat's hold (0.47s), 0.4s fade = 1.45s. */
@keyframes rule-dot {
  0% {
    opacity: 1;
    transform: scale(0);
  }
  5.5%,
  72.4% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
@keyframes rule-line {
  0%,
  5.5% {
    opacity: 1;
    transform: translateX(-50%) scaleX(0);
    animation-timing-function: var(--ease-power3-out);
  }
  40%,
  72.4% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) scaleX(1);
  }
}
```

- [ ] **Step 3: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 4: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task4`
Expected: `all clear` both times. In the screenshots, every rule's two ticks are blue and no line remains after the fade.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Rule.tsx src/app/globals.css
git commit -m "feat(motion): rules unzip a signal line from the centre and light their ticks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Odometers

**Files:**
- Create: `src/components/motion/Odometer.tsx`
- Modify: `src/components/home/GitHubActivity.tsx`
- Modify: `src/components/home/OpenSource.tsx`
- Delete: `src/components/vui/StatsCounter.tsx` (nothing else imports it)
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `useReveal` (Task 3), plus `COUNT_SECONDS`, `backOut`, `clamp01`, `countCurve`, `digitPositions`, `odometerCells` and `BEAT` (Task 1).
- Produces: a default-exported `Odometer` with props `{ value: number; suffix?: string; suffixClassName?: string; delay?: number; className?: string }`.

- [ ] **Step 1: `Odometer`**

Create `src/components/motion/Odometer.tsx`:

```tsx
"use client";

import {
  COUNT_SECONDS,
  backOut,
  clamp01,
  countCurve,
  digitPositions,
  odometerCells,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useId, useRef } from "react";
import { useReveal } from "./useReveal";

const CELL = 1.15; // em: one digit cell, matching .odo-col's line-height
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const SPRING = backOut(2.4);
const SPRING_SECONDS = 0.34;

interface Props {
  value: number;
  /** Springs in once the count lands, e.g. "+". */
  suffix?: string;
  suffixClassName?: string;
  /** Seconds to hold at zero after the reveal, to stagger a row of counters. */
  delay?: number;
  className?: string;
}

/**
 * A number that rolls into place like the reel's stdlib odometer: a strip of
 * digits per place, turning as a mechanical counter does (the ones spin, the
 * higher places tick over on the carry), blurred along its travel while it
 * moves. An optional suffix springs in once it lands. The server renders the
 * landed number; screen readers get plain text.
 */
export default function Odometer({ value, suffix, suffixClassName, delay = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId().replace(/:/g, "");
  const cells = odometerCells(value);
  const places = cells.filter((c) => c.place >= 0).length;
  const text = cells.map((c) => c.ch).join("");

  useReveal(ref, (el) => {
    const cols = [...el.querySelectorAll<HTMLElement>(".odo-col")];
    const strips = cols.map((c) => c.querySelector<HTMLElement>(".odo-strip"));
    const blurs = cols.map((c) => el.querySelector(`#${id}-${c.dataset.place} feGaussianBlur`));
    const seps = [...el.querySelectorAll<HTMLElement>(".odo-sep")];
    const tail = el.querySelector<HTMLElement>(".odo-suffix");
    const em = parseFloat(getComputedStyle(el).fontSize) || 16;
    const target = Math.round(value);
    // A leading place fades in as the carry rolls its first digit on.
    const shown = (k: number, v: number) => (k <= 0 ? 1 : clamp01(v - (10 ** k - 1)));
    let prev = digitPositions(0, places);

    const paint = (v: number, moving: boolean) => {
      const pos = digitPositions(v, places);
      cols.forEach((col, i) => {
        const k = Number(col.dataset.place);
        const strip = strips[i];
        if (!strip) return;
        strip.style.transform = `translateY(${(-pos[k] * CELL).toFixed(4)}em)`;
        col.style.opacity = String(shown(k, v));
        // Vertical blur from this frame's travel, capped at 6px.
        let d = Math.abs(pos[k] - prev[k]);
        if (d > 5) d = 10 - d;
        const blur = moving ? Math.min(6, d * CELL * em * 0.5) : 0;
        blurs[i]?.setAttribute("stdDeviation", `0 ${blur.toFixed(2)}`);
        strip.style.filter = blur > 0.1 ? `url(#${id}-${k})` : "";
      });
      seps.forEach((s) => (s.style.opacity = String(shown(Number(s.dataset.after), v))));
      prev = pos;
    };
    const spring = (s: number) => {
      if (!tail) return;
      const k = s <= 0 ? 0 : SPRING(s);
      tail.style.opacity = s <= 0 ? "0" : "1";
      tail.style.transform = `rotate(${(-90 * (1 - k)).toFixed(2)}deg) scale(${k.toFixed(4)})`;
    };

    const t0 = performance.now() + delay * 1000;
    const end = COUNT_SECONDS + (tail ? SPRING_SECONDS : 0);
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      paint(target, false);
      cols.forEach((c) => (c.style.opacity = ""));
      seps.forEach((s) => (s.style.opacity = ""));
      if (tail) {
        tail.style.opacity = "";
        tail.style.transform = "";
      }
    };
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= end) return finish();
      if (t >= 0) {
        paint(countCurve(t / COUNT_SECONDS) * target, t < COUNT_SECONDS);
        spring((t - COUNT_SECONDS) / SPRING_SECONDS);
      }
      raf = requestAnimationFrame(frame);
    };
    paint(0, false);
    spring(0);
    raf = requestAnimationFrame(frame);
    return finish;
  });

  return (
    <span ref={ref} data-reveal="hide" className={cn("odometer", className)}>
      <span className="sr-only">
        {text}
        {suffix}
      </span>
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          {cells
            .filter((c) => c.place >= 0)
            .map((c) => (
              <filter key={c.place} id={`${id}-${c.place}`} x="0" y="-50%" width="100%" height="200%">
                <feGaussianBlur stdDeviation="0 0" />
              </filter>
            ))}
        </defs>
      </svg>
      <span aria-hidden>
        {cells.map((c, i) =>
          c.place < 0 ? (
            <span key={i} className="odo-sep" data-after={c.after}>
              {c.ch}
            </span>
          ) : (
            <span key={i} className="odo-col" data-place={c.place}>
              <span className="odo-sizer">{c.ch}</span>
              <span
                className="odo-strip"
                style={{ transform: `translateY(${(-Number(c.ch) * CELL).toFixed(4)}em)` }}
              >
                {DIGITS.map((d, j) => (
                  <span key={j}>{d}</span>
                ))}
              </span>
            </span>
          ),
        )}
      </span>
      {suffix && (
        <span aria-hidden className={cn("odo-suffix", suffixClassName)}>
          {suffix}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: CSS**

Append to `src/app/globals.css`:

```css
/* Odometer: one column per digit, as wide as its landed digit, clipped to one
   line top and bottom; the strip inside holds 0-9 and a closing 0. */
@layer base {
  .odo-col {
    position: relative;
    display: inline-block;
    line-height: 1.15em;
    clip-path: inset(0 -0.3em);
  }
  .odo-sizer {
    visibility: hidden;
  }
  .odo-strip {
    position: absolute;
    inset: 0 0 auto 0;
    text-align: center;
  }
  .odo-strip > span {
    display: block;
    height: 1.15em;
  }
  .odo-suffix {
    display: inline-block;
    transform-origin: 50% 60%;
  }
}
```

- [ ] **Step 3: GitHub stats roll, a quarter beat apart**

In `src/components/home/GitHubActivity.tsx`, replace the import

```tsx
import StatsCounter from "@/components/vui/StatsCounter";
```

with

```tsx
import Odometer from "@/components/motion/Odometer";
import { BEAT } from "@/lib/motion";
```

and replace

```tsx
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-4 py-3">
              <dd className="display-md text-2xl sm:text-[1.7rem]">
                <StatsCounter value={s.value} />
              </dd>
```

with

```tsx
          {stats.map((s, i) => (
            <div key={s.label} className="bg-card px-4 py-3">
              <dd className="display-md text-2xl sm:text-[1.7rem]">
                <Odometer value={s.value} delay={(i * BEAT) / 4} />
              </dd>
```

- [ ] **Step 4: The open-source count rolls and the "+" springs**

In `src/components/home/OpenSource.tsx`, add `import Odometer from "@/components/motion/Odometer";` and replace

```tsx
      <p className="display-md text-4xl sm:text-5xl">
        {count}
        <span className="text-signal">+</span>{" "}
```

with

```tsx
      <p className="display-md text-4xl sm:text-5xl">
        <Odometer value={count} suffix="+" suffixClassName="text-signal" />{" "}
```

- [ ] **Step 5: Remove `StatsCounter`**

Run: `grep -rn "StatsCounter" src`
Expected: no matches except the file itself. Then:

```bash
git rm src/components/vui/StatsCounter.tsx
```

- [ ] **Step 6: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 7: Headless checks and number shapes**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task5`

Expected: `all clear`. In `desktop-dark-home.png`:
- the four GitHub stats read exactly as today's numbers, with a comma in any number of 1,000 or more and no leading zeros;
- the open-source line reads `<count>+ merged pull requests`, with a blue "+" on the baseline;
- the digits sit on the same baseline as the text beside them.

This is Review Focus 5.

- [ ] **Step 8: Commit**

```bash
git add src/components/motion/Odometer.tsx src/components/home/GitHubActivity.tsx src/components/home/OpenSource.tsx src/app/globals.css
git commit -m "feat(motion): odometers for the PR count and GitHub stats, replacing StatsCounter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`git rm` already staged the deletion. It goes into this commit.)

---

### Task 6: Page titles rise with a PKY label

**Files:**
- Create: `src/components/motion/PageTitle.tsx`
- Modify: `src/app/experience/page.tsx`, `src/app/projects/page.tsx`, `src/app/contact/page.tsx`, `src/app/privacy/page.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `useReveal` and `Scramble` (Task 3).
- Produces: a default-exported `PageTitle` with props `{ label: string; title: string; className?: string }`. It renders the label `PKY / {label}` and an `<h1>`.

- [ ] **Step 1: `PageTitle`**

Create `src/components/motion/PageTitle.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";
import Scramble from "./Scramble";
import { useReveal } from "./useReveal";

interface Props {
  /** The page's name for the mono label: "WORK" becomes "PKY / WORK". */
  label: string;
  title: string;
  className?: string;
}

/**
 * A page header set the way the reel's end card sets the name: the mono
 * label decodes, the serif title rises out of a mask, and a hairline of
 * signal unzips under it from the centre and fades. Plays once on mount.
 */
export default function PageTitle({ label, title, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useReveal(
    ref,
    (el) => {
      el.setAttribute("data-play", "");
      return () => el.removeAttribute("data-play");
    },
    { on: "mount" },
  );

  return (
    <div ref={ref} data-reveal="title" className={cn("page-title", className)}>
      <Scramble text={`PKY / ${label}`} on="mount" className="block" />
      <h1 className="display mt-3 text-[2.75rem] sm:text-[3.75rem]">
        <span className="page-title-mask">
          <span className="page-title-text">{title}</span>
        </span>
      </h1>
      <span aria-hidden className="page-title-line" />
    </div>
  );
}
```

- [ ] **Step 2: CSS**

Append to `src/app/globals.css`:

```css
/* Page titles: the serif rises out of a mask; a signal hairline unzips and fades. */
@layer base {
  .page-title {
    position: relative;
  }
  .page-title-mask {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
    padding-bottom: 0.12em;
    margin-bottom: -0.12em;
  }
  .page-title-text {
    display: inline-block;
  }
  .page-title-line {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -0.6rem;
    height: 1px;
    background: hsl(var(--signal));
    opacity: 0;
    transform: scaleX(0);
    pointer-events: none;
  }
  @media (prefers-reduced-motion: no-preference) {
    html[data-motion]:not([data-motion="static"]) .page-title:not([data-revealed]) .page-title-text {
      transform: translateY(115%);
    }
    .page-title[data-play] .page-title-text {
      animation: title-rise 0.6s var(--ease-expo-out) both;
    }
    .page-title[data-play] .page-title-line {
      animation: title-line 1s linear both;
    }
  }
}

@keyframes title-rise {
  from {
    transform: translateY(115%);
  }
  to {
    transform: none;
  }
}
/* 0.4s unzip from the centre (power3.out), 0.2s hold, 0.4s fade. */
@keyframes title-line {
  0% {
    opacity: 1;
    transform: scaleX(0);
    animation-timing-function: var(--ease-power3-out);
  }
  40%,
  60% {
    opacity: 1;
    transform: scaleX(1);
  }
  100% {
    opacity: 0;
    transform: scaleX(1);
  }
}
```

- [ ] **Step 3: Use it on every page**

In each file, add `import PageTitle from "@/components/motion/PageTitle";` and make these replacements:

| File | Replace | With |
|---|---|---|
| `src/app/experience/page.tsx` | `<h1 className="display text-4xl sm:text-5xl">Work</h1>` | `<PageTitle label="WORK" title="Work" />` |
| `src/app/projects/page.tsx` | `<h1 className="display text-4xl sm:text-5xl">Projects</h1>` | `<PageTitle label="PROJECTS" title="Projects" />` |
| `src/app/contact/page.tsx` | `<h1 className="display text-4xl sm:text-5xl">Contact</h1>` | `<PageTitle label="CONTACT" title="Contact" />` |
| `src/app/privacy/page.tsx` | `<h1 className="display text-4xl sm:text-5xl">Privacy</h1>` | `<PageTitle label="PRIVACY" title="Privacy" />` |

In `src/app/not-found.tsx`, replace

```tsx
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="display text-4xl sm:text-5xl">That page is not here.</h1>
```

with

```tsx
      <PageTitle label="404" title="That page is not here." />
```

- [ ] **Step 4: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 5: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only /no-such-page --shots $V/shots/task6`
Expected: `all clear`. In the screenshots the 404 title wraps inside the column, no descender ("g", "p", "j") is clipped, and "PKY / 404" sits above it.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion/PageTitle.tsx src/app/experience/page.tsx src/app/projects/page.tsx src/app/contact/page.tsx src/app/privacy/page.tsx src/app/not-found.tsx src/app/globals.css
git commit -m "feat(motion): page titles rise out of a mask under a decoding PKY label

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The hero intro and the grid power-on

**Files:**
- Create: `src/components/motion/typing.ts`
- Create: `src/components/motion/HeroGreeting.tsx`
- Modify: `src/components/motion/runtime.ts` (session helpers, `data-hello` in the boot script)
- Modify: `src/components/layout/WorkbenchGrid.tsx` (power-on)
- Modify: `src/app/page.tsx` (use `HeroGreeting`)
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `motionMode` and `MOTION_BOOT` (Task 3); `typeTimes`, `backOut`, `clamp01`, `power3Out` and `expoOut` (Task 1).
- Produces:
  - `caretSpot(root: HTMLElement, chars: HTMLElement[], i: number): { x: number; y: number; h: number }` and `showChars(chars: HTMLElement[], times: number[], t: number): number`, from `@/components/motion/typing`. Task 8 uses both.
  - `HELLO_KEY`, `GRID_KEY`, `playedThisSession(key)`, `markPlayed(key)` and `unmarkPlayed(key)`, from `runtime.ts`.
  - The `.caret-block` CSS class, which Task 8 also uses.
  - A default-exported `HeroGreeting` with props `{ text: string }`.

- [ ] **Step 1: Session helpers and the hello marker**

Replace the whole of `src/components/motion/runtime.ts` with:

```ts
/* The motion kit's runtime: the boot script, the motion mode, and once-per-session keys. */

/** sessionStorage keys for moves that play once per tab session. */
export const HELLO_KEY = "pky:hello";
export const GRID_KEY = "pky:grid";

export function playedThisSession(key: string): boolean {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function markPlayed(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {}
}

export function unmarkPlayed(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

/**
 * Runs at the top of <body>, before the first paint (see layout.tsx). When
 * the visitor has not asked for reduced motion it marks <html> with
 * data-motion="on", so the CSS "before" states can hold back what is about
 * to animate; on the first visit to home in a tab session it also sets
 * data-hello, which holds the greeting back for the intro. If the kit has
 * not started 3s later it flips the marker to "static" and drops data-hello,
 * and everything shows as it is. Without scripts, or with reduced motion,
 * no marker appears and the finished page shows from the first paint.
 */
export const MOTION_BOOT = [
  "(function(){try{",
  "var d=document.documentElement;",
  'if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;',
  'd.setAttribute("data-motion","on");',
  "setTimeout(function(){",
  'if(d.getAttribute("data-motion")==="on"){d.setAttribute("data-motion","static");d.removeAttribute("data-hello")}',
  "},3000);",
  "var played=false;",
  `try{played=sessionStorage.getItem("${HELLO_KEY}")!==null}catch(e){}`,
  'if(location.pathname==="/"&&!played)d.setAttribute("data-hello","play");',
  "}catch(e){}})();",
].join("");

export type MotionMode = "animate" | "static";

/**
 * Whether the kit animates right now. The first call after hydration turns
 * the boot script's "on" into "ready"; a "static" marker (the 3s failsafe
 * fired, or no marker at all) keeps the page static for this page load.
 * Reduced motion is checked live on every call.
 */
export function motionMode(): MotionMode {
  if (typeof window === "undefined") return "static";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const html = document.documentElement;
  if (html.dataset.motion === "on") html.dataset.motion = "ready";
  return html.dataset.motion === "ready" ? "animate" : "static";
}
```

`motionMode` is unchanged from Task 3. What changed is the session helpers and the boot script, which now handles `data-hello`.

- [ ] **Step 2: Typing helpers**

Create `src/components/motion/typing.ts`:

```ts
/**
 * Shared by the typed pieces (the hero greeting, TypeOn). Characters are
 * [data-ch] spans laid out from the first paint, so revealing them never
 * moves anything; the caret is an absolutely placed .caret-block.
 */

/** Where a caret parked after character i (before the first when i < 0) sits, relative to root. */
export function caretSpot(
  root: HTMLElement,
  chars: HTMLElement[],
  i: number,
): { x: number; y: number; h: number } {
  const c = chars[Math.max(0, i)]?.getBoundingClientRect();
  if (!c) return { x: 0, y: 0, h: 0 };
  const r = root.getBoundingClientRect();
  return { x: (i < 0 ? c.left : c.right) - r.left, y: c.top - r.top, h: c.height };
}

/** Shows the characters whose time has come; returns how many are showing. */
export function showChars(chars: HTMLElement[], times: number[], t: number): number {
  let shown = 0;
  chars.forEach((c, i) => {
    const on = times[i] <= t;
    c.style.visibility = on ? "visible" : "hidden";
    if (on) shown = i + 1;
  });
  return shown;
}
```

- [ ] **Step 3: `HeroGreeting`**

Create `src/components/motion/HeroGreeting.tsx`:

```tsx
"use client";

import { backOut, clamp01, power3Out, typeTimes } from "@/lib/motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import { HELLO_KEY, markPlayed, motionMode, playedThisSession, unmarkPlayed } from "./runtime";
import { caretSpot, showChars } from "./typing";

// Layout effects only mean something in the browser; this avoids React's server warning.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* The reel's first bar, in seconds from mount. */
const DOT_AT = 1.15; // the cursor snaps into a dot
const LINE_FROM = 1.25; // the dot unzips the line...
const LINE_TO = 1.65; // ...out to the rails
const DROP = 1.875; // four beats: the line fades, the dot springs into the wave
const FADE = 0.3;
const SPRING = 0.34;
const END = DROP + Math.max(FADE, SPRING);
const spring = backOut(2.4);

/**
 * The hero greeting as the reel's opening bar: it types in mono behind the
 * blue block cursor, the cursor snaps into a dot with a ring, the dot unzips
 * a signal line along the baseline out to the rails, and on the drop the line
 * fades as the dot springs into the wave. Plays on the first visit to home in
 * a tab session; the boot script holds the greeting back with
 * html[data-hello] until then, and later visits find it already there.
 */
export default function HeroGreeting({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useBrowserLayoutEffect(() => {
    const html = document.documentElement;
    const release = () => html.removeAttribute("data-hello");
    const h1 = ref.current;
    const caret = h1?.querySelector<HTMLElement>("[data-caret]");
    const dot = h1?.querySelector<HTMLElement>(".hello-dot");
    const ring = h1?.querySelector<HTMLElement>(".hello-ring");
    const line = h1?.querySelector<HTMLElement>(".hello-line");
    const wave = h1?.querySelector<HTMLElement>(".hello-wave");
    if (!h1 || !caret || !dot || !ring || !line || !wave) return release();
    if (motionMode() === "static" || playedThisSession(HELLO_KEY)) return release();

    markPlayed(HELLO_KEY);
    html.setAttribute("data-hello", "play");
    const chars = [...h1.querySelectorAll<HTMLElement>("[data-ch]")];
    const times = typeTimes(text, { start: 0.3, step: 0.04, pause: 0.04 });

    // The layout is final from the first paint, so the landing spots are known now.
    const box = h1.getBoundingClientRect();
    const column = (h1.closest(".column") ?? document.body).getBoundingClientRect();
    const last = caretSpot(h1, chars, chars.length - 1);
    const dotX = last.x + caret.offsetWidth / 2;
    const dotY = last.y + last.h / 2;
    const left = column.left - box.left;
    line.style.left = `${left}px`;
    line.style.width = `${column.width}px`;
    line.style.top = `${dotY - 1}px`;
    line.style.transformOrigin = `${dotX - left}px 50%`;

    let raf = 0;
    let finished = false;
    const finish = () => {
      finished = true;
      cancelAnimationFrame(raf);
      chars.forEach((c) => (c.style.visibility = ""));
      for (const el of [caret, dot, ring, line]) el.style.opacity = "0";
      wave.style.visibility = "";
      wave.style.transform = "";
      release();
    };

    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= END) return finish();
      const n = showChars(chars, times, t);
      // Cursor: solid while typing, gone once it becomes the dot.
      if (t < DOT_AT) {
        const s = caretSpot(h1, chars, n - 1);
        caret.style.transform = `translate(${s.x}px, ${s.y + (s.h - caret.offsetHeight) / 2}px)`;
        caret.style.opacity = "1";
      } else {
        caret.style.opacity = "0";
      }
      // Dot: pops at DOT_AT, shrinks away as the wave springs in on the drop.
      const pop = clamp01((t - DOT_AT) / 0.05);
      const gone = clamp01((t - DROP) / 0.12);
      dot.style.opacity = t >= DOT_AT && gone < 1 ? "1" : "0";
      dot.style.transform = `translate(${dotX - 5}px, ${dotY - 5}px) scale(${(pop * (1 - gone)).toFixed(3)})`;
      // Ring: expands from the dot and fades.
      const r = clamp01((t - DOT_AT) / 0.45);
      ring.style.opacity = t >= DOT_AT && r < 1 ? ((1 - r) * 0.9).toFixed(3) : "0";
      ring.style.transform = `translate(${dotX - 5}px, ${dotY - 5}px) scale(${(1 + r * 2.6).toFixed(3)})`;
      // Line: unzips both ways from the dot, holds, fades on the drop.
      const zip = power3Out((t - LINE_FROM) / (LINE_TO - LINE_FROM));
      line.style.opacity = t >= LINE_FROM ? (1 - clamp01((t - DROP) / FADE)).toFixed(3) : "0";
      line.style.transform = `scaleX(${zip.toFixed(4)})`;
      // Wave: springs in on the drop.
      wave.style.visibility = t < DROP ? "hidden" : "visible";
      wave.style.transform = `scale(${(t < DROP ? 0 : spring((t - DROP) / SPRING)).toFixed(4)})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReduce = () => {
      if (reduce.matches) finish();
    };
    reduce.addEventListener("change", onReduce);
    return () => {
      reduce.removeEventListener("change", onReduce);
      // Cut short (navigated away, or React re-running effects): let a later visit play it.
      if (!finished) unmarkPlayed(HELLO_KEY);
      finish();
    };
  }, [text]);

  return (
    <h1 ref={ref} className="hello relative font-mono text-[2rem] leading-[1.05] sm:text-[2.5rem]">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {[...text].map((ch, i) => (
          <span key={i} data-ch>
            {ch}
          </span>
        ))}
      </span>{" "}
      <span aria-hidden className="hello-wave inline-block">
        👋
      </span>
      <span aria-hidden data-caret className="caret-block" />
      <span aria-hidden className="hello-dot" />
      <span aria-hidden className="hello-ring" />
      <span aria-hidden className="hello-line" />
    </h1>
  );
}
```

- [ ] **Step 4: CSS**

Append to `src/app/globals.css`:

```css
/* Typing: a blue block caret. Hero intro: dot, ring and line; the greeting is
   held back while html[data-hello] is set. */
@layer base {
  .caret-block {
    position: absolute;
    left: 0;
    top: 0;
    width: 0.55ch;
    height: 1em;
    background: hsl(var(--signal));
    opacity: 0;
    pointer-events: none;
  }
  .hello-dot,
  .hello-ring {
    position: absolute;
    left: 0;
    top: 0;
    width: 10px;
    height: 10px;
    border-radius: 9999px;
    opacity: 0;
    pointer-events: none;
  }
  .hello-dot {
    background: hsl(var(--signal));
  }
  .hello-ring {
    border: 1.5px solid hsl(var(--signal));
  }
  /* Behind the text and the donut: z-index -1 inside the hero's stacking context. */
  .hello-line {
    position: absolute;
    left: 0;
    top: 0;
    height: 2px;
    z-index: -1;
    background: hsl(var(--signal));
    opacity: 0;
    pointer-events: none;
  }
  .hello-wave {
    transform-origin: 50% 60%;
  }
  @media (prefers-reduced-motion: no-preference) {
    html[data-hello] .hello [data-ch],
    html[data-hello] .hello-wave {
      visibility: hidden;
    }
  }
}
```

- [ ] **Step 5: Use `HeroGreeting` on home**

In `src/app/page.tsx`, add `import HeroGreeting from "@/components/motion/HeroGreeting";` and replace

```tsx
            <h1 className="font-mono text-[2rem] leading-[1.05] sm:text-[2.5rem]">
              hi, prashant here{" "}
              <span aria-hidden className="inline-block">
                👋
              </span>
            </h1>
```

with

```tsx
            <HeroGreeting text="hi, prashant here" />
```

- [ ] **Step 6: The grid powers on from the centre**

In `src/components/layout/WorkbenchGrid.tsx`, add these imports after `import { useEffect, useRef } from "react";`:

```tsx
import { GRID_KEY, markPlayed, motionMode, playedThisSession, unmarkPlayed } from "@/components/motion/runtime";
import { clamp01, expoOut } from "@/lib/motion";
```

Inside the effect, directly after `const traces: Trace[] = [];`, add:

```tsx
    // First load of a tab session: the grid powers on from the centre, the
    // reveal front easing out over 1.1s, as the reel's ground does.
    let powerFrom = -1;
    if (motionMode() === "animate" && !playedThisSession(GRID_KEY)) {
      markPlayed(GRID_KEY);
      powerFrom = performance.now();
    }
    const powerReveal = () => {
      if (powerFrom < 0) return Infinity;
      const on = expoOut(((performance.now() - powerFrom) / 1000 - 0.12) / 1.1);
      if (on >= 1) {
        powerFrom = -1;
        return Infinity;
      }
      return on * (Math.hypot(w / 2, h / 2) + 260);
    };
```

Then replace the whole `drawGrid` function:

```tsx
    const drawGrid = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `hsl(${ink} / 0.045)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = originX(); x < w; x += CELL) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, h);
      }
      for (let y = originY(); y < h; y += CELL) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(w, Math.round(y) + 0.5);
      }
      ctx.stroke();
    };
```

with

```tsx
    const drawGrid = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      const reveal = powerReveal();
      if (reveal === Infinity) {
        ctx.strokeStyle = `hsl(${ink} / 0.045)`;
        ctx.beginPath();
        for (let x = originX(); x < w; x += CELL) {
          ctx.moveTo(Math.round(x) + 0.5, 0);
          ctx.lineTo(Math.round(x) + 0.5, h);
        }
        for (let y = originY(); y < h; y += CELL) {
          ctx.moveTo(0, Math.round(y) + 0.5);
          ctx.lineTo(w, Math.round(y) + 0.5);
        }
        ctx.stroke();
        return;
      }
      // Powering on: each line fades in as the front passes it.
      const cx = w / 2;
      const cy = h / 2;
      const aspect = h > 0 ? w / h : 1;
      const stroke = (a: number, x0: number, y0: number, x1: number, y1: number) => {
        if (a <= 0) return;
        ctx.strokeStyle = `hsl(${ink} / ${(0.045 * a).toFixed(4)})`;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      };
      for (let x = originX(); x < w; x += CELL) {
        const X = Math.round(x) + 0.5;
        stroke(clamp01((reveal - Math.abs(X - cx)) / 260), X, 0, X, h);
      }
      for (let y = originY(); y < h; y += CELL) {
        const Y = Math.round(y) + 0.5;
        stroke(clamp01((reveal - Math.abs(Y - cy) * aspect) / 260), 0, Y, w, Y);
      }
    };
```

Finally, in the effect's cleanup, add this as the first line of `return () => {`:

```tsx
      if (powerFrom >= 0) unmarkPlayed(GRID_KEY);
```

- [ ] **Step 7: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 8: Headless checks**

Run:

```bash
$V/check.sh --quick
$V/check.sh --hello --live --slow --skip-pages
```

Expected: `all clear` both times. Together they cover Review Focus 2, 3 and 4:
- the greeting is hidden before typing and visible after, and `pky:hello` is stored;
- a reload starts without `data-hello`;
- a first visit to home through the header link types the greeting;
- reduced motion switched on mid-intro leaves nothing hidden;
- with scripts arriving late, the page is static and fully visible at 3.3s.

- [ ] **Step 9: Commit**

```bash
git add src/components/motion/typing.ts src/components/motion/HeroGreeting.tsx src/components/motion/runtime.ts src/components/layout/WorkbenchGrid.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(motion): hero intro types the greeting, fires the line, springs the wave; grid powers on

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The email types in

**Files:**
- Create: `src/components/motion/TypeOn.tsx`
- Modify: `src/components/home/ContactStrip.tsx`

**Interfaces:**
- Consumes: `caretSpot` and `showChars` (Task 7), `.caret-block` (Task 7), `useReveal` (Task 3), and `BEAT` and `typeTimes` (Task 1).
- Produces: a default-exported `TypeOn` with props `{ text: string; times: number[]; className?: string }`.

- [ ] **Step 1: `TypeOn`**

Create `src/components/motion/TypeOn.tsx`:

```tsx
"use client";

import { BEAT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { caretSpot, showChars } from "./typing";
import { useReveal } from "./useReveal";

interface Props {
  text: string;
  /** When each character appears, in seconds from the reveal (typeTimes). */
  times: number[];
  className?: string;
}

/**
 * Types `text` behind the blue block cursor when it scrolls into view, then
 * blinks the cursor three times on the beat and lets it go, like the URL on
 * the reel's end card. The server renders the finished text.
 */
export default function TypeOn({ text, times, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useReveal(ref, (el) => {
    const chars = [...el.querySelectorAll<HTMLElement>("[data-ch]")];
    const caret = el.querySelector<HTMLElement>("[data-caret]");
    const typed = times[times.length - 1] ?? 0;
    const end = typed + 6 * BEAT; // off and on, three times
    const park = (i: number) => {
      if (!caret) return;
      const s = caretSpot(el, chars, i);
      caret.style.transform = `translate(${s.x}px, ${s.y + (s.h - caret.offsetHeight) / 2}px)`;
    };
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      chars.forEach((c) => (c.style.visibility = ""));
      if (caret) caret.style.opacity = "0";
    };
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= end) return finish();
      park(showChars(chars, times, t) - 1);
      if (caret) {
        const after = t - typed;
        caret.style.opacity = after <= 0 || Math.floor(after / BEAT) % 2 === 1 ? "1" : "0";
      }
      raf = requestAnimationFrame(frame);
    };
    showChars(chars, times, -1);
    park(-1);
    if (caret) caret.style.opacity = "1";
    raf = requestAnimationFrame(frame);
    return finish;
  });

  return (
    <span ref={ref} data-reveal="hide" className={cn("relative inline-block", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {[...text].map((ch, i) => (
          <span key={i} data-ch>
            {ch}
          </span>
        ))}
      </span>
      <span aria-hidden data-caret className="caret-block" />
    </span>
  );
}
```

- [ ] **Step 2: The contact strip**

In `src/components/home/ContactStrip.tsx`, add these imports:

```tsx
import TypeOn from "@/components/motion/TypeOn";
import { typeTimes } from "@/lib/motion";
```

Add this module-level constant after the imports:

```tsx
/* The reel's URL pace: 16ms a character. */
const EMAIL_TIMES = typeTimes(profile.email, { start: 0, step: 0.016, pause: 0 });
```

Then replace the paragraph

```tsx
      <p className="measure mt-3 text-muted-foreground">
        Ask Dev Senpai anything about my work, or send a note and I will reply
        from{" "}
        <a href={`mailto:${profile.email}`} className="link">
          {profile.email}
        </a>
        .
      </p>
```

with

```tsx
      <p className="mt-3">
        <a
          href={`mailto:${profile.email}`}
          className="font-mono text-[15px] text-signal transition-colors hover:text-foreground sm:text-base"
        >
          <TypeOn text={profile.email} times={EMAIL_TIMES} />
        </a>
      </p>
      <p className="measure mt-3 text-muted-foreground">
        Ask Dev Senpai anything about my work, or send a note and I will reply.
      </p>
```

- [ ] **Step 3: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 4: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task8`
Expected: `all clear`. The screenshot shows the email on its own line in blue mono, with no cursor left behind.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/TypeOn.tsx src/components/home/ContactStrip.tsx
git commit -m "feat(motion): the contact email types in at the reel's URL pace

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The experience packet

**Files:**
- Create: `src/components/motion/PacketTrack.tsx`
- Modify: `src/components/home/ExperienceLedger.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `useReveal` (Task 3), and `BEAT` and `clamp01` (Task 1).
- Produces: a default-exported `PacketTrack` with props `{ children: ReactNode }`. Children mark their nodes with `<span data-node className="packet-node" />`.

- [ ] **Step 1: `PacketTrack`**

Create `src/components/motion/PacketTrack.tsx`:

```tsx
"use client";

import { BEAT, clamp01 } from "@/lib/motion";
import { useRef, type ReactNode } from "react";
import { useReveal } from "./useReveal";

const LEAD = 0.25; // s from the reveal to the first node
const RUNOFF = 0.45; // s from the last node off the bottom

/**
 * The experience list as the reel's voice pipeline: a hairline down the left
 * with a node beside each job. When the list scrolls in, a packet runs down
 * it one beat per job and lights each node as it passes. Children mark their
 * nodes with [data-node]. Finished state: every node lit.
 */
export default function PacketTrack({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useReveal(ref, (el) => {
    const nodes = [...el.querySelectorAll<HTMLElement>("[data-node]")];
    const head = el.querySelector<HTMLElement>(".packet-head");
    const top = el.getBoundingClientRect().top;
    // Keyframes (seconds, px down the track): the top, each node a beat apart, the bottom.
    const keys: [number, number][] = [[0, 0]];
    nodes.forEach((n, i) => {
      const r = n.getBoundingClientRect();
      keys.push([LEAD + i * BEAT, r.top + r.height / 2 - top]);
    });
    const end = keys[keys.length - 1][0] + RUNOFF;
    keys.push([end, el.offsetHeight]);
    const yAt = (t: number) => {
      for (let i = 1; i < keys.length; i++) {
        const [t1, y1] = keys[i];
        const [t0, y0] = keys[i - 1];
        if (t <= t1) return y0 + (y1 - y0) * clamp01((t - t0) / (t1 - t0 || 1));
      }
      return keys[keys.length - 1][1];
    };

    el.setAttribute("data-play", "");
    nodes.forEach((n) => n.removeAttribute("data-lit"));
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      nodes.forEach((n) => n.setAttribute("data-lit", ""));
      if (head) head.style.opacity = "0";
    };
    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (t >= end) return finish();
      if (head) {
        head.style.opacity = clamp01((end - t) / 0.3).toFixed(3);
        head.style.transform = `translateY(${yAt(t).toFixed(1)}px)`;
      }
      nodes.forEach((n, i) => {
        if (t >= LEAD + i * BEAT) n.setAttribute("data-lit", "");
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return finish;
  });

  return (
    <div ref={ref} data-reveal="packet" className="packet-track relative pl-5">
      <span aria-hidden className="packet-rail" />
      <span aria-hidden className="packet-head" />
      {children}
    </div>
  );
}
```

- [ ] **Step 2: CSS**

Append to `src/app/globals.css`:

```css
/* Experience packet: rail, nodes lit blue, a packet with a short trail, a ping. */
@layer base {
  .packet-rail {
    position: absolute;
    left: 3px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: hsl(var(--border));
  }
  .packet-head {
    position: absolute;
    left: 1px;
    top: -2.5px;
    width: 5px;
    height: 5px;
    background: hsl(var(--signal));
    opacity: 0;
    pointer-events: none;
  }
  .packet-head::before {
    content: "";
    position: absolute;
    left: 2px;
    bottom: 100%;
    width: 1px;
    height: 44px;
    background: linear-gradient(to top, hsl(var(--signal)), transparent);
  }
  /* Sits in the date column, on the rail, level with the first date line. */
  .packet-node {
    position: absolute;
    left: calc(-1.25rem + 1px);
    top: calc(0.75em - 2.5px);
    width: 5px;
    height: 5px;
    background: hsl(var(--signal));
  }
  .packet-node::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid hsl(var(--signal));
    opacity: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    html[data-motion]:not([data-motion="static"]) .packet-track:not([data-revealed]) .packet-node,
    .packet-track[data-play] .packet-node:not([data-lit]) {
      background: hsl(var(--foreground) / 0.25);
    }
    .packet-track[data-play] .packet-node[data-lit]::after {
      animation: node-ping 0.5s var(--ease-power3-out) both;
    }
  }
}

@keyframes node-ping {
  from {
    opacity: 0.9;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(3.2);
  }
}
```

- [ ] **Step 3: Wrap the ledger**

Replace the whole of `src/components/home/ExperienceLedger.tsx` with the version below. Compared with Task 2, the list is wrapped in `PacketTrack`, and the date column is `relative` and carries the node:

```tsx
import PacketTrack from "@/components/motion/PacketTrack";
import careerData from "@/data/career.json";
import { careerSchema } from "@/lib/schemas";
import Image from "next/image";

/**
 * The home page's centrepiece: every internship with what was actually built
 * there and the stack it took. The full record lives on /experience. A packet
 * runs down the list when it scrolls in (PacketTrack).
 */
export default function ExperienceLedger() {
  const career = careerSchema.parse(careerData).career;

  return (
    <PacketTrack>
      <ol className="divide-y">
        {career.map((job) => (
          <li
            key={job.name}
            className="grid gap-x-6 gap-y-3 py-6 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr]"
          >
            <div className="label relative">
              <span aria-hidden data-node className="packet-node" />
              <time className="block">{job.start}</time>
              <span className="block">to {job.end ?? "present"}</span>
              {job.location && <span className="mt-1 block">{job.location}</span>}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="relative size-9 shrink-0 overflow-hidden rounded bg-white ring-1 ring-border">
                  <Image
                    src={job.logo}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-contain p-1"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="display-md text-lg leading-snug">
                    <a
                      href={job.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-signal"
                    >
                      {job.name}
                    </a>
                  </h3>
                  <p className="text-sm text-muted-foreground">{job.title}</p>
                </div>
              </div>

              {job.description && (
                <ul className="mt-3 flex flex-col gap-2">
                  {job.description.slice(0, 2).map((d) => (
                    <li key={d} className="flex gap-3 text-sm leading-relaxed">
                      <span
                        aria-hidden
                        className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-signal"
                      />
                      <span className="text-foreground/90">{d}</span>
                    </li>
                  ))}
                </ul>
              )}

              {job.tech && <p className="label mt-3">{job.tech.join(" · ")}</p>}
            </div>
          </li>
        ))}
      </ol>
    </PacketTrack>
  );
}
```

- [ ] **Step 4: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 5: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task9`
Expected: `all clear`. In both the desktop and mobile screenshots, the experience list has a hairline down its left with a blue square level with each job's first date line, and the dates clear the line.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion/PacketTrack.tsx src/components/home/ExperienceLedger.tsx src/app/globals.css
git commit -m "feat(motion): a packet runs the experience list and lights each job

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Wins slam in over ghost numerals

**Files:**
- Create: `src/components/motion/AchievementsList.tsx`
- Modify: `src/components/home/Achievements.tsx`
- Modify: `src/data/profile.json` (achievements gain `mark`)
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `useReveal` (Task 3), and `BEAT`, `SLAMS`, `poseAt`, `poseCss` and `power3Out` (Task 1).
- Produces: a default-exported `AchievementsList` with props `{ items: Achievement[] }`, plus the exported type `Achievement { title: string; detail: string; mark?: string }`.

- [ ] **Step 1: Data**

In `src/data/profile.json`, add a `mark` to three achievements. Leave everything else as it is:

```json
    {
      "title": "Overall winner, GenTech Thales Hackathon",
      "detail": "First place across all tracks.",
      "mark": "1st"
    },
    {
      "title": "Global top 11, Walmart Sparkathon",
      "detail": "Selected from a worldwide pool of teams.",
      "mark": "11"
    },
```

and

```json
    {
      "title": "CodeChef 4-star, peak rating 1813",
      "detail": "",
      "mark": "1813"
    }
```

- [ ] **Step 2: `AchievementsList`**

Create `src/components/motion/AchievementsList.tsx`:

```tsx
"use client";

import { BEAT, SLAMS, poseAt, poseCss, power3Out } from "@/lib/motion";
import { useRef } from "react";
import { useReveal } from "./useReveal";

export interface Achievement {
  title: string;
  detail: string;
  /** A short figure set behind the row as a ghost numeral, e.g. "1st". */
  mark?: string;
}

const FADE = 0.3; // s for each unmarked row
const STAGGER = 0.12; // s between unmarked rows

/**
 * The wins, as the reel's wins scene: rows with a mark slam in one beat
 * apart, each with one of the reel's three entrances, over an outlined ghost
 * numeral; the rest fade up after the last slam.
 */
export default function AchievementsList({ items }: { items: Achievement[] }) {
  const ref = useRef<HTMLUListElement>(null);

  useReveal(ref, (el) => {
    const rows = [...el.querySelectorAll<HTMLElement>("[data-win]")];
    const slams = rows
      .filter((r) => r.dataset.win === "mark")
      .map((row, i) => ({ row, at: i * BEAT, e: SLAMS[i % SLAMS.length] }));
    const rest = rows.filter((r) => r.dataset.win === "rest");
    const lastSlam = slams[slams.length - 1];
    const restFrom = lastSlam ? lastSlam.at + lastSlam.e.duration : 0;
    const end = restFrom + Math.max(0, rest.length - 1) * STAGGER + FADE;

    const draw = (t: number) => {
      for (const { row, at, e } of slams) {
        if (t < at) {
          row.style.opacity = "0";
          continue;
        }
        const css = poseCss(poseAt(e, t - at));
        row.style.opacity = "1";
        row.style.transform = css.transform;
        row.style.filter = css.filter;
      }
      rest.forEach((row, i) => {
        const k = power3Out((t - restFrom - i * STAGGER) / FADE);
        row.style.opacity = k.toFixed(3);
        row.style.transform = `translateY(${((1 - k) * 8).toFixed(2)}px)`;
      });
    };
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      for (const r of rows) {
        r.style.opacity = "";
        r.style.transform = "";
        r.style.filter = "";
      }
    };
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= end) return finish();
      draw(t);
      raf = requestAnimationFrame(frame);
    };
    draw(0);
    raf = requestAnimationFrame(frame);
    return finish;
  });

  return (
    <ul ref={ref} data-reveal="hide" className="flex flex-col divide-y">
      {items.map((a) => (
        <li
          key={a.title}
          data-win={a.mark ? "mark" : "rest"}
          className="win relative py-2.5 first:pt-0"
        >
          {a.mark && (
            <span aria-hidden className="ghost-mark">
              {a.mark}
            </span>
          )}
          <div className="relative">
            <p className="text-sm font-medium leading-snug">{a.title}</p>
            {a.detail && <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Use it**

Replace the whole of `src/components/home/Achievements.tsx` with:

```tsx
import AchievementsList from "@/components/motion/AchievementsList";
import profile from "@/data/profile.json";

export default function Achievements() {
  return <AchievementsList items={profile.achievements} />;
}
```

- [ ] **Step 4: CSS**

Append to `src/app/globals.css`:

```css
/* Wins: rows pivot low-left like the reel's slams; marks sit behind as outlines. */
@layer base {
  .win {
    transform-origin: 0% 60%;
  }
  .ghost-mark {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-display), Georgia, serif;
    font-size: 2.75rem;
    line-height: 1;
    letter-spacing: -0.02em;
    color: transparent;
    -webkit-text-stroke: 1.5px hsl(var(--foreground) / 0.16);
    pointer-events: none;
    user-select: none;
  }
}
```

- [ ] **Step 5: Lint, test, build, and confirm the chatbot index is unchanged**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

Run: `npm run gen && git status --short src/data/embeddings.json`
Expected: `npm run gen` finishes, and `git status` prints nothing for `embeddings.json`. The generator reads only `title` and `detail`, so the index text doesn't change.

If `embeddings.json` does show as modified, run `git diff --stat src/data/embeddings.json`, include it in the commit, and say so in your report. If `npm run gen` fails to load the model, report the error and continue: `mark` never reaches the index.

- [ ] **Step 6: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task10`
Expected: `all clear`. In the screenshots, "1st", "11" and "1813" sit faint and outlined at the right of their rows, behind the text, in both themes.

- [ ] **Step 7: Commit**

```bash
git add src/components/motion/AchievementsList.tsx src/components/home/Achievements.tsx src/data/profile.json src/app/globals.css
git commit -m "feat(motion): marked wins slam in on the beat over ghost numerals

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: "fluent in ___"

**Files:**
- Create: `src/components/motion/LangReel.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `useReveal` (Task 3), and `reelClicks`, `reelPos`, `reelDuration` and `reelWords` (Task 1).
- Produces: a default-exported `LangReel` with props `{ words: string[]; className?: string }`. The last word is the landing word.

- [ ] **Step 1: `LangReel`**

Create `src/components/motion/LangReel.tsx`:

```tsx
"use client";

import { reelClicks, reelDuration, reelPos } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useReveal } from "./useReveal";

const LINE = 1.15; // em: one word cell, matching .reel-window's line-height

/**
 * "fluent in ___": a slot reel that clicks through the languages, slowing as
 * it goes, and lands on the last word with an overshoot, like the reel's
 * stack scene. The window is as wide as the widest word, so nothing moves
 * around it. The server renders the landed word.
 */
export default function LangReel({ words, className }: { words: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const last = words.length - 1;

  useReveal(ref, (el) => {
    const strip = el.querySelector<HTMLElement>(".reel-strip");
    if (!strip || last < 1) return () => {};
    const clicks = reelClicks(last);
    const end = reelDuration(clicks);
    const put = (pos: number) => {
      strip.style.transform = `translateY(${(-pos * LINE).toFixed(4)}em)`;
    };
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      put(last);
    };
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= end) return finish();
      put(reelPos(t, clicks));
      raf = requestAnimationFrame(frame);
    };
    put(0);
    raf = requestAnimationFrame(frame);
    return finish;
  });

  if (last < 0) return null;
  return (
    <p
      ref={ref}
      data-reveal="hide"
      className={cn("display-md text-[1.35rem] tracking-[-0.015em] sm:text-[1.6rem]", className)}
    >
      <span className="sr-only">fluent in {words[last]}</span>
      <span aria-hidden>
        <span className="text-muted-foreground">fluent in</span>{" "}
        <span className="reel-window">
          <span className="reel-sizer">
            {words.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </span>
          <span className="reel-strip" style={{ transform: `translateY(${(-last * LINE).toFixed(4)}em)` }}>
            {words.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </span>
        </span>
      </span>
    </p>
  );
}
```

- [ ] **Step 2: CSS**

Append to `src/app/globals.css`:

```css
/* Language reel: a one-line window as wide as the widest word, clipped top and bottom. */
@layer base {
  .reel-window {
    position: relative;
    display: inline-block;
    line-height: 1.15em;
    clip-path: inset(0 -0.2em);
  }
  .reel-sizer {
    display: inline-grid;
    visibility: hidden;
  }
  .reel-sizer > span {
    grid-area: 1 / 1;
    white-space: nowrap;
  }
  .reel-strip {
    position: absolute;
    inset: 0 0 auto 0;
  }
  .reel-strip > span {
    display: block;
    height: 1.15em;
    white-space: nowrap;
  }
}
```

- [ ] **Step 3: Home skills section**

In `src/app/page.tsx`:
1. Add the imports:

   ```tsx
   import LangReel from "@/components/motion/LangReel";
   import { reelWords } from "@/lib/motion";
   ```

2. Inside `Home()`, after the `const age = …` line, add:

   ```tsx
     const languages = profile.skills.find((s) => s.group === "Languages")?.items ?? [];
   ```

3. Replace

   ```tsx
           <SectionHeading label="07 / SKILLS" title="Skills and technologies" />
           <SkillChips />
   ```

   with

   ```tsx
           <SectionHeading label="07 / SKILLS" title="Skills and technologies" />
           <LangReel words={reelWords(languages)} className="mb-6" />
           <SkillChips />
   ```

- [ ] **Step 4: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 5: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task11`
Expected: `all clear`. The screenshot reads "fluent in Go." above the skill chips at desktop and mobile widths, and only one word shows in the window.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion/LangReel.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(motion): \"fluent in\" slot reel lands on Go.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: The index rail as the reel's chrome

**Files:**
- Modify: `src/components/home/IndexRail.tsx`
- Modify: `src/app/page.tsx` (`INDEX` gains Achievements)
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `.label` (Task 2), `#achievements` (Task 2) and `--ease-back-out` (Task 3).
- Produces: `IndexRail({ entries: IndexEntry[] })`, with the same export and `IndexEntry` type as before.

- [ ] **Step 1: Rewrite `IndexRail`**

Replace the whole of `src/components/home/IndexRail.tsx` with:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export interface IndexEntry {
  id: string;
  label: string;
}

/**
 * The index in the right margin on wide screens, in the reel's chrome style:
 * numbered mono rows and a signal playhead that springs to the section on
 * screen. Sections that share a top edge (side-by-side columns) light
 * together. Sits outside the column so it never competes with the content.
 */
export default function IndexRail({ entries }: { entries: IndexEntry[] }) {
  const [active, setActive] = useState<string[]>(entries[0] ? [entries[0].id] : []);
  const [head, setHead] = useState(0);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const targets = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    // The section whose top is closest above the 40% line wins, with any
    // section that shares its top edge.
    const pick = () => {
      const line = window.innerHeight * 0.4;
      let best = targets[0];
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) best = el;
      }
      const top = best.getBoundingClientRect().top;
      const ids = targets
        .filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 2)
        .map((el) => el.id);
      setActive((prev) => (prev.join() === ids.join() ? prev : ids));
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [entries]);

  // Park the playhead beside the first active row.
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>(`[data-id="${active[0]}"]`);
    if (row) setHead(row.offsetTop + (row.offsetHeight - 14) / 2);
  }, [active]);

  return (
    <nav aria-label="On this page" className="index-rail fixed top-[38vh] hidden w-44 xl:block">
      <p className="label mb-3">Index</p>
      <div className="relative pl-4">
        <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px bg-border" />
        <span aria-hidden className="index-playhead" style={{ transform: `translateY(${head}px)` }} />
        <ol ref={list} className="flex flex-col gap-1.5">
          {entries.map((e, i) => {
            const on = active.includes(e.id);
            return (
              <li key={e.id} data-id={e.id}>
                <a
                  href={`#${e.id}`}
                  aria-current={on ? "location" : undefined}
                  className={cn("label transition-colors", on ? "text-foreground" : "hover:text-foreground")}
                >
                  {String(i + 1).padStart(2, "0")} {e.label}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: CSS**

Append to `src/app/globals.css`:

```css
/* Index rail playhead: springs to the active row. */
@layer base {
  .index-playhead {
    position: absolute;
    left: -0.5px;
    top: 0;
    width: 2px;
    height: 14px;
    background: hsl(var(--signal));
    transition: transform 0.34s var(--ease-back-out);
  }
  @media (prefers-reduced-motion: reduce) {
    .index-playhead {
      transition: none;
    }
  }
}
```

- [ ] **Step 3: Eight entries**

In `src/app/page.tsx`, change `INDEX` to:

```tsx
const INDEX = [
  { id: "intro", label: "Intro" },
  { id: "github", label: "GitHub" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "open-source", label: "Open source" },
  { id: "achievements", label: "Achievements" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];
```

- [ ] **Step 4: Lint, test, build**

Run: `npm run lint && npm test && npm run build`
Expected: lint is clean, 27 tests pass and the build succeeds.

- [ ] **Step 5: Headless checks**

Run: `$V/check.sh --quick`, then `$V/check.sh --only / --shots $V/shots/task12`
Expected: `all clear`. In `desktop-dark-home.png`, the rail right of the column reads 01 INTRO to 08 CONTACT in mono caps, with the blue playhead beside 01, and nothing wraps or collides with the column.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/IndexRail.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(motion): index rail in the reel's chrome style with a sprung playhead

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Docs and the full pass

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the docs that match the shipped behaviour.

- [ ] **Step 1: Update CLAUDE.md**

In `CLAUDE.md`, under `## Commands`, add a line after `npm run lint`:

```bash
npm test        # unit tests for the motion maths (src/lib/motion.ts, node --test)
```

Under `## Design system (redesign of Sep 2026)`, replace the `- Type:` bullet with:

```markdown
- Type: Young Serif for display (`.display`, `.display-md`, one weight) and
  big numbers, Instrument Sans for body, JetBrains Mono for machine output
  (the donut, code in chat), the hero greeting, and `.label`: small
  spaced-out mono caps for section labels (`03 / EXPERIENCE`), page labels
  (`PKY / WORK`), dates, places, tech lists and captions. Silkscreen
  (`.font-pixel`) only for the banner clock. Loaded in `src/app/layout.tsx`
  via `next/font`.
```

Then replace the last bullet

```markdown
- Deliberate restraint: no gradient washes, no glow effects, no card
  shadows. The banner, the donut, and the grid traces are the only motion.
```

with

```markdown
- Deliberate restraint: no gradient washes, no glow effects, no card
  shadows.
- Motion follows the showreel (`videos/prashant-showreel`; spec in
  `docs/superpowers/specs/2026-09-26-reel-motion-design.md`): a hero intro
  once per tab session, then one move per section as it scrolls in, then
  stillness. The banner, the donut and the grid traces keep running. The
  timing maths live in `src/lib/motion.ts` (`npm test`); the pieces live in
  `src/components/motion/` and render their finished state on the server.
  A script at the top of `<body>` marks `<html data-motion>` before the
  first paint; CSS "before" states apply only under that marker and
  `prefers-reduced-motion: no-preference`, and a 3s timer flips it to
  `static` if scripts are late. New moves use `useReveal`, play once,
  follow reduced motion live, and animate only transform, opacity, filter
  or canvas.
```

In the `- Ground:` bullet, change

```markdown
  on a fixed canvas with a few blue traces running along it. Static under
  `prefers-reduced-motion`.
```

to

```markdown
  on a fixed canvas with a few blue traces running along it. It powers on
  from the centre on the first load of a tab session. Static under
  `prefers-reduced-motion`.
```

In `## Testing a change`, change step 1 from `` `npm run lint && npm run build` `` to `` `npm run lint && npm test && npm run build` ``.

- [ ] **Step 2: Full verification**

Run:

```bash
npm run lint && npm test && npm run build
$V/check.sh --shots $V/shots/final
$V/check.sh --hello --live --slow --skip-pages
```

Expected: lint is clean, 27 tests pass, the build succeeds, and both checks report `all clear`. The full run covers:
- all six pages;
- desktop, mobile and the tall window;
- reduced motion and JavaScript off;
- light and dark screenshots.

- [ ] **Step 3: The JS budget**

In the `next build` output, read the First Load JS for `/`.
Expected: at most 146 kB. It was 136 kB before this work, and the budget is +10 kB. Report the number.

- [ ] **Step 4: Record the hero intro**

Run: `$V/hero-gif.sh $V/shots/final/hero-intro.gif`
Expected: the script prints the GIF's path and size. The GIF covers the first 3.5s of home in dark mode at 1280×720 and shows:
- the greeting typing;
- the cursor becoming a dot;
- the line unzipping to the rails;
- the wave springing in.

Report the path. The spec's other Docs item, the saved design-preference note, lives outside the repo. The controller updates it after this task.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md covers the motion kit, the label type, and npm test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
