import type { Project } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Icon from "../Icon";

interface Props {
  project: Project;
  /**
   * "row": thumbnail beside text, for the projects list.
   * "compact": small thumbnail above a short blurb, for the home page.
   */
  layout: "row" | "compact";
}

export default function ProjectRow({ project, layout }: Props) {
  const { name, description, image, tags, links, href, language } = project;
  const primary = href ?? links.find((l) => l.name === "Website")?.href ?? links[0]?.href;
  const compact = layout === "compact";

  return (
    <article
      className={cn(
        "group grid",
        compact ? "gap-3" : "gap-4 sm:grid-cols-[13rem_1fr] sm:gap-6",
      )}
    >
      <a
        href={primary}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative block overflow-hidden rounded-md bg-secondary ring-1 ring-border",
          compact ? "aspect-[4/3]" : "aspect-[16/10]",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={`${name} screenshot`}
            fill
            sizes={compact ? "(min-width: 1024px) 15vw, 45vw" : "(min-width: 640px) 13rem, 100vw"}
            className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <Tile name={name} language={language} />
        )}
      </a>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className={cn("font-medium leading-snug", compact ? "text-[15px]" : "text-lg")}>
          <a
            href={primary}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-signal"
          >
            {name}
          </a>
        </h3>
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground",
            compact && "line-clamp-3 text-[13px]",
          )}
        >
          {description}
        </p>
        <p className="text-xs text-muted-foreground">
          {(compact ? tags.slice(0, 4) : tags).join(", ")}
        </p>
        {!compact && links.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-foreground underline decoration-border underline-offset-4 hover:decoration-signal"
                >
                  <Icon name={l.icon} aria-hidden className="size-3.5" />
                  {l.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/** Typographic stand-in for projects without a screenshot. */
function Tile({ name, language }: { name: string; language?: string }) {
  const initials = name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-3">
      <span className="text-[11px] text-muted-foreground">{language ?? ""}</span>
      <span className="display self-end text-4xl text-foreground/20 transition-colors group-hover:text-signal/60">
        {initials}
      </span>
    </div>
  );
}
