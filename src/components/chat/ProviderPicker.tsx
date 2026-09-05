"use client";

import { useChatbot, type ProviderChoice } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";

/**
 * Segmented control for the model. Only rendered when the server has keys
 * for at least two providers; otherwise there is nothing to choose.
 */
export default function ProviderPicker({ className }: { className?: string }) {
  const { provider, providers, setProvider } = useChatbot();
  const configured = providers.filter((p) => p.configured);
  if (configured.length < 2) return null;

  const options: { id: ProviderChoice; label: string; busy?: boolean }[] = [
    { id: "auto", label: "Auto" },
    ...configured.map((p) => ({ id: p.id, label: p.label, busy: p.retryAfterMs > 0 })),
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Model"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-background/60 p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = provider === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.busy}
            title={o.busy ? `${o.label} is out of quota for now` : undefined}
            onClick={() => setProvider(o.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
              active
                ? "bg-signal text-background"
                : "text-muted-foreground hover:text-foreground",
              o.busy && "opacity-40",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
