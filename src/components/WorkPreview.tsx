import careerData from "@/data/career.json";
import { careerSchema } from "@/lib/schemas";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar";

export default function WorkPreview() {
  const career = careerSchema.parse(careerData).career;

  return (
    <ul className="flex flex-col gap-2">
      {career.map((job, id) => (
        <li key={id}>
          <Link
            href={job.href}
            target="_blank"
            className="group flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border hover:bg-secondary/40"
          >
            <Avatar className="size-12 shrink-0 rounded-xl border bg-white">
              <AvatarImage
                src={job.logo}
                alt={job.name}
                className="bg-background object-contain p-1"
              />
              <AvatarFallback className="rounded-xl">
                {job.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1">
                <h3 className="truncate font-semibold leading-tight">
                  {job.name}
                </h3>
                <ArrowUpRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {job.title}
              </p>
            </div>

            <time className="shrink-0 whitespace-nowrap rounded-full border border-border/70 bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {job.start} {"– "}
              {job.end ?? "Present"}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
