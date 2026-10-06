import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const ACCENT = "#6366f1";
const DARK  = { bg:"#000", bgCard:"#0a0a0a", bgCard2:"#111", border:"rgba(255,255,255,0.08)", text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)", navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)", togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)", input:"#111", inputBd:"rgba(255,255,255,0.12)" };
const LIGHT = { bg:"#fff", bgCard:"#fafafa", bgCard2:"#f4f4f5", border:"rgba(0,0,0,0.07)", text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)", navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)", togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)", input:"#fff", inputBd:"rgba(0,0,0,0.12)" };

const STAGES  = ["Pre-Seed","Seed","Series A","Series B","Series C","Growth","Late Stage"];
const SECTORS = ["Fintech","SaaS","HealthTech","EdTech","InsurTech","DeepTech","CleanTech","AgriTech","ConstructionTech","Logistics","E-commerce","Alternative Proteins","Travel & Hospitality Tech","Cybersecurity","AI/ML"];
const RISK    = ["Low","Medium","High"];
const GEO     = ["Global","North America","Europe","Asia Pacific","Southeast Asia","South Asia","Middle East","Africa","Latin America"];

export default function InvestorProfile() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const c = theme === "dark" ? DARK : LIGHT;

  const [profile, setProfile]   = useState(null);
  const [form,    setForm]      = useState({});
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [loading, setLoading]   = useState(true);
  const [msg,     setMsg]       = useState("");

  const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/investor-login"); return; }
    fetch("/api/investor/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setProfile(data); setForm(data); }
        else { setEditing(true); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleChip = (field, val) => {
    const arr = form[field] || [];
    setForm(f => ({
      ...f,
      [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
    }));
  };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/investor/profile", {
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

  // ── shared styles ──
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
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:ACCENT, letterSpacing:"0.5px" }}>INVESTOR PROFILE</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTheme(t => t==="dark"?"light":"dark")} style={{ width:36, height:36, borderRadius:8, background:c.togBg, border:`1px solid ${c.togBd}`, display:"flex", alignItems:"center", justifyContent:"center", color:c.text, cursor:"pointer" }}>{theme==="dark"?<SunIcon/>:<MoonIcon/>}</button>
          <button onClick={() => navigate("/investor-dashboard")} style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13, fontWeight:500, color:c.text2, background:"transparent", border:`1px solid ${c.border}`, cursor:"pointer" }}>← Dashboard</button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ position:"relative", zIndex:2, maxWidth:780, margin:"0 auto", padding:"96px 24px 80px" }}>

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:40, flexWrap:"wrap", gap:16 }}>
          <div>
            <h1 style={{ fontSize:"clamp(24px,3.5vw,40px)", fontWeight:800, letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:6 }}>
              {profile?.investor_name || "Your Profile"}
            </h1>
            {profile?.investor_id && (
              <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3 }}>{profile.investor_id}</span>
            )}
          </div>
          {!editing && (
            <button onClick={() => { setForm(profile); setEditing(true); }} style={{ height:38, padding:"0 20px", borderRadius:8, fontSize:13, fontWeight:500, background:ACCENT, color:"#fff", border:"none", cursor:"pointer" }}>
              Edit Profile
            </button>
          )}
        </div>

        {/* ── VIEW MODE ── */}
        {!editing && profile && (
          <div style={{ display:"grid", gap:16 }}>
            {/* stat row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
              {[
                { label:"Avg Check", value: profile.avg_check_usd ? `$${(profile.avg_check_usd/1e6).toFixed(1)}M` : "—" },
                { label:"Check Range", value: profile.check_min && profile.check_max ? `$${(profile.check_min/1e6).toFixed(1)}M – $${(profile.check_max/1e6).toFixed(1)}M` : "—" },
                { label:"Deals / Year", value: profile.deals_per_year ?? "—" },
                { label:"Risk Appetite", value: profile.risk_appetite || "—" },
                { label:"Pre-Revenue OK", value: profile.pre_revenue_ok ? "Yes" : "No" },
                { label:"Geo Focus", value: profile.geo_focus || "—" },
                { label:"Email", value: profile.email || "—" },
              ].map(s => (
                <div key={s.label} style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text3, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.5px" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* sectors & stages */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={labelSt}>Preferred Sectors</div>
                <div>{(profile.preferred_sectors||[]).map(s => <span key={s} style={{ ...chipSt(true), cursor:"default" }}>{s}</span>)}</div>
              </div>
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={labelSt}>Preferred Stages</div>
                <div>{(profile.preferred_stages||[]).map(s => <span key={s} style={{ ...chipSt(true), cursor:"default" }}>{s}</span>)}</div>
              </div>
            </div>

            {/* thesis */}
            {profile.thesis_text && (
              <div style={{ background:c.bgCard, border:`1px solid ${c.border}`, borderRadius:12, padding:"20px 22px" }}>
                <div style={labelSt}>Investment Thesis</div>
                <p style={{ fontSize:14, color:c.text2, lineHeight:1.8, margin:0 }}>{profile.thesis_text}</p>
              </div>
            )}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {editing && (
          <div style={{ display:"grid", gap:20 }}>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Name</label>
                <input style={inputSt} value={form.investor_name||""} onChange={e => setForm(f=>({...f,investor_name:e.target.value}))} placeholder="Firm or individual name"/>
              </div>
              <div>
                <label style={labelSt}>Geo Focus</label>
                <select style={inputSt} value={form.geo_focus||""} onChange={e => setForm(f=>({...f,geo_focus:e.target.value}))}>
                  <option value="">Select region</option>
                  {GEO.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Email</label>
                <input style={inputSt} type="email" value={form.email||""} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com"/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Min Check (USD)</label>
                <input style={inputSt} type="number" value={form.check_min||""} onChange={e => setForm(f=>({...f,check_min:Number(e.target.value)}))} placeholder="e.g. 500000"/>
              </div>
              <div>
                <label style={labelSt}>Max Check (USD)</label>
                <input style={inputSt} type="number" value={form.check_max||""} onChange={e => setForm(f=>({...f,check_max:Number(e.target.value)}))} placeholder="e.g. 5000000"/>
              </div>
              <div>
                <label style={labelSt}>Avg Check (USD)</label>
                <input style={inputSt} type="number" value={form.avg_check_usd||""} onChange={e => setForm(f=>({...f,avg_check_usd:Number(e.target.value)}))} placeholder="e.g. 2000000"/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <div>
                <label style={labelSt}>Deals / Year</label>
                <input style={inputSt} type="number" value={form.deals_per_year||""} onChange={e => setForm(f=>({...f,deals_per_year:Number(e.target.value)}))} placeholder="e.g. 4"/>
              </div>
              <div>
                <label style={labelSt}>Risk Appetite</label>
                <select style={inputSt} value={form.risk_appetite||""} onChange={e => setForm(f=>({...f,risk_appetite:e.target.value}))}>
                  <option value="">Select</option>
                  {RISK.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                <label style={{ ...labelSt, marginBottom:12 }}>Pre-Revenue OK?</label>
                <button onClick={() => setForm(f=>({...f,pre_revenue_ok:!f.pre_revenue_ok}))} style={{ height:42, borderRadius:8, border:`1px solid ${form.pre_revenue_ok ? ACCENT : c.border}`, background: form.pre_revenue_ok ? `${ACCENT}20` : "transparent", color: form.pre_revenue_ok ? ACCENT : c.text2, fontSize:13, cursor:"pointer" }}>
                  {form.pre_revenue_ok ? "✓ Yes" : "No"}
                </button>
              </div>
            </div>

            <div>
              <label style={labelSt}>Preferred Sectors</label>
              <div>{SECTORS.map(s => <span key={s} style={chipSt((form.preferred_sectors||[]).includes(s))} onClick={() => toggleChip("preferred_sectors", s)}>{s}</span>)}</div>
            </div>

            <div>
              <label style={labelSt}>Preferred Stages</label>
              <div>{STAGES.map(s => <span key={s} style={chipSt((form.preferred_stages||[]).includes(s))} onClick={() => toggleChip("preferred_stages", s)}>{s}</span>)}</div>
            </div>

            <div>
              <label style={labelSt}>Investment Thesis</label>
              <textarea style={{ ...inputSt, height:110, resize:"vertical" }} value={form.thesis_text||""} onChange={e => setForm(f=>({...f,thesis_text:e.target.value}))} placeholder="Describe your investment focus, what problems you back, what you look for in founders…"/>
            </div>

            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button onClick={handleSave} disabled={saving} style={{ height:42, padding:"0 28px", borderRadius:8, background:ACCENT, color:"#fff", border:"none", fontSize:14, fontWeight:600, cursor:"pointer" }}>
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