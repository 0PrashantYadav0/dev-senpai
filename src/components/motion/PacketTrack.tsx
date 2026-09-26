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
      // Rest on the plain CSS (lit nodes, no pings) rather than on held
      // animation fills: Chrome can paint a finished ::after animation at its
      // start value.
      el.removeAttribute("data-play");
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
