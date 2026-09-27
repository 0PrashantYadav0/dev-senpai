# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Prashant Kumar Yadav's personal portfolio (prashantyadav.vercel.app) with
Dev Senpai, a RAG chatbot that answers questions about his work. Next.js 14
App Router, TypeScript, Tailwind CSS.

## Deployment warning

`main` is attached to Vercel and auto-deploys on push. Never commit
experiments directly to `main`; work on a branch, build and test it, then
merge. The owner has approved adding Claude as a commit co-author in this
repository.

## Commands

```bash
npm run dev     # dev server on :3000
npm run build   # production build (a running dev server on :3000 rewrites .next, stop it first)
npm run gen     # regenerate the chatbot's retrieval index after editing src/data
npm run lint
npm test        # unit tests for the motion maths (src/lib/motion.ts, node --test; needs Node 22.18+ for type stripping)
```

`npm run start` needs a prior build. When testing a production build while a
dev server might be running, use another port: `npx next start -p 3111`.

## Content model

All site content is data, not markup. Edit these and the pages follow:

| File | Holds |
|------|-------|
| `src/data/profile.json` | headline, summary, skills, open source, achievements, FAQ |
| `src/data/career.json` | internships (drives home Experience + /experience) |
| `src/data/education.json` | degrees |
| `src/data/projects.json` | all projects, tags, links |
| `src/data/socials.json` | social links |

After editing any of them run `npm run gen` so Dev Senpai's index
(`src/data/embeddings.json`) picks up the change. The resume PDF is
`public/resume.pdf`.

## Design system (redesign of Sep 2026)

The look is "the polyglot's workbench": black ground, cool off-white ink, one
blue signal colour. Dark is the default theme; light mode is white.

- Tokens live in `src/app/globals.css` as HSL CSS variables consumed by
  `tailwind.config.ts` (shadcn-style). Retheme by editing the variables only;
  components use semantic classes (`bg-background`, `text-signal`, ...).
- Type: Young Serif for display (`.display`, `.display-md`, one weight) and
  big numbers, Instrument Sans for body, JetBrains Mono for machine output
  (the donut, code in chat), the hero greeting, and `.label`: small
  spaced-out mono caps for section labels (`03 / EXPERIENCE`), page labels
  (`PKY / WORK`), dates, places, tech lists and captions. Silkscreen
  (`.font-pixel`) only for the banner clock. Loaded in `src/app/layout.tsx`
  via `next/font`.
- Layout: one centred column, `max-w-site` (44rem), with dashed rails on
  both edges (`.column`) and a `--gutter` variable for the side padding.
  Sections are separated by `src/components/layout/Rule.tsx`, a dashed rule
  that spans the viewport with a tick at each rail. On the home page an
  `IndexRail` lists the sections in the right margin at `xl` and up.
- Ground: `src/components/layout/WorkbenchGrid.tsx` draws a faint line grid
  on a fixed canvas with a few blue traces running along it. It powers on
  from the centre on the first load of a tab session. Static under
  `prefers-reduced-motion`.
- Banner: `src/components/home/Banner.tsx` is a pixel-art landscape drawn
  on a canvas at a third of the size (night in dark mode, day in light),
  with `PixelClock` showing Lucknow time. No image assets; edit the
  palettes and the `FIGURE` sprite in that file to change the scene.
- The hero's 3D element is `src/components/home/AsciiDonut.tsx`, a hand-rolled
  donut.c-style torus rendered into a `<pre>`. No 3D library; keep it that
  way. It pauses off-screen and freezes under `prefers-reduced-motion`. It
  overlaps the banner's lower edge on the home page.
- Brand marks come from `simple-icons`: `src/lib/stackList.ts` for the
  stack strip, `src/lib/skillMarks.ts` for the skill chips. Both are
  server-only so the SVG paths never reach client JS.
- Pieces adapted from VengeanceUI (github.com/Ashutoshx7/VengeanceUI) live
  in `src/components/vui/` and are rewritten without framer-motion or three.
- Deliberate restraint: no gradient washes, no glow effects, no card
  shadows.
- Motion follows the showreel (`videos/prashant-showreel`; spec in
  `docs/superpowers/specs/2026-09-26-reel-motion-design.md`): a hero intro
  once per tab session, then one move per section as it scrolls in, then
  stillness. The banner, the donut and the grid traces keep running. The
  timing maths live in `src/lib/motion.ts` (`npm test`); the pieces live in
  `src/components/motion/` and render their finished state on the server.
  A script at the top of `<body>` marks `<html data-motion>` before the
  first paint; CSS "before" states apply only under that marker and
  `prefers-reduced-motion: no-preference`, and a 3s timer flips it to
  `static` if scripts are late. New moves use `useReveal`, play once,
  follow reduced motion live, and animate only transform, opacity, filter
  or canvas (the decode and typing effects change text and per-character
  visibility, never layout). A finished move rests on plain CSS, not on a
  held animation fill: Chrome can paint a finished `::after` animation at
  its start value.

## GitHub data

`src/lib/github.ts` fetches, with an hour of caching and a fallback for each:
the merged-into-stdlib count (hero), the contribution calendar (through
github-contributions-api.jogruber.de, no token), pull requests by state
(search API), and recent public events. `GITHUB_TOKEN` in `.env` is optional
and only raises the rate limit. Any block whose data fails is hidden, never
shown empty. Tailwind purges class names built from template strings, so
the heat-map levels are spelled out in `ContributionGraph.tsx`.

## Architecture

- Pages: `src/app/{page,experience,projects,contact,privacy}`. Home embeds
  digest sections from `src/components/home/`; the chat floats in
  `src/components/chat/ChatDock.tsx` on every page.
- Chatbot pipeline (retrieval, providers, budgets, fallback) is documented in
  `ARCHITECTURE.md`. Provider config: `src/lib/providers.ts`. The default
  Groq model is `openai/gpt-oss-120b` (llama-3.3-70b is gone from this key).
- Contact form posts through a server action (`src/lib/actions.ts`) to Resend.
  Do not submit it in automated tests; assert client-side validation instead.

## Testing a change

1. `npm run lint && npm test && npm run build`
2. `npx next start -p 3111`, then check home, /experience, /projects,
   /contact in both themes and at mobile width.
3. Exercise Dev Senpai once (needs `GROQ_API_KEY` in `.env`) and the projects
   filters.
