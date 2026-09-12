"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/** The time in Lucknow, set in a pixel face. Ticks once a second. */
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function PixelClock({ className }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setNow(fmt.format(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time
      className={cn(
        "font-pixel inline-flex items-baseline gap-1.5 rounded-sm bg-background/70 px-2 py-1 text-[11px] leading-none text-foreground backdrop-blur-[2px] sm:text-xs",
        className,
      )}
      title="Current time in Lucknow, India"
      aria-live="off"
    >
      <span className="tabular-nums">{now ?? "--:--:--"}</span>
      <span className="text-[9px] text-muted-foreground">IST</span>
    </time>
  );
}
