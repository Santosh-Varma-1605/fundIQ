import { FONT_MONO, FONT_SERIF } from "../../theme";

const AGENT_LABELS = {
  analyst: "Analyst",
  advocate: "Advocate",
  skeptic: "Skeptic",
  arbiter: "Arbiter",
};

function Bubble({ turn, c, side }) {
  const isArbiter = turn.agent === "arbiter";
  const isAnalyst = turn.agent === "analyst";
  const align = side === "right" ? "flex-end" : "flex-start";

  return (
    <div style={{ display: "flex", justifyContent: isAnalyst || isArbiter ? "center" : align, marginBottom: 16 }}>
      <div
        style={{
          maxWidth: isAnalyst || isArbiter ? "100%" : "78%",
          background: isArbiter ? c.text : c.bgCard,
          color: isArbiter ? c.bg : c.text,
          border: `1px solid ${isArbiter ? c.text : c.border}`,
          borderRadius: 2,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontFamily: FONT_MONO,
            letterSpacing: "1.5px",
            marginBottom: 8,
            textTransform: "uppercase",
            color: isArbiter ? c.bg : c.text3,
            opacity: isArbiter ? 0.7 : 1,
          }}
        >
          {AGENT_LABELS[turn.agent]}
          {turn.round > 0 ? ` · ROUND ${turn.round}` : ""}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{turn.content}</div>
      </div>
    </div>
  );
}

export default function ArbiterTranscript({ transcript, c, loading, error }) {
  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px", textAlign: "center", color: c.text3, fontSize: 12, fontFamily: FONT_MONO }}>
        Loading transcript...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px", textAlign: "center", color: "#b3401f", fontSize: 12, fontFamily: FONT_MONO }}>
        Failed to load transcript: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text3, marginBottom: 20, textTransform: "uppercase" }}>
        ◆ Full Debate Transcript
      </div>
      {transcript.map((turn, i) => (
        <Bubble key={i} turn={turn} c={c} side={turn.agent === "skeptic" ? "right" : "left"} />
      ))}
    </div>
  );
}