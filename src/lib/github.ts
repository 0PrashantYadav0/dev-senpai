/**
 * Live GitHub numbers, fetched on the server and cached for an hour.
 * Falls back to the resume's figure when GitHub is unreachable or rate-limited.
 */

const GITHUB_USER = "0PrashantYadav0";
const STDLIB_REPO = "stdlib-js/stdlib";

/** The number on the resume; shown when the live call fails. */
export const MERGED_PR_FALLBACK = 145;

export interface MergedPrCount {
  count: number;
  live: boolean;
}

export async function getMergedStdlibPrCount(): Promise<MergedPrCount> {
  const url =
    `https://api.github.com/search/issues?q=is:pr+is:merged+author:${GITHUB_USER}+repo:${STDLIB_REPO}&per_page=1`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "prashantyadav-portfolio",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  try {
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`GitHub search returned ${res.status}`);
    const data = (await res.json()) as { total_count?: number };
    if (typeof data.total_count !== "number") throw new Error("Unexpected payload");
    return { count: data.total_count, live: true };
  } catch (err) {
    console.warn("Merged PR count unavailable, using resume figure:", err);
    return { count: MERGED_PR_FALLBACK, live: false };
  }
}
