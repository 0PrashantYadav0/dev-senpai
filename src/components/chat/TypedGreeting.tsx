"use client";

import { useEffect, useState } from "react";

const GREETING =
  "Hi. I'm Dev Senpai, the assistant on Prashant's site. Ask me what he built at Walmart or Zomato, which projects use Go, or whether he's a fit for your team. I answer from his resume and project notes, so I'll say when I don't know.";

/** Module-level so navigating between pages does not replay the intro. */
let hasPlayed = false;

export default function TypedGreeting() {
  const [shown, setShown] = useState(hasPlayed ? GREETING : "");
  const [done, setDone] = useState(hasPlayed);

  useEffect(() => {
    if (hasPlayed) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      hasPlayed = true;
      setShown(GREETING);
      setDone(true);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(GREETING.slice(0, i));
      if (i >= GREETING.length) {
        window.clearInterval(id);
        hasPlayed = true;
        setDone(true);
      }
    }, 14);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-sm leading-relaxed" aria-live="polite">
      <span className={done ? undefined : "caret"}>{shown}</span>
    </p>
  );
}
