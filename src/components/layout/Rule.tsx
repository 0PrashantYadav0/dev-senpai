import { cn } from "@/lib/utils";

/**
 * A section rule that runs the full width of the viewport, with a tick
 * where it crosses each column rail. Place it between sections.
 */
export default function Rule({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("rule", className)}>
      <i />
      <i />
    </div>
  );
}
