import { FONT_MONO, FONT_SERIF } from "../../theme";

function Tag({ children, c }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontFamily: FONT_MONO,
        letterSpacing: "0.5px",
        padding: "5px 10px",
        borderRadius: 2,
        border: `1px solid ${c.border}`,
        background: c.bgSurf,
        color: c.text2,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {children}
    </span>
  );
}

function ListSection({ title, items, c }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text3, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: c.text2, lineHeight: 1.7, marginBottom: 4 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ArbiterVerdict({ verdict, c, onViewTranscript, transcriptOpen }) {
  const confidenceColor = { low: "#b3401f", medium: "#8a6100", high: "#1f7a3d" }[verdict.confidence] ?? c.text2;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 8 }}>
        <div style={{ fontSize: 64, fontWeight: 800, fontFamily: FONT_SERIF, letterSpacing: "-3px", color: c.text, lineHeight: 1 }}>
          {verdict.score}
        </div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text3 }}>VIABILITY SCORE</div>
          <div style={{ fontSize: 11, fontFamily: FONT_MONO, letterSpacing: "1px", color: confidenceColor, marginTop: 2, textTransform: "uppercase" }}>
            {verdict.confidence} confidence
          </div>
        </div>
      </div>

      <p style={{ fontSize: 15, color: c.text, lineHeight: 1.75, marginBottom: 32, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
        {verdict.summary}
      </p>

      {verdict.targetSectors?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text3, marginBottom: 10, textTransform: "uppercase" }}>
            Target Sectors / Angles
          </div>
          <div>
            {verdict.targetSectors.map((s, i) => (
              <Tag key={i} c={c}>{s}</Tag>
            ))}
          </div>
        </div>
      )}

      <ListSection title="Unresolved Risks" items={verdict.unresolvedRisks} c={c} />
      <ListSection title="Recommended Adjustments" items={verdict.recommendedAdjustments} c={c} />
      <ListSection title="What Would Change This Verdict" items={verdict.whatWouldChangeTheVerdict} c={c} />

      <button
        onClick={onViewTranscript}
        style={{
          marginTop: 12,
          width: "100%",
          textAlign: "left",
          background: "none",
          border: `1px solid ${c.border}`,
          borderRadius: 2,
          padding: "14px 16px",
          color: c.text2,
          fontSize: 12,
          fontFamily: FONT_MONO,
          letterSpacing: "0.5px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{transcriptOpen ? "HIDE FULL DEBATE" : "VIEW FULL DEBATE"}</span>
        <span>{transcriptOpen ? "−" : "+"}</span>
      </button>
    </div>
  );
}