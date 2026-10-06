import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const ACCENT = "#6366f1";
const DARK  = { bg:"#000", bgCard:"#0a0a0a", border:"rgba(255,255,255,0.08)", text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)", navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)", togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)", badge:"rgba(255,255,255,0.05)" };
const LIGHT = { bg:"#fff", bgCard:"#fafafa", border:"rgba(0,0,0,0.07)", text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)", navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)", togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)", badge:"rgba(0,0,0,0.04)" };

function ScoreBar({ value, color = ACCENT }) {
  const pct = Math.min(Math.round(value * 100), 100);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, borderRadius:99, overflow:"hidden", background:"rgba(128,128,128,0.15)" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width 0.6s ease" }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color, minWidth:34 }}>{pct}%</span>
    </div>
  );
}

function StartupCard({ match, rank, onClick, c }) {
  const fmt = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
    return `$${n}`;
  };

  return (
    <div
      onClick={onClick}
      style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:16, padding:"22px 24px", cursor:"pointer", transition:"border-color 0.2s, transform 0.2s", position:"relative", overflow:"hidden" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${ACCENT}60`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* rank */}
      <div style={{ position:"absolute", top:20, right:22, width:28, height:28, borderRadius:8, background:c.badge, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3 }}>
        #{rank}
      </div>

      {/* name + badges */}
      <div style={{ marginBottom:14, paddingRight:36 }}>
        <div style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.4px", marginBottom:6 }}>{match.startup_name}</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {match.sector && <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${ACCENT}40`, background:`${ACCENT}10`, color:ACCENT }}>{match.sector}</span>}
          {match.stage  && <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${c.border}`, color:c.text2 }}>{match.stage}</span>}
          {match.market && <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${c.border}`, color:c.text2 }}>{match.market}</span>}
        </div>
      </div>

      {/* match score bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:5 }}>Match Score</div>
        <ScoreBar value={match.similarity_score} color={ACCENT}/>
      </div>

      {/* stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {[
          { label:"Raised",   value: fmt(match.total_raised) },
          { label:"Revenue",  value: fmt(match.revenue) },
          { label:"Team",     value: match.team_size ? `${match.team_size} ppl` : "—" },
        ].map(s => (
          <div key={s.label} style={{ background:c.badge, borderRadius:8, padding:"10px 12px" }}>
            <div style={{ fontSize:10, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:13, fontWeight:600 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {match.traction_score != null && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:10, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:5 }}>Traction Score</div>
          <ScoreBar value={Math.min(match.traction_score/2, 1)} color="#22c55e"/>
        </div>
      )}
    </div>
  );
}

export default function InvestorTopPicks() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const c = theme === "dark" ? DARK : LIGHT;

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/investor-login"); return; }
    fetch("/api/investor/top-picks", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => { setMatches(data); setLoading(false); })
      .catch(() => { setError("Could not load matches. Make sure your profile is set up."); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:c.bg, color:c.text, fontFamily:"'Inter',sans-serif", position:"relative" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:`linear-gradient(${c.grid} 1px,transparent 1px),linear-gradient(90deg,${c.grid} 1px,transparent 1px)`, backgroundSize:"80px 80px" }}/>

      {/* Nav */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:64, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", background:c.navBg, borderBottom:`1px solid ${c.border}`, backdropFilter:"blur(14px)" }}>
        <button onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:9, background:"none", border:"none", color:c.text, cursor:"pointer", padding:0 }}>
          <div style={{ width:20, height:20, clipPath:"polygon(50% 0%,100% 100%,0% 100%)", background:c.text }}/>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.3px" }}>FundIQ</span>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:100, border:`1px solid ${ACCENT}33`, background:`${ACCENT}11` }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:ACCENT }}/>
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:ACCENT, letterSpacing:"0.5px" }}>TOP PICKS · STARTUPS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTheme(t => t==="dark"?"light":"dark")} style={{ width:36, height:36, borderRadius:8, background:c.togBg, border:`1px solid ${c.togBd}`, display:"flex", alignItems:"center", justifyContent:"center", color:c.text, cursor:"pointer" }}>{theme==="dark"?<SunIcon/>:<MoonIcon/>}</button>
          <button onClick={() => navigate("/investor-dashboard")} style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13, fontWeight:500, color:c.text2, background:"transparent", border:`1px solid ${c.border}`, cursor:"pointer" }}>← Dashboard</button>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:2, maxWidth:900, margin:"0 auto", padding:"96px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", borderRadius:100, border:`1px solid ${ACCENT}40`, background:`${ACCENT}10`, marginBottom:20 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:ACCENT }}/>
            <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", color:ACCENT, letterSpacing:"1px", textTransform:"uppercase" }}>AI-Curated · Daily</span>
          </div>
          <h1 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-2px", lineHeight:1.06, marginBottom:12 }}>Your Top Startup Picks</h1>
          <p style={{ fontSize:15, color:c.text2, lineHeight:1.75, maxWidth:520 }}>
            Your 10 highest-confidence startup matches, ranked by AI similarity score against your investment thesis and preferences.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:"flex", justifyContent:"center", padding:"80px 0" }}>
            <div style={{ width:32, height:32, border:`2px solid ${c.border}`, borderTopColor:ACCENT, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"24px 28px", textAlign:"center" }}>
            <p style={{ color:c.text2, fontSize:14, marginBottom:16 }}>{error}</p>
            <button onClick={() => navigate("/investor-profile")} style={{ height:38, padding:"0 20px", borderRadius:8, background:ACCENT, color:"#fff", border:"none", fontSize:13, cursor:"pointer" }}>
              Set Up Profile →
            </button>
          </div>
        )}

        {/* Cards grid */}
        {!loading && !error && matches.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))", gap:16 }}>
            {matches.map((m, i) => (
              <StartupCard
                key={m.startup_id}
                match={m}
                rank={i + 1}
                c={c}
                onClick={() => navigate(`/startup-view/${m.startup_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}