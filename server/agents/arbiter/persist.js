import ArbiterRun from "../../models/ArbiterRun.js";

export async function persistNode(state) {
  await ArbiterRun.findOneAndUpdate(
    { runId: state.runId },
    {
      marketContext: state.marketContext,
      transcript: state.transcript,
      verdict: state.verdict,
      status: "complete",
    },
    { upsert: true }
  );

  return { ...state, status: "complete" };
}