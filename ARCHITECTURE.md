# RAG Chatbot — Architecture & How It Works

This document explains how the Dev Senpai chatbot works end-to-end.

---

## Overview

The chatbot uses **Retrieval-Augmented Generation (RAG)** — it finds relevant portfolio data first, then sends it as context to an LLM to generate a natural-language answer.

```
User Question → Keyword Search → Top Documents → Groq LLM → Streamed Response
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Chat LLM** | [Groq](https://groq.com) (`llama-3.3-70b-versatile`) | Generates natural language responses |
| **Embeddings** | [@xenova/transformers](https://github.com/xenova/transformers.js) (`all-MiniLM-L6-v2`) | Generates document embeddings at build time |
| **Vector Search** | Custom keyword similarity | Finds relevant docs at query time |
| **Frontend** | `useChat` from `ai/react` | Handles streaming UI |
| **API** | Next.js API Route (`/api/chat`) | Orchestrates RAG pipeline |

---

## How Data Flows

### 1. Embedding Generation (`npm run gen`)

Run once at build time to index all portfolio content:

```
src/app/**/page.tsx  ──┐
src/data/*.json       ──┼──→ Text Splitter ──→ Local Embeddings ──→ embeddings.json
src/data/*.md         ──┤                    (MiniLM-L6-v2)
content/*.mdx         ──┘
```

**Script:** [`scripts/generate.ts`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/scripts/generate.ts)

1. Reads all page routes, data files (JSON, MD), and blog posts (MDX)
2. Splits them into ~1000-character chunks with 200-char overlap
3. Generates 384-dimensional embeddings using MiniLM-L6-v2 (runs locally, no API)
4. Saves everything to `src/data/embeddings.json`

### 2. Query Time (`POST /api/chat`)

When a user sends a message:

```
User: "What skills does Prashant have?"
            │
            ▼
   ┌─── Keyword Search ───┐
   │  Tokenize query       │
   │  Score all 25 docs    │
   │  Return top 4         │
   └───────────────────────┘
            │
            ▼
   ┌─── System Prompt ─────┐
   │  Bio facts (age, etc) │
   │  + Retrieved context  │
   │  + Instructions       │
   └───────────────────────┘
            │
            ▼
   ┌─── Groq Streaming ───┐
   │  llama-3.3-70b        │
   │  Stream chunks back   │
   └───────────────────────┘
            │
            ▼
   Frontend renders in real-time
```

**Handler:** [`src/app/api/chat/route.ts`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/src/app/api/chat/route.ts)

---

## Key Files

### [`src/lib/vectordb.ts`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/src/lib/vectordb.ts)
**Runtime search engine.** Loads pre-computed embeddings and performs keyword-based similarity search. Avoids importing ML libraries in Next.js (which causes webpack issues with native ONNX bindings).

- `loadEmbeddings()` — reads `embeddings.json` once, caches in memory
- `tokenize()` — splits text into lowercase tokens (3+ chars)
- `computeSimilarity()` — counts matching tokens between query and document
- `similaritySearch(query, k)` — returns top-k most relevant documents

### [`src/lib/embeddings.ts`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/src/lib/embeddings.ts)
**Embedding model wrapper.** Used only by `generate.ts` (not imported in Next.js). Wraps `@xenova/transformers` to provide a LangChain-compatible `Embeddings` interface.

- Uses `Xenova/all-MiniLM-L6-v2` (384 dimensions, ~80MB model, downloaded on first run)
- Model is cached after first download

### [`src/app/api/chat/route.ts`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/src/app/api/chat/route.ts)
**API endpoint.** Orchestrates the RAG pipeline:
1. Extracts the latest user message
2. Runs similarity search to find relevant documents
3. Builds a system prompt with bio facts + retrieved context
4. Streams response from Groq's `llama-3.3-70b-versatile`
5. Returns a `ReadableStream` (plain text)

### [`src/components/Chat.tsx`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/src/components/Chat.tsx)
**Chat UI.** Uses the `useChat` hook from `ai/react` with `streamProtocol: "text"` to handle the plain-text stream from the API.

### [`scripts/generate.ts`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/scripts/generate.ts)
**Embedding generator.** Runs in standalone Node.js (not in Next.js). Reads all content sources, splits into chunks, generates embeddings with MiniLM, and saves to JSON.

### [`src/data/about.md`](file:///Users/prashantyadav/Downloads/Project/dev-senpai/src/data/about.md)
**Plain-text bio.** Contains human-readable facts about Prashant (age, skills, contact). This ensures the chatbot has clean text to reference instead of raw JSX code from page files.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | ✅ | Groq API key for chat completions |

No other API keys needed. Embeddings are generated locally.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run gen` | Regenerate embeddings from all content sources |
| `npm run dev` | Start the development server |

---

## Why Not Vector Search at Runtime?

The `@xenova/transformers` library uses ONNX Runtime (native Node.js bindings). Next.js tries to bundle these with webpack, which fails because `.node` binary files can't be parsed as JavaScript modules. Rather than fighting webpack config, the runtime uses a lightweight keyword search that works well for the ~25 documents in this portfolio.

The pre-computed embeddings (generated via `npm run gen` in plain Node.js) still use the full ML model for high-quality document splitting and indexing.
