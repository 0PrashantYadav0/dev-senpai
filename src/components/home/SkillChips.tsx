import profile from "@/data/profile.json";
import { markForSkill } from "@/lib/skillMarks";
import type { CSSProperties } from "react";

/**
 * Every skill as a chip, grouped the way profile.json groups them. Chips
 * whose name maps to a brand mark carry it in brand colour; the rest are
 * text. A server component, so the SVG paths cost no client JS.
 */
export default function SkillChips() {
  return (
    <div className="flex flex-col gap-6">
      {profile.skills.map((group) => (
        <div key={group.group}>
          <h3 className="mb-2.5 text-sm text-muted-foreground">{group.group}</h3>
          <ul className="flex flex-wrap gap-2">
            {group.items.map((item) => {
              const mark = markForSkill(item);
              return (
                <li
                  key={item}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[13px] leading-none"
                >
                  {mark && (
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="tech-mark size-3.5 shrink-0"
                      style={{ "--mark-dark": mark.dark, "--mark-light": mark.light } as CSSProperties}
                    >
                      <path d={mark.path} />
                    </svg>
                  )}
                  {item}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
