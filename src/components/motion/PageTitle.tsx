"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";
import Scramble from "./Scramble";
import { useReveal } from "./useReveal";

interface Props {
  /** The page's name for the mono label: "WORK" becomes "PKY / WORK". */
  label: string;
  title: string;
  className?: string;
}

/**
 * A page header set the way the reel's end card sets the name: the mono
 * label decodes, the serif title rises out of a mask, and a hairline of
 * signal unzips under it from the centre and fades. Plays once on mount.
 */
export default function PageTitle({ label, title, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useReveal(
    ref,
    (el) => {
      el.setAttribute("data-play", "");
      return () => el.removeAttribute("data-play");
    },
    { on: "mount" },
  );

  return (
    <div ref={ref} data-reveal="title" className={cn("page-title", className)}>
      <Scramble text={`PKY / ${label}`} on="mount" className="block" />
      <h1 className="display mt-3 text-[2.75rem] sm:text-[3.75rem]">
        <span className="page-title-mask">
          <span className="page-title-text">{title}</span>
        </span>
      </h1>
      <span aria-hidden className="page-title-line" />
    </div>
  );
}
