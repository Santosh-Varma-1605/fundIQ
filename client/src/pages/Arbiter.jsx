import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../ThemeContext";
import { DARK, LIGHT, FONT_SERIF, FONT_MONO, FONT_SANS } from "../theme";
import ArbiterInputForm from "../components/arbiter/ArbiterInputForm";
import ArbiterProgress from "../components/arbiter/ArbiterProgress";
import ArbiterVerdict from "../components/arbiter/ArbiterVerdict";
import ArbiterTranscript from "../components/arbiter/ArbiterTranscript";
import ArbiterFollowUp from "../components/arbiter/ArbiterFollowUp";
import {
  submitArbiterAnalysis,
  pollArbiterStatus,
  getArbiterTranscript,
  askArbiterFollowUp,
  getArbiterFollowUps,
} from "../lib/arbiterApi";

const COPY = {
  investor: {
    portalTag: "INVESTOR PORTAL · DEBATE INTELLIGENCE",
    line1: "Stress-test the",
    emph: "deal",
    line2: "before you do.",
    body: "Arbiter runs a structured, adversarial debate on any startup in your pipeline — bull case, bear case, live market data — and hands you a verdict, not just a score.",
    backRoute: "/investor-dashboard",
  },
  startup: {
    portalTag: "STARTUP PORTAL · DEBATE INTELLIGENCE",
    line1: "See your pitch",
    emph: "argued",
    line2: "both ways.",
    body: "Arbiter debates your own fundability — bull case, bear case, live market conditions — so you walk into the room having already survived the hardest questions.",
    backRoute: "/startup-dashboard",
  },
};

const ROLES = [
  { name: "The Advocate", desc: "Builds the strongest bull case — traction, timing, team." },
  { name: "The Skeptic", desc: "Attacks the weak points — market risk, moat, macro headwinds." },
  { name: "The Analyst", desc: "Feeds the debate live market and sector data, not opinion." },
  { name: "The Arbiter", desc: "Weighs both sides and delivers the final verdict and score." },
];

export default function Arbiter({ role = "investor" }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const c = isDark ? DARK : LIGHT;
  const copy = COPY[role];

  const [view, setView] = useState("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [runId, setRunId] = useState(null);

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");

  const [followUps, setFollowUps] = useState([]);
  const [followUpsLoaded, setFollowUpsLoaded] = useState(false);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  const handleSubmit = async (payload) => {
    setView("running");
    setErrorMessage("");
    setProgressIndex(0);

    const progressTimer = setInterval(() => {
      setProgressIndex((i) => Math.min(i + 1, 3));
    }, 6000);

    try {
      const { runId: newRunId } = await submitArbiterAnalysis(payload);
      setRunId(newRunId);

      const result = await pollArbiterStatus(newRunId);
      clearInterval(progressTimer);
      setVerdict(result.verdict);
      setView("verdict");
    } catch (err) {
      clearInterval(progressTimer);
      setErrorMessage(err.message || "Something went wrong running Arbiter.");
      setView("error");
    }
  };

  const handleViewTranscript = async () => {
    const next = !transcriptOpen;
    setTranscriptOpen(next);

    if (next && runId) {
      if (!transcript) {
        setTranscriptLoading(true);
        setTranscriptError("");
        try {
          const data = await getArbiterTranscript(runId);
          setTranscript(data.transcript);
        } catch (err) {
          setTranscriptError(err.message);
        } finally {
          setTranscriptLoading(false);
        }
      }

      if (!followUpsLoaded) {
        try {
          const data = await getArbiterFollowUps(runId);
          setFollowUps(data.followUps || []);
        } catch {
          // Non-fatal — an empty follow-up list is a fine fallback.
        } finally {
          setFollowUpsLoaded(true);
        }
      }
    }
  };

  const handleAsk = async (question) => {
    setAsking(true);
    setAskError("");
    try {
      const result = await askArbiterFollowUp(runId, question);
      setFollowUps((prev) => [...prev, result]);
    } catch (err) {
      setAskError(err.message || "Failed to get an answer — try again.");
    } finally {
      setAsking(false);
    }
  };

  const resetToForm = () => {
    setView("form");
    setVerdict(null);
    setTranscript(null);
    setTranscriptOpen(false);
    setRunId(null);
    setFollowUps([]);
    setFollowUpsLoaded(false);
    setAskError("");
  };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: FONT_SANS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{opacity:.5} 50%{opacity:.85} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .arbiter-orb {
          position: absolute; top: -160px; left: 50%; transform: translateX(-50%);
          width: 640px; height: 640px; border-radius: 50%; filter: blur(90px);
          background: radial-gradient(circle, rgba(120,170,255,0.22), rgba(255,120,80,0.10) 55%, transparent 75%);
          animation: glow 6s ease-in-out infinite; pointer-events: none;
        }
        .arbiter-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-left: 1px solid ${c.border}; border-top: 1px solid ${c.border}; }
        @media (max-width: 900px) { .arbiter-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .arbiter-grid { grid-template-columns: 1fr; } }
        .arbiter-back:focus-visible { outline: 2px solid ${c.borderHi}; outline-offset: 2px; }
      `}</style>

      <nav style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", borderBottom: `1px solid ${c.border}`, background: c.navBg, backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate(copy.backRoute)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", color: c.text, cursor: "pointer" }}>
          <div style={{ width: 22, height: 22, clipPath: "polygon(50% 0%,100% 100%,0% 100%)", background: c.text }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: FONT_SERIF }}>FundIQ</span>
        </button>
        <button className="arbiter-back" onClick={() => navigate(copy.backRoute)}
          style={{ fontSize: 11, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text2, background: "none", border: `1px solid ${c.border}`, borderRadius: 2, padding: "8px 14px", cursor: "pointer" }}>
          ← BACK TO DASHBOARD
        </button>
      </nav>

      <div style={{ position: "relative", overflow: "hidden", padding: "72px 40px 56px", borderBottom: `1px solid ${c.border}`, animation: "fadeUp .6s ease both" }}>
        <div className="arbiter-orb" />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "3px", color: c.text3, marginBottom: 18 }}>
            ◆ {copy.portalTag}
          </div>
          <h1 style={{ fontSize: "clamp(30px,4.5vw,50px)", fontWeight: 800, letterSpacing: "-2.5px", lineHeight: 1.05, fontFamily: FONT_SERIF, marginBottom: 20 }}>
            {copy.line1} <span style={{ fontStyle: "italic", fontWeight: 400 }}>{copy.emph}</span> {copy.line2}
          </h1>
          {view === "form" && (
            <p style={{ fontSize: 15, color: c.text2, lineHeight: 1.75, maxWidth: 540, margin: "0 auto 8px" }}>
              {copy.body}
            </p>
          )}
        </div>
      </div>

      {view === "form" && (
        <div style={{ padding: "56px 20px", animation: "fadeUp .5s ease both" }}>
          <ArbiterInputForm role={role} c={c} onSubmit={handleSubmit} submitting={false} />
        </div>
      )}

      {view === "running" && <ArbiterProgress c={c} activeIndex={progressIndex} />}

      {view === "error" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#b3401f", marginBottom: 20 }}>{errorMessage}</div>
          <button onClick={resetToForm} style={{ fontSize: 12, fontFamily: FONT_MONO, letterSpacing: "1px", background: c.text, color: c.bg, border: "none", borderRadius: 2, padding: "12px 20px", cursor: "pointer" }}>
            TRY AGAIN
          </button>
        </div>
      )}

      {view === "verdict" && verdict && (
        <div style={{ animation: "fadeUp .5s ease both" }}>
          <ArbiterVerdict verdict={verdict} c={c} onViewTranscript={handleViewTranscript} transcriptOpen={transcriptOpen} />
          {transcriptOpen && (
            <>
              <ArbiterTranscript transcript={transcript} c={c} loading={transcriptLoading} error={transcriptError} />
              <ArbiterFollowUp c={c} followUps={followUps} onAsk={handleAsk} asking={asking} error={askError} />
            </>
          )}
          <div style={{ textAlign: "center", paddingBottom: 60 }}>
            <button onClick={resetToForm} style={{ fontSize: 11, fontFamily: FONT_MONO, letterSpacing: "1px", color: c.text2, background: "none", border: `1px solid ${c.border}`, borderRadius: 2, padding: "10px 18px", cursor: "pointer" }}>
              RUN ANOTHER ANALYSIS
            </button>
          </div>
        </div>
      )}

      {view === "form" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 40px 100px" }}>
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "3px", color: c.text3, marginBottom: 10 }}>◆ HOW ARBITER THINKS</div>
            <h2 style={{ fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 800, letterSpacing: "-1px", fontFamily: FONT_SERIF }}>
              Four agents. One verdict.
            </h2>
          </div>
          <div className="arbiter-grid">
            {ROLES.map((r) => (
              <div key={r.name} style={{ borderRight: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: "28px 24px", background: c.bgCard }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_SERIF, marginBottom: 10 }}>{r.name}</div>
                <div style={{ fontSize: 12.5, color: c.text2, lineHeight: 1.65 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}