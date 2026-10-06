import express from "express";
import { randomUUID } from "crypto";
import ArbiterRun from "../models/ArbiterRun.js";
import { runArbiter } from "../agents/arbiter/orchestrator.js";
import { answerFollowUp } from "../agents/arbiter/followUp.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const input = req.body;

    if (!input || !input.role || !input.companyName || !input.sector || !input.stage) {
      return res.status(400).json({
        error: "Missing required fields: role, companyName, sector, stage.",
      });
    }

    const runId = randomUUID();
    const userId = req.user?.id || "anonymous";

    await ArbiterRun.create({
      runId,
      userId,
      role: input.role,
      input,
      status: "running",
    });

    runArbiter(input, runId).catch(async (err) => {
      console.error(`[arbiter] run ${runId} failed:`, err);
      await ArbiterRun.updateOne(
        { runId },
        { status: "failed", errorMessage: err.message }
      ).catch(() => {});
    });

    return res.status(202).json({ runId });
  } catch (err) {
    console.error("[arbiter] /analyze failed to start:", err);
    return res.status(500).json({ error: "Failed to start Arbiter run." });
  }
});

router.get("/:runId/status", async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await ArbiterRun.findOne({ runId });

    if (!run) {
      return res.status(404).json({ error: "Run not found." });
    }

    return res.json({
      runId: run.runId,
      status: run.status,
      verdict: run.verdict,
      errorMessage: run.errorMessage,
    });
  } catch (err) {
    console.error("[arbiter] /status failed:", err);
    return res.status(500).json({ error: "Failed to fetch run status." });
  }
});

router.get("/:runId/transcript", async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await ArbiterRun.findOne({ runId });

    if (!run) {
      return res.status(404).json({ error: "Run not found." });
    }

    return res.json({
      runId: run.runId,
      status: run.status,
      transcript: run.transcript,
    });
  } catch (err) {
    console.error("[arbiter] /transcript failed:", err);
    return res.status(500).json({ error: "Failed to fetch transcript." });
  }
});

// [Day 7 — Follow-up Q&A] NOT a graph node. Single grounded call over an
// already-completed run's persisted data. See followUp.js for the rules.
router.post("/:runId/ask", async (req, res) => {
  try {
    const { runId } = req.params;
    const { question } = req.body;
    const userId = req.user?.id || "anonymous";

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "Missing required field: question." });
    }

    const run = await ArbiterRun.findOne({ runId });
    if (!run) {
      return res.status(404).json({ error: "Run not found." });
    }
    if (run.status !== "complete") {
      return res.status(409).json({
        error: "This run has not finished yet — Follow-up Q&A is only available once a verdict exists.",
      });
    }

    const answer = await answerFollowUp({
      transcript: run.transcript,
      verdict: run.verdict,
      question: question.trim(),
    });

    run.followUps.push({ question: question.trim(), answer, askedBy: userId });
    await run.save();

    return res.json({ question: question.trim(), answer, askedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[arbiter] /ask failed:", err);
    return res.status(500).json({ error: "Failed to answer follow-up question." });
  }
});

router.get("/:runId/followups", async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await ArbiterRun.findOne({ runId });

    if (!run) {
      return res.status(404).json({ error: "Run not found." });
    }

    return res.json({ runId: run.runId, followUps: run.followUps });
  } catch (err) {
    console.error("[arbiter] /followups failed:", err);
    return res.status(500).json({ error: "Failed to fetch follow-ups." });
  }
});

export default router;