"use client";

import type { ContributionDay, Contributions } from "@/lib/github";
import { useState } from "react";

/**
 * A year of contributions as a GitHub-style calendar. Columns are weeks,
 * rows are days. The grid is fluid, 53 equal columns of square cells, so
 * the whole year fits the column at every width with no horizontal scroll.
 */

/* Spelled out so Tailwind sees them and keeps the styles in the bundle. */
const LEVEL_CLASS = ["heat heat-0", "heat heat-1", "heat heat-2", "heat heat-3", "heat heat-4"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKS = 53;

function utc(date: string) {
  return new Date(date + "T00:00:00Z");
}

function describe(d: ContributionDay) {
  const when = utc(d.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (d.count === 0) return `No contributions on ${when}`;
  return `${d.count} contribution${d.count === 1 ? "" : "s"} on ${when}`;
}

interface Tip {
  x: number;
  y: number;
  text: string;
}

export default function ContributionGraph({ data }: { data: Contributions }) {
  const [tip, setTip] = useState<Tip | null>(null);

  // Pad the first week so Sunday sits on row 0, like GitHub.
  const lead = utc(data.days[0].date).getUTCDay();
  const cells: (ContributionDay | null)[] = [...Array<null>(lead).fill(null), ...data.days];
  const weeks: (ContributionDay | null)[][] = [];
  for (let w = 0; w * 7 < cells.length; w++) {
    const week = cells.slice(w * 7, w * 7 + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // One label per month present, in order (a month at both ends appears twice).
  const months: string[] = [];
  let lastMonth = -1;
  for (const d of data.days) {
    const m = utc(d.date).getUTCMonth();
    if (m !== lastMonth) {
      months.push(MONTHS[m]);
      lastMonth = m;
    }
  }

  const show = (e: React.MouseEvent<HTMLDivElement>, d: ContributionDay) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top - 6, text: describe(d) });
  };

  return (
    <figure className="min-w-0">
      <div
        aria-hidden
        className="mb-1 flex justify-between text-[10px] leading-none text-muted-foreground"
      >
        {months.map((m, i) => (
          <span key={`${m}-${i}`}>{m}</span>
        ))}
      </div>

      <div
        role="img"
        aria-label={`${data.total} contributions in the last year`}
        className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[2px]"
        style={
          weeks.length === WEEKS
            ? undefined
            : { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }
        }
      >
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-col gap-[2px]">
            {week.map((d, i) =>
              d ? (
                <div
                  key={d.date}
                  title={describe(d)}
                  className={`aspect-square w-full rounded-[2px] ${LEVEL_CLASS[d.level] ?? LEVEL_CLASS[0]}`}
                  onMouseEnter={(e) => show(e, d)}
                  onMouseLeave={() => setTip(null)}
                />
              ) : (
                <div key={`pad-${w}-${i}`} className="aspect-square w-full" />
              ),
            )}
          </div>
        ))}
      </div>

      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-card px-2 py-1 text-xs text-foreground"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}

      <figcaption className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{data.total.toLocaleString("en-US")} contributions in the last year</span>
        <span className="inline-flex items-center gap-1">
          Less
          {LEVEL_CLASS.map((cls) => (
            <span key={cls} aria-hidden className={`inline-block size-[10px] rounded-[2px] ${cls}`} />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}
