import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { LocalEmbeddings } from "../src/lib/embeddings";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

interface StoredEmbedding {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const APP_DIR = path.join(ROOT, "src", "app");

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as T;
}

/**
 * Turn a .tsx / page file into readable prose: drop imports, JSX tags and
 * className attrs, and keep the human-facing text nodes. This lets facts that
 * only live in the home page (or any section page) still make it into the RAG
 * index. It is intentionally lossy — we only want the readable copy.
 */
function extractReadableText(source: string): string {
  return source
    .replace(/import[\s\S]*?from\s+["'][^"']+["'];?/g, " ") // imports
    .replace(/export\s+(default\s+)?(async\s+)?function[^{]*\{/g, " ")
    .replace(/className=("[^"]*"|\{[^}]*\})/g, " ") // className props
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ") // JSX comments
    .replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1") // {" "} literals
    .replace(/\{new Date\(\)\.getFullYear\(\)[^}]*\}/g, "current") // dynamic year
    .replace(/\{[^}]*\}/g, " ") // any other JSX expression
    .replace(/<[^>]+>/g, " ") // JSX tags
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&copy;/g, "(c)")
    .replace(/[{};]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Document builders — one readable card per fact cluster              */
/* ------------------------------------------------------------------ */

interface CareerEntry {
  name: string;
  href: string;
  title: string;
  start: string;
  end?: string;
  description?: string[];
  tech?: string[];
}

interface Project {
  name: string;
  description: string;
  href?: string;
  tags: string[];
  links: { name: string; href: string }[];
}

interface Social {
  name: string;
  href: string;
}

function buildCareerDocs(): Document[] {
  const { career } = readJson<{ career: CareerEntry[] }>("career.json");
  return career.map((c) => {
    const period = `${c.start} - ${c.end ?? "Present"}`;
    const lines = [
      `Work Experience: Prashant worked as ${c.title} at ${c.name} (${period}).`,
      c.description?.length ? `What he did: ${c.description.join(" ")}` : "",
      c.tech?.length ? `Technologies and tools: ${c.tech.join(", ")}.` : "",
      `Company website: ${c.href}`,
    ].filter(Boolean);
    return new Document({
      pageContent: lines.join("\n"),
      metadata: {
        source: "/experience",
        type: "experience",
        title: `${c.title} at ${c.name}`,
      },
    });
  });
}

function buildEducationDocs(): Document[] {
  const { education } = readJson<{ education: CareerEntry[] }>(
    "education.json",
  );
  return education.map((e) => {
    const period = `${e.start} - ${e.end ?? "Present"}`;
    const lines = [
      `Education: Prashant studied ${e.title} at ${e.name} (${period}).`,
      e.description?.length ? `Highlights: ${e.description.join(" ")}` : "",
      `Institute: ${e.href}`,
    ].filter(Boolean);
    return new Document({
      pageContent: lines.join("\n"),
      metadata: {
        source: "/experience",
        type: "education",
        title: `${e.title} at ${e.name}`,
      },
    });
  });
}

function buildProjectDocs(): Document[] {
  const { projects } = readJson<{ projects: Project[] }>("projects.json");
  return projects.map((p) => {
    const links = p.links.map((l) => `${l.name}: ${l.href}`).join(", ");
    const lines = [
      `Project: ${p.name}.`,
      p.description,
      `Tech stack: ${p.tags.join(", ")}.`,
      links ? `Links: ${links}.` : "",
    ].filter(Boolean);
    return new Document({
      pageContent: lines.join("\n"),
      metadata: { source: "/projects", type: "project", title: p.name },
    });
  });
}

function buildSocialsDoc(): Document {
  const { socials } = readJson<{ socials: Social[] }>("socials.json");
  const content =
    "Contact and social links for Prashant: " +
    socials.map((s) => `${s.name} (${s.href})`).join(", ") + ".";
  return new Document({
    pageContent: content,
    metadata: { source: "/contact", type: "socials", title: "Socials" },
  });
}

/**
 * A curated profile / skills card. This guarantees the most important facts are
 * always retrievable regardless of how the question is phrased.
 */
function buildProfileDoc(): Document {
  const content = [
    "About Prashant Yadav: a software developer from India who builds complex, high-performance systems.",
    "Specialties: voice AI, Go microservices, full-stack web development, and cloud-native infrastructure.",
    "He enjoys developing ambitious applications, instant coffee, and watching Anime.",
    "Frontend skills: React, Next.js, Redux, TailwindCSS, Shadcn/UI, Framer Motion.",
    "Backend skills: Go (Gin, Chi), Node.js, Express, Spring Boot, Bun, Deno, Hono.",
    "Databases: MongoDB, MySQL, PostgreSQL, SQLite, Drizzle, Prisma, Supabase, Firebase, Redis.",
    "DevOps and deployment: Docker, Kubernetes, ArgoCD, GitHub Actions, AWS, Azure, Vercel, Render, Cloudflare, Fly.io, Railway.",
    "AI / GenAI: LLM integration, RAG pipelines, voice bots (NLU, TTS, STT, VAD), Groq, OpenAI, Gemini, Deepgram, Elevenlabs, Cerebras.",
    "Languages: TypeScript, JavaScript, Go, Java, C++, C, Python, Bash.",
    "You can view his resume at /resume.pdf and reach him through the /contact page.",
  ].join("\n");
  return new Document({
    pageContent: content,
    metadata: { source: "/", type: "profile", title: "Profile & Skills" },
  });
}

function buildPageDocs(): Document[] {
  const pages = ["page.tsx", "privacy/page.tsx", "contact/page.tsx"];
  const docs: Document[] = [];
  for (const rel of pages) {
    const filePath = path.join(APP_DIR, rel);
    if (!fs.existsSync(filePath)) continue;
    const text = extractReadableText(fs.readFileSync(filePath, "utf-8"));
    if (text.length < 40) continue; // skip near-empty pages
    const route = "/" + rel.replace(/\/?page\.tsx$/, "");
    docs.push(
      new Document({
        pageContent: text,
        metadata: { source: route || "/", type: "page", title: route || "/" },
      }),
    );
  }
  return docs;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function generate() {
  console.log("Starting embedding generation...");

  const embeddings = new LocalEmbeddings();

  const docs: Document[] = [
    buildProfileDoc(),
    ...buildCareerDocs(),
    ...buildEducationDocs(),
    ...buildProjectDocs(),
    buildSocialsDoc(),
    ...buildPageDocs(),
  ];

  console.log(`Built ${docs.length} readable documents.`);

  // Most cards are already small and self-contained; only the odd long page
  // gets split. Small chunks + overlap keep semantic units intact.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 120,
  });
  const splitDocs = await splitter.splitDocuments(docs);
  console.log(`Total chunks to embed: ${splitDocs.length}`);

  console.log("Generating embeddings (first run downloads the model)...");
  const store = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  const stored: StoredEmbedding[] = store.memoryVectors.map(
    (d: {
      content: string;
      embedding: number[];
      metadata: Record<string, unknown>;
    }) => ({
      content: d.content,
      metadata: d.metadata,
      embedding: d.embedding,
    }),
  );

  const outputPath = path.join(DATA_DIR, "embeddings.json");
  fs.writeFileSync(outputPath, JSON.stringify(stored));
  console.log(`Done. Saved ${stored.length} embeddings to ${outputPath}`);
}

generate().catch(console.error);
