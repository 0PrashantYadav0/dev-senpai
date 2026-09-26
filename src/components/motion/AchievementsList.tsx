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
