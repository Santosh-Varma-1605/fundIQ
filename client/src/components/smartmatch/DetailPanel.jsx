// The side panel on wide screens. Holds what the card deliberately truncates:
// the full thesis, contact details, and every numeric field. The card stays
// scannable; the panel is where someone who wants to actually compare numbers
// looks before deciding.
//
// Hidden under 1000px by the parent's media query — on narrow screens the
// card alone is the experience.

import { FONT_MONO, FONT_SERIF } from "../../theme";
import FitBreakdown from "./FitBreakdown";
import { fmtUsd, Meter } from "./CandidateBody";

function Row({ label, value, c, mono = false }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      gap: 16, padding: "9px 0", borderBottom: `1px solid ${c.border}`,
    }}>
      <span style={{
        fontSize: 9, fontFamily: FONT_MONO, color: c.text3,
        letterSpacing: "1.5px", textTransform: "uppercase", flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600, color: c.text, textAlign: "right",
        fontFamily: mono ? FONT_MONO : "inherit", overflowWrap: "anywhere",
      }}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children, c }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{
        fontSize: 8, fontFamily: FONT_MONO, letterSpacing: "2px",
        color: c.text3, textTransform: "uppercase", marginBottom: 10,
      }}>◆ {title}</div>
      {children}
    </div>
  );
}

export default function DetailPanel({ card, role, accent, c }) {
  if (!card) {
    return (
      <div style={{
        border: `1px dashed ${c.border}`, borderRadius: 2, padding: 32,
        minHeight: 300, display: "flex", alignItems: "center",
        justifyContent: "center", textAlign: "center",
      }}>
        <div style={{
          fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "2px",
        }}>NO CARD SELECTED</div>
      </div>
    );
  }

  const p = card.profile || {};
  const viewingInvestor = role === "startup";

  const sectors = Array.isArray(p.preferred_sectors)
    ? p.preferred_sectors.join(", ")
    : p.preferred_sectors || "—";
  const stages = Array.isArray(p.preferred_stages)
    ? p.preferred_stages.join(", ")
    : p.preferred_stages || "—";

  return (
    <div style={{
      background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 2,
      padding: "26px 28px",
    }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontSize: 20, fontWeight: 800, fontFamily: FONT_SERIF,
          letterSpacing: "-0.8px", color: c.text, marginBottom: 4,
        }}>{card.name}</div>
        <div style={{
          fontSize: 9, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1.5px",
        }}>{card.match_id}</div>
      </div>

      {p.email && (
        <Section title="Contact" c={c}>
          <a
            href={`mailto:${p.email}`}
            style={{
              fontSize: 13, color: accent, textDecoration: "none",
              fontFamily: FONT_MONO, overflowWrap: "anywhere",
            }}
          >{p.email}</a>
        </Section>
      )}

      {viewingInvestor ? (
        <>
          {p.thesis_text && (
            <Section title="Investment thesis" c={c}>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: c.text2 }}>{p.thesis_text}</p>
            </Section>
          )}

          <Section title="Mandate" c={c}>
            <Row label="Sectors"     value={sectors} c={c} />
            <Row label="Stages"      value={stages} c={c} />
            <Row label="Geography"   value={p.geo_focus} c={c} />
            <Row label="Check size"  value={`${fmtUsd(p.check_min)} – ${fmtUsd(p.check_max)}`} c={c} mono />
            <Row label="Risk"        value={p.risk_appetite} c={c} />
            <Row label="Deals / yr"  value={p.deals_per_year} c={c} mono />
            <Row label="Pre-revenue" value={p.pre_revenue_ok ? "Yes" : "No"} c={c} />
          </Section>
        </>
      ) : (
        <>
          <Section title="Company" c={c}>
            <Row label="Sector"  value={p.sector} c={c} />
            <Row label="Stage"   value={p.stage} c={c} />
            <Row label="Market"  value={p.market} c={c} />
            <Row label="HQ"      value={p.hq_country} c={c} />
            <Row label="Team"    value={p.team_size ? `${p.team_size} people` : null} c={c} mono />
          </Section>

          <Section title="Financials" c={c}>
            <Row label="Raising"      value={fmtUsd(p.current_raise)} c={c} mono />
            <Row label="Total raised" value={fmtUsd(p.total_raised)} c={c} mono />
            <Row label="Revenue"      value={fmtUsd(p.revenue)} c={c} mono />
            <Row label="Growth"       value={p.growth_rate != null ? `${(p.growth_rate * 100).toFixed(0)}%` : null} c={c} mono />
          </Section>

          <Section title="Scores" c={c}>
            <div style={{ display: "grid", gap: 16 }}>
              <Meter label="Traction" value={p.traction_score} max={2} color="#22c55e" c={c} />
              <Meter label="Risk"     value={p.risk_score}     max={1} color="#ef4444" c={c} />
            </div>
          </Section>
        </>
      )}

      {card.features && (
        <Section title="Compatibility" c={c}>
          <FitBreakdown features={card.features} accent={accent} c={c} />
          <div style={{ marginTop: 14 }}>
            <Row label="Reciprocal" value={card.reciprocal_score?.toFixed(4)} c={c} mono />
            <Row label="Semantic"   value={card.similarity_score?.toFixed(4)} c={c} mono />
          </div>
          <p style={{
            fontSize: 11, lineHeight: 1.6, color: c.text3, marginTop: 10,
          }}>
            Reciprocal blends semantic similarity with how well you fit
            each other's stated criteria — so a strong one-way match
            doesn't score highly on its own.
          </p>
        </Section>
      )}
    </div>
  );
}