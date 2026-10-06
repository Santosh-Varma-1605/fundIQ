import { FONT_MONO, FONT_SERIF } from "../../theme";

const STEPS = [
  { key: "analyst", label: "Analyst" },
  { key: "advocate", label: "Advocate" },
  { key: "skeptic", label: "Skeptic" },
  { key: "arbiter", label: "Arbiter" },
];

export default function ArbiterProgress({ c, activeIndex }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "2px", color: c.text3, marginBottom: 28 }}>
        ● RUNNING THE DEBATE — THIS TAKES ABOUT 20-30 SECONDS
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {STEPS.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;
          return (
            <div
              key={step.key}
              style={{
                flex: 1,
                maxWidth: 120,
                padding: "14px 8px",
                borderRadius: 2,
                border: `1px solid ${isActive ? c.borderHi : c.border}`,
                background: isActive ? c.bgCard : "transparent",
                opacity: isDone ? 0.4 : 1,
                transition: "all .3s",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isActive ? c.text : c.text3,
                  margin: "0 auto 8px",
                  animation: isActive ? "pulse2 1.2s infinite" : "none",
                }}
              />
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_SERIF, color: c.text }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}