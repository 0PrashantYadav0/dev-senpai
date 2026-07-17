# RAG Chatbot — Architecture & How It Works

This document explains how the Dev Senpai chatbot works end-to-end.

---

## Overview

The chatbot uses **Retrieval-Augmented Generation (RAG)** — it finds relevant
portfolio data first, then sends it as context to an LLM to generate a natural,
human-like answer.

```
User Question
  → Query Expansion
  → Hybrid Retrieval (dense cosine + sparse BM25)
  → Reciprocal Rank Fusion
  → MMR diversity rerank
  → Groq LLM
  → Streamed Response
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Chat LLM** | [Groq](https://groq.com) (`llama-3.3-70b-versatile`) | Generates natural language responses |
| **Embeddings** | [@xenova/transformers](https://github.com/xenova/transformers.js) (`all-MiniLM-L6-v2`) | 384-dim embeddings for docs (build time) and queries (runtime) |
| **Vector Search** | Custom hybrid engine (dense + sparse + RRF + MMR) | Finds diverse, high-signal docs at query time |
| **Frontend** | `useChat` from `ai/react` | Handles streaming UI |
| **API** | Next.js API Route (`/api/chat`) | Orchestrates the RAG pipeline |

---

## How Data Flows

### 1. Embedding Generation (`npm run gen`)

Run once at build time to index the portfolio content. Instead of embedding raw
JSX/JSON, `generate.ts` builds **readable "cards"** — one self-contained,
human-readable document per fact cluster (each job, each project, education,
socials, a curated profile/skills card, and readable text extracted from the
site pages).

```
src/data/career.json     ──┐
src/data/education.json   ──┤
src/data/projects.json    ──┼──→ Readable cards ──→ Text Splitter ──→ Local Embeddings ──→ embeddings.json
src/data/socials.json     ──┤                                       (MiniLM-L6-v2)
src/app/**/page.tsx       ──┘   (imports/JSX stripped to prose)
```

**Script:** `scripts/generate.ts`

1. Converts each JSON record into clean prose (e.g. "Prashant worked as … at …").
2. Extracts readable copy from the home/privacy/contact pages (JSX stripped).
3. Adds a curated profile + skills card so key facts are always retrievable.
4. Splits into ~700-char chunks (120 overlap) and embeds with MiniLM-L6-v2.
5. Saves everything to `src/data/embeddings.json`.

### 2. Query Time (`POST /api/chat`)

```
User: "What did Prashant do at Nugget?"
        │
        ▼
  Query expansion (synonyms/aliases)
        │
        ├── Dense: embed query → cosine similarity over all docs
        └── Sparse: BM25 term-overlap with IDF weighting
        │
        ▼
  Reciprocal Rank Fusion (robust to score-scale differences)
        │
        ▼
  MMR rerank (drops redundant chunks, keeps variety)
        │
        ▼
  System prompt (bio facts + retrieved context w/ source links)
        │
        ▼
  Groq llama-3.3-70b → streamed, human-like answer
```

If the embedding model can't load at request time, retrieval **degrades
gracefully to pure sparse search** so the chat never hard-fails.

**Handler:** `src/app/api/chat/route.ts`

---

## Key Files

### `src/lib/vectordb.ts`
**Runtime hybrid search engine.** Loads pre-computed embeddings and performs:

- `embedQuery()` — lazily embeds the query (MiniLM), falls back to sparse-only.
- `cosineSimilarity()` — dense semantic scoring.
- `buildSparseScorer()` — BM25-style lexical scoring with IDF.
- `expandQuery()` — lightweight synonym expansion for casual phrasing.
- `rrfFuse()` — Reciprocal Rank Fusion of dense + sparse rankings.
- `mmrRerank()` — Maximal Marginal Relevance for diverse context.
- `similaritySearch(query, k)` — returns top-k fused, reranked documents.

### `src/lib/embeddings.ts`
**Embedding model wrapper.** Wraps `@xenova/transformers` behind a
LangChain-compatible interface. Used at build time by `generate.ts` and lazily
at runtime by `vectordb.ts` (externalized via `serverComponentsExternalPackages`).

### `src/app/api/chat/route.ts`
**API endpoint.** Runs similarity search, builds a grounded system prompt with
source links, and streams a plain-text response from Groq.

### `scripts/generate.ts`
**Embedding generator.** Builds readable cards from JSON + pages, chunks, embeds
with MiniLM, and writes `src/data/embeddings.json`.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | yes | Groq API key for chat completions |

No other API keys needed. Embeddings are generated locally.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run gen` | Regenerate embeddings from all content sources |
| `npm run dev` | Start the development server |
