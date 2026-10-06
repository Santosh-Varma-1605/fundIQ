import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import "./Home.css";

/* ─── SVG ICONS ─────────────────────────────────────── */
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconFilter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconBolt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconPlay = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconDollar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconPercent = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const IconScale = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18"/>
    <path d="M7 21h10"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
  </svg>
);

/* ─── DATA ───────────────────────────────────────────── */

const STATS = [
  { num: "12K+",   label: "Startups Analyzed",  Icon: IconBarChart },
  { num: "94%",    label: "Match Accuracy",      Icon: IconPercent  },
  { num: "3,800+", label: "Active Investors",    Icon: IconUsers    },
  { num: "$2.4B",  label: "Capital Facilitated", Icon: IconDollar   },
];

const MATCHES = [
  { Icon: IconBolt,    name:"Sequoia Capital",     stage:"Series A–C",      pct:"94%" },
  { Icon: IconTrendUp, name:"Y Combinator",        stage:"Pre-seed / Seed", pct:"87%" },
  { Icon: IconFilter,  name:"Andreessen Horowitz", stage:"Growth / Late",   pct:"81%" },
];

const ARBITER_AGENTS = [
  { Icon: IconTrendUp,  name: "Advocate", desc: "Builds the strongest bull case — traction, timing, team." },
  { Icon: IconFilter,   name: "Skeptic",  desc: "Attacks the weak points — market risk, moat, macro headwinds." },
  { Icon: IconBarChart, name: "Analyst",  desc: "Feeds the debate live market and sector data, not opinion." },
  { Icon: IconScale,    name: "Arbiter",  desc: "Weighs both sides and delivers the final verdict and score." },
];

const TICKER = [
  "Smart Matching", "Arbiter Verdicts", "Multi-Agent Debate",
  "Deal Flow Intelligence", "Investor Thesis Filter", "Pitch Analytics",
  "Real-Time Trends", "Precision Connections",
];

const FOOTER_LINKS = ["Platform", "Arbiter", "Founders", "Investors", "Pricing", "Blog", "Privacy"];

/* ─── COMPONENT ──────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const tickerLoop = [...TICKER, ...TICKER];

  return (
    <>
      <div className="grid-bg" aria-hidden="true" />
      <span className="cross cross-tl" aria-hidden="true">+</span>
      <span className="cross cross-tr" aria-hidden="true">+</span>

      {/* ══ NAVBAR ══════════════════════════════════════ */}
      <nav className="nav" style={{ borderBottomColor: scrolled ? "var(--border-hi)" : "var(--border)" }}>
        <a href="/" className="nav-logo">
          <div className="logo-tri" aria-hidden="true" />
          FundIQ
        </a>

    

        <div className="nav-right">
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark"
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button className="btn-outline" onClick={() => navigate("/investor-login")}>
            Investor Sign In
          </button>
          <button className="btn-fill" onClick={() => navigate("/startup-login")}>
            Startup Sign In
          </button>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-rainbow" aria-hidden="true" />
        <div className="hero-content">
          <h1 className="hero-title">
            Raise Smarter.<br />Invest Sharper.
          </h1>
          <p className="hero-sub">
            FundIQ matches founders and investors on genuine thesis alignment —
            then lets you debate the deal itself before you commit.
          </p>
          <div className="hero-ctas">
            <button className="cta-white" onClick={() => navigate("/startup-login")}>
              <IconPlay />
              Start Raising
            </button>
            <button className="cta-dark" onClick={() => navigate("/investor-login")}>
              I'm an Investor
            </button>
          </div>
        </div>
      </section>

      {/* ══ TICKER ══════════════════════════════════════ */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker-track">
          {tickerLoop.map((item, i) => (
            <span className="tick-item" key={i}>
              <span className="tick-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ══ STATS ═══════════════════════════════════════ */}
      <div className="stats-row">
        {STATS.map(({ num, label }) => (
          <div className="stat-cell" key={label}>
            <div className="stat-num">{num}</div>
            <div className="stat-lbl">{label}</div>
          </div>
        ))}
      </div>

      {/* ══ SMART MATCHING ═══════════════════════════════ */}
      <div className="section">
        <div className="features-layout">
          <div className="ui-card">
            <div className="score-row">
              <div className="score-ring">
                <div className="score-center">
                  <span className="score-n">82</span>
                  <span className="score-lbl2">SCORE</span>
                </div>
              </div>
              <div>
                <div className="score-name">NovaSynth AI</div>
                <div className="score-sub">Series A · Deep Tech</div>
                <span className="pill">High Fundability</span>
              </div>
            </div>
            <div className="match-list">
              {MATCHES.map(({ Icon, name, stage, pct }, i) => (
                <div className="match-row" key={i}>
                  <div className="match-left">
                    <div className="match-ava"><Icon /></div>
                    <div>
                      <div className="match-name">{name}</div>
                      <div className="match-stage">{stage}</div>
                    </div>
                  </div>
                  <div className="match-pct">{pct}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow">
              <IconTarget /> Core Platform · Intelligent Matchmaking
            </div>
            <h2 className="section-h" style={{ marginBottom: 14 }}>
              Matched on real alignment,<br />not cold outreach.
            </h2>
            <p className="section-p" style={{ marginBottom: 20 }}>
              Every founder and investor on FundIQ is mapped by sector, stage,
              check size, thesis, and risk appetite — so every introduction
              starts from genuine shared interest, not a cold cap-table blast.
            </p>
            <div className="mode-tags" style={{ marginBottom: 28 }}>
              {["Thesis-Mapped", "Sector + Stage Fit", "Check-Size Aligned"].map(t => (
                <span className="mode-tag" key={t}>{t}</span>
              ))}
            </div>
            <button className="cta-white" onClick={() => navigate("/startup-login")}>
              <IconPlay /> Find Your Match
            </button>
          </div>
        </div>
      </div>

      {/* ══ MODES ═══════════════════════════════════════ */}
      <div className="modes-section">
        <div className="modes-inner">
          <div className="eyebrow">Discovery Modes</div>
          <h2 className="section-h">Two ways to act on it.</h2>
          <p className="section-p">
            Once you're matched, browse the full ecosystem or let Sure Shot Mode
            cut straight to your top three — FundIQ has a mode for every workflow.
          </p>
          <div className="modes-grid">
            <div className="mode-card" onClick={() => navigate("/startup-login")}>
              <div className="mode-badge"><IconFilter /> EXPLORE MODE</div>
              <div className="mode-title">Browse the Ecosystem</div>
              <p className="mode-desc">A professional directory of investors and startups. Filter by sector, stage, geography, check size, and thesis alignment. Build a curated list on your terms.</p>
              <div className="mode-tags">
                {["Smart Filters","Directory View","Save Lists","Thesis Scan"].map(t => (
                  <span className="mode-tag" key={t}>{t}</span>
                ))}
              </div>
              <div className="mode-arrow"><IconArrow /></div>
            </div>
            <div className="mode-card" onClick={() => navigate("/startup-login")}>
              <div className="mode-badge"><IconBolt /> SURE SHOT MODE</div>
              <div className="mode-title">Your Top 3 Matches</div>
              <p className="mode-desc">Skip the noise. FundIQ's compatibility engine surfaces your 3 highest-confidence matches with clear reasoning for every pairing — built for founders and investors who trust data.</p>
              <div className="mode-tags">
                {["AI-Ranked","Confidence Scores","Clear Rationale","Instant Action"].map(t => (
                  <span className="mode-tag" key={t}>{t}</span>
                ))}
              </div>
              <div className="mode-arrow"><IconArrow /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ARBITER ═══════════════════════════════════════ */}
      <div className="section arbiter-section">
        <div className="eyebrow">
          <IconScale /> Next Step · Multi-Agent Debate Engine
        </div>
        <h2 className="section-h">Every deal, debated before you commit.</h2>
        <p className="section-p">
          Found your match? Arbiter runs a structured, adversarial debate on the
          deal itself — Advocate versus Skeptic, grounded in live market data —
          before you commit. Available to founders and investors alike.
        </p>

        <div className="agents-grid">
          {ARBITER_AGENTS.map(({ Icon, name, desc }) => (
            <div className="step-card" key={name}>
              <div className="step-icon"><Icon /></div>
              <div className="step-title">{name}</div>
              <p className="step-desc">{desc}</p>
            </div>
          ))}
        </div>

        <div className="verdict-preview">
          <div className="verdict-preview-head">
            <div
              className="score-ring"
              style={{ background: "conic-gradient(var(--green) 0% 78%, var(--border) 78% 100%)" }}
            >
              <div className="score-center">
                <span className="score-n">78</span>
                <span className="score-lbl2">SCORE</span>
              </div>
            </div>
            <div>
              <div className="score-name">Sample Verdict · Medium Confidence</div>
              <p className="verdict-preview-summary">
                Strong early traction and a genuine sector tailwind, offset by a thin
                revenue base for the round size and an unresolved supply-chain risk.
              </p>
              <div className="mode-tags">
                {["Climate Tech", "Supply Diversification", "LOI Needed"].map(t => (
                  <span className="mode-tag" key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <button className="cta-dark verdict-cta" onClick={() => navigate("/startup-login")}>
            See your own verdict <IconArrow />
          </button>
        </div>
      </div>

      {/* ══ CTA ═════════════════════════════════════════ */}
      <div className="cta-section">
        <h2 className="cta-title">Stop guessing.<br />Start funding.</h2>
        <p className="cta-sub">
          Join the intelligence layer reshaping how startups and capital find each other.
        </p>
        <div className="cta-row">
          <button className="cta-white" onClick={() => navigate("/startup-login")}>
            <IconPlay />Start Raising
          </button>
          <button className="cta-dark" onClick={() => navigate("/investor-login")}>
            I'm an Investor
          </button>
        </div>
      </div>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer className="footer-wrap">
        <div className="footer">
          <div>
            <div className="footer-brand">FundIQ</div>
            <div className="footer-tagline">Raise Smarter. Invest Sharper.</div>
          </div>
          <nav className="footer-links">
            {FOOTER_LINKS.map(l => <a href="#" key={l}>{l}</a>)}
          </nav>
          <div className="footer-copy">© 2026 FundIQ</div>
        </div>
      </footer>
    </>
  );
}