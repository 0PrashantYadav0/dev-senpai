import Image from "next/image";

export interface TimelineEntry {
  name: string;
  href?: string;
  title: string;
  logo?: string;
  meta?: string;
  start: string;
  end?: string;
  description?: string[];
  tech?: string[];
}

/**
 * A ledger: the date column on the left is the timeline, the content sits to
 * its right. Entries are separated by rules, not boxed.
 */
export default function Timeline({ items }: { items: TimelineEntry[] }) {
  return (
    <ol className="divide-y">
      {items.map((item, i) => (
        <li
          key={`${item.name}-${i}`}
          className="grid gap-x-6 gap-y-2 py-6 first:pt-0 sm:grid-cols-[10rem_1fr]"
        >
          <div className="text-sm text-muted-foreground">
            <time className="block">{item.start}</time>
            <span className="block">to {item.end ?? "present"}</span>
            {item.meta && <span className="mt-1 block">{item.meta}</span>}
          </div>

          <div className="min-w-0">
            <div className="flex items-start gap-3">
              {item.logo && (
                <span className="relative mt-0.5 size-9 shrink-0 overflow-hidden rounded bg-white ring-1 ring-border">
                  <Image src={item.logo} alt="" fill sizes="36px" className="object-contain p-1" />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-medium leading-snug">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-signal"
                    >
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </h3>
                {item.title && <p className="text-sm text-muted-foreground">{item.title}</p>}
              </div>
            </div>

            {item.description && item.description.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {item.description.map((d) => (
                  <li key={d} className="flex gap-3 text-sm leading-relaxed">
                    <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-signal" />
                    <span className="text-foreground/90">{d}</span>
                  </li>
                ))}
              </ul>
            )}

            {item.tech && item.tech.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">{item.tech.join(", ")}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
