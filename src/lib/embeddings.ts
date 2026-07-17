import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import type { FeatureExtractionPipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let pipelineInstance: FeatureExtractionPipeline | null = null;

/**
 * Load the feature-extraction pipeline lazily.
 *
 * The import is marked `webpackIgnore` so Next/webpack never tries to bundle
 * `@xenova/transformers` (and its native `onnxruntime-node` `.node` binaries)
 * into the server bundle. It is resolved at runtime instead, keeping the build
 * clean while still allowing real semantic query embeddings.
 */
async function getPipeline(): Promise<FeatureExtractionPipeline> {
    if (!pipelineInstance) {
        const mod = await import(
            /* webpackIgnore: true */ "@xenova/transformers"
        );
        pipelineInstance = await mod.pipeline("feature-extraction", MODEL_NAME);
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
