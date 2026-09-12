# Banner, grid, and GitHub redesign (12 Sep 2026)

Brief: the site looks plain at large widths; the owner wants a centred
column with real margins, a moving background, a banner with a pixel clock,
GitHub activity (heatmap, merged/open PRs, recent events), chip-style skills,
and text presented the way ashutoshx7.me does it. Keep the ASCII donut.
Borrow from VengeanceUI where it fits.

## Layout

- Content column `max-w-site` = 44rem, centred. Dashed rails on both column
  edges from `sm` up. Section rules span the full viewport with 3px ticks
  where they cross the rails (`Rule` component).
- Right-hand `IndexRail` (home only, `xl` up): section anchors, active one
  highlighted with IntersectionObserver.
- Header and footer live inside the column.

## Background

`WorkbenchGrid`: fixed canvas behind everything. A 48px line grid at very
low opacity, a handful of copper traces that travel along grid lines and
fade. Static grid only under `prefers-reduced-motion`. Pauses when the tab
is hidden.

## Banner

`Banner`: canvas drawn at 1/3 resolution and upscaled with smoothing off so
it reads as pixel art. Dark theme: night over hills, copper crescent moon,
twinkling stars, a shooting star now and then. Light theme: day, copper sun,
drifting pixel clouds. Both: three parallax hill layers, grass band, a
pixel figure at a laptop whose screen blinks. Edges fade into the page.
`PixelClock` (Silkscreen via next/font) shows Asia/Kolkata time, bottom right.

## Hero

Name + wave (unchanged voice), donut beside it (unchanged component). Intro
is one line, then three bullets with bold links, then "Download resume" and
"Send an email", then social chips.

## GitHub section

`src/lib/github.ts` gains:
- `getContributions()`: github-contributions-api.jogruber.de (no token),
  returns 371 days with counts and levels plus the yearly total.
- `getPullRequests()`: three search calls (merged, open, closed-unmerged),
  6 items each with totals.
- `getRecentActivity()`: public events mapped to readable lines.
All cached with `revalidate: 3600`; failures degrade to hidden blocks.

Components: `ContributionGraph` (server SVG), `StatsCounter` (count-up,
ported from VengeanceUI without framer-motion), `PullRequestTabs` (client
tabs), `ActivityFeed` (server list).

## Skills

`SkillChips`: profile skill groups rendered as chips; each item that maps
to a simple-icons mark gets the mark in brand colour (`skillMarks.ts`).

## Not changing

Donut, palette tokens, fonts for display/body/mono, chat dock, contact
form, data files' shape, other pages beyond inheriting the column.
