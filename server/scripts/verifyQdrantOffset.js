// server/scripts/verifyQdrantOffset.js
import "dotenv/config";
import { qdrant } from "../embeddings/vectorStore.js";

const vec = (await qdrant.retrieve("startups", { ids: [1], with_vector: true }))[0].vector;
const page1 = await qdrant.search("investors", { vector: vec, limit: 50, offset: 0,  with_payload: true });
const page2 = await qdrant.search("investors", { vector: vec, limit: 50, offset: 50, with_payload: true });

const ids1 = page1.map(p => p.payload.investor_id);
const ids2 = page2.map(p => p.payload.investor_id);
const overlap = ids2.filter(id => ids1.includes(id));

console.log(`page1 ${ids1.length}, page2 ${ids2.length}, overlap ${overlap.length}`);
console.log(overlap.length === 0 ? "✓ offset paginates cleanly" : `✗ OVERLAP: ${overlap}`);
console.log(`scores descend across the boundary: ${page1.at(-1).score >= page2[0].score ? "✓" : "✗"}`);