import {
  siApachekafka,
  siCplusplus,
  siDjango,
  siDocker,
  siFastapi,
  siGithubactions,
  siGo,
  siGrafana,
  siHelm,
  siJavascript,
  siKubernetes,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPostgresql,
  siPrometheus,
  siPython,
  siReact,
  siRedis,
  siSpring,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

/** Marks shown on the home page; every one is a stack something shipped with. */
const STACK: { icon: SimpleIcon; label?: string }[] = [
  { icon: siGo },
  { icon: siPython },
  { icon: siTypescript },
  { icon: siJavascript },
  { icon: siCplusplus },
  { icon: siOpenjdk, label: "Java" },
  { icon: siReact },
  { icon: siNextdotjs },
  { icon: siNodedotjs },
  { icon: siSpring },
  { icon: siDjango },
  { icon: siFastapi },
  { icon: siPostgresql },
  { icon: siMongodb },
  { icon: siRedis },
  { icon: siApachekafka, label: "Kafka" },
  { icon: siDocker },
  { icon: siKubernetes },
  { icon: siHelm },
  { icon: siGrafana },
  { icon: siPrometheus },
  { icon: siGithubactions, label: "GitHub Actions" },
];

/** Near-black brand marks vanish on the espresso ground; hand those the ink colour. */
function markColor(hex: string): string | undefined {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 60 ? undefined : `#${hex}`;
}

export default function StackStrip() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {STACK.map(({ icon, label }) => {
        const name = label ?? icon.title;
        const color = markColor(icon.hex);
        return (
          <li
            key={icon.slug}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              aria-hidden
              className="size-4 shrink-0"
              style={color ? { fill: color } : undefined}
              fill={color ? undefined : "currentColor"}
            >
              <path d={icon.path} />
            </svg>
            {name}
          </li>
        );
      })}
    </ul>
  );
}
