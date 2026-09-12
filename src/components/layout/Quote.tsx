"use client";

import { usePathname } from "next/navigation";

/** One line per route, set above the footer. */
const QUOTES: Record<string, { text: string; by: string }> = {
  "/": { text: "Talk is cheap. Show me the code.", by: "Linus Torvalds" },
  "/experience": {
    text: "The best way to predict the future is to invent it.",
    by: "Alan Kay",
  },
  "/projects": {
    text: "Simplicity is prerequisite for reliability.",
    by: "Edsger W. Dijkstra",
  },
  "/contact": {
    text: "The most powerful tool we have as developers is automation.",
    by: "Scott Hanselman",
  },
};

const DEFAULT = {
  text: "Programs must be written for people to read, and only incidentally for machines to execute.",
  by: "Harold Abelson",
};

export default function Quote() {
  const pathname = usePathname();
  const q = QUOTES[pathname ?? ""] ?? DEFAULT;

  return (
    <blockquote className="mx-auto mb-16 mt-14 max-w-xl text-center">
      <p className="display-md text-xl leading-snug sm:text-[1.35rem]">{q.text}</p>
      <footer className="mt-3 text-sm text-muted-foreground">&ndash; {q.by}</footer>
    </blockquote>
  );
}
