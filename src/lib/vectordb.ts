import * as fs from "fs";
import * as path from "path";

/**
 * Modern, dependable retrieval for the portfolio chatbot.
 *
 * Pipeline (all local, no external vector DB):
 *   1. Dense retrieval  - cosine similarity over MiniLM embeddings.
 *   2. Sparse retrieval - keyword / term-overlap scoring (BM25-style).
 *   3. Hybrid fusion    - Reciprocal Rank Fusion (RRF) merges both rankings,
 *                         which is robust to score-scale differences.
 *   4. Diversity rerank - Maximal Marginal Relevance (MMR) trims redundant
 *                         chunks so the LLM sees varied, high-signal context.
 *
 * If the embedding model can't load at request time we degrade gracefully to
 * pure sparse retrieval, so the chat never hard-fails.
 */

interface StoredEmbedding {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface SearchResult {
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

/* ------------------------------------------------------------------ */
/* Text utilities                                                      */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "with", "what", "who", "does", "did",
  "can", "how", "are", "was", "were", "his", "her", "him", "she", "they",
  "this", "that", "from", "have", "has", "had", "about", "tell", "know",
  "please", "would", "could", "should", "any", "all", "some", "get", "give",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Lightweight query expansion so casual phrasing still hits the right docs.
 */
const SYNONYMS: Record<string, string[]> = {
  work: ["experience", "job", "internship", "role", "career"],
  job: ["work", "experience", "role", "internship"],
  experience: ["work", "career", "internship", "job"],
  skills: ["tech", "technologies", "stack", "tools", "expertise"],
  tech: ["skills", "technologies", "stack", "tools"],
  project: ["projects", "build", "app", "application"],
  study: ["education", "degree", "college", "university", "school"],
  education: ["study", "degree", "college", "university"],
  contact: ["email", "reach", "linkedin", "github", "socials"],
  ai: ["genai", "llm", "voice", "rag", "machine", "learning"],
};

function expandQuery(query: string): string[] {
  const base = tokenize(query);
  const expanded = new Set(base);
  for (const t of base) {
    (SYNONYMS[t] ?? []).forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}

/* ------------------------------------------------------------------ */
/* Scoring primitives                                                  */
/* ------------------------------------------------------------------ */

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * BM25-flavoured sparse score with inverse-document-frequency weighting.
 */
function buildSparseScorer(docs: StoredEmbedding[]) {
  const N = docs.length;
  const df = new Map<string, number>();
  const docTokens = docs.map((d) => {
    const toks = tokenize(d.content);
    const unique = new Set(toks);
    unique.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
    return toks;
  });
  const avgLen =
    docTokens.reduce((sum, t) => sum + t.length, 0) / Math.max(N, 1);
  const k1 = 1.5;
  const b = 0.75;

  return (queryTerms: string[], docIndex: number): number => {
    const toks = docTokens[docIndex];
    if (toks.length === 0) return 0;
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);

    let score = 0;
    for (const term of queryTerms) {
      const f = tf.get(term);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(term) ?? 0) + 0.5) / ((df.get(term) ?? 0) + 0.5));
      const denom = f + k1 * (1 - b + (b * toks.length) / avgLen);
      score += idf * ((f * (k1 + 1)) / denom);
    }
    return score;
  };
}

/* ------------------------------------------------------------------ */
/* Rank fusion + MMR                                                   */
/* ------------------------------------------------------------------ */

function rrfFuse(
  rankings: number[][],
  k = 60,
): Map<number, number> {
  const fused = new Map<number, number>();
  for (const ranking of rankings) {
    ranking.forEach((docIndex, rank) => {
      fused.set(docIndex, (fused.get(docIndex) ?? 0) + 1 / (k + rank + 1));
    });
  }
  return fused;
}

function mmrRerank(
  candidates: number[],
  queryVec: number[] | null,
  docs: StoredEmbedding[],
  denseScores: Map<number, number>,
  k: number,
  lambda = 0.7,
): number[] {
  if (!queryVec) return candidates.slice(0, k);

  const selected: number[] = [];
  const pool = [...candidates];

  while (selected.length < k && pool.length > 0) {
    let best = pool[0];
    let bestScore = -Infinity;
    for (const idx of pool) {
      const relevance = denseScores.get(idx) ?? 0;
      let maxSim = 0;
      for (const s of selected) {
        maxSim = Math.max(
          maxSim,
          cosineSimilarity(docs[idx].embedding, docs[s].embedding),
        );
      }
      const score = lambda * relevance - (1 - lambda) * maxSim;
      if (score > bestScore) {
        bestScore = score;
        best = idx;
      }
    }
    selected.push(best);
    pool.splice(pool.indexOf(best), 1);
  }
  return selected;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

async function embedQuery(query: string): Promise<number[] | null> {
  try {
    // Imported lazily so a model-load failure never breaks sparse retrieval.
    const { LocalEmbeddings } = await import("@/lib/embeddings");
    const embedder = new LocalEmbeddings();
    return await embedder.embedQuery(query);
  } catch (err) {
    console.warn("Dense embedding unavailable, falling back to sparse:", err);
    return null;
  }
}

export async function similaritySearch(
  query: string,
  k: number = 5,
): Promise<SearchResult[]> {
  const docs = loadEmbeddings();
  if (docs.length === 0) return [];

  const queryTerms = expandQuery(query);
  const queryVec = await embedQuery(query);

  // Dense ranking (semantic).
  const denseScores = new Map<number, number>();
  let denseRanking: number[] = [];
  if (queryVec) {
    const scored = docs.map((d, i) => {
      const s = cosineSimilarity(queryVec, d.embedding);
      denseScores.set(i, s);
      return { i, s };
    });
    denseRanking = scored
      .sort((a, b) => b.s - a.s)
      .map((x) => x.i);
  }

  // Sparse ranking (lexical / BM25).
  const sparseScorer = buildSparseScorer(docs);
  const sparseRanking = docs
    .map((_, i) => ({ i, s: sparseScorer(queryTerms, i) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.s > 0)
    .map((x) => x.i);

  // Fuse rankings (RRF). If dense is unavailable we still have sparse.
  const rankings = [denseRanking, sparseRanking].filter((r) => r.length > 0);
  const fused = rrfFuse(rankings);

  const fusedOrder = Array.from(fused.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([idx]) => idx);

  // Consider a generous candidate pool, then diversify with MMR.
  const candidatePool = fusedOrder.slice(0, Math.max(k * 3, 12));
  const finalOrder = mmrRerank(
    candidatePool,
    queryVec,
    docs,
    denseScores,
    k,
  );

  return finalOrder.map((idx) => ({
    pageContent: docs[idx].content,
    metadata: docs[idx].metadata,
    score: fused.get(idx) ?? 0,
  }));
}
