import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const ACCENT = "#6366f1"; // indigo — investor's colour theme
const DARK  = { bg:"#000", bgCard:"#0a0a0a", border:"rgba(255,255,255,0.08)", text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)", navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)", togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)" };
const LIGHT = { bg:"#fff", bgCard:"#fafafa", border:"rgba(0,0,0,0.07)", text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)", navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)", togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)" };

function ScoreBar({ value, max = 1, color }) {
  const pct = Math.min(((value || 0) / max) * 100, 100);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, borderRadius:99, overflow:"hidden", background:"rgba(128,128,128,0.15)" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width 0.6s ease" }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color, minWidth:36 }}>{value?.toFixed(2) ?? "—"}</span>
    </div>
  );
}

export default function StartupView() {
  const { startup_id } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const c = theme === "dark" ? DARK : LIGHT;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  const labelSt = { fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6, display:"block" };
  const chipSt  = { display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:100, fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", border:`1px solid ${ACCENT}40`, background:`${ACCENT}10`, color:ACCENT, marginRight:6, marginBottom:6 };

  const fmt = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`;
    return `$${n}`;
  };

  useEffect(() => {
    fetch(`/api/startup/profile/${startup_id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => { setError("Could not load this startup's profile."); setLoading(false); });
  }, [startup_id]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:c.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:32, height:32, border:`2px solid ${c.border}`, borderTopColor:ACCENT, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

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
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:ACCENT, letterSpacing:"0.5px" }}>STARTUP PROFILE</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTheme(t => t==="dark"?"light":"dark")} style={{ width:36, height:36, borderRadius:8, background:c.togBg, border:`1px solid ${c.togBd}`, display:"flex", alignItems:"center", justifyContent:"center", color:c.text, cursor:"pointer" }}>{theme==="dark"?<SunIcon/>:<MoonIcon/>}</button>
          <button onClick={() => navigate(-1)} style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13, fontWeight:500, color:c.text2, background:"transparent", border:`1px solid ${c.border}`, cursor:"pointer" }}>← Back</button>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:2, maxWidth:780, margin:"0 auto", padding:"96px 24px 80px" }}>

        {error && (
          <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"32px", textAlign:"center", color:c.text2 }}>{error}</div>
        )}

        {profile && (
          <>
            {/* Header */}
            <div style={{ marginBottom:40 }}>
              <h1 style={{ fontSize:"clamp(24px,3.5vw,42px)", fontWeight:800, letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:8 }}>
                {profile.startup_name}
              </h1>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                {profile.startup_id && <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3 }}>{profile.startup_id}</span>}
                {profile.sector && <span style={chipSt}>{profile.sector}</span>}
                {profile.stage  && <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${c.border}`, color:c.text2 }}>{profile.stage}</span>}
                {profile.market && <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${c.border}`, color:c.text2 }}>{profile.market}</span>}
                {profile.hq_country && <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${c.border}`, color:c.text2 }}>📍 {profile.hq_country}</span>}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:16 }}>
              {[
                { label:"Total Raised",  value: fmt(profile.total_raised) },
                { label:"Current Raise", value: fmt(profile.current_raise) },
                { label:"Revenue",       value: fmt(profile.revenue) },
                { label:"Growth Rate",   value: profile.growth_rate != null ? `${(profile.growth_rate * 100).toFixed(1)}%` : "—" },
                { label:"Team Size",     value: profile.team_size ? `${profile.team_size} people` : "—" },
              ].map(s => (
                <div key={s.label} style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={labelSt}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Score bars */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={labelSt}>Traction Score</span>
                </div>
                <ScoreBar value={profile.traction_score} max={2} color="#22c55e"/>
              </div>
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={labelSt}>Risk Score</span>
                </div>
                <ScoreBar value={profile.risk_score} max={1} color="#ef4444"/>
              </div>
            </div>

            {/* Contact */}
            <div style={{ background:c.bgCard, border:`1px solid ${ACCENT}40`, borderRadius:12, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={labelSt}>Contact Startup</div>
                <p style={{ margin:0, fontSize:14, color:c.text2 }}>Reach out directly via email to connect with this startup.</p>
              </div>
              {profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, height:40, padding:"0 22px", borderRadius:8, background:ACCENT, color:"#fff", fontSize:14, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}
                >
                  ✉ {profile.email}
                </a>
              ) : (
                <span style={{ fontSize:13, color:c.text3 }}>Email not available</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
