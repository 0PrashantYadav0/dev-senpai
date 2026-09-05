"use client";

import type { Project } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import ProjectRow from "./ProjectRow";

interface Filter {
  id: string;
  label: string;
  match: (p: Project) => boolean;
}

const MAIN_LANGUAGES = ["Go", "Python", "C++", "JavaScript", "TypeScript"];
const lang = (...names: string[]) => (p: Project) => names.includes(p.language ?? "");
const tag = (re: RegExp) => (p: Project) => p.tags.some((t) => re.test(t));

/** Two groups: what it is written in, and what it is for. */
const LANGUAGE_FILTERS: Filter[] = [
  { id: "go", label: "Go", match: lang("Go") },
  { id: "python", label: "Python", match: lang("Python") },
  { id: "cpp", label: "C++", match: lang("C++") },
  { id: "js", label: "JS / TS", match: lang("JavaScript", "TypeScript") },
  { id: "other", label: "Other languages", match: (p) => !MAIN_LANGUAGES.includes(p.language ?? "") },
];

const AREA_FILTERS: Filter[] = [
  { id: "ai", label: "AI and ML", match: tag(/ai|llm|rag|gemini|groq|cerebras|machine|neural|cnn|chatbot|knowledge graph|langchain|agent|cognee|openai/i) },
  { id: "devops", label: "DevOps", match: tag(/docker|kubernetes|helm|argocd|jenkins|github actions|gitops|ci\/cd|prometheus|grafana|nginx|devsecops|signoz|opentelemetry|observability/i) },
  { id: "web", label: "Web", match: tag(/react|next|node|express|spring|hono|bun|tailwind|mern|htmx|flask|fastapi|django/i) },
];

const ALL: Filter = { id: "all", label: "All", match: () => true };

export default function ProjectsBrowser({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string>("all");

  const filter = useMemo(
    () => [ALL, ...LANGUAGE_FILTERS, ...AREA_FILTERS].find((f) => f.id === active) ?? ALL,
    [active],
  );
  const visible = useMemo(() => projects.filter(filter.match), [filter, projects]);

  const chip = (f: Filter) => {
    const count = projects.filter(f.match).length;
    const on = active === f.id;
    return (
      <button
        key={f.id}
        role="tab"
        aria-selected={on}
        onClick={() => setActive(f.id)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
          on
            ? "border-signal bg-signal-soft text-foreground"
            : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        )}
      >
        {f.label}
        <span className="text-xs text-muted-foreground">{count}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" aria-label="Filter projects" className="flex flex-wrap items-center gap-2">
        {chip(ALL)}
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {LANGUAGE_FILTERS.map(chip)}
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {AREA_FILTERS.map(chip)}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">Nothing matches that filter yet.</p>
      ) : (
        <ul className="divide-y">
          {visible.map((p) => (
            <li key={p.name} className="py-8 first:pt-0">
              <ProjectRow project={p} layout="row" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
