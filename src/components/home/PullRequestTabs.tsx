"use client";

import type { PrState, PullRequests } from "@/lib/github";
import { cn } from "@/lib/utils";
import { GitMerge, GitPullRequest, GitPullRequestClosed } from "lucide-react";
import { useState } from "react";

const TABS: { id: PrState; label: string; Icon: typeof GitMerge; tone: string }[] = [
  { id: "merged", label: "Merged", Icon: GitMerge, tone: "text-signal" },
  { id: "open", label: "Open", Icon: GitPullRequest, tone: "text-foreground" },
  { id: "closed", label: "Closed", Icon: GitPullRequestClosed, tone: "text-muted-foreground" },
];

interface Props {
  data: PullRequests;
  /** Pre-formatted "3d ago" strings keyed by PR url, computed on the server. */
  ages: Record<string, string>;
  user: string;
}

export default function PullRequestTabs({ data, ages, user }: Props) {
  const [active, setActive] = useState<PrState>("merged");
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];
  const bucket = data[active];
  const more = Math.max(0, bucket.total - bucket.items.length);
  const query = `is:pr+author:${user}+${
    active === "merged" ? "is:merged" : active === "open" ? "is:open" : "is:closed+is:unmerged"
  }`;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-medium">Pull requests</h3>
        <div role="tablist" aria-label="Pull request state" className="flex gap-1 rounded-md border p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs transition-colors",
                active === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              <span className={cn("tabular-nums", active === t.id ? "opacity-70" : "opacity-60")}>
                {data[t.id].total}
              </span>
            </button>
          ))}
        </div>
      </div>

      {bucket.items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing here right now.</p>
      ) : (
        <ul className="mt-3 divide-y">
          {bucket.items.map((pr) => (
            <li key={pr.url} className="flex gap-3 py-2.5">
              <tab.Icon className={cn("mt-0.5 size-4 shrink-0", tab.tone)} aria-hidden />
              <div className="min-w-0 flex-1">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm hover:text-signal"
                  title={pr.title}
                >
                  {pr.title}
                </a>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {pr.repo}
                  <span className="mx-1.5 opacity-50">#{pr.number}</span>
                  {ages[pr.url]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <a
        href={`https://github.com/pulls?q=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        className="link mt-3 inline-block text-sm"
      >
        {more > 0 ? `All ${bucket.total} ${tab.label.toLowerCase()} on GitHub` : "See on GitHub"}
      </a>
    </div>
  );
}
