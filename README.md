# prashantyadav.vercel.app

Personal portfolio with Dev Senpai, a chatbot that answers questions about my
work using retrieval-augmented generation over the site's own content. It can
run on Groq, Gemini, or ChatGPT and falls back between them when a quota runs
out.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Bricolage Grotesque via `next/font`
- Retrieval: local MiniLM embeddings (`@xenova/transformers`), BM25, reciprocal rank fusion, MMR. No database, the index is a JSON file.
- Generation: Groq, Gemini, and OpenAI through one OpenAI-compatible client, with per-provider budgets, automatic fallback, and an answer cache.
- Contact form: Resend

Details of the chatbot pipeline are in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Run it

```bash
npm install
cp .env.example .env     # add at least GROQ_API_KEY
npm run gen              # build the retrieval index (downloads the ~80 MB model once)
npm run dev
```

Open <http://localhost:3000>.

## Update the content

All content lives in `src/data`:

| File | What it holds |
|------|---------------|
| `profile.json` | Headline, summary, skills, open source, achievements, college roles, FAQ answers |
| `career.json` | Internships |
| `education.json` | Degrees |
| `projects.json` | Projects, tags, links, screenshots in `public/` |
| `socials.json` | Social links |

After editing any of them, run `npm run gen` so the chatbot picks up the change.
The resume PDF is `public/resume.pdf`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run gen` | Rebuild `src/data/embeddings.json` |
| `npm run lint` | ESLint |

## License

MIT
