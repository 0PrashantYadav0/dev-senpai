"use client";

import { useChatbot } from "@/contexts/ChatContext";
import profile from "@/data/profile.json";
import Link from "next/link";

export default function ContactStrip() {
  const { open } = useChatbot();

  return (
    <section className="rounded-lg border bg-card p-6 sm:p-8">
      <h2 className="display-md text-2xl sm:text-3xl">Want to know more about me?</h2>
      <p className="measure mt-3 text-muted-foreground">
        Ask Dev Senpai anything about my work, or send a note and I will reply
        from{" "}
        <a href={`mailto:${profile.email}`} className="link">
          {profile.email}
        </a>
        .
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
