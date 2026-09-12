"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export interface IndexEntry {
  id: string;
  label: string;
}

/**
 * The index in the right margin on wide screens: one link per section,
 * the one on screen marked. Sits outside the column so it never competes
 * with the content.
 */
export default function IndexRail({ entries }: { entries: IndexEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id);

  useEffect(() => {
    const targets = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    // The section whose top is closest above the 40% line wins.
    const pick = () => {
      const line = window.innerHeight * 0.4;
      let best = targets[0];
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) best = el;
      }
      setActive(best.id);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [entries]);

  return (
    <nav
      aria-label="On this page"
      className="index-rail fixed top-[38vh] hidden w-40 xl:block"
    >
      <p className="mb-3 font-mono text-[10px] tracking-widest text-muted-foreground">
        index
      </p>
      <ol className="flex flex-col gap-1.5">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              aria-current={active === e.id ? "location" : undefined}
              className={cn(
                "group inline-flex items-center gap-2 text-sm transition-colors",
                active === e.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-px transition-all",
                  active === e.id ? "w-4 bg-signal" : "w-2 bg-border group-hover:w-3",
                )}
              />
              {e.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
