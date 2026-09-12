"use client";

import { useEffect, useRef } from "react";
import PixelClock from "./PixelClock";

/**
 * The banner: a pixel-art landscape drawn by hand on a canvas. Night over
 * the hills in dark mode, a warm afternoon in light mode. Rendered at a
 * third of the size and scaled up with smoothing off so every pixel is a
 * deliberate square. Stars twinkle, clouds drift, the hills parallax, the
 * figure's laptop flickers. Holds one frame under reduced motion and
 * pauses off-screen.
 */

const PX = 3; // one logical pixel = 3 CSS pixels

type Palette = {
  sky: string[]; // top to horizon bands
  glow: string;
  disc: string;
  hills: [string, string, string];
  grass: string;
  blade: string;
  cloud: string;
  star: string;
  skin: string;
  cloth: string;
  laptop: string;
  screen: string[];
};

const NIGHT: Palette = {
  sky: ["#03050a", "#050914", "#080e1d", "#0b1428", "#0f1a33", "#142240"],
  glow: "#1c2d55",
  disc: "#e6ecf2",
  hills: ["#1b2745", "#121b30", "#0a1020"],
  grass: "#070b14",
  blade: "#101a2c",
  cloud: "#3a4d78",
  star: "#e6ecf2",
  skin: "#d9a97a",
  cloth: "#2b3a5a",
  laptop: "#1f2a40",
  screen: ["#3d8ef5", "#e6ecf2", "#2f6fd0"],
};

const DAY: Palette = {
  sky: ["#cfe3f7", "#d8e9f9", "#e0eefb", "#e8f2fc", "#eff6fd", "#f4f8fe"],
  glow: "#dbe9f8",
  disc: "#fff0b8",
  hills: ["#b9cbe3", "#9db4d4", "#7f99bf"],
  grass: "#6f8ab0",
  blade: "#8aa3c5",
  cloud: "#ffffff",
  star: "#ffffff",
  skin: "#d9a97a",
  cloth: "#2b3a5a",
  laptop: "#1f2a40",
  screen: ["#1a5fd0", "#ffffff", "#2f6fd0"],
};

/* A person sitting cross-legged with a laptop, 11 wide by 9 tall.
   . empty  h head/skin  b body  l laptop base  s screen */
const FIGURE = [
  "....hhh....",
  "....hhh....",
  ".....h.....",
  "...bbbbb...",
  "..bbbbbbb..",
  "..bbbbbbbss",
  "...bbbbblss",
  "..bbbbbbbll",
  ".bbbbbbbbb.",
];

interface Star {
  x: number;
  y: number;
  phase: number;
  speed: number;
}
interface Cloud {
  x: number;
  y: number;
  w: number;
  speed: number;
}

function hillProfile(seed: number, amp: number, base: number, freq: number) {
  return (x: number) =>
    base +
    amp *
      (0.55 * Math.sin(x * freq + seed) +
        0.3 * Math.sin(x * freq * 2.3 + seed * 1.7) +
        0.15 * Math.sin(x * freq * 5.1 + seed * 0.4));
}

