"use client";

import TypeOn from "@/components/motion/TypeOn";
import Scramble from "@/components/motion/Scramble";
import { useChatbot } from "@/contexts/ChatContext";
import profile from "@/data/profile.json";
import { typeTimes } from "@/lib/motion";
import Link from "next/link";

/* The reel's URL pace: 16ms a character. */
const EMAIL_TIMES = typeTimes(profile.email, { start: 0, step: 0.016, pause: 0 });

export default function ContactStrip() {
  const { open } = useChatbot();

  return (
    <section className="rounded-lg border bg-card p-6 sm:p-8">
      <Scramble text="08 / CONTACT" className="mb-3 block" />
      <h2 className="display-md text-2xl sm:text-3xl">Want to know more about me?</h2>
      <p className="mt-3">
        <a
          href={`mailto:${profile.email}`}
          className="font-mono text-[15px] text-signal transition-colors hover:text-foreground sm:text-base"
        >
          <TypeOn text={profile.email} times={EMAIL_TIMES} />
        </a>
      </p>
      <p className="measure mt-3 text-muted-foreground">
        Ask Dev Senpai anything about my work, or send a note and I will reply.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Send a message
        </Link>
        <button
          type="button"
          onClick={open}
          className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:border-signal hover:bg-signal-soft"
        >
          Ask Dev Senpai
        </button>
      </div>
    </section>
  );
}
