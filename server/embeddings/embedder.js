import { pipeline } from "@xenova/transformers";

let extractor = null;

async function getExtractor() {
  if (!extractor) {
    console.log("Loading MiniLM model (first time only)...");
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("Model loaded.");
  }
  return extractor;
}

export async function embed(text) {
  const model = await getExtractor();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data); // 384-dim normalized vector
}