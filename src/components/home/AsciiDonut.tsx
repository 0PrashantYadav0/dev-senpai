"use client";

import { useEffect, useRef } from "react";

const W = 56;
const H = 26;
const CHARS = ".,-~:;=!*#$@";

/**
 * The donut.c torus, re-derived by hand: two rotation matrices, a z-buffer,
 * and a luminance ramp into ASCII. No 3D library; the whole render is this
 * file. Pauses off-screen and holds a single frame under reduced motion.
 */
function renderFrame(A: number, B: number): string {
  const chars: string[] = new Array(W * H).fill(" ");
  const zbuf = new Float32Array(W * H);
  const cA = Math.cos(A),
    sA = Math.sin(A),
    cB = Math.cos(B),
    sB = Math.sin(B);

  for (let t = 0; t < 6.283; t += 0.07) {
    const ct = Math.cos(t),
      st = Math.sin(t);
    for (let p = 0; p < 6.283; p += 0.02) {
      const sp = Math.sin(p),
        cp = Math.cos(p);
      const h = ct + 2; // torus cross-section pushed out to the ring
      const D = 1 / (sp * h * sA + st * cA + 5); // camera distance, inverted
      const m = sp * h * cA - st * sA;

      const x = Math.floor(W / 2 + 23 * D * (cp * h * cB - m * sB));
      const y = Math.floor(H / 2 + 11.5 * D * (cp * h * sB + m * cB));
      const o = x + W * y;
      const lum = Math.floor(
        8 *
          ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB),
      );

      if (y >= 0 && y < H && x >= 0 && x < W && D > zbuf[o]) {
        zbuf[o] = D;
        chars[o] = CHARS[Math.max(lum, 0)];
      }
    }
  }

  let out = "";
  for (let row = 0; row < H; row++) {
    out += chars.slice(row * W, (row + 1) * W).join("") + "\n";
  }
  return out;
}

export default function AsciiDonut({ className }: { className?: string }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = ref.current;
    if (!pre) return;

    let A = 5.6; // a flattering opening angle: the hole reads immediately
    let B = 0.2;
    let raf = 0;
    let last = 0;
    let visible = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    pre.textContent = renderFrame(A, B);
    if (reduceMotion) return;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 33) return; // ~30fps is plenty for text
      last = now;
      A += 0.045;
      B += 0.02;
      pre.textContent = renderFrame(A, B);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(pre);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <pre
      ref={ref}
      aria-hidden
      className={`donut overflow-hidden text-[7px] sm:text-[9px] lg:text-[11px] ${className ?? ""}`}
    />
  );
}
