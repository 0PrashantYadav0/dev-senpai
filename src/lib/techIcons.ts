import {
  siBun,
  siCplusplus,
  siDjango,
  siDocker,
  siFastapi,
  siFlask,
  siGin,
  siGo,
  siHono,
  siHtmx,
  siJavascript,
  siJenkins,
  siKubernetes,
  siMermaid,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPython,
  siReact,
  siRedis,
  siSpring,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

// This module is bundled into client JS (project tiles), so it imports only
// the icons the tiles can use. The full home-page stack lives in
// stackList.ts, which stays server-side.

export type { SimpleIcon };

/** Icons a project tile can fall back to, keyed by language or tag. */
const BY_NAME: Record<string, SimpleIcon> = {
  go: siGo,
  python: siPython,
  typescript: siTypescript,
  javascript: siJavascript,
  "c++": siCplusplus,
  java: siOpenjdk,
  react: siReact,
  "next.js": siNextdotjs,
  nextjs: siNextdotjs,
  "node.js": siNodedotjs,
  nodejs: siNodedotjs,
  "spring boot": siSpring,
  django: siDjango,
  fastapi: siFastapi,
  flask: siFlask,
  gin: siGin,
  bun: siBun,
  hono: siHono,
  htmx: siHtmx,
  jenkins: siJenkins,
  kubernetes: siKubernetes,
  docker: siDocker,
  mermaid: siMermaid,
  mongodb: siMongodb,
  postgresql: siPostgresql,
  redis: siRedis,
};

/** The mark for a project without a screenshot: its language, else the first
 * recognisable tag. */
function iconForProject(
  language?: string,
  tags: string[] = [],
): SimpleIcon | undefined {
  const lang = language?.toLowerCase();
  if (lang && BY_NAME[lang]) return BY_NAME[lang];
  for (const t of tags) {
    const hit = BY_NAME[t.toLowerCase()];
    if (hit) return hit;
  }
  return undefined;
}

/** A serialisable tile mark, resolved on the server so simple-icons never
 * reaches client JS. */
export interface TechMark {
  path: string;
  title: string;
  dark: string;
  light: string;
}

export function markForProject(
  language?: string,
  tags: string[] = [],
): TechMark | undefined {
  const icon = iconForProject(language, tags);
  if (!icon) return undefined;
  const { dark, light } = markColors(icon.hex);
  return { path: icon.path, title: icon.title, dark, light };
}

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * A brand colour tuned for each ground: lightness raised on black, lowered
 * on white, hue and saturation kept so the mark stays recognisable. Without
 * this, JavaScript's yellow disappears on white and C++'s navy on black.
 */
export function markColors(hex: string): { dark: string; light: string } {
  const [h, s, l] = hexToHsl(hex);
  return {
    dark: l < 0.6 ? hslToHex(h, s, 0.6) : `#${hex}`,
    light: l > 0.42 ? hslToHex(h, s, 0.42) : `#${hex}`,
  };
}
