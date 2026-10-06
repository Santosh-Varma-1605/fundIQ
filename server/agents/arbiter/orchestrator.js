import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

import { intakeNode } from "./intake.js";
import { analystNode } from "./analyst.js";
import { advocateNode } from "./advocate.js";
import { skepticNode } from "./skeptic.js";
import { arbiterNode } from "./moderator.js";
import { persistNode } from "./persist.js";
import { roundCheckNode, roundCheckRouter } from "./roundCheck.js";

const ArbiterStateAnnotation = Annotation.Root({
  input: Annotation(),
  marketContext: Annotation(),
  transcript: Annotation(),
  round: Annotation(),
  maxRounds: Annotation(),
  verdict: Annotation(),
  status: Annotation(),
  runId: Annotation(),
});

const graph = new StateGraph(ArbiterStateAnnotation)
  .addNode("intake", intakeNode)
  .addNode("analyst", analystNode)
  .addNode("advocate", advocateNode)
  .addNode("skeptic", skepticNode)
  .addNode("round_check", roundCheckNode)
  .addNode("arbiter", arbiterNode)
  .addNode("persist", persistNode)
  .addEdge(START, "intake")
  .addEdge("intake", "analyst")
  .addEdge("analyst", "advocate")
  .addEdge("advocate", "skeptic")
  .addEdge("skeptic", "round_check")
  .addConditionalEdges("round_check", roundCheckRouter, {
    continue: "advocate",
    done: "arbiter",
  })
  .addEdge("arbiter", "persist")
  .addEdge("persist", END);

export const arbiterGraph = graph.compile();

export async function runArbiter(input, runId) {
  const initialState = {
    input,
    marketContext: null,
    transcript: [],
    round: 0,
    maxRounds: 2,
    verdict: null,
    status: "running",
    runId,
  };

  return arbiterGraph.invoke(initialState);
}