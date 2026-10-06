import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useEffect, useState } from "react";
import FeatureCard from "../components/FeatureCard";
import { DARK, LIGHT, FONT_SERIF, FONT_MONO, FONT_SANS } from "../theme";

/* [Updated] Featured = Smart Matching + Arbiter, the two flagship tools */
const FEATURED = [
  {
    id: "smartmatch", tag: "AI · RECIPROCAL", title: "Smart Match",
    desc: "Swipe through investors ranked by two-way fit — not just how well they match you, but how well you match their mandate.",
    stat: "New", route: "/startup-smart-match",
    icon: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  {
    id: "arbiter", tag: "LANGGRAPH · DEBATE", title: "Arbiter",
    desc: "Your pitch, debated by AI — bull case, bear case, and live market data — before any real investor sees it.",
    stat: "New", route: "/startup-arbiter",
    icon: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 7l-3 6a3 3 0 0 0 6 0z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0z"/><path d="M5 7h14"/><path d="M8 21h8"/></svg>,
  },
];

/* [Updated] Auto Pitch Corrector moved here to make room for Arbiter above */
const SECONDARY = [
  {
    id: "pitch", title: "Auto Pitch Corrector", stat: "GPT-4o powered", route: "/startup-pitch-corrector",
    icon: (color) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  },
  {
    id: "viability", title: "Startup Advisor", stat: "Powered by Groq", route: "/startup-viability",
    icon: (color) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>,
  },
  {
    id: "optimizer", title: "Cost Optimizer", stat: "Runway analysis ready", route: "/startup-cost-optimizer",
    icon: (color) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  {
    id: "picks", title: "Top Picks", stat: "5 new picks today", route: "/startup-top-picks",
    icon: (color) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
];

const STATS = [
  { label: "Investor matches", value: "38",   sub: "+12 this week"    },
  { label: "Fundability score", value: "82",   sub: "+4 pts this month" },
  { label: "Runway estimate",   value: "14mo", sub: "Based on burn"    },
  { label: "Top picks waiting", value: "5",    sub: "2 new today"      },
];

const ACTIVITY = [
  { name: "Sequoia Capital",     stage: "Series A · Deep Tech", score: "94" },
  { name: "Y Combinator",        stage: "Pre-seed · B2B SaaS",  score: "88" },
  { name: "Andreessen Horowitz", stage: "Seed · AI/ML",         score: "81" },
  { name: "Tiger Global",        stage: "Series B · FinTech",   score: "76" },
];

const SunIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

export default function Startupdashboard() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const c = isDark ? DARK : LIGHT;
  const [user, setUser] = useState({ firstName: "Founder", lastName: "" });
  const [dropOpen, setDropOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/user/me", { credentials: "include" });
        if (!res.ok) return navigate("/startup-login");
        const data = await res.json();
        if (data.role !== "startup") return navigate("/");
        if (data.firstName) setUser({ firstName: data.firstName, lastName: data.lastName || "" });
      } catch { navigate("/startup-login"); }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await fetch("http://localhost:5000/api/auth/logout", { method: "POST", credentials: "include" });
    navigate("/startup-login");
  };

  const initials = `${user.firstName?.[0] ?? "S"}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const timeStr = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: FONT_SANS, position: "relative" }}>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fq-hero { padding: 48px 40px 40px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        @media (max-width: 700px) { .fq-hero { padding: 36px 20px 32px; align-items: flex-start; } }
        .fq-stats { display: grid; grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 700px) { .fq-stats { grid-template-columns: repeat(2, 1fr); } }
        .fq-main { padding: 0 40px 80px; }
        @media (max-width: 700px) { .fq-main { padding: 0 20px 60px; } }

        .fq-featured-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 760px) { .fq-featured-grid { grid-template-columns: 1fr; } }

        .fq-secondary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
        @media (max-width: 900px) { .fq-secondary-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .fq-secondary-grid { grid-template-columns: 1fr; } }

        /* ── Rainbow border, rewritten ──
           Old technique used an absolutely-positioned ::before with a
           mask, which failed silently and rendered as huge unclipped
           diagonal streaks across the page. This version uses the
           "double background, padding-box + border-box" technique
           instead — there is no absolute positioning and no mask at
           all, so there is structurally nothing that can bleed outside
           the card's own border-box. Worst case if the browser doesn't
           support @property is a static (non-rotating) gradient ring —
           never an overflow bug. */
        @property --fq-angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes fq-rotate-ring { to { --fq-angle: 360deg; } }

        .fq-featured-wrap {
          position: relative;
          border-radius: 8px;
          padding: 2px;
          background:
            linear-gradient(${c.bgCard}, ${c.bgCard}) padding-box,
            linear-gradient(${c.border}, ${c.border}) border-box;
        }
        .fq-featured-wrap:hover,
        .fq-featured-wrap:focus-within {
          background:
            linear-gradient(${c.bgCard}, ${c.bgCard}) padding-box,
            conic-gradient(from var(--fq-angle),
              #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #30b0c7, #007aff, #5856d6, #ff2d55, #ff3b30) border-box;
          animation: fq-rotate-ring 3s linear infinite;
        }

        .fq-featured-badge {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          font-size: 8.5px; font-family: ${FONT_MONO}; letter-spacing: 1.5px;
          padding: 3px 7px; border-radius: 2px;
          background: ${c.text}; color: ${c.bg}; font-weight: 700;
          pointer-events: none;
        }

        .fq-tile {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border: 1px solid ${c.border}; border-radius: 2px;
          background: ${c.bgCard}; cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .fq-tile:hover { background: ${c.hover}; border-color: ${c.borderHi}; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: c.navBg, borderBottom: `1px solid ${c.border}`, backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: c.text, cursor: "default" }}>
          <div style={{ width: 22, height: 22, clipPath: "polygon(50% 0%,100% 100%,0% 100%)", background: c.text }}/>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: FONT_SERIF }}>FundIQ</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: c.text, letterSpacing: "1px", fontWeight: 700 }}>{timeStr}</div>
          <div style={{ fontSize: 9, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "2px" }}>{dateStr}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ width: 34, height: 34, borderRadius: 2, background: c.togBg, border: `1px solid ${c.togBd}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.text, cursor: "pointer" }}>
            {isDark ? <SunIcon/> : <MoonIcon/>}
          </button>

          <div style={{ position: "relative" }}>
            <button onClick={() => setDropOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 12px 0 8px", borderRadius: 2, background: c.togBg, border: `1px solid ${dropOpen ? c.borderHi : c.togBd}`, color: c.text, cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ width: 24, height: 24, borderRadius: 2, background: c.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: c.bg, fontFamily: FONT_MONO }}>{initials}</div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.3px" }}>{user.firstName}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: c.text3, transform: dropOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {dropOpen && (
              <>
                <div onClick={() => setDropOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 299 }}/>
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 300, width: 210, background: c.bgCard, border: `1px solid ${c.borderHi}`, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 2, background: c.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: c.bg, fontFamily: FONT_MONO }}>{initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: 10, color: c.text3, fontFamily: FONT_MONO, letterSpacing: "1px", marginTop: 2 }}>STARTUP</div>
                    </div>
                  </div>
                  {[
                    { label: "Profile",      route: "/startup-profile"     },
                    { label: "Dashboard",    route: "/startup-dashboard"   },
                    { label: "Transactions", route: "/startup-transactions" },
                  ].map(({ label, route }) => (
                    <button key={label} onClick={() => { setDropOpen(false); navigate(route); }}
                      style={{ display: "flex", alignItems: "center", width: "100%", padding: "11px 16px", background: "none", border: "none", color: c.text2, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", textAlign: "left", letterSpacing: "0.2px" }}
                      onMouseEnter={e => { e.currentTarget.style.background = c.hover; e.currentTarget.style.color = c.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = c.text2; }}>
                      {label}
                    </button>
                  ))}
                  <div style={{ borderTop: `1px solid ${c.border}`, margin: "4px 0" }}/>
                  <button onClick={() => { setDropOpen(false); handleLogout(); }}
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "11px 16px", background: "none", border: "none", color: isDark ? "#ff6b6b" : "#cc0000", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(200,0,0,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div className="fq-hero" style={{ borderBottom: `1px solid ${c.border}`, animation: "fadeUp .6s ease both" }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "3px", color: c.text3, marginBottom: 16, textTransform: "uppercase" }}>
            ◆ Startup Portal · Intelligence Hub
          </div>
          <h1 style={{ fontSize: "clamp(32px,5vw,68px)", fontWeight: 800, letterSpacing: "-3px", lineHeight: 1, color: c.text, fontFamily: FONT_SERIF, marginBottom: 12 }}>
            Find your<br/>
            <span style={{ fontStyle: "italic", fontWeight: 400 }}>investor</span> now.
          </h1>
          <p style={{ fontSize: 14, color: c.text2, maxWidth: 380, lineHeight: 1.75, marginTop: 16 }}>
            Welcome back, <strong style={{ color: c.text, fontWeight: 700 }}>{user.firstName}</strong>. Your startup intelligence hub is live — every tool you need to raise smarter and close faster.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, flexShrink: 0 }}>
          <button onClick={() => navigate("/startup-profile")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px", borderRadius: 2, background: c.text, color: c.bg, border: "none", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.5px", transition: "opacity .15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".82"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            + CREATE STARTUP PROFILE
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1.5px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.text2, animation: "pulse2 2s infinite" }}/>
            STARTUP DASHBOARD ACTIVE
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="fq-stats" style={{ borderBottom: `1px solid ${c.border}`, animation: "fadeUp .7s .1s ease both" }}>
        {STATS.map(({ label, value, sub }, i) => (
          <div key={label} style={{ padding: "28px 32px", borderRight: i < STATS.length - 1 ? `1px solid ${c.border}` : "none", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "2px", color: c.text3, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-2px", color: c.text, fontFamily: FONT_SERIF, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "0.5px" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="fq-main" style={{ maxWidth: 1200, margin: "0 auto", animation: "fadeUp .8s .18s ease both" }}>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "40px 0 28px", borderBottom: `1px solid ${c.border}`, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "3px", color: c.text3, marginBottom: 8 }}>◆ INTELLIGENCE TOOLS</div>
            <h2 style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 800, letterSpacing: "-1px", color: c.text, fontFamily: FONT_SERIF }}>
              Six tools to find your investor now.
            </h2>
          </div>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1.5px", textAlign: "right" }}>
            RAISE SMARTER<br/>PITCH BETTER<br/>CLOSE FASTER
          </div>
        </div>

        {/* ── FEATURED (big) ── */}
        <div style={{ marginTop: 24 }}>
          <div className="fq-featured-grid">
            {FEATURED.map((f) => (
              <div className="fq-featured-wrap" tabIndex={0} key={f.id}>
                <span className="fq-featured-badge">FEATURED</span>
                <FeatureCard feature={f} c={c} isDark={isDark} onClick={() => navigate(f.route)} />
              </div>
            ))}
          </div>
        </div>

        {/* ── SECONDARY (small) ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "2px", color: c.text3, marginBottom: 12, textTransform: "uppercase" }}>
            More tools
          </div>
          <div className="fq-secondary-grid">
            {SECONDARY.map((f) => (
              <div key={f.id} className="fq-tile" onClick={() => navigate(f.route)}>
                <div style={{ flexShrink: 0, color: c.text2 }}>{f.icon(c.text2)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{f.title}</div>
                  <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.stat}</div>
                </div>
                <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: c.text3, flexShrink: 0 }}>→</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ACTIVITY TABLE ── */}
        <div style={{ marginTop: 56 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 16, borderBottom: `2px solid ${c.text}` }}>
            <div>
              <div style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "3px", color: c.text3, marginBottom: 6 }}>◆ RECENT ACTIVITY</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.6px", color: c.text, fontFamily: FONT_SERIF }}>Latest matches</div>
            </div>
            <button onClick={() => navigate("/startup-matching")}
              style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: c.text2, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = c.text}
              onMouseLeave={e => e.currentTarget.style.color = c.text2}>
              VIEW ALL →
            </button>
          </div>

          {ACTIVITY.map((row, i) => (
            <div key={i} onClick={() => navigate("/startup-matching")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${c.border}`, cursor: "pointer", transition: "background .15s", margin: "0 -40px", padding: "18px 40px" }}
              onMouseEnter={e => e.currentTarget.style.background = c.hover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 2, background: c.bgSurf, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: c.text2, fontFamily: FONT_MONO }}>
                  {row.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text, letterSpacing: "-0.2px" }}>{row.name}</div>
                  <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "0.5px", marginTop: 2 }}>{row.stage}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.text, fontFamily: FONT_SERIF, letterSpacing: "-1px", lineHeight: 1 }}>{row.score}</div>
                  <div style={{ fontSize: 9, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1px" }}>MATCH %</div>
                </div>
                <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3 }}>→</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: "0 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderBottom: `1px solid ${c.border}`, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 18, height: 18, clipPath: "polygon(50% 0%,100% 100%,0% 100%)", background: c.text2 }}/>
            <span style={{ fontSize: 14, fontWeight: 800, color: c.text, fontFamily: FONT_SERIF, letterSpacing: "-0.3px" }}>FundIQ</span>
          </div>
          <div style={{ fontSize: 11, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "2px", textAlign: "center" }}>
            FIND YOUR INVESTOR NOW
          </div>
        </div>
        <div style={{ padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1px" }}>© 2025 FUNDIQ · RAISE SMARTER. INVEST SHARPER.</div>
          <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1px" }}>STARTUP PORTAL</div>
        </div>
      </footer>
    </div>
  );
}