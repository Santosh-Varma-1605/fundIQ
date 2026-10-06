// server/scripts/checkCursorGap.js
import "dotenv/config";
import mongoose from "mongoose";
import Match from "../models/Match.js";

await mongoose.connect(process.env.MONGO_URI);

const docs = await Match.find({}).select("entity_id entity_type matches").lean();
const sizes = docs.map(d => d.matches.length);
const under50 = sizes.filter(s => s < 50).length;
console.log(`held < 50 (small eligible pool): ${under50}/${docs.length}`);
console.log(`min ${Math.min(...sizes)}, max ${Math.max(...sizes)}`);
const gaps = docs
  .map(d => ({ id: d.entity_id, held: d.matches.length, cursor: d.retrieval_cursor ?? 0 }))
  .map(x => ({ ...x, gap: x.cursor - x.held }))
  .filter(x => x.gap > 0)
  .sort((a, b) => b.gap - a.gap);

console.log(`docs with a cursor/held gap: ${gaps.length}/${docs.length}`);
gaps.slice(0, 10).forEach(g =>
  console.log(`  ${g.id}: held ${g.held}, cursor ${g.cursor}, gap ${g.gap}`));

await mongoose.disconnect();