import careerData from "@/data/career.json";
import { careerSchema } from "@/lib/schemas";
import Image from "next/image";

/** Compact list for the home page: when, where, what. Details live on /experience. */
export default function ExperienceLedger() {
  const career = careerSchema.parse(careerData).career;

  return (
    <ol className="divide-y">
      {career.map((job) => (
        <li
          key={job.name}
          className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 py-4 sm:grid-cols-[11rem_2.5rem_1fr] sm:items-center"
        >
          <time className="col-span-2 whitespace-nowrap text-sm text-muted-foreground sm:col-span-1">
            {job.start} to {job.end ?? "present"}
          </time>
          <span className="relative size-8 overflow-hidden rounded bg-white ring-1 ring-border sm:size-8">
            <Image
              src={job.logo}
              alt=""
              fill
              sizes="32px"
              className="object-contain p-1"
            />
          </span>
          <div className="min-w-0">
            <p className="font-medium leading-snug">
              <a
                href={job.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-signal"
              >
                {job.name}
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              {job.title}
              {job.description?.[0] ? (
                <span className="hidden sm:inline">. {firstClause(job.description[0])}</span>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** First sentence, trimmed to keep the row on one or two lines. */
function firstClause(text: string): string {
  const s = text.split(/(?<=\.)\s/)[0];
  return s.length > 110 ? s.slice(0, 107).replace(/[,\s]+\S*$/, "") + "…" : s;
}
