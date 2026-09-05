import data from "@/data/socials.json";
import { socialSchema } from "@/lib/schemas";
import Icon from "./Icon";

export default function Socials({ className }: { className?: string }) {
  const socials = socialSchema.parse(data).socials;

  return (
    <ul className={className ?? "flex items-center gap-2"}>
      {socials.map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={item.name}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <span className="sr-only">{item.name}</span>
            <Icon name={item.icon} aria-hidden="true" className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