export default function Banner() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0; // logical width
    let H = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let t = 0; // seconds of animation
    let dark = document.documentElement.classList.contains("dark");
    let stars: Star[] = [];
    let clouds: Cloud[] = [];
    let shoot: { x: number; y: number; life: number } | null = null;
    let nextShoot = 4;
    let screenIdx = 0;
    let nextBlink = 1.5;

    // Amplitude and base are fractions of the height; frequency is per
    // logical pixel, so the back range rolls slowest.
    const hills = [
      hillProfile(1.3, 0.1, 0.5, 0.035),
      hillProfile(4.1, 0.08, 0.63, 0.05),
      hillProfile(7.7, 0.06, 0.76, 0.08),
    ];

    const seedScene = () => {
      stars = Array.from({ length: Math.floor(W / 4) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
      }));
      clouds = Array.from({ length: 5 }, (_, i) => ({
        x: (W / 5) * i + Math.random() * 20,
        y: 4 + Math.random() * (H * 0.24),
        w: 14 + Math.floor(Math.random() * 14),
        speed: 1.2 + Math.random() * 1.4,
      }));
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect?.width ?? canvas.clientWidth));
      const cssH = Math.max(1, Math.floor(rect?.height ?? canvas.clientHeight));
      W = Math.ceil(cssW / PX);
      H = Math.ceil(cssH / PX);
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.imageSmoothingEnabled = false;
      seedScene();
      draw();
    };

    const px = (x: number, y: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    };

    const draw = () => {
      const p = dark ? NIGHT : DAY;
      const horizon = H * 0.62;

      // Sky in bands.
      const bands = p.sky.length;
      for (let i = 0; i < bands; i++) {
        const y0 = Math.floor((horizon * i) / bands);
        const y1 = Math.floor((horizon * (i + 1)) / bands);
        ctx.fillStyle = p.sky[i];
        ctx.fillRect(0, y0, W, y1 - y0 + 1);
      }
      ctx.fillStyle = p.sky[bands - 1];
      ctx.fillRect(0, Math.floor(horizon), W, H);
      // A low glow along the horizon.
      ctx.fillStyle = p.glow;
      ctx.fillRect(0, Math.floor(horizon) - 2, W, 3);

      // Stars, twinkling on their own phases.
      if (dark) {
        for (const s of stars) {
          const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
          if (a > 0.55) px(s.x, s.y, p.star);
          else if (a > 0.4) px(s.x, s.y, "#7c8aa6");
        }
        if (shoot) {
          for (let i = 0; i < 6; i++) px(shoot.x - i * 1.4, shoot.y - i, i < 2 ? p.star : "#93a2c0");
        }
      }

      // The disc: a crescent moon at night, the sun by day.
      const cx = Math.floor(W * 0.52); // left of the clock at every width
      const cy = Math.floor(H * 0.24);
      const r = Math.max(6, Math.floor(H * 0.12));
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r) continue;
          if (dark) {
            // Carve a second circle out of the disc for the crescent.
            const dx = x - Math.round(r * 0.5);
            const dy = y - Math.round(r * 0.15);
            if (dx * dx + dy * dy < r * r * 0.72) continue;
          }
          px(cx + x, cy + y, p.disc);
        }
      }

      // Clouds: rounded blobs that drift and wrap.
      for (const c of clouds) {
        const cx0 = ((c.x + t * c.speed) % (W + c.w * 2)) - c.w;
        const rows = [
          [4, c.w - 8],
          [2, c.w - 4],
          [1, c.w - 2],
          [0, c.w],
          [0, c.w],
          [2, c.w - 4],
        ];
        rows.forEach(([off, len], i) => {
          ctx.fillStyle = dark ? p.cloud : p.cloud;
          ctx.globalAlpha = dark ? 0.95 : 1;
          ctx.fillRect(Math.floor(cx0 + off), Math.floor(c.y + i), len, 1);
          ctx.globalAlpha = 1;
        });
      }

      // Hills: three layers, each sliding at its own speed.
      hills.forEach((profile, i) => {
        ctx.fillStyle = p.hills[i];
        const drift = t * (0.3 + i * 0.45);
        for (let x = 0; x < W; x++) {
          const top = Math.floor(H * profile(x + drift));
          ctx.fillRect(x, top, 1, H - top);
        }
      });

      // Grass band with swaying blades.
      const gy = H - 6;
      ctx.fillStyle = p.grass;
      ctx.fillRect(0, gy, W, 6);
      for (let x = 0; x < W; x += 3) {
        const sway = Math.round(Math.sin(t * 1.6 + x * 0.35));
        px(x + sway, gy - 1, p.blade);
        if (x % 9 === 0) px(x + sway, gy - 2, p.blade);
      }

      // The figure sits on the grass to the left, clear of the donut on the
      // right; on a phone the donut spans the column, so it moves right.
      const fx = Math.floor(W * (W * PX < 640 ? 0.85 : 0.22));
      const fy = gy - FIGURE.length;
      FIGURE.forEach((row, ry) => {
        [...row].forEach((ch, rx) => {
          if (ch === ".") return;
          const c =
            ch === "h" ? p.skin : ch === "b" ? p.cloth : ch === "l" ? p.laptop : p.screen[screenIdx];
          px(fx + rx, fy + ry, c);
        });
      });
      // Light spill from the screen onto the ground at night.
      if (dark) {
        ctx.globalAlpha = 0.25;
        px(fx + 9, fy + 9, p.screen[0]);
        px(fx + 10, fy + 9, p.screen[0]);
        ctx.globalAlpha = 1;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 66) return; // 15fps reads right for pixel art
      const dt = last ? Math.min(0.2, (now - last) / 1000) : 0.066;
      last = now;
      t += dt;

      if (t > nextBlink) {
        screenIdx = (screenIdx + 1 + Math.floor(Math.random() * 2)) % 3;
        nextBlink = t + 0.8 + Math.random() * 2.2;
      }
      if (dark) {
        if (!shoot && t > nextShoot) {
          shoot = { x: W * (0.2 + Math.random() * 0.6), y: 2 + Math.random() * H * 0.2, life: 0 };
        }
        if (shoot) {
          shoot.x += 60 * dt;
          shoot.y += 32 * dt;
          shoot.life += dt;
          if (shoot.life > 0.7) {
            shoot = null;
            nextShoot = t + 5 + Math.random() * 9;
          }
        }
      }
      draw();
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
    const applyMotion = () => (motion.matches ? stop() : start());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      dark = document.documentElement.classList.contains("dark");
      draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    resize();
    applyMotion();
    motion.addEventListener("change", applyMotion);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", applyMotion);
    };
  }, []);

  return (
    <div className="banner relative h-[176px] w-full overflow-hidden sm:h-[220px]">
      <canvas ref={ref} aria-hidden className="block h-full w-full [image-rendering:pixelated]" />
      <PixelClock className="absolute right-3 top-3" />
    </div>
  );
}
