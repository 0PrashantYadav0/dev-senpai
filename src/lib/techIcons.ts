import {
  siApachekafka,
  siArgo,
  siBun,
  siCplusplus,
  siDjango,
  siDocker,
  siFastapi,
  siFirebase,
  siFlask,
  siGin,
  siGit,
  siGithubactions,
  siGnubash,
  siGo,
  siGrafana,
  siGraphql,
  siHelm,
  siHono,
  siHtmx,
  siJavascript,
  siJenkins,
  siKubernetes,
  siLangchain,
  siLinux,
  siMermaid,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siOpenjdk,
  siOpentelemetry,
  siPostgresql,
  siPrometheus,
  siPython,
  siReact,
  siRedis,
  siSpring,
  siSqlite,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siWebassembly,
  type SimpleIcon,
} from "simple-icons";

export type { SimpleIcon };

/** Everything shipped with so far, in the order it reads best: languages,
 * frontend, backend, data, infrastructure, observability, AI. */
export const STACK: { icon: SimpleIcon; label?: string }[] = [
  { icon: siGo },
  { icon: siPython },
  { icon: siTypescript },
  { icon: siJavascript },
  { icon: siCplusplus },
  { icon: siOpenjdk, label: "Java" },
  { icon: siGnubash, label: "Bash" },
  { icon: siWebassembly, label: "WebAssembly" },
  { icon: siReact },
  { icon: siNextdotjs },
  { icon: siTailwindcss, label: "Tailwind" },
  { icon: siNodedotjs },
  { icon: siSpring },
  { icon: siDjango },
  { icon: siFastapi },
  { icon: siFlask },
  { icon: siGin },
  { icon: siBun },
  { icon: siHono },
  { icon: siGraphql },
  { icon: siPostgresql },
  { icon: siMysql },
  { icon: siMongodb },
  { icon: siRedis },
  { icon: siSqlite },
  { icon: siSupabase },
  { icon: siFirebase },
  { icon: siApachekafka, label: "Kafka" },
  { icon: siDocker },
  { icon: siKubernetes },
  { icon: siHelm },
  { icon: siNginx },
  { icon: siGithubactions, label: "GitHub Actions" },
  { icon: siArgo, label: "ArgoCD" },
  { icon: siJenkins },
  { icon: siLinux },
  { icon: siGit },
  { icon: siGrafana },
  { icon: siPrometheus },
  { icon: siOpentelemetry, label: "OpenTelemetry" },
  { icon: siLangchain },
];

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
export function iconForProject(
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
