"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export interface IndexEntry {
  id: string;
  label: string;
}

/**
 * The index in the right margin on wide screens, in the reel's chrome style:
 * numbered mono rows and a signal playhead that springs to the section on
 * screen. Sections that share a top edge (side-by-side columns) light
 * together. Sits outside the column so it never competes with the content.
 */
export default function IndexRail({ entries }: { entries: IndexEntry[] }) {
  const [active, setActive] = useState<string[]>(entries[0] ? [entries[0].id] : []);
  const [head, setHead] = useState(0);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const targets = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    // The section whose top is closest above the 40% line wins, with any
    // section that shares its top edge.
    const pick = () => {
      const line = window.innerHeight * 0.4;
      let best = targets[0];
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) best = el;
      }
      const top = best.getBoundingClientRect().top;
      const ids = targets
        .filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 2)
        .map((el) => el.id);
      setActive((prev) => (prev.join() === ids.join() ? prev : ids));
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [entries]);

  // Park the playhead beside the first active row.
  useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>(`[data-id="${active[0]}"]`);
    if (row) setHead(row.offsetTop + (row.offsetHeight - 14) / 2);
  }, [active]);

  return (
    <nav aria-label="On this page" className="index-rail fixed top-[38vh] hidden w-44 xl:block">
      <p className="label mb-3">Index</p>
      <div className="relative pl-4">
        <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px bg-border" />
        <span aria-hidden className="index-playhead" style={{ transform: `translateY(${head}px)` }} />
        <ol ref={list} className="flex flex-col gap-1.5">
          {entries.map((e, i) => {
            const on = active.includes(e.id);
            return (
              <li key={e.id} data-id={e.id}>
                <a
                  href={`#${e.id}`}
                  aria-current={on ? "location" : undefined}
                  className={cn("label transition-colors", on ? "text-foreground" : "hover:text-foreground")}
                >
                  {String(i + 1).padStart(2, "0")} {e.label}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
