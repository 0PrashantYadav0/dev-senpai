import StatsCounter from "@/components/vui/StatsCounter";
import {
  GITHUB_USER,
  getContributions,
  getPullRequests,
  getRecentActivity,
  timeAgo,
  type Activity,
} from "@/lib/github";
import {
  GitCommitHorizontal,
  GitPullRequestArrow,
  CircleDot,
  MessageSquare,
  FolderPlus,
  Star,
  Activity as ActivityIcon,
} from "lucide-react";
import ContributionGraph from "./ContributionGraph";
import PullRequestTabs from "./PullRequestTabs";

const ICONS: Record<Activity["kind"], typeof Star> = {
  push: GitCommitHorizontal,
  pr: GitPullRequestArrow,
  issue: CircleDot,
  comment: MessageSquare,
  create: FolderPlus,
  star: Star,
  other: ActivityIcon,
};

/**
 * What GitHub says about the work: the calendar, the numbers, the pull
 * requests by state, and the last few public events. Everything is
 * fetched on the server and cached for an hour; any block whose data did
 * not arrive is left out rather than shown empty.
 */
export default async function GitHubActivity() {
  const [contributions, prs, activity] = await Promise.all([
    getContributions(),
    getPullRequests(),
    getRecentActivity(),
  ]);
  const now = Date.now();

  if (!contributions && !prs && activity.length === 0) {
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

      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        {prs && <PullRequestTabs data={prs} ages={ages} user={GITHUB_USER} />}

        {activity.length > 0 && (
          <div className="min-w-0">
            <h3 className="text-base font-medium">Lately</h3>
            <ol className="mt-3 flex flex-col gap-3">
              {activity.map((a) => {
                const Icon = ICONS[a.kind];
                return (
                  <li key={a.url + a.text} className="flex gap-3 text-sm">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 hover:text-signal"
                      >
                        {a.text}
                      </a>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.repo.replace(`${GITHUB_USER}/`, "")}
                        <span className="mx-1.5 opacity-50">·</span>
                        {timeAgo(a.at, now)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
