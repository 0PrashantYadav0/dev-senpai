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
