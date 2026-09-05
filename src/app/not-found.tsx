import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-6 pb-8 pt-16 sm:pt-24">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="display text-4xl sm:text-5xl">That page is not here.</h1>
      <p className="measure text-muted-foreground">
        It may have moved when the site was redesigned. The work, projects, and
        contact pages are still where the header says they are.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/projects"
          className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:border-signal hover:bg-signal-soft"
        >
          See projects
        </Link>
      </div>
    </div>
  );
}
