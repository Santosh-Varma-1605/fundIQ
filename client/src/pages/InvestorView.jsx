import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const ACCENT = "#f59e0b"; // amber — startup's colour theme
const DARK  = { bg:"#000", bgCard:"#0a0a0a", border:"rgba(255,255,255,0.08)", text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)", navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)", togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)", badge:"rgba(255,255,255,0.05)" };
const LIGHT = { bg:"#fff", bgCard:"#fafafa", border:"rgba(0,0,0,0.07)", text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)", navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)", togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)", badge:"rgba(0,0,0,0.04)" };

function ScoreBar({ value, color = ACCENT }) {
  const pct = Math.min(Math.round(value * 100), 100);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, borderRadius:99, overflow:"hidden", background:"rgba(128,128,128,0.15)" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width 0.6s ease" }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:700, color, minWidth:36 }}>{pct}%</span>
    </div>
  );
}

export default function InvestorView() {
  const { investor_id } = useParams();
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

  const fmtCheck = (min, max) => {
    const fmt = n => n >= 1e6 ? `$${(n/1e6).toFixed(0)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${n}`;
    if (!min && !max) return "—";
    if (!max) return `${fmt(min)}+`;
    return `${fmt(min)} – ${fmt(max)}`;
  };

  useEffect(() => {
    fetch(`/api/investor/profile/${investor_id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => { setError("Could not load this investor's profile."); setLoading(false); });
  }, [investor_id]);

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
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:ACCENT, letterSpacing:"0.5px" }}>INVESTOR PROFILE</span>
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
                {profile.investor_name}
              </h1>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {profile.investor_id && (
                  <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3 }}>{profile.investor_id}</span>
                )}
                {profile.geo_focus && (
                  <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${ACCENT}40`, background:`${ACCENT}10`, color:ACCENT }}>{profile.geo_focus}</span>
                )}
                {profile.risk_appetite && (
                  <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", padding:"3px 10px", borderRadius:100, border:`1px solid ${c.border}`, color:c.text2 }}>{profile.risk_appetite} risk</span>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:16 }}>
              {[
                { label:"Check Range",    value: fmtCheck(profile.check_min, profile.check_max) },
                { label:"Avg Check",      value: profile.avg_check_usd ? (profile.avg_check_usd >= 1e6 ? `$${(profile.avg_check_usd/1e6).toFixed(1)}M` : `$${profile.avg_check_usd}`) : "—" },
                { label:"Deals / Year",   value: profile.deals_per_year ?? "—" },
                { label:"Pre-Revenue OK", value: profile.pre_revenue_ok ? "Yes" : "No" },
              ].map(s => (
                <div key={s.label} style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={labelSt}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Sectors & Stages */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={labelSt}>Preferred Sectors</div>
                <div>
                  {(profile.preferred_sectors || []).map(s => (
                    <span key={s} style={chipSt}>{s}</span>
                  ))}
                  {(!profile.preferred_sectors || profile.preferred_sectors.length === 0) && <span style={{ color:c.text3, fontSize:13 }}>—</span>}
                </div>
              </div>
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={labelSt}>Preferred Stages</div>
                <div>
                  {(profile.preferred_stages || []).map(s => (
                    <span key={s} style={{ ...chipSt, border:`1px solid ${c.border}`, background:"transparent", color:c.text2 }}>{s}</span>
                  ))}
                  {(!profile.preferred_stages || profile.preferred_stages.length === 0) && <span style={{ color:c.text3, fontSize:13 }}>—</span>}
                </div>
              </div>
            </div>

            {/* Thesis */}
            {profile.thesis_text && (
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"20px 22px", marginBottom:16 }}>
                <div style={labelSt}>Investment Thesis</div>
                <p style={{ fontSize:14, color:c.text2, lineHeight:1.85, margin:0 }}>{profile.thesis_text}</p>
              </div>
            )}

            {/* Contact */}
            <div style={{ background:c.bgCard, border:`1px solid ${ACCENT}40`, borderRadius:12, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={labelSt}>Contact Investor</div>
                <p style={{ margin:0, fontSize:14, color:c.text2 }}>Reach out directly via email to express interest or ask questions.</p>
              </div>
              {profile.email ? (
                <a
                  href={`mailto:${profile.email}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, height:40, padding:"0 22px", borderRadius:8, background:ACCENT, color:"#000", fontSize:14, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}
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
