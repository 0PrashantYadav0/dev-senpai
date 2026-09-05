import * as fs from "fs";
import * as path from "path";

/**
 * Retrieval for the portfolio chatbot. Everything runs in-process over a
 * pre-computed JSON index, no external vector store.
 *
 *   1. Contextual query    - short follow-ups ("what about there?") borrow
 *                            terms from the previous turn so retrieval sees a
 *                            standalone question.
 *   2. Dense retrieval     - cosine similarity over MiniLM embeddings.
 *   3. Sparse retrieval    - BM25 over stemmed tokens, index built once.
 *   4. Fusion              - Reciprocal Rank Fusion of both rankings.
 *   5. Boosts              - entity matches (a company or project named in
 *                            the query) and intent matches (asking about
 *                            "experience" favours experience cards).
 *   6. Diversity           - Maximal Marginal Relevance on the candidate pool.
 *   7. Confidence          - a fused score threshold so the route can tell the
 *                            model when nothing relevant was found.
 *
 * If the embedding model cannot load at request time, retrieval degrades to
 * sparse-only and keeps working.
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

export interface SearchOptions {
  k?: number;
  /** Earlier user turns, most recent last. Used for follow-up questions. */
  history?: string[];
}

/* ------------------------------------------------------------------ */
/* Index loading                                                       */
/* ------------------------------------------------------------------ */

interface Index {
  docs: StoredEmbedding[];
  tokens: string[][];
  df: Map<string, number>;
  avgLen: number;
  /** Lowercased title -> doc indices that carry it. */
  entities: Map<string, number[]>;
}

let index: Index | null = null;

function loadIndex(): Index {
  if (index) return index;

  const file = path.join(process.cwd(), "src", "data", "embeddings.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      "embeddings.json not found. Run `npm run gen` to build the index.",
    );
  }
  const docs: StoredEmbedding[] = JSON.parse(fs.readFileSync(file, "utf-8"));

  const df = new Map<string, number>();
  const tokens = docs.map((d) => {
    const toks = tokenize(d.content);
    new Set(toks).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
    return toks;
  });
  const avgLen =
    tokens.reduce((sum, t) => sum + t.length, 0) / Math.max(docs.length, 1);

  const entities = new Map<string, number[]>();
  docs.forEach((d, i) => {
    const title = String(d.metadata?.title ?? "").toLowerCase();
    for (const name of entityNames(title)) {
      const list = entities.get(name) ?? [];
      list.push(i);
      entities.set(name, list);
    }
  });

  index = { docs, tokens, df, avgLen, entities };
  return index;
}

/** Split a card title into the names someone might type. */
function entityNames(title: string): string[] {
  const names = new Set<string>();
  const clean = title.replace(/\(.*?\)/g, " ").trim();
  if (clean.length >= 3) names.add(clean);
  // "Engineering Intern at Nugget by Zomato" -> "nugget by zomato", "nugget", "zomato"
  const atIdx = clean.indexOf(" at ");
  const org = atIdx >= 0 ? clean.slice(atIdx + 4).trim() : clean;
  if (org.length >= 3) names.add(org);
  for (const part of org.split(/\s+(?:by|and|of|,)\s+|\s*[-:,/]\s*/)) {
    const p = part.trim();
    if (p.length >= 4 && !GENERIC_WORDS.has(p)) names.add(p);
  }
  return Array.from(names);
}

const GENERIC_WORDS = new Set([
  "intern", "engineering", "software", "developer", "backend", "frontend",
  "profile", "skills", "socials", "system", "platform", "project", "projects",
]);

/* ------------------------------------------------------------------ */
/* Text utilities                                                      */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "with", "what", "who", "does", "did",
  "can", "how", "are", "was", "were", "his", "her", "him", "she", "they",
  "this", "that", "from", "have", "has", "had", "about", "tell", "know",
  "please", "would", "could", "should", "any", "all", "some", "get", "give",
  "prashant", "yadav", "kumar", "there", "them", "which", "when", "where",
  "into", "than", "then", "also", "just", "like", "more", "most", "very",
]);

/** Cheap suffix stemmer; enough to match "deployed" with "deployment". */
function stem(word: string): string {
  if (word.length <= 4) return word;
  return word
    .replace(/(ization|isation)$/, "ize")
    .replace(/(ations?|ments?|ness|ings?|ities|ies|ers?|ed|es|s)$/, "")
    .replace(/(ize|ise)$/, "iz");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/(?<![a-z])\.|\.(?![a-z])/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

const SYNONYMS: Record<string, string[]> = {
  work: ["experience", "intern", "role", "career", "job"],
  job: ["work", "experience", "intern", "role"],
  experience: ["work", "career", "intern", "job"],
  internship: ["intern", "experience", "work"],
  company: ["work", "intern", "experience"],
  skill: ["tech", "technology", "stack", "tool", "language"],
  tech: ["skill", "technology", "stack", "tool"],
  stack: ["tech", "skill", "technology"],
  build: ["project", "app", "platform"],
  project: ["build", "app", "platform", "source"],
  study: ["education", "degree", "college", "university", "iiit"],
  education: ["study", "degree", "college", "university", "iiit"],
  college: ["education", "university", "iiit", "degree"],
  contact: ["email", "reach", "linkedin", "github", "social"],
  hire: ["contact", "email", "open", "role", "full-time", "internship"],
  ai: ["llm", "voice", "rag", "genai", "machine", "learning", "agent"],
  voice: ["bot", "tts", "stt", "nlu", "telephony", "sip"],
  award: ["achievement", "hackathon", "winner", "rank"],
  achievement: ["award", "hackathon", "winner", "rank", "codeforce"],
  hackathon: ["achievement", "winner", "award"],
  opensource: ["stdlib", "maintainer", "pull", "request"],
  zomato: ["eternal", "nugget"],
  kubernetes: ["k8s", "helm", "argocd", "devops", "cloud"],
  devops: ["kubernetes", "docker", "ci", "cd", "argocd", "github", "action"],
  cloud: ["aws", "azure", "kubernetes", "devops"],
  rank: ["codeforce", "codechef", "rating", "competitive"],
  competitive: ["codeforce", "codechef", "rating", "rank"],
};

function expandTerms(query: string): string[] {
  const base = tokenize(query.replace(/open[\s-]source/g, "opensource"));
  const expanded = new Set(base);
  for (const t of base) {
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (stem(key) === t) syns.forEach((s) => expanded.add(stem(s)));
    }
  }
  return Array.from(expanded);
}

/* ------------------------------------------------------------------ */
/* Contextual query for follow-ups                                     */
/* ------------------------------------------------------------------ */

const ANAPHORA = /\b(it|its|that|this|there|they|them|those|these|he|him|his|same|one|which|more|else|also|again|other)\b/i;

/**
 * Detects "what else did he do there?" style follow-ups and folds the
 * previous user turn into the retrieval query. The original question is still
 * what the model answers; only retrieval sees the merged text.
 */
export function contextualQuery(latest: string, history: string[] = []): string {
  const trimmed = latest.trim();
  const words = trimmed.split(/\s+/).length;
  const isFollowUp = words <= 8 || ANAPHORA.test(trimmed);
  if (!isFollowUp || history.length === 0) return trimmed;
  const previous = history.slice(-2).join(" ");
  return `${trimmed} ${previous}`;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function bm25(idx: Index, queryTerms: string[], docIndex: number): number {
  const toks = idx.tokens[docIndex];
  if (toks.length === 0) return 0;
  const N = idx.docs.length;
  const k1 = 1.5;
  const b = 0.75;
  const tf = new Map<string, number>();
  for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);

  let score = 0;
  for (const term of queryTerms) {
    const f = tf.get(term);
    if (!f) continue;
    const n = idx.df.get(term) ?? 0;
    const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
    const denom = f + k1 * (1 - b + (b * toks.length) / idx.avgLen);
    score += idf * ((f * (k1 + 1)) / denom);
  }
  return score;
}

function rrf(rankings: number[][], k = 60): Map<number, number> {
  const fused = new Map<number, number>();
  for (const ranking of rankings) {
    ranking.forEach((docIndex, rank) => {
      fused.set(docIndex, (fused.get(docIndex) ?? 0) + 1 / (k + rank + 1));
    });
  }
  return fused;
}

const INTENT_BOOST: Array<{ pattern: RegExp; types: string[] }> = [
  { pattern: /\b(work|job|intern|experience|career|company|employ)/i, types: ["experience"] },
  { pattern: /\b(project|built|build|repo|github|app|side)/i, types: ["project"] },
  { pattern: /\b(study|education|college|university|degree|gpa|school|iiit)/i, types: ["education"] },
  { pattern: /\b(skill|stack|tech|language|tool|framework|know)/i, types: ["profile", "skills"] },
  { pattern: /\b(contact|email|reach|linkedin|hire|hiring|available|open to)/i, types: ["socials", "faq"] },
  { pattern: /\b(award|achievement|hackathon|winner|rank|rating|codeforces|codechef)/i, types: ["achievements"] },
  { pattern: /\b(open[\s-]?source|stdlib|maintainer|pull request|prs?)\b/i, types: ["opensource"] },
  { pattern: /\b(who|about|introduce|summary|overview|background)\b/i, types: ["profile"] },
];

function applyBoosts(idx: Index, query: string, fused: Map<number, number>) {
  const q = query.toLowerCase();

  // Entity boost: the query names a company, project or institution.
  for (const [name, docIdxs] of idx.entities) {
    if (name.length < 4 || !q.includes(name)) continue;
    const weight = 0.02 + Math.min(name.length, 20) / 1000;
    for (const i of docIdxs) fused.set(i, (fused.get(i) ?? 0) + weight);
  }

  // Intent boost: the type of card the question is about.
  for (const { pattern, types } of INTENT_BOOST) {
    if (!pattern.test(q)) continue;
    idx.docs.forEach((d, i) => {
      const type = String(d.metadata?.type ?? "");
      if (types.includes(type) && fused.has(i)) {
        fused.set(i, (fused.get(i) ?? 0) + 0.006);
      }
    });
  }
}

function mmr(
  candidates: number[],
  idx: Index,
  relevance: Map<number, number>,
  k: number,
  lambda = 0.72,
): number[] {
  const selected: number[] = [];
  const pool = [...candidates];
  while (selected.length < k && pool.length > 0) {
    let best = pool[0];
    let bestScore = -Infinity;
    for (const i of pool) {
      let maxSim = 0;
      for (const s of selected) {
        maxSim = Math.max(maxSim, cosine(idx.docs[i].embedding, idx.docs[s].embedding));
      }
      const score = lambda * (relevance.get(i) ?? 0) - (1 - lambda) * maxSim;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    selected.push(best);
    pool.splice(pool.indexOf(best), 1);
  }
  return selected;
}

/* ------------------------------------------------------------------ */
/* Embeddings                                                          */
/* ------------------------------------------------------------------ */

async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const { LocalEmbeddings } = await import("@/lib/embeddings");
    return await new LocalEmbeddings().embedQuery(query);
  } catch (err) {
    console.warn("Dense embedding unavailable, using sparse retrieval:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Fused-score floor below which a result is treated as noise. */
const MIN_FUSED_SCORE = 0.012;

export async function similaritySearch(
  query: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const k = options.k ?? 6;
  const idx = loadIndex();
  if (idx.docs.length === 0) return [];

  const retrievalQuery = contextualQuery(query, options.history);
  const terms = expandTerms(retrievalQuery);
  const queryVec = await embedQuery(retrievalQuery);

  // Dense ranking.
  const dense = new Map<number, number>();
  let denseRanking: number[] = [];
  if (queryVec) {
    denseRanking = idx.docs
      .map((d, i) => {
        const s = cosine(queryVec, d.embedding);
        dense.set(i, s);
        return { i, s };
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map((x) => x.i);
  }

  // Sparse ranking.
  const sparseRanking = idx.docs
    .map((_, i) => ({ i, s: bm25(idx, terms, i) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 30)
    .map((x) => x.i);

  const rankings = [denseRanking, sparseRanking].filter((r) => r.length > 0);
  if (rankings.length === 0) return [];

  const fused = rrf(rankings);
  applyBoosts(idx, retrievalQuery, fused);

  const ordered = Array.from(fused.entries())
    .filter(([, s]) => s >= MIN_FUSED_SCORE)
    .sort((a, b) => b[1] - a[1])
    .map(([i]) => i);

  const pool = ordered.slice(0, Math.max(k * 3, 12));
  const relevance = new Map<number, number>();
  for (const i of pool) {
    // Blend fused rank score with dense similarity so MMR has a smooth signal.
    relevance.set(i, (fused.get(i) ?? 0) * 20 + (dense.get(i) ?? 0));
  }
  const finalOrder = queryVec ? mmr(pool, idx, relevance, k) : pool.slice(0, k);

  return finalOrder.map((i) => ({
    pageContent: idx.docs[i].content,
    metadata: idx.docs[i].metadata,
    score: fused.get(i) ?? 0,
  }));
}
