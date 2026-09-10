import careerData from "@/data/career.json";
import { careerSchema } from "@/lib/schemas";
import Image from "next/image";

/**
 * The home page's centrepiece: every internship with what was actually built
 * there and the stack it took. The full record lives on /experience.
 */
export default function ExperienceLedger() {
  const career = careerSchema.parse(careerData).career;

  return (
    <ol className="divide-y">
      {career.map((job) => (
        <li
          key={job.name}
          className="grid gap-x-6 gap-y-3 py-6 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr]"
        >
          <div className="text-sm text-muted-foreground">
            <time className="block">{job.start}</time>
            <span className="block">to {job.end ?? "present"}</span>
            {job.location && <span className="mt-1 block">{job.location}</span>}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="relative size-9 shrink-0 overflow-hidden rounded bg-white ring-1 ring-border">
                <Image
                  src={job.logo}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-contain p-1"
                />
              </span>
              <div className="min-w-0">
                <h3 className="display-md text-lg leading-snug">
                  <a
                    href={job.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-signal"
                  >
                    {job.name}
                  </a>
                </h3>
                <p className="text-sm text-muted-foreground">{job.title}</p>
              </div>
            </div>

            {job.description && (
              <ul className="mt-3 flex flex-col gap-2">
                {job.description.slice(0, 2).map((d) => (
                  <li key={d} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-signal"
                    />
                    <span className="text-foreground/90">{d}</span>
                  </li>
                ))}
              </ul>
            )}

            {job.tech && (
              <p className="mt-3 text-xs text-muted-foreground">
                {job.tech.join(", ")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
