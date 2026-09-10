import { STACK } from "@/lib/stackList";
import { markColors } from "@/lib/techIcons";
import type { CSSProperties } from "react";

/** Every stack shipped with so far, wearing its own brand colour. A server
 * component, so the SVGs cost no client JS. */
export default function StackStrip() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
      {STACK.map(({ icon, label }) => {
        const name = label ?? icon.title;
        const { dark, light } = markColors(icon.hex);
        return (
          <li
            key={icon.slug}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              aria-hidden
              className="tech-mark size-4 shrink-0"
              style={
                { "--mark-dark": dark, "--mark-light": light } as CSSProperties
              }
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
