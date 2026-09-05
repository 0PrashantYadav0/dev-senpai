import profile from "@/data/profile.json";
import { getMergedStdlibPrCount } from "@/lib/github";

export default async function OpenSource() {
  const os = profile.openSource;
  const { count, live } = await getMergedStdlibPrCount();

  return (
    <div className="flex flex-col gap-3">
      <p className="display-md text-4xl sm:text-5xl">
        {count}
        <span className="text-signal">+</span>{" "}
        <span className="text-2xl text-muted-foreground sm:text-3xl">merged pull requests</span>
      </p>
      <p className="text-muted-foreground">
        {os.role} to{" "}
        <a
          href={os.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-signal"
        >
          {os.name}
        </a>
        , the standard library for JavaScript, since {os.start}.
        {live ? " Counted live from GitHub." : ""}
      </p>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {os.description.map((d) => (
          <li key={d} className="flex gap-3">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-signal" />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}
