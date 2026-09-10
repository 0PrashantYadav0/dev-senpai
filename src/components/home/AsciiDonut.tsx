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

  const rows: string[] = [];
  for (let row = 0; row < H; row++) {
    rows.push(chars.slice(row * W, (row + 1) * W).join(""));
  }
  return rows.join("\n");
}

/* The opening angle, chosen because the hole reads immediately. Rendered on
   the server too, so the hero arrives at full size with no layout shift. */
const START_A = 5.6;
const START_B = 0.2;
const FIRST_FRAME = renderFrame(START_A, START_B);

export default function AsciiDonut({ className }: { className?: string }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = ref.current;
    if (!pre) return;

    let A = START_A;
    let B = START_B;
    let raf = 0;
    let last = 0;
    let visible = true;
    let animating = false;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 33) return; // ~30fps is plenty for text
      last = now;
      A += 0.045;
      B += 0.02;
      pre.textContent = renderFrame(A, B);
    };

    const start = () => {
      if (animating) return;
      animating = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!animating) return;
      animating = false;
      cancelAnimationFrame(raf);
    };

    // Follow the OS setting live, not just its value at mount.
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => (motion.matches ? stop() : start());

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(pre);
    applyMotion();
    motion.addEventListener("change", applyMotion);

    return () => {
      stop();
      observer.disconnect();
      motion.removeEventListener("change", applyMotion);
    };
  }, []);

  return (
    <pre
      ref={ref}
      aria-hidden
      className={`donut overflow-hidden text-[8px] sm:text-[10px] lg:text-[12px] ${className ?? ""}`}
    >
      {FIRST_FRAME}
    </pre>
  );
}
