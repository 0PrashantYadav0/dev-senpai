"use client";

import { useEffect, useRef } from "react";

/**
 * The page ground: a fine line grid with a few copper traces travelling
 * along it, like signals on a board. Drawn on one fixed canvas behind
 * everything. Under reduced motion only the grid is drawn; the traces are
 * skipped entirely. Pauses while the tab is hidden.
 */

const CELL = 48;
const TRACES = 7;

interface Trace {
  x: number;
  y: number;
  dir: 0 | 1 | 2 | 3; // right, down, left, up
  len: number; // cells travelled so far on this leg
  leg: number; // cells for this leg
  life: number; // 0..1 fade
  speed: number; // px per second
  trail: { x: number; y: number }[];
}

export default function WorkbenchGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let running = false;
    const traces: Trace[] = [];

    const css = () => getComputedStyle(document.documentElement);
    let ink = "0 0% 50%";
    let signal = "27 60% 58%";
    const readTokens = () => {
      const s = css();
      ink = s.getPropertyValue("--foreground").trim() || ink;
      signal = s.getPropertyValue("--signal").trim() || signal;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGrid();
    };

    // Grid lines are centred on the viewport so they line up with the column.
    const originX = () => (w / 2) % CELL;
    const originY = () => 0;

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

    const spawn = (): Trace => {
      const cols = Math.floor(w / CELL);
      const rows = Math.floor(h / CELL);
      const dir = Math.floor(Math.random() * 4) as Trace["dir"];
      return {
        x: originX() + Math.floor(Math.random() * cols) * CELL,
        y: originY() + Math.floor(Math.random() * rows) * CELL,
        dir,
        len: 0,
        leg: 2 + Math.floor(Math.random() * 5),
        life: 0,
        speed: 40 + Math.random() * 50,
        trail: [],
      };
    };

    const step = (t: Trace, dt: number) => {
      const d = t.speed * dt;
      const dx = t.dir === 0 ? d : t.dir === 2 ? -d : 0;
      const dy = t.dir === 1 ? d : t.dir === 3 ? -d : 0;
      t.x += dx;
      t.y += dy;
      t.len += d / CELL;
      t.trail.push({ x: t.x, y: t.y });
      if (t.trail.length > 90) t.trail.shift();
      if (t.len >= t.leg) {
        // Snap to the grid and turn a corner.
        t.x = Math.round((t.x - originX()) / CELL) * CELL + originX();
        t.y = Math.round((t.y - originY()) / CELL) * CELL + originY();
        t.len = 0;
        t.leg = 2 + Math.floor(Math.random() * 5);
        const turn = Math.random() < 0.5 ? 1 : 3;
        t.dir = ((t.dir + turn) % 4) as Trace["dir"];
      }
      t.life += dt;
    };

    const drawTraces = () => {
      for (const t of traces) {
        // Fade in for a second, live ~9s, fade out over the last two.
        const a = Math.min(1, t.life, Math.max(0, 11 - t.life) / 2) * 0.55;
        if (t.trail.length < 2) continue;
        for (let i = 1; i < t.trail.length; i++) {
          const k = i / t.trail.length; // 0 tail .. 1 head
          ctx.strokeStyle = `hsl(${signal} / ${(a * k * k).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(t.trail[i - 1].x, t.trail[i - 1].y);
          ctx.lineTo(t.trail[i].x, t.trail[i].y);
          ctx.stroke();
        }
        ctx.fillStyle = `hsl(${signal} / ${a.toFixed(3)})`;
        ctx.fillRect(t.x - 1.5, t.y - 1.5, 3, 3);
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return;
      const dt = Math.min(0.1, (now - last) / 1000 || 0.033);
      last = now;
      for (let i = traces.length - 1; i >= 0; i--) {
        const t = traces[i];
        step(t, dt);
        const off = t.x < -CELL || t.x > w + CELL || t.y < -CELL || t.y > h + CELL;
        if (t.life > 11 || off) traces.splice(i, 1);
      }
      while (traces.length < TRACES && Math.random() < 0.02) traces.push(spawn());
      drawGrid();
      drawTraces();
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (motion.matches || document.hidden) {
        stop();
        traces.length = 0;
        drawGrid();
      } else {
        start();
      }
    };

    readTokens();
    resize();
    apply();

    const themeObserver = new MutationObserver(() => {
      readTokens();
      drawGrid();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", resize);
    motion.addEventListener("change", apply);
    document.addEventListener("visibilitychange", apply);
    return () => {
      stop();
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
