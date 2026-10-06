import { useState } from "react";
import { FONT_MONO } from "../../theme";

export default function ArbiterFollowUp({ c, followUps, onAsk, asking, error }) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    onAsk(question.trim());
    setQuestion("");
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 80px" }}>
      <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text3, marginBottom: 16, textTransform: "uppercase" }}>
        ◆ Ask A Follow-Up About This Verdict
      </div>

      {followUps?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {followUps.map((f, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: c.text, fontWeight: 600, marginBottom: 6 }}>{f.question}</div>
              <div
                style={{
                  fontSize: 13,
                  color: c.text2,
                  lineHeight: 1.7,
                  background: c.bgSurf,
                  border: `1px solid ${c.border}`,
                  borderRadius: 2,
                  padding: "12px 14px",
                }}
              >
                {f.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#b3401f", marginBottom: 12 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why didn't you weight our LOIs more heavily?"
          style={{
            flex: 1,
            background: c.bgSurf,
            border: `1px solid ${c.border}`,
            borderRadius: 2,
            color: c.text,
            fontSize: 13,
            fontFamily: "inherit",
            padding: "10px 12px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          style={{
            padding: "0 18px",
            borderRadius: 2,
            background: c.text,
            color: c.bg,
            border: "none",
            fontSize: 11,
            fontFamily: FONT_MONO,
            letterSpacing: "0.5px",
            cursor: asking || !question.trim() ? "not-allowed" : "pointer",
            opacity: asking || !question.trim() ? 0.5 : 1,
          }}
        >
          {asking ? "ASKING..." : "ASK"}
        </button>
      </form>
    </div>
  );
}