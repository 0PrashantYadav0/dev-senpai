import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { LocalEmbeddings } from "../src/lib/embeddings";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Builds the retrieval index for Dev Senpai.
 *
 * Every fact cluster becomes one readable "card": a job, a project, a degree,
 * an achievement, a FAQ entry. Cards are short and self-contained so a single
 * retrieved chunk is enough to answer a question. The output is written to
 * src/data/embeddings.json and loaded by src/lib/vectordb.ts at runtime.
 */

interface StoredEmbedding {
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const APP_DIR = path.join(ROOT, "src", "app");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8")) as T;
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CareerEntry {
  name: string;
  href: string;
  title: string;
  location?: string;
  start: string;
  end?: string;
  description?: string[];
  tech?: string[];
}

interface Project {
  name: string;
  description: string;
  href?: string;
  language?: string;
  tags: string[];
  links: { name: string; href: string }[];
}

interface Social {
  name: string;
  href: string;
}

interface Profile {
  name: string;
  headline: string;
  location: string;
  birthYear: number;
  email: string;
  site: string;
  resume: string;
  summary: string[];
  focus: string[];
  skills: { group: string; items: string[] }[];
  openSource: {
    name: string;
    role: string;
    href: string;
    start: string;
    end: string | null;
    description: string[];
  };
  achievements: { title: string; detail: string }[];
  roles: { title: string; start: string; end: string | null; description: string }[];
  faq: { q: string; a: string }[];
}

/* ------------------------------------------------------------------ */
/* Card builders                                                       */
/* ------------------------------------------------------------------ */

function card(content: string[], metadata: Record<string, unknown>): Document {
  return new Document({
    pageContent: content.filter(Boolean).join("\n"),
    metadata,
  });
}

function buildCareerDocs(): Document[] {
  const { career } = readJson<{ career: CareerEntry[] }>("career.json");
  return career.map((c) =>
    card(
      [
        `Work experience: Prashant worked as ${c.title} at ${c.name} from ${c.start} to ${c.end ?? "present"}${c.location ? ` (${c.location.toLowerCase()})` : ""}.`,
        c.description?.length ? `What he did at ${c.name}: ${c.description.join(" ")}` : "",
        c.tech?.length ? `Technologies used at ${c.name}: ${c.tech.join(", ")}.` : "",
        `Company website: ${c.href}`,
      ],
      { source: "/experience", type: "experience", title: `${c.title} at ${c.name}` },
    ),
  );
}

function buildEducationDocs(): Document[] {
  const { education } = readJson<{ education: CareerEntry[] }>("education.json");
  return education.map((e) =>
    card(
      [
        `Education: Prashant studied ${e.title} at ${e.name} from ${e.start} to ${e.end ?? "present"}.`,
        e.description?.length ? `Highlights: ${e.description.join(". ")}.` : "",
        `Institute website: ${e.href}`,
      ],
      { source: "/experience", type: "education", title: `${e.title} at ${e.name}` },
    ),
  );
}

function buildProjectDocs(): Document[] {
  const { projects } = readJson<{ projects: Project[] }>("projects.json");
  return projects.map((p) => {
    const links = p.links.map((l) => `${l.name}: ${l.href}`).join(", ");
    return card(
      [
        `Project: ${p.name}. ${p.description}`,
        `Tech stack for ${p.name}: ${p.tags.join(", ")}.${p.language ? ` Primary language: ${p.language}.` : ""}`,
        links ? `Links: ${links}.` : "",
      ],
      { source: "/projects", type: "project", title: p.name },
    );
  });
}

function buildSocialsDoc(): Document {
  const { socials } = readJson<{ socials: Social[] }>("socials.json");
  return card(
    [
      "Contact and social links for Prashant: " +
        socials.map((s) => `${s.name} (${s.href})`).join(", ") +
        ". The contact form is on the /contact page and the resume is at /resume.pdf.",
    ],
    { source: "/contact", type: "socials", title: "Contact and socials" },
  );
}

function buildProfileDocs(profile: Profile): Document[] {
  const docs: Document[] = [];

  docs.push(
    card(
      [
        `About ${profile.name}: ${profile.headline}`,
        ...profile.summary,
        `He is based in ${profile.location}. Website: ${profile.site}. Resume: ${profile.resume}. Email: ${profile.email}.`,
        `Areas of focus: ${profile.focus.join("; ")}.`,
      ],
      { source: "/", type: "profile", title: "About Prashant" },
    ),
  );

  docs.push(
    card(
      [
        "Technical skills of Prashant:",
        ...profile.skills.map((s) => `${s.group}: ${s.items.join(", ")}.`),
      ],
      { source: "/", type: "skills", title: "Skills" },
    ),
  );

  const os = profile.openSource;
  docs.push(
    card(
      [
        `Open source: Prashant is a ${os.role.toLowerCase()} of ${os.name} (the standard library for JavaScript) since ${os.start}${os.end ? ` until ${os.end}` : ", ongoing"}.`,
        os.description.join(" "),
        `Repository: ${os.href}`,
      ],
      { source: "/experience", type: "opensource", title: `${os.role} of ${os.name}` },
    ),
  );

  docs.push(
    card(
      [
        "Achievements and awards of Prashant:",
        ...profile.achievements.map((a) => `${a.title}${a.detail ? `. ${a.detail}` : "."}`),
      ],
      { source: "/", type: "achievements", title: "Achievements" },
    ),
  );

  docs.push(
    card(
      [
        "Leadership roles and responsibilities of Prashant at college:",
        ...profile.roles.map(
          (r) => `${r.title}, ${r.start} to ${r.end ?? "present"}. ${r.description}`,
        ),
      ],
      { source: "/experience", type: "roles", title: "Roles at IIIT Lucknow" },
    ),
  );

  for (const f of profile.faq) {
    docs.push(card([`Question: ${f.q}`, `Answer: ${f.a}`], { source: "/", type: "faq", title: f.q }));
  }

  return docs;
}

/**
 * Readable copy from the privacy page, so questions about data handling get
 * a grounded answer. Lossy by design.
 */
function buildPrivacyDoc(): Document | null {
  const file = path.join(APP_DIR, "privacy", "page.tsx");
  if (!fs.existsSync(file)) return null;
  const text = fs
    .readFileSync(file, "utf-8")
    .replace(/import[\s\S]*?from\s+["'][^"']+["'];?/g, " ")
    .replace(/className=("[^"]*"|\{[^}]*\})/g, " ")
    .replace(/\{["'`]([^"'`]*)["'`]\}/g, "$1")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[{};]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 80) return null;
  return card([`Privacy policy of this site: ${text}`], {
    source: "/privacy",
    type: "page",
    title: "Privacy policy",
  });
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function generate() {
  console.log("Building cards...");
  const profile = readJson<Profile>("profile.json");

  const docs: Document[] = [
    ...buildProfileDocs(profile),
    ...buildCareerDocs(),
    ...buildEducationDocs(),
    ...buildProjectDocs(),
    buildSocialsDoc(),
  ];
  const privacy = buildPrivacyDoc();
  if (privacy) docs.push(privacy);
  console.log(`Built ${docs.length} cards.`);

  // Cards are small; only long ones are split. Overlap keeps sentences whole.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
    separators: ["\n\n", "\n", ". ", " "],
  });
  const chunks = await splitter.splitDocuments(docs);
  console.log(`Embedding ${chunks.length} chunks (first run downloads the model)...`);

  const embedder = new LocalEmbeddings();
  const vectors = await embedder.embedDocuments(chunks.map((c) => c.pageContent));

  const stored: StoredEmbedding[] = chunks.map((c, i) => ({
    content: c.pageContent,
    metadata: c.metadata,
    embedding: vectors[i],
  }));

  const out = path.join(DATA_DIR, "embeddings.json");
  fs.writeFileSync(out, JSON.stringify(stored));
  console.log(`Saved ${stored.length} embeddings to ${path.relative(ROOT, out)}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
