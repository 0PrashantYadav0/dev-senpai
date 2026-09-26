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
      <span aria-hidden className="select-none">
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
        <span aria-hidden className={cn("odo-suffix select-none", suffixClassName)}>
          {suffix}
        </span>
      )}
    </span>
  );
}
