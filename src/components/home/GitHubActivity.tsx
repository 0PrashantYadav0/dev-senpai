import StatsCounter from "@/components/vui/StatsCounter";
import { GITHUB_USER, getContributions, getPullRequests, timeAgo } from "@/lib/github";
import ContributionGraph from "./ContributionGraph";
import PullRequestTabs from "./PullRequestTabs";

/**
 * What GitHub says about the work: the calendar, the numbers, and the pull
 * requests by state. Everything is fetched on the server and cached for an
 * hour; any block whose data did not arrive is left out rather than shown
 * empty.
 */
export default async function GitHubActivity() {
  const [contributions, prs] = await Promise.all([getContributions(), getPullRequests()]);
  const now = Date.now();

  if (!contributions && !prs) {
    return (
      <p className="text-sm text-muted-foreground">
        GitHub is not answering right now.{" "}
        <a href={`https://github.com/${GITHUB_USER}`} className="link">
          See the profile directly.
        </a>
      </p>
    );
  }

  const stats = [
    contributions && { label: "contributions, past year", value: contributions.total },
    prs && { label: "pull requests merged", value: prs.merged.total },
    prs && { label: "open right now", value: prs.open.total },
    prs && { label: "closed without merge", value: prs.closed.total },
  ].filter((s): s is { label: string; value: number } => Boolean(s));

  const ages: Record<string, string> = {};
  if (prs) {
    for (const state of ["merged", "open", "closed"] as const) {
      for (const pr of prs[state].items) ages[pr.url] = timeAgo(pr.updatedAt, now);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {contributions && <ContributionGraph data={contributions} />}

      {stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-4 py-3">
              <dd className="display-md text-2xl sm:text-[1.7rem]">
                <StatsCounter value={s.value} />
              </dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {prs && <PullRequestTabs data={prs} ages={ages} user={GITHUB_USER} />}
    </div>
  );
}
