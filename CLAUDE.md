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

The look is "the polyglot's workbench": espresso dark ground, cream ink, one
copper signal colour. Dark is the default theme; light mode is warm paper.

- Tokens live in `src/app/globals.css` as HSL CSS variables consumed by
  `tailwind.config.ts` (shadcn-style). Retheme by editing the variables only;
  components use semantic classes (`bg-background`, `text-signal`, ...).
- Type: Young Serif for display (`.display`, `.display-md`, one weight),
  Instrument Sans for body, JetBrains Mono strictly for machine output (the
  donut, code in chat). Loaded in `src/app/layout.tsx` via `next/font`.
- The hero's 3D element is `src/components/home/AsciiDonut.tsx`, a hand-rolled
  donut.c-style torus rendered into a `<pre>`. No 3D library; keep it that
  way. It pauses off-screen and freezes under `prefers-reduced-motion`.
- `src/components/home/StackStrip.tsx` shows tech marks from `simple-icons`
  in brand colours (near-black marks fall back to the ink colour). It is a
  server component so the SVGs cost no client JS.
- Deliberate restraint: no gradient washes, no dot grids, no glow effects,
  no card shadows. The donut is the one decorative element.

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

1. `npm run lint && npm run build`
2. `npx next start -p 3111`, then check home, /experience, /projects,
   /contact in both themes and at mobile width.
3. Exercise Dev Senpai once (needs `GROQ_API_KEY` in `.env`) and the projects
   filters.
