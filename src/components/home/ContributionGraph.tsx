import type { Contributions } from "@/lib/github";

/**
 * A year of contributions as a GitHub-style calendar, rendered as SVG on
 * the server so it costs no client JS. Columns are weeks, rows are days.
 */
const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
/* Spelled out so Tailwind sees them and keeps the styles in the bundle. */
const LEVEL_CLASS = ["heat heat-0", "heat heat-1", "heat heat-2", "heat heat-3", "heat heat-4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ContributionGraph({ data }: { data: Contributions }) {
  // Pad the first week so Sunday sits on row 0, like GitHub.
  const first = new Date(data.days[0].date + "T00:00:00Z");
  const lead = first.getUTCDay();
  const cells = [...Array<null>(lead).fill(null), ...data.days];
  const weeks = Math.ceil(cells.length / 7);
  const width = weeks * STEP - GAP;
  const height = 7 * STEP - GAP + 16;

  // One month label per first week that starts in a new month.
  const labels: { x: number; text: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const day = cells[w * 7] ?? cells[w * 7 + lead];
    if (!day) continue;
    const m = new Date(day.date + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth) {
      if (labels.length === 0 || w - (labels[labels.length - 1].x / STEP) > 2) {
        labels.push({ x: w * STEP, text: MONTHS[m] });
      }
      lastMonth = m;
    }
  }

  return (
    <figure className="min-w-0">
      <div className="overflow-x-auto pb-1 [scrollbar-width:thin]">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${data.total} contributions in the last year`}
          className="block text-[10px] text-muted-foreground"
        >
          {labels.map((l) => (
            <text key={l.text + l.x} x={l.x} y={10} fill="currentColor" fontFamily="inherit">
              {l.text}
            </text>
          ))}
          <g transform="translate(0,16)">
            {cells.map((d, i) => {
              if (!d) return null;
              const x = Math.floor(i / 7) * STEP;
              const y = (i % 7) * STEP;
              return (
                <rect
                  key={d.date}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  className={LEVEL_CLASS[d.level] ?? LEVEL_CLASS[0]}
                >
                  <title>
                    {d.count === 0
                      ? `No contributions on ${d.date}`
                      : `${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}`}
                  </title>
                </rect>
              );
            })}
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {data.total.toLocaleString("en-US")} contributions in the last year
        </span>
        <span className="inline-flex items-center gap-1">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <svg key={l} width={CELL} height={CELL} aria-hidden>
              <rect width={CELL} height={CELL} rx={2} className={LEVEL_CLASS[l]} />
            </svg>
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}
