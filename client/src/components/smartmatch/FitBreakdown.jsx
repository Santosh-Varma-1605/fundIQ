// The "why this match" row. Renders the five structural features that feed
// backwardScore(), which is the half of the reciprocal score that semantic
// similarity alone can't see.
//
// Two of them are not booleans: checkSizeFit and riskAppetiteFit use a soft
// falloff, so a raise slightly outside an investor's range scores ~0.8 rather
// than 0. Those render as "partial" instead of a tick or a cross — collapsing
// them to yes/no would misrepresent what the scoring actually did.

import { FONT_MONO } from "../../theme";

const FEATURES = [
  { key: "sectorMatch",     label: "Sector" },
  { key: "stageMatch",      label: "Stage" },
  { key: "checkSizeFit",    label: "Check size" },
  { key: "riskAppetiteFit", label: "Risk fit" },
  { key: "geoMatch",        label: "Geography" },
];

const FULL = 0.99; // float arithmetic — 1 doesn't always compare equal

function state(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "unknown";
  if (v >= FULL) return "full";
  if (v > 0)     return "partial";
  return "none";
}

export default function FitBreakdown({ features, accent, c, compact = false }) {
  if (!features) return null;

  const rows = FEATURES
    .map((f) => ({ ...f, value: features[f.key], s: state(features[f.key]) }))
    .filter((f) => f.s !== "unknown");

  if (!rows.length) return null;

  return (
    <div>
      <div style={{
        fontSize: 8, fontFamily: FONT_MONO, letterSpacing: "2px",
        color: c.text3, textTransform: "uppercase", marginBottom: 8,
      }}>
        ◆ Why this match
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {rows.map(({ key, label, value, s }) => {
          const on      = s === "full";
          const partial = s === "partial";

          const color = on ? accent : partial ? c.text2 : c.text3;
          const mark  = on ? "✓" : partial ? "~" : "✕";

          return (
            <div
              key={key}
              title={partial ? `Partial fit (${Math.round(value * 100)}%)` : undefined}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 9px", borderRadius: 2,
                border: `1px solid ${on ? `${accent}44` : c.border}`,
                background: on ? `${accent}0e` : "transparent",
                opacity: s === "none" ? 0.45 : 1,
              }}
            >
              <span style={{
                fontSize: 10, fontFamily: FONT_MONO, color,
                fontWeight: 700, lineHeight: 1,
              }}>{mark}</span>
              <span style={{
                fontSize: 10, fontFamily: FONT_MONO, color: on ? c.text : c.text2,
                letterSpacing: "0.4px",
              }}>{label}</span>
              {partial && !compact && (
                <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: c.text3 }}>
                  {Math.round(value * 100)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}