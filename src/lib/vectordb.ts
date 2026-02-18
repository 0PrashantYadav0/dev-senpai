import * as fs from "fs";
import * as path from "path";

interface StoredEmbedding {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

interface SearchResult {
  pageContent: string;
  metadata: Record<string, unknown>;
  score: number;
}

let cachedEmbeddings: StoredEmbedding[] | null = null;

function loadEmbeddings(): StoredEmbedding[] {
  if (cachedEmbeddings) return cachedEmbeddings;

  const embeddingsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "embeddings.json",
  );

  if (!fs.existsSync(embeddingsPath)) {
    throw new Error(
      "embeddings.json not found. Run `npm run gen` to generate embeddings.",
    );
  }

  cachedEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, "utf-8"));
  return cachedEmbeddings!;
}

/**
 * Simple keyword-based similarity search.
 * Uses term frequency overlap between query and documents.
 * This avoids importing @xenova/transformers in the Next.js runtime.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function computeSimilarity(queryTokens: string[], docContent: string): number {
  const docTokens = new Set(tokenize(docContent));
  let matches = 0;
  for (const token of queryTokens) {
    if (docTokens.has(token)) matches++;
  }
  // Normalize by query length
  return queryTokens.length > 0 ? matches / queryTokens.length : 0;
}

export async function similaritySearch(
  query: string,
  k: number = 4,
): Promise<SearchResult[]> {
  const embeddings = loadEmbeddings();
  const queryTokens = tokenize(query);

  const scored = embeddings.map((item) => ({
    pageContent: item.content,
    metadata: item.metadata,
    score: computeSimilarity(queryTokens, item.content),
  }));

  // Sort by score descending, return top-k
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}