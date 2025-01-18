import { DataAPIClient } from "@datastax/astra-db-ts";
import { AstraDBVectorStore } from "@langchain/community/vectorstores/astradb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

if (!process.env.ASTRA_DB_API_ENDPOINT || !process.env.ASTRA_DB_APPLICATION_TOKEN || !process.env.ASTRA_DB_COLLECTION) {
  throw new Error("Please set environmental variables for Astra DB!");
}

const endpoint = process.env.ASTRA_DB_API_ENDPOINT;
const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
const collection = process.env.ASTRA_DB_COLLECTION;

export async function getVectorStore() {
  const embeddings = new GoogleGenerativeAIEmbeddings({ 
    model: "text-embedding-004" 
  });

  return AstraDBVectorStore.fromExistingIndex(
    embeddings,
    {
      token,
      endpoint,
      collection,
      collectionOptions: {
        vector: { 
          dimension: 768,  
          metric: "cosine" 
        },
      },
    }
  );
}

export async function getEmbeddingsCollection() {
  const client = new DataAPIClient(token);
  const db = client.db(endpoint);
  return db.collection(collection);
}