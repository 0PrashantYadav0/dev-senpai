# Dev Senpai - AI Portfolio Chatbot

A personal developer portfolio website featuring **Dev Senpai**, an AI chatbot that answers questions about my skills, projects, and experience using RAG (Retrieval-Augmented Generation).

![Chatbot Demo](/public/chatbot-demo.png)

## Features

- **AI Chatbot**: Powered by [Groq](https://groq.com) (`llama-3.3-70b-versatile`) for ultra-fast responses.
- **RAG Architecture**: Hybrid retrieval (dense embeddings + BM25) fused with Reciprocal Rank Fusion and reranked with MMR to ground the AI's answers in real portfolio data.
- **Local Embeddings**: Uses [`@xenova/transformers`](https://github.com/xenova/transformers.js) to generate embeddings locally (no external API costs).
- **Fast & Free**: No database required. Embeddings are stored in a local JSON file.
- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM**: [Groq](https://groq.com/) (Llama 3.3 70B)
- **Embeddings**: Local MiniLM-L6-v2 (via `@xenova/transformers`)
- **Vector Search**: Custom in-memory hybrid engine — dense cosine similarity + sparse BM25, RRF fusion, and MMR reranking (graceful fallback to sparse-only)
- **Streaming**: `ai/react` (Vercel AI SDK)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/dev-senpai.git
cd dev-senpai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Groq API key (get one for free at [console.groq.com](https://console.groq.com/keys)):

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Generate Embeddings

This step reads your content (data files and site pages), turns it into readable cards, and generates the vector embeddings used by the chatbot.

```bash
npm run gen
```

*Note: The first run will download the embedding model (~80MB).*

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Architecture

The chatbot works by:
1. **Indexing**: `npm run gen` converts your content into embeddings saved in `src/data/embeddings.json`.
2. **Retrieval**: When a user asks a question, the API runs hybrid retrieval (dense + sparse), fuses the rankings with RRF, and diversifies with MMR.
3. **Generation**: The relevant content is sent to Groq's Llama 3 model as context to generate a helpful answer.

For a detailed deep-dive, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Customization

- **Bio/Data**: Edit the curated profile card in `scripts/generate.ts` to update the chatbot's core knowledge about you.
- **Projects/Experience**: Update `src/data/projects.json`, `src/data/career.json`, and `src/data/education.json`.
- **System Prompt**: Modify `src/app/api/chat/route.ts` to change the chatbot's personality or instructions.

## License

MIT
