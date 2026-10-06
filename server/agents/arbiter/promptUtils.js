export function formatMarketContext(marketContext) {
  if (!marketContext) return "(no market context available)";
  const lines = [`Sector trend: ${marketContext.sectorTrend}`];
  if (marketContext.comparableRaises?.length) {
    lines.push("Comparable raises:", ...marketContext.comparableRaises.map((r) => `- ${r}`));
  }
  if (marketContext.notableNews?.length) {
    lines.push("Notable news:", ...marketContext.notableNews.map((n) => `- ${n}`));
  }
  return lines.join("\n");
}

/**
 * Input as the Advocate sees it. Deliberately does NOT include
 * knownRedFlags / selfAssessedWeaknesses — those route to the Skeptic
 * only (see formatInputForSkeptic below). This is what stops the
 * Advocate from softly arguing against itself.
 */
export function formatInputForAdvocate(input) {
  const lines = [
    `Company: ${input.companyName}`,
    `Sector: ${input.sector}`,
    `Stage: ${input.stage}`,
  ];
  if (input.tractionMetrics) lines.push(`Traction: ${input.tractionMetrics}`);
  if (input.fundingAsk) lines.push(`Funding ask: ${input.fundingAsk} ${input.fundingAskCurrency ?? ""}`);
  if (input.runwayMonths) lines.push(`Runway: ${input.runwayMonths} months`);
  if (input.checkSizeRange) lines.push(`Investor check size range: ${input.checkSizeRange}`);
  return lines.join("\n");
}

/**
 * Input as the Skeptic sees it — everything the Advocate sees, plus
 * whatever the user flagged as a concern/weakness. This is the ONLY
 * place these two fields are ever read.
 */
export function formatInputForSkeptic(input) {
  const lines = [formatInputForAdvocate(input)];
  if (input.knownRedFlags) lines.push(`Investor-flagged concerns: ${input.knownRedFlags}`);
  if (input.selfAssessedWeaknesses) lines.push(`Founder-flagged weaknesses: ${input.selfAssessedWeaknesses}`);
  return lines.join("\n");
}

/**
 * Finds the most recent transcript turn spoken by a given agent —
 * this is how round 2 "reads what the other side just said."
 */
export function getLastTurnByAgent(transcript, agentName) {
  const turns = transcript.filter((t) => t.agent === agentName);
  if (!turns.length) return "(no prior turn found)";
  return turns[turns.length - 1].content;
}