import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let pipelineInstance: FeatureExtractionPipeline | null = null;

async function getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!pipelineInstance) {
        pipelineInstance = await pipeline("feature-extraction", MODEL_NAME);
    }
    return pipelineInstance;
}

export class LocalEmbeddings extends Embeddings {
    constructor(params?: EmbeddingsParams) {
        super(params ?? {});
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        const pipe = await getPipeline();
        const results: number[][] = [];
        for (const text of texts) {
            const output = await pipe(text, {
                pooling: "mean",
                normalize: true,
            });
            results.push(Array.from(output.data as Float32Array));
        }
        return results;
    }

    async embedQuery(text: string): Promise<number[]> {
        const pipe = await getPipeline();
        const output = await pipe(text, {
            pooling: "mean",
            normalize: true,
        });
        return Array.from(output.data as Float32Array);
    }
}
