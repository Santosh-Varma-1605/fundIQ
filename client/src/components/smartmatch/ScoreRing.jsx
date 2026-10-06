// Compatibility ring built from reciprocal_score — the harmonic mean of
// semantic similarity and structural fit. Deliberately NOT similarity_score:
// that number alone is what the matching looked like before the reciprocal
// rewrite, and showing it would undersell what the backend actually does.

import { FONT_MONO, FONT_SERIF } from "../../theme";

export default function ScoreRing({ score = 0, accent, c, size = 72 }) {
  const pct = Math.max(0, Math.min(100, Math.round(score * 100)));

  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={c.border} strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={accent} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 1,
      }}>
        <div style={{
          fontSize: size > 60 ? 20 : 16, fontWeight: 800,
          fontFamily: FONT_SERIF, color: c.text,
          letterSpacing: "-1px", lineHeight: 1,
        }}>{pct}</div>
        <div style={{
          fontSize: 7, fontFamily: FONT_MONO, color: c.text3,
          letterSpacing: "1.5px",
        }}>MATCH</div>
      </div>
    </div>
  );
}