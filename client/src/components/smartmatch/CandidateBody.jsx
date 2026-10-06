// The two card layouts. A startup swiping sees investor cards; an investor
// swiping sees startup cards. Same shell, different fields — so the card
// component stays one file instead of two near-duplicates.

import { FONT_MONO, FONT_SERIF } from "../../theme";

export const fmtUsd = (n) => {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
};

const pct = (n) => (n == null ? "—" : `${(Number(n) * 100).toFixed(0)}%`);

// ── shared bits ──────────────────────────────────────────────────

export function Chip({ children, accent, c, active = false }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: FONT_MONO, padding: "3px 9px", borderRadius: 2,
      border: `1px solid ${active ? `${accent}44` : c.border}`,
      background: active ? `${accent}0e` : "transparent",
      color: active ? accent : c.text2,
      letterSpacing: "0.4px", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function StatCell({ label, value, c }) {
  return (
    <div style={{ background: c.bgSurf, borderRadius: 2, padding: "9px 11px", minWidth: 0 }}>
      <div style={{
        fontSize: 8, fontFamily: FONT_MONO, color: c.text3,
        letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: c.text,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{value}</div>
    </div>
  );
}

export function Meter({ label, value, max = 1, color, c }) {
  const ratio = Math.max(0, Math.min(Number(value) / max, 1));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{
          fontSize: 8, fontFamily: FONT_MONO, color: c.text3,
          letterSpacing: "1.5px", textTransform: "uppercase",
        }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: FONT_MONO }}>
          {value == null ? "—" : Number(value).toFixed(2)}
        </span>
      </div>
      <div style={{ height: 3, background: c.border, borderRadius: 0 }}>
        <div style={{
          height: "100%", width: `${ratio * 100}%`, background: color,
          transition: "width 0.5s ease",
        }}/>
      </div>
    </div>
  );
}

// ── investor card (shown to a startup) ───────────────────────────

function InvestorBody({ p, accent, c }) {
  const sectors = Array.isArray(p.preferred_sectors)
    ? p.preferred_sectors
    : String(p.preferred_sectors || "").split(",").map(s => s.trim()).filter(Boolean);

  const stages = Array.isArray(p.preferred_stages)
    ? p.preferred_stages
    : String(p.preferred_stages || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <>
      <div style={{ fontSize: 11, color: c.text2, marginBottom: 14, fontFamily: FONT_MONO }}>
        Venture Capital{p.geo_focus ? ` · ${p.geo_focus}` : ""}
      </div>

      {p.thesis_text && (
        <p style={{
          fontSize: 13, lineHeight: 1.65, color: c.text2, marginBottom: 14,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{p.thesis_text}</p>
      )}

      {sectors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {sectors.slice(0, 4).map(s => (
            <Chip key={s} accent={accent} c={c} active>{s}</Chip>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatCell
          label="Check size"
          value={`${fmtUsd(p.check_min)} – ${fmtUsd(p.check_max)}`}
          c={c}
        />
        <StatCell label="Stages" value={stages.join(", ") || "—"} c={c} />
        <StatCell label="Risk appetite" value={p.risk_appetite || "—"} c={c} />
        <StatCell
          label="Deals / year"
          value={p.deals_per_year ? `${p.deals_per_year}` : "—"}
          c={c}
        />
      </div>

      {p.pre_revenue_ok != null && (
        <div style={{ marginTop: 12 }}>
          <Chip accent={accent} c={c} active={Boolean(p.pre_revenue_ok)}>
            {p.pre_revenue_ok ? "Invests pre-revenue" : "Revenue required"}
          </Chip>
        </div>
      )}
    </>
  );
}

// ── startup card (shown to an investor) ──────────────────────────

function StartupBody({ p, accent, c }) {
  return (
    <>
      <div style={{ fontSize: 11, color: c.text2, marginBottom: 14, fontFamily: FONT_MONO }}>
        {[p.sector, p.stage].filter(Boolean).join(" · ") || "Startup"}
        {p.hq_country ? ` · ${p.hq_country}` : ""}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
        {p.sector && <Chip accent={accent} c={c} active>{p.sector}</Chip>}
        {p.stage  && <Chip accent={accent} c={c}>{p.stage}</Chip>}
        {p.market && <Chip accent={accent} c={c}>{p.market}</Chip>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <StatCell label="Raising now"  value={fmtUsd(p.current_raise)} c={c} />
        <StatCell label="Revenue"      value={fmtUsd(p.revenue)} c={c} />
        <StatCell label="Total raised" value={fmtUsd(p.total_raised)} c={c} />
        <StatCell
          label="Growth"
          value={p.growth_rate != null ? pct(p.growth_rate) : "—"}
          c={c}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Meter label="Traction" value={p.traction_score} max={2} color="#22c55e" c={c} />
        <Meter label="Risk"     value={p.risk_score}     max={1} color="#ef4444" c={c} />
      </div>

      {p.team_size != null && (
        <div style={{
          marginTop: 12, fontSize: 10, fontFamily: FONT_MONO, color: c.text3,
          letterSpacing: "1px",
        }}>
          TEAM · {p.team_size} PEOPLE
        </div>
      )}
    </>
  );
}

export default function CandidateBody({ card, role, accent, c }) {
  const p = card.profile || {};
  // role is the VIEWER. A startup viewing sees investor cards.
  return role === "startup"
    ? <InvestorBody p={p} accent={accent} c={c} />
    : <StartupBody  p={p} accent={accent} c={c} />;
}