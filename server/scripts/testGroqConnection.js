import "dotenv/config";
import { callGroq } from "../agents/arbiter/groqClient.js";

async function main() {
  console.log("Calling Groq...");
  const response = await callGroq({
    systemPrompt: "You are a terse test assistant. Reply in one short sentence.",
    userPrompt: "Say hello and confirm you are working.",
  });
  console.log("\nGroq responded:\n");
  console.log(response);
  console.log("\n✅ Groq connection verified.");
}

main().catch((err) => {
  console.error("\n❌ Groq connection FAILED:");
  console.error(err.message);
  process.exit(1);
});