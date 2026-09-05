# Dev Senpai: how the chatbot works

Dev Senpai is the assistant on the portfolio. It answers questions about
Prashant with retrieval-augmented generation (RAG): it finds the relevant
portfolio cards first, then hands them to a language model as context.

```text
question
  → contextual query (folds in the previous turn for follow-ups)
  → dense retrieval (MiniLM cosine)  +  sparse retrieval (BM25, stemmed)
  → reciprocal rank fusion
  → entity and intent boosts
  → MMR diversity rerank, confidence floor
  → system prompt (key facts + numbered cards)
  → provider chain: visitor's choice → Groq → the rest
  → streamed plain-text answer, cached if it was a first-turn question
```

## Files

| File | Role |
|------|------|
| `scripts/generate.ts` | Builds readable cards from `src/data/*.json` and embeds them into `src/data/embeddings.json`. Run with `npm run gen`. |
| `src/lib/embeddings.ts` | MiniLM-L6-v2 via `@xenova/transformers`, used at build time and lazily at request time. |
| `src/lib/vectordb.ts` | The retrieval engine. Loads the index once, runs dense + sparse search, fuses, boosts, reranks. |
| `src/lib/providers.ts` | Groq, Gemini, and ChatGPT behind one client (all three speak the OpenAI chat protocol). Holds per-provider budgets and the fallback order. |
| `src/lib/ratelimit.ts` | `Budget` (per-provider per-minute and per-day caps) and `SlidingWindow` (per-visitor cap). |
| `src/lib/cache.ts` | LRU with TTL for finished answers. |
| `src/app/api/chat/route.ts` | `GET` lists configured providers. `POST` runs the pipeline and streams the answer. |
| `src/contexts/ChatContext.tsx` | Client state: messages, chosen provider, per-answer metadata, open/closed dock. |
| `src/components/chat/*` | The panel (used inline on the home page and as a dock elsewhere). |

## Content: cards, not pages

`generate.ts` turns each fact cluster into one self-contained card:

- one card per job (`career.json`), degree (`education.json`), and project (`projects.json`)
- from `profile.json`: an about card, a skills card, an open-source card, an achievements card, a college-roles card, and one card per FAQ entry
- a contact card from `socials.json`
- a lossy text extraction of the privacy page

Cards are short enough that a single retrieved chunk usually answers the
question. Long cards are split at 800 characters with 120 overlap.

To change what the bot knows, edit the JSON files and run `npm run gen`.

## Retrieval details (`vectordb.ts`)

- **Contextual query.** Short questions or ones with pronouns ("what about there?") are merged with the last two user turns before retrieval. The model still sees the original question.
- **Sparse index** is built once per process: stemmed tokens, document frequencies, average length. Synonym expansion maps casual words ("job", "stack", "hire") onto the vocabulary of the cards.
- **Dense** search is cosine similarity over MiniLM vectors. If the model cannot load, the route continues with sparse only.
- **Fusion** uses reciprocal rank fusion, which needs no score normalisation.
- **Boosts.** A query that names a company, project, or institution boosts that card. A query about "experience", "projects", "education", "skills", "contact", "achievements", or "open source" nudges cards of that type.
- **MMR** picks the final set for diversity so the model does not get five copies of the same card.
- **Confidence floor.** Cards under a fused-score threshold are dropped, and the prompt says so when nothing is left.

## Providers and quota (`providers.ts`, `ratelimit.ts`)

Each provider has a request budget (requests per minute and per day) taken
from env vars with conservative free-tier defaults. Before every call the
route reserves one request from the budget; if the budget is empty, or the
provider recently returned 429, it moves to the next provider in the chain
without touching the network. Upstream 429s put the provider into a cooldown
based on its `Retry-After`.

Order of attempts:

1. the provider the visitor picked (or every configured provider in order for "Auto")
2. Groq, because it is fast and has the largest free quota
3. anything else that is configured

The response carries `X-Chat-Provider`, `X-Chat-Model`, `X-Chat-Cache`, and
(when the first choice was skipped) `X-Chat-Fallback`, which the UI turns into
the small "via Groq" line under an answer.

## Keeping token use low

- Only the last 8 messages go to the model, each capped at 1,500 characters.
- Retrieved context is capped at 6,000 characters; six cards normally, nine for list-style questions.
- Answers are capped at 450 output tokens. Reasoning models get `reasoning_effort: low`.
- First-turn questions are cached for 12 hours, so the suggested prompts cost one provider call in total.
- Each visitor is limited to 20 questions a minute.

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | one of the three | Groq (default model `openai/gpt-oss-120b`) |
| `GEMINI_API_KEY` | one of the three | Gemini through its OpenAI-compatible endpoint (default `gemini-2.5-flash`) |
| `OPENAI_API_KEY` | one of the three | ChatGPT (default `gpt-4.1-mini`) |
| `*_MODEL` | no | Override a provider's model |
| `*_RPM`, `*_RPD` | no | Override a provider's per-minute and per-day budget |
| `RESEND_API_KEY` | for the contact form | Resend |
| `GITHUB_TOKEN` | no | Higher rate limit for the live stdlib-js merged-PR count |

Budgets live in server memory. On serverless hosts that means per warm
instance, which is still enough to keep a single burst of traffic inside a
free tier.
