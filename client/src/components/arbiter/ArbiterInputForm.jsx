import { useState } from "react";
import { FONT_SERIF, FONT_MONO } from "../../theme";

const SECTORS = ["fintech", "climate tech", "healthtech", "ai/ml", "saas", "consumer", "deep tech", "other"];
const STAGES = [
  { value: "pre-seed", label: "Pre-seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b-plus", label: "Series B+" },
];
const CURRENCIES = ["usd", "eur", "gbp", "inr"];
const INVESTOR_TYPES = ["angel", "vc", "corporate", "growth"];

const FIELD_BASE_STYLE = (c) => ({
  width: "100%",
  background: c.bgSurf,
  border: `1px solid ${c.border}`,
  borderRadius: 2,
  color: c.text,
  fontSize: 13,
  fontFamily: "inherit",
  padding: "10px 12px",
  outline: "none",
});

function Label({ children, c, optional }) {
  return (
    <label style={{ display: "block", fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1px", color: c.text3, marginBottom: 6, textTransform: "uppercase" }}>
      {children}
      {optional && <span style={{ color: c.text3, textTransform: "none", letterSpacing: 0 }}> (optional)</span>}
    </label>
  );
}

export default function ArbiterInputForm({ role, c, onSubmit, submitting }) {
  const [form, setForm] = useState({
    companyName: "",
    sector: SECTORS[0],
    stage: "seed",
    pitchDeckOrSummary: "",
    tractionMetrics: "",
    geography: "",
    checkSizeRange: "",
    knownRedFlags: "",
    investorThesisNotes: "",
    fundingAsk: "",
    fundingAskCurrency: "usd",
    runwayMonths: "",
    targetInvestorType: INVESTOR_TYPES[0],
    selfAssessedWeaknesses: "",
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      role,
      companyName: form.companyName,
      sector: form.sector,
      stage: form.stage,
      pitchDeckOrSummary: form.pitchDeckOrSummary,
      tractionMetrics: form.tractionMetrics || undefined,
    };

    if (role === "investor") {
      payload.geography = form.geography || undefined;
      payload.checkSizeRange = form.checkSizeRange || undefined;
      payload.knownRedFlags = form.knownRedFlags || undefined;
      payload.investorThesisNotes = form.investorThesisNotes || undefined;
    } else {
      payload.fundingAsk = form.fundingAsk ? Number(form.fundingAsk) : undefined;
      payload.fundingAskCurrency = form.fundingAskCurrency;
      payload.runwayMonths = form.runwayMonths ? Number(form.runwayMonths) : undefined;
      payload.targetInvestorType = form.targetInvestorType;
      payload.selfAssessedWeaknesses = form.selfAssessedWeaknesses || undefined;
    }

    onSubmit(payload);
  };

  const inputStyle = FIELD_BASE_STYLE(c);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Label c={c}>Company name</Label>
        <input style={inputStyle} required value={form.companyName} onChange={update("companyName")} placeholder="e.g. Nimbus Robotics" />
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Label c={c}>Sector</Label>
          <select style={inputStyle} value={form.sector} onChange={update("sector")}>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <Label c={c}>Stage</Label>
          <select style={inputStyle} value={form.stage} onChange={update("stage")}>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label c={c}>{role === "investor" ? "Pitch summary / notes on this startup" : "Your pitch summary"}</Label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          required
          value={form.pitchDeckOrSummary}
          onChange={update("pitchDeckOrSummary")}
          placeholder="Paste a summary of the pitch, product, and market."
        />
      </div>

      <div>
        <Label c={c} optional>Traction metrics</Label>
        <input style={inputStyle} value={form.tractionMetrics} onChange={update("tractionMetrics")} placeholder="e.g. $18K MRR, 22% MoM growth, 6 paying pilots" />
      </div>

      {role === "investor" ? (
        <>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Label c={c} optional>Geography</Label>
              <input style={inputStyle} value={form.geography} onChange={update("geography")} placeholder="e.g. North America" />
            </div>
            <div style={{ flex: 1 }}>
              <Label c={c} optional>Check size range</Label>
              <input style={inputStyle} value={form.checkSizeRange} onChange={update("checkSizeRange")} placeholder="e.g. $250K-$1M" />
            </div>
          </div>
          <div>
            <Label c={c} optional>Known red flags</Label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.knownRedFlags} onChange={update("knownRedFlags")} placeholder="Anything you already suspect — routes only to the Skeptic." />
          </div>
          <div>
            <Label c={c} optional>Your investment thesis notes</Label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.investorThesisNotes} onChange={update("investorThesisNotes")} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 2 }}>
              <Label c={c}>Funding ask</Label>
              <input type="number" style={inputStyle} required value={form.fundingAsk} onChange={update("fundingAsk")} placeholder="1500000" />
            </div>
            <div style={{ flex: 1 }}>
              <Label c={c}>Currency</Label>
              <select style={inputStyle} value={form.fundingAskCurrency} onChange={update("fundingAskCurrency")}>
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>{cur.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Label c={c} optional>Runway (months)</Label>
              <input type="number" style={inputStyle} value={form.runwayMonths} onChange={update("runwayMonths")} placeholder="14" />
            </div>
            <div style={{ flex: 1 }}>
              <Label c={c} optional>Target investor type</Label>
              <select style={inputStyle} value={form.targetInvestorType} onChange={update("targetInvestorType")}>
                {INVESTOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label c={c} optional>Self-assessed weaknesses</Label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.selfAssessedWeaknesses} onChange={update("selfAssessedWeaknesses")} placeholder="What are you most worried about? Routes only to the Skeptic." />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          height: 46,
          borderRadius: 2,
          background: c.text,
          color: c.bg,
          border: "none",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.5px",
          fontFamily: FONT_MONO,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "ANALYZING..." : role === "investor" ? "ANALYZE THIS STARTUP" : "RUN MY ARBITER ANALYSIS"}
      </button>
    </form>
  );
}