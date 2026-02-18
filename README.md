# Dev Senpai - AI Portfolio Chatbot

A personal developer portfolio website featuring **Dev Senpai**, an AI chatbot that answers questions about my skills, projects, and experience using RAG (Retrieval-Augmented Generation).

![Chatbot Demo](/public/chatbot-demo.png)

## Features

- **AI Chatbot**: Powered by [Groq](https://groq.com) (`llama-3.3-70b-versatile`) for ultra-fast responses.
- **RAG Architecture**: Retrieves relevant portfolio data (projects, skills, bio) to ground the AI's answers.
- **Local Embeddings**: Uses [`@xenova/transformers`](https://github.com/xenova/transformers.js) to generate embeddings locally (no external API costs).
- **Fast & Free**: No database required. Embeddings are stored in a local JSON file.
- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **LLM**: [Groq](https://groq.com/) (Llama 3.3 70B)
- **Embeddings**: Local MiniLM-L6-v2 (via `@xenova/transformers`)
- **Vector Search**: In-memory keyword-similarity search (custom implementation for speed & Next.js compatibility)
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

This step reads your content (pages, data files, blog posts) and generates the vector embeddings used by the chatbot.

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
2. **Retrieval**: When a user asks a question, the API finds the most relevant content using keyword-based similarity search.
3. **Generation**: The relevant content is sent to Groq's Llama 3 model as context to generate a helpful answer.

For a detailed deep-dive, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Customization

- **Bio/Data**: Edit `src/data/about.md` to update the chatbot's core knowledge about you.
- **Projects/Skills**: Update `src/data/projects.json` and `src/data/skills.json`.
- **System Prompt**: Modify `src/app/api/chat/route.ts` to change the chatbot's personality or instructions.

## License

MIT
