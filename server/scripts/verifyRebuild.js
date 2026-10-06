// server/scripts/verifyRebuild.js
import "dotenv/config";
import mongoose from "mongoose";
import Match from "../models/Match.js";

await mongoose.connect(process.env.MONGO_URI);

const docs = await Match.find({}).select("entity_id entity_type matches stage_relaxed");
const counts = docs.map(d => d.matches.length).sort((a, b) => a - b);
const n = counts.length;

console.log(`Match docs: ${n}`);
console.log(`matches[] length — min ${counts[0]}, median ${counts[n >> 1]}, max ${counts[n - 1]}`);
console.log(`empty feeds: ${counts.filter(c => c === 0).length}`);
console.log(`stage_relaxed docs: ${docs.filter(d => d.stage_relaxed).length}`);

const missingScore = docs.filter(d => d.matches.some(m => m.reciprocal_score == null)).length;
console.log(`docs with any null reciprocal_score: ${missingScore}`);

const badSort = docs.filter(d =>
  d.matches.some((m, i) => i > 0 && m.reciprocal_score > d.matches[i - 1].reciprocal_score)
).length;
console.log(`docs sorted incorrectly: ${badSort}`);

const sample = docs.find(d => d.entity_type === "startup" && d.matches.length > 3);
console.log(`\nSample — ${sample.entity_id}:`);
sample.matches.slice(0, 3).forEach(m =>
  console.log(`  ${m.match_id} ${m.match_name} | sim ${m.similarity_score} | recip ${m.reciprocal_score} | ${m.status}`)
);

await mongoose.disconnect();