/**
 * Live GitHub numbers, fetched on the server and cached for an hour.
 * Every call degrades gracefully: the merged count falls back to the
 * resume's figure, everything else to an empty result the UI hides.
 */

export const GITHUB_USER = "0PrashantYadav0";
const STDLIB_REPO = "stdlib-js/stdlib";

/** A floor the count has already passed; shown when the live call fails. */
export const MERGED_PR_FALLBACK = 160;

const REVALIDATE = 3600;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "prashantyadav-portfolio",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, next: { revalidate: REVALIDATE } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Merged PRs into stdlib (the hero figure)                            */
/* ------------------------------------------------------------------ */

export interface MergedPrCount {
  count: number;
  live: boolean;
}

export async function getMergedStdlibPrCount(): Promise<MergedPrCount> {
  const url = `https://api.github.com/search/issues?q=is:pr+is:merged+author:${GITHUB_USER}+repo:${STDLIB_REPO}&per_page=1`;
  try {
    const data = await getJson<{ total_count?: number }>(url, { headers: headers() });
    if (typeof data.total_count !== "number") throw new Error("Unexpected payload");
    return { count: data.total_count, live: true };
  } catch (err) {
    console.warn("Merged PR count unavailable, using resume figure:", err);
    return { count: MERGED_PR_FALLBACK, live: false };
  }
}

/* ------------------------------------------------------------------ */
/* Contribution calendar                                               */
/* ------------------------------------------------------------------ */

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Contributions {
  total: number;
  days: ContributionDay[];
}

/**
 * The public contribution graph, via a small proxy that scrapes it, so no
 * token is needed. Returns null when unreachable; the UI hides the graph.
 */
export async function getContributions(): Promise<Contributions | null> {
  const url = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`;
  try {
    const data = await getJson<{
      total?: Record<string, number>;
      contributions?: ContributionDay[];
    }>(url, { headers: { "User-Agent": "prashantyadav-portfolio" } });
    if (!Array.isArray(data.contributions)) throw new Error("Unexpected payload");
    const total = data.total?.lastYear ?? data.contributions.reduce((s, d) => s + d.count, 0);
    return { total, days: data.contributions };
  } catch (err) {
    console.warn("Contribution graph unavailable:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Pull requests across every repository                               */
/* ------------------------------------------------------------------ */

export type PrState = "merged" | "open" | "closed";

export interface PullRequest {
  title: string;
  repo: string; // owner/name
  url: string;
  number: number;
  updatedAt: string;
}

export interface PrBucket {
  total: number;
  items: PullRequest[];
}

export type PullRequests = Record<PrState, PrBucket>;

const PR_QUERIES: Record<PrState, string> = {
  merged: "is:pr+is:merged",
  open: "is:pr+is:open",
  closed: "is:pr+is:closed+is:unmerged",
};

interface SearchItem {
  title: string;
  html_url: string;
  number: number;
  updated_at: string;
  repository_url: string;
}

async function searchPrs(state: PrState, perPage: number): Promise<PrBucket | null> {
  const url = `https://api.github.com/search/issues?q=${PR_QUERIES[state]}+author:${GITHUB_USER}&per_page=${perPage}&sort=updated`;
  try {
    const data = await getJson<{ total_count?: number; items?: SearchItem[] }>(url, {
      headers: headers(),
    });
    if (typeof data.total_count !== "number" || !Array.isArray(data.items)) {
      throw new Error("Unexpected payload");
    }
    return {
      total: data.total_count,
      items: data.items.map((i) => ({
        title: i.title,
        repo: i.repository_url.split("/repos/")[1] ?? "",
        url: i.html_url,
        number: i.number,
        updatedAt: i.updated_at,
      })),
    };
  } catch (err) {
    console.warn(`PR search (${state}) unavailable:`, err);
    return null;
  }
}

/** Every state, or null when none of the searches came back. */
export async function getPullRequests(perPage = 6): Promise<PullRequests | null> {
  const [merged, open, closed] = await Promise.all([
    searchPrs("merged", perPage),
    searchPrs("open", perPage),
    searchPrs("closed", perPage),
  ]);
  if (!merged && !open && !closed) return null;
  const empty: PrBucket = { total: 0, items: [] };
  return { merged: merged ?? empty, open: open ?? empty, closed: closed ?? empty };
}

/* ------------------------------------------------------------------ */
/* Recent public activity                                              */
/* ------------------------------------------------------------------ */

export type ActivityKind = "push" | "pr" | "issue" | "comment" | "create" | "star" | "other";

export interface Activity {
  kind: ActivityKind;
  text: string;
  repo: string;
  url: string;
  at: string;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    size?: number;
    commits?: { message: string }[];
    number?: number;
    pull_request?: { number?: number; head?: { ref?: string } };
    issue?: { title: string; html_url: string; number: number };
    comment?: { html_url: string };
  };
}

function describe(e: GitHubEvent): Activity | null {
  const repo = e.repo.name;
  const repoUrl = `https://github.com/${repo}`;
  const base = { repo, at: e.created_at };
  switch (e.type) {
    case "PushEvent": {
      const n = e.payload.size ?? e.payload.commits?.length ?? 0;
      const branch = (e.payload.ref ?? "").replace("refs/heads/", "");
      if (n === 0) return null;
      return {
        ...base,
        kind: "push",
        text: `Pushed ${n} commit${n === 1 ? "" : "s"} to ${branch}`,
        url: `${repoUrl}/commits/${branch}`,
      };
    }
    case "PullRequestEvent": {
      // The public event stream carries a trimmed pull request: number and
      // branches, no title. The branch name is the most readable part.
      const number = e.payload.number ?? e.payload.pull_request?.number;
      if (!number) return null;
      const verbs: Record<string, string> = { opened: "Opened", merged: "Merged", closed: "Closed" };
      const verb = verbs[e.payload.action ?? ""];
      if (!verb) return null;
      const branch = e.payload.pull_request?.head?.ref;
      return {
        ...base,
        kind: "pr",
        text: `${verb} pull request #${number}${branch ? ` from ${branch}` : ""}`,
        url: `${repoUrl}/pull/${number}`,
      };
    }
    case "IssuesEvent": {
      const issue = e.payload.issue;
      if (!issue || !["opened", "closed"].includes(e.payload.action ?? "")) return null;
      const verb = e.payload.action === "opened" ? "Opened issue" : "Closed issue";
      return { ...base, kind: "issue", text: `${verb} #${issue.number}: ${issue.title}`, url: issue.html_url };
    }
    case "IssueCommentEvent": {
      const issue = e.payload.issue;
      if (!issue || e.payload.action !== "created") return null;
      return {
        ...base,
        kind: "comment",
        text: `Commented on #${issue.number}: ${issue.title}`,
        url: e.payload.comment?.html_url ?? issue.html_url,
      };
    }
    case "CreateEvent": {
      if (e.payload.ref_type !== "repository") return null;
      return { ...base, kind: "create", text: "Created the repository", url: repoUrl };
    }
    case "WatchEvent":
      return { ...base, kind: "star", text: "Starred", url: repoUrl };
    default:
      return null;
  }
}

/** The last few things worth reading from the public event stream. */
export async function getRecentActivity(limit = 6): Promise<Activity[]> {
  const url = `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=60`;
  try {
    const events = await getJson<GitHubEvent[]>(url, { headers: headers() });
    const out: Activity[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      const a = describe(e);
      if (!a) continue;
      // One line per repo+text; pushes to the same branch collapse.
      const key = `${a.repo}:${a.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a);
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    console.warn("Recent activity unavailable:", err);
    return [];
  }
}

/** "3 days ago" style, computed on the server so it is stable in the HTML. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
  ];
  let v = s;
  let label = "s";
  for (const [div, next] of units) {
    if (v < div) break;
    v /= div;
    label = next;
  }
  if (label === "s") return "just now";
  return `${Math.floor(v)}${label} ago`;
}
