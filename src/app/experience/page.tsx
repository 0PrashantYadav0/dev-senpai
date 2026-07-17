import Experience from "@/components/Experience";

export default function ExperiencePage() {
  return (
    <article className="mt-8 flex flex-col gap-8 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="title text-5xl">experience.</h1>
        <p className="font-light text-muted-foreground">
          Where I&apos;ve worked, what I built, and the tools I reached for.
        </p>
      </div>

      <Experience />
    </article>
  );
}
