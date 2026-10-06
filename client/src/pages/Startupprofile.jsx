import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const ACCENT = "#f59e0b";
const DARK  = { bg:"#000", bgCard:"#0a0a0a", border:"rgba(255,255,255,0.08)", text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)", navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)", togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)", input:"#111", inputBd:"rgba(255,255,255,0.12)" };
const LIGHT = { bg:"#fff", bgCard:"#fafafa", border:"rgba(0,0,0,0.07)", text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)", navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)", togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)", input:"#fff", inputBd:"rgba(0,0,0,0.12)" };

const STAGES  = ["Pre-Seed","Seed","Series A","Series B","Series C","Growth","Late Stage"];
const SECTORS = ["Fintech","SaaS","HealthTech","EdTech","InsurTech","DeepTech","CleanTech","AgriTech","ConstructionTech","Logistics","E-commerce","Alternative Proteins","Travel & Hospitality Tech","Cybersecurity","AI/ML"];
const MARKETS = ["Global","North America","Europe","Asia Pacific","Southeast Asia","South Asia","Middle East","Africa","Latin America"];

export default function StartupProfile() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const c = theme === "dark" ? DARK : LIGHT;

  const [profile, setProfile] = useState(null);
  const [form,    setForm]    = useState({});
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState("");

  const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/startup-login"); return; }
    fetch("/api/startup/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setProfile(data); setForm(data); }
        else setEditing(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/startup/profile", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setProfile(data); setEditing(false); setMsg("Saved!"); }
      else setMsg(data.message || "Error saving");
    } catch { setMsg("Network error"); }
    setSaving(false);
  };

  const fmt = (n, prefix="$", suffix="") => {
    if (!n && n !== 0) return "—";
    if (n >= 1e9) return `${prefix}${(n/1e9).toFixed(1)}B${suffix}`;
    if (n >= 1e6) return `${prefix}${(n/1e6).toFixed(1)}M${suffix}`;
    if (n >= 1e3) return `${prefix}${(n/1e3).toFixed(0)}K${suffix}`;
    return `${prefix}${n}${suffix}`;
  };

  const labelSt = { fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6, display:"block" };
  const inputSt = { width:"100%", background:c.input, border:`1px solid ${c.inputBd}`, borderRadius:8, padding:"10px 14px", color:c.text, fontSize:14, fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box" };
  const chipSt  = (active) => ({ display:"inline-flex", alignItems:"center", padding:"4px 12px", borderRadius:100, fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", cursor:"pointer", border:`1px solid ${active ? ACCENT : c.border}`, background: active ? `${ACCENT}20` : "transparent", color: active ? ACCENT : c.text2, marginRight:6, marginBottom:6 });

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
          <button onClick={() => navigate("/startup-dashboard")} style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13, fontWeight:500, color:c.text2, background:"transparent", border:`1px solid ${c.border}`, cursor:"pointer" }}>← Dashboard</button>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:2, maxWidth:780, margin:"0 auto", padding:"96px 24px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:40, flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ fontSize:"clamp(24px,3.5vw,40px)", fontWeight:800, letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:6 }}>
              {profile?.startup_name || "Your Profile"}
            </h1>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {profile?.startup_id && <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3 }}>{profile.startup_id}</span>}
              {profile?.sector && <span style={{ ...chipSt(true), cursor:"default", fontSize:11 }}>{profile.sector}</span>}
              {profile?.stage  && <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text2, padding:"3px 10px", border:`1px solid ${c.border}`, borderRadius:100 }}>{profile.stage}</span>}
            </div>
          </div>
          {!editing && (
            <button onClick={() => { setForm(profile); setEditing(true); }} style={{ height:38, padding:"0 20px", borderRadius:8, fontSize:13, fontWeight:500, background:ACCENT, color:"#000", border:"none", cursor:"pointer" }}>
              Edit Profile
            </button>
          )}
        </div>

        {/* VIEW MODE */}
        {!editing && profile && (
          <div style={{ display:"grid", gap:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
              {[
                { label:"Total Raised",  value: fmt(profile.total_raised) },
                { label:"Current Raise", value: fmt(profile.current_raise) },
                { label:"Revenue",       value: fmt(profile.revenue) },
                { label:"Growth Rate",   value: profile.growth_rate != null ? `${(profile.growth_rate*100).toFixed(1)}%` : "—" },
                { label:"Team Size",     value: profile.team_size ?? "—" },
                { label:"HQ Country",    value: profile.hq_country || "—" },
                { label:"Email", value: profile.email || "—" },
              ].map(s => (
                <div key={s.label} style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* score bars */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                { label:"Traction Score", value:profile.traction_score, max:2, color:"#22c55e" },
                { label:"Risk Score",     value:profile.risk_score,     max:1, color:"#ef4444" },
              ].map(bar => (
                <div key={bar.label} style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={labelSt}>{bar.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:bar.color }}>{bar.value?.toFixed(2) ?? "—"}</span>
                  </div>
                  <div style={{ height:6, background:c.border, borderRadius:99 }}>
                    <div style={{ height:"100%", width:`${Math.min(((bar.value||0)/bar.max)*100,100)}%`, background:bar.color, borderRadius:99 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {editing && (
          <div style={{ display:"grid", gap:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Startup Name</label>
                <input style={inputSt} value={form.startup_name||""} onChange={e => setForm(f=>({...f,startup_name:e.target.value}))} placeholder="e.g. AlphaSystems"/>
              </div>
              <div>
                <label style={labelSt}>HQ Country</label>
                <input style={inputSt} value={form.hq_country||""} onChange={e => setForm(f=>({...f,hq_country:e.target.value}))} placeholder="e.g. Singapore"/>
              </div>
              <div>
                <label style={labelSt}>Email</label>
                <input style={inputSt} type="email" value={form.email||""} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com"/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Sector</label>
                <select style={inputSt} value={form.sector||""} onChange={e => setForm(f=>({...f,sector:e.target.value}))}>
                  <option value="">Select</option>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Stage</label>
                <select style={inputSt} value={form.stage||""} onChange={e => setForm(f=>({...f,stage:e.target.value}))}>
                  <option value="">Select</option>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Market</label>
                <select style={inputSt} value={form.market||""} onChange={e => setForm(f=>({...f,market:e.target.value}))}>
                  <option value="">Select</option>
                  {MARKETS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Total Raised (USD)</label>
                <input style={inputSt} type="number" value={form.total_raised||""} onChange={e => setForm(f=>({...f,total_raised:Number(e.target.value)}))} placeholder="e.g. 1350000000"/>
              </div>
              <div>
                <label style={labelSt}>Current Raise (USD)</label>
                <input style={inputSt} type="number" value={form.current_raise||""} onChange={e => setForm(f=>({...f,current_raise:Number(e.target.value)}))} placeholder="e.g. 5000000"/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Revenue (USD)</label>
                <input style={inputSt} type="number" value={form.revenue||""} onChange={e => setForm(f=>({...f,revenue:Number(e.target.value)}))} placeholder="e.g. 300000000"/>
              </div>
              <div>
                <label style={labelSt}>Growth Rate (decimal)</label>
                <input style={inputSt} type="number" step="0.01" value={form.growth_rate||""} onChange={e => setForm(f=>({...f,growth_rate:Number(e.target.value)}))} placeholder="e.g. 0.06 for 6%"/>
              </div>
              <div>
                <label style={labelSt}>Team Size</label>
                <input style={inputSt} type="number" value={form.team_size||""} onChange={e => setForm(f=>({...f,team_size:Number(e.target.value)}))} placeholder="e.g. 50"/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Traction Score (0–2)</label>
                <input style={inputSt} type="number" step="0.01" min="0" max="2" value={form.traction_score||""} onChange={e => setForm(f=>({...f,traction_score:Number(e.target.value)}))} placeholder="e.g. 1.41"/>
              </div>
              <div>
                <label style={labelSt}>Risk Score (0–1)</label>
                <input style={inputSt} type="number" step="0.01" min="0" max="1" value={form.risk_score||""} onChange={e => setForm(f=>({...f,risk_score:Number(e.target.value)}))} placeholder="e.g. 0.25"/>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={handleSave} disabled={saving} style={{ height:42, padding:"0 28px", borderRadius:8, background:ACCENT, color:"#000", border:"none", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                {saving ? "Saving…" : "Save Profile"}
              </button>
              {profile && <button onClick={() => { setForm(profile); setEditing(false); }} style={{ height:42, padding:"0 20px", borderRadius:8, background:"transparent", color:c.text2, border:`1px solid ${c.border}`, fontSize:14, cursor:"pointer" }}>Cancel</button>}
              {msg && <span style={{ fontSize:13, color: msg==="Saved!" ? "#22c55e" : "#ef4444" }}>{msg}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}