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

async function generate() {
  console.log("🚀 Starting embedding generation...");

  const embeddings = new LocalEmbeddings();

  // Load routes
  const appDir = path.join(process.cwd(), "src", "app");
  const routeFiles = fs.readdirSync(appDir, { recursive: true });
  const routes: Document[] = [];
  for (const file of routeFiles) {
    const filePath = path.join(appDir, file as string);
    if (fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      if (ext === ".tsx" && path.basename(filePath) === "page.tsx") {
        const content = fs.readFileSync(filePath, "utf-8");
        const route = "/" + path.relative(appDir, filePath).replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
        routes.push(new Document({ pageContent: content, metadata: { source: route, type: "page" } }));
      } else if (ext !== ".tsx" && ext !== ".ts" && ext !== ".ico" && ext !== ".css") {
        console.log(`Unknown file type: ${path.basename(filePath)}`);
      }
    }
  }
  console.log(`📄 Loaded ${routes.length} page routes`);

  // Load data files
  const dataDir = path.join(process.cwd(), "src", "data");
  const dataFiles = fs.readdirSync(dataDir);
  const dataDocs: Document[] = [];
  for (const file of dataFiles) {
    if (file === "embeddings.json") continue;
    const filePath = path.join(dataDir, file);
    if (fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      if (ext === ".json") {
        const content = fs.readFileSync(filePath, "utf-8");
        dataDocs.push(new Document({ pageContent: content, metadata: { source: file, type: "data" } }));
      } else if (ext === ".md") {
        const content = fs.readFileSync(filePath, "utf-8");
        dataDocs.push(new Document({ pageContent: content, metadata: { source: file, type: "data" } }));
      } else if (ext === ".ts" || ext === ".tsx") {
        const content = fs.readFileSync(filePath, "utf-8");
        dataDocs.push(new Document({ pageContent: content, metadata: { source: file, type: "data" } }));
      }
    }
  }
  console.log(`📊 Loaded ${dataDocs.length} data files`);

  // Load MDX content
  const contentDir = path.join(process.cwd(), "content");
  const mdxDocs: Document[] = [];
  if (fs.existsSync(contentDir)) {
    const contentFiles = fs.readdirSync(contentDir, { recursive: true });
    for (const file of contentFiles) {
      const filePath = path.join(contentDir, file as string);
      if (fs.statSync(filePath).isFile() && path.extname(filePath) === ".mdx") {
        const content = fs.readFileSync(filePath, "utf-8");
        mdxDocs.push(new Document({ pageContent: content, metadata: { source: file as string, type: "blog" } }));
      }
    }
  }
  console.log(`📝 Loaded ${mdxDocs.length} blog posts`);

  // Split and embed
  const allDocs = [...routes, ...dataDocs, ...mdxDocs];
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const splitDocs = await splitter.splitDocuments(allDocs);
  console.log(`📦 Total documents to embed: ${splitDocs.length}`);

  console.log("🔄 Generating embeddings (this may take a minute on first run)...");
  const store = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

  // Save embeddings
  const storedEmbeddings: StoredEmbedding[] = store.memoryVectors.map((d: { content: string; embedding: number[]; metadata: Record<string, unknown> }) => ({
    content: d.content,
    metadata: d.metadata,
    embedding: d.embedding,
  }));

  const outputPath = path.join(process.cwd(), "src", "data", "embeddings.json");
  fs.writeFileSync(outputPath, JSON.stringify(storedEmbeddings));
  console.log(`✅ Done! Saved ${storedEmbeddings.length} embeddings to ${outputPath}`);
}

generate().catch(console.error);
