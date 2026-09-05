import { cn } from "@/lib/utils";

interface Props {
  /** Animate the bars (only while the assistant is working). */
  active?: boolean;
  className?: string;
}

/**
 * Dev Senpai's mark: five bars of a voice waveform, a nod to the voice-AI
 * work on the resume. Static by default; animates while an answer is being
 * prepared and respects reduced-motion.
 */
export default function Waveform({ active = false, className }: Props) {
  const heights = [40, 75, 100, 65, 45];
  return (
    <span
      aria-hidden
      className={cn("inline-flex h-4 items-center gap-[2px] text-signal", className)}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            height: `${h}%`,
            animationDelay: active ? `${i * 110}ms` : undefined,
          }}
          className={cn(
            "w-[2.5px] origin-center rounded-full bg-current",
            active && "motion-safe:animate-wave",
          )}
        />
      ))}
    </span>
  );
}
