import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../ThemeContext";

/* ─── ICONS ─── */
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconCheck = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ─── TOKENS ─── */
const DARK = {
  bg:"#000", bgCard:"#0a0a0a",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.20)",
  text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)",
  navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)",
  hover:"rgba(255,255,255,0.04)", btnFill:"#fff", btnFillFg:"#000",
  togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)",
  input:"rgba(255,255,255,0.04)", inputBd:"rgba(255,255,255,0.10)", inputFocus:"rgba(255,255,255,0.22)",
  errorBg:"rgba(239,68,68,0.08)", errorBd:"rgba(239,68,68,0.25)", errorText:"#f87171",
  weakBg:"rgba(239,68,68,0.08)", weakBd:"rgba(239,68,68,0.20)", weakText:"#f87171",
};
const LIGHT = {
  bg:"#fff", bgCard:"#fafafa",
  border:"rgba(0,0,0,0.07)", borderHi:"rgba(0,0,0,0.18)",
  text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)",
  navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)",
  hover:"rgba(0,0,0,0.03)", btnFill:"#0a0a0a", btnFillFg:"#fff",
  togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)",
  input:"rgba(0,0,0,0.02)", inputBd:"rgba(0,0,0,0.10)", inputFocus:"rgba(0,0,0,0.22)",
  errorBg:"rgba(239,68,68,0.06)", errorBd:"rgba(239,68,68,0.20)", errorText:"#dc2626",
  weakBg:"rgba(239,68,68,0.06)", weakBd:"rgba(239,68,68,0.18)", weakText:"#dc2626",
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { theme, setTheme } = useTheme();

  /* token & role come from the email link:
     /reset-password?token=xxxx&role=startup  */
  const token = params.get("token") || "";
  const role  = params.get("role")  || "startup";

  const isInvestor  = role === "investor";
  const accentColor = isInvestor ? "#6366f1" : "#22c55e";
  const roleLabel   = isInvestor ? "Investor" : "Startup";
  const loginPath   = isInvestor ? "/investor-login" : "/startup-login";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [focus,     setFocus]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  const c = theme === "dark" ? DARK : LIGHT;

  /* password strength helpers */
  const hasLength  = password.length >= 8;
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const isStrong   = hasLength && hasUpper && hasNumber;
  const strengthPct = [hasLength, hasUpper, hasNumber].filter(Boolean).length / 3;

  /* ── Reset handler ── */
  const handleReset = async () => {
    setError("");
    if (!token)              { setError("Invalid or missing reset token."); return; }
    if (!password)           { setError("Please enter a new password."); return; }
    if (!isStrong)           { setError("Password must be 8+ characters, include an uppercase letter and a number."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/api/auth/${role}/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => navigate(loginPath), 2500);
      } else {
        setError(data.message || "Invalid or expired link.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const SunIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
  const MoonIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );

  /* ── Style helpers ── */
  const inp = (f, extra = {}) => ({
    width:"100%", height:46, background:c.input,
    border:`1px solid ${focus===f ? c.inputFocus : c.inputBd}`,
    borderRadius:8, color:c.text, fontFamily:"'Inter',sans-serif",
    fontSize:14, padding:"0 42px 0 40px", outline:"none",
    transition:"border-color .2s", boxSizing:"border-box", ...extra,
  });
  const icoWrap = {
    position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
    color:c.text3, display:"flex", alignItems:"center", pointerEvents:"none",
  };
  const lbl = {
    fontSize:12, fontWeight:500, color:c.text3, marginBottom:6,
    display:"block", fontFamily:"'Inter',sans-serif", letterSpacing:"0.3px",
  };

  const GridBg = () => (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(${c.grid} 1px,transparent 1px),linear-gradient(90deg,${c.grid} 1px,transparent 1px)`,
        backgroundSize:"80px 80px" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:`linear-gradient(to bottom,${c.bg} 0%,transparent 10%,transparent 55%,${c.bg} 100%),
                   linear-gradient(to right,${c.bg} 0%,transparent 6%,transparent 94%,${c.bg} 100%)` }}/>
      <div style={{ position:"fixed", top:"40%", left:"-5%", right:"-5%", bottom:"-5%",
        zIndex:0, pointerEvents:"none",
        background:`linear-gradient(to right,#0a2a3a 0%,#0a4a52 8%,#006655 16%,#1a8a3a 28%,#5aa800 38%,#c8d800 45%,#d8e000 50%,#c0c800 55%,#d08000 62%,#c85000 72%,#aa2000 84%,#6a0a00 92%,#3a0000 100%)`,
        WebkitMaskImage:"linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.2) 20%,rgba(0,0,0,0.5) 50%,black 100%)",
        maskImage:"linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.2) 20%,rgba(0,0,0,0.5) 50%,black 100%)",
        opacity: theme==="dark" ? 0.45 : 0.12 }}/>
    </>
  );

  return (
    <div style={{ minHeight:"100vh", background:c.bg, color:c.text, fontFamily:"'Inter',sans-serif", position:"relative", overflowX:"hidden" }}>
      <GridBg />

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px",
        background:c.navBg, borderBottom:`1px solid ${c.border}`,
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}>

        {/* Logo → home */}
        <button onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:9, background:"none", border:"none", color:c.text, cursor:"pointer", padding:0 }}>
          <div style={{ width:20, height:20, clipPath:"polygon(50% 0%,100% 100%,0% 100%)", background:c.text }}/>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.3px" }}>FundIQ</span>
        </button>

        {/* Role badge */}
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px",
          borderRadius:100, border:`1px solid ${accentColor}33`, background:`${accentColor}11` }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor }}/>
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace",
            color:accentColor, letterSpacing:"0.5px" }}>
            {roleLabel.toUpperCase()} PORTAL
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTheme(t => t==="dark" ? "light" : "dark")}
            style={{ width:36, height:36, borderRadius:8, background:c.togBg, border:`1px solid ${c.togBd}`,
              display:"flex", alignItems:"center", justifyContent:"center", color:c.text, cursor:"pointer" }}>
            {theme==="dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => navigate(loginPath)}
            style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13.5, fontWeight:500,
              fontFamily:"'Inter',sans-serif", color:c.text, background:"transparent",
              border:`1px solid ${c.borderHi}`, cursor:"pointer" }}>
            {isInvestor ? "Investor Sign In" : "Startup Sign In"}
          </button>
        </div>
      </nav>

      {/* PAGE BODY */}
      <div style={{ position:"relative", zIndex:2, minHeight:"100vh", display:"flex",
        alignItems:"center", justifyContent:"center", paddingTop:64, paddingBottom:40 }}>
        <div style={{ display:"flex", alignItems:"center", width:"100%", maxWidth:960, padding:"0 24px" }}>

          {/* LEFT — branding */}
          <div style={{ flex:1, paddingRight:72 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8,
              padding:"5px 12px", borderRadius:100, marginBottom:24,
              border:`1px solid ${accentColor}40`, background:`${accentColor}10` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor }}/>
              <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace",
                color:accentColor, letterSpacing:"1px", textTransform:"uppercase" }}>
                {roleLabel} Portal
              </span>
            </div>

            <div style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:11,
              letterSpacing:"1.8px", textTransform:"uppercase", color:c.text3,
              marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ width:16, height:1, background:c.text3, display:"block" }}/>
              Account Recovery
            </div>

            <h1 style={{ fontSize:"clamp(32px,3.5vw,50px)", fontWeight:800,
              letterSpacing:"-2px", lineHeight:1.06, color:c.text, marginBottom:14 }}>
              Set a new<br/>password.
            </h1>
            <p style={{ fontSize:15, color:c.text2, lineHeight:1.75, maxWidth:320, marginBottom:36 }}>
              Choose a strong password to secure your {roleLabel.toLowerCase()} account.
            </p>

            {/* Requirements checklist */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                [hasLength,  "At least 8 characters"],
                [hasUpper,   "One uppercase letter"],
                [hasNumber,  "One number"],
              ].map(([met, label]) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:18, height:18, borderRadius:"50%", flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background: met ? `${accentColor}20` : c.hover,
                    border:`1px solid ${met ? accentColor : c.border}`,
                    transition:"all .2s",
                  }}>
                    {met && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize:13, color: met ? c.text2 : c.text3, transition:"color .2s" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — card */}
          <div style={{ width:420, flexShrink:0, background:c.bgCard,
            border:`1px solid ${c.border}`, borderRadius:16, padding:"36px 36px 32px" }}>

            {/* Back to login */}
            <button onClick={() => navigate(loginPath)}
              style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
                color:c.text3, fontFamily:"'Inter',sans-serif", fontSize:13,
                cursor:"pointer", marginBottom:28, padding:0, transition:"color .15s" }}
              onMouseEnter={e => e.currentTarget.style.color = c.text}
              onMouseLeave={e => e.currentTarget.style.color = c.text3}>
              <IconArrowLeft />
              Back to {isInvestor ? "Investor" : "Startup"} Sign In
            </button>

            {done ? (
              /* ── SUCCESS STATE ── */
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"12px 0" }}>
                <div style={{ color:accentColor, marginBottom:20 }}><IconCheck /></div>
                <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.6px", color:c.text, marginBottom:10 }}>
                  Password updated
                </h2>
                <p style={{ fontSize:14, color:c.text2, lineHeight:1.75, maxWidth:300, marginBottom:24 }}>
                  Your password has been changed and all existing sessions have been signed out.
                </p>
                <div style={{ width:"100%", padding:"12px 16px", marginBottom:28,
                  background: isInvestor ? "rgba(99,102,241,0.06)" : "rgba(34,197,94,0.06)",
                  border:`1px solid ${isInvestor ? "rgba(99,102,241,0.18)" : "rgba(34,197,94,0.18)"}`,
                  borderRadius:8 }}>
                  <p style={{ fontSize:12.5, color:accentColor, lineHeight:1.65, margin:0 }}>
                    Redirecting you to sign in…
                  </p>
                </div>
                <button onClick={() => navigate(loginPath)}
                  style={{ width:"100%", height:48, borderRadius:100,
                    background:accentColor, color:"#fff", border:"none",
                    fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:600, cursor:"pointer" }}>
                  Sign In Now
                </button>
              </div>
            ) : (
              /* ── FORM STATE ── */
              <>
                {/* Invalid token warning */}
                {!token && (
                  <div style={{ marginBottom:20, padding:"11px 14px",
                    background:c.errorBg, border:`1px solid ${c.errorBd}`, borderRadius:8 }}>
                    <p style={{ fontSize:13, color:c.errorText, margin:0 }}>
                      This link is invalid or has already been used.
                    </p>
                  </div>
                )}

                <div style={{ marginBottom:24 }}>
                  <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.8px", color:c.text, marginBottom:6 }}>
                    New password
                  </h2>
                  <p style={{ fontSize:13.5, color:c.text2, lineHeight:1.7 }}>
                    Enter and confirm your new password below.
                  </p>
                </div>

                {/* Error banner */}
                {error && (
                  <div style={{ marginBottom:16, padding:"11px 14px",
                    background:c.errorBg, border:`1px solid ${c.errorBd}`, borderRadius:8 }}>
                    <p style={{ fontSize:13, color:c.errorText, margin:0, lineHeight:1.5 }}>{error}</p>
                  </div>
                )}

                {/* New password */}
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>New password</label>
                  <div style={{ position:"relative" }}>
                    <span style={icoWrap}><IconLock /></span>
                    <input type={showPass ? "text" : "password"} placeholder="Min. 8 characters"
                      value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                      style={inp("pw")}
                      onFocus={() => setFocus("pw")} onBlur={() => setFocus(null)}/>
                    <button onClick={() => setShowPass(p => !p)}
                      style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)",
                        background:"none", border:"none", color:c.text3, cursor:"pointer", display:"flex", padding:0 }}>
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ height:3, borderRadius:2, background:c.border, overflow:"hidden" }}>
                        <div style={{
                          height:"100%", borderRadius:2,
                          width:`${strengthPct * 100}%`,
                          background: strengthPct < 0.5 ? "#ef4444" : strengthPct < 1 ? "#f59e0b" : accentColor,
                          transition:"width .3s, background .3s",
                        }}/>
                      </div>
                      <p style={{ fontSize:11.5, marginTop:5, color:
                        strengthPct < 0.5 ? (theme==="dark" ? "#f87171" : "#dc2626") :
                        strengthPct < 1   ? "#f59e0b" : accentColor }}>
                        {strengthPct < 0.5 ? "Weak" : strengthPct < 1 ? "Almost there" : "Strong password"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom:28 }}>
                  <label style={lbl}>Confirm password</label>
                  <div style={{ position:"relative" }}>
                    <span style={icoWrap}><IconLock /></span>
                    <input type={showConf ? "text" : "password"} placeholder="Re-enter password"
                      value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }}
                      onKeyDown={e => e.key==="Enter" && handleReset()}
                      style={inp("cf")}
                      onFocus={() => setFocus("cf")} onBlur={() => setFocus(null)}/>
                    <button onClick={() => setShowConf(p => !p)}
                      style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)",
                        background:"none", border:"none", color:c.text3, cursor:"pointer", display:"flex", padding:0 }}>
                      {showConf ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirm && (
                    <p style={{ fontSize:11.5, marginTop:6,
                      color: password === confirm ? accentColor : (theme==="dark" ? "#f87171" : "#dc2626") }}>
                      {password === confirm ? "Passwords match ✓" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button onClick={handleReset} disabled={loading || !token}
                  style={{ width:"100%", height:48, borderRadius:100,
                    background: (loading || !token) ? `${accentColor}55` : accentColor,
                    color:"#fff", border:"none", fontFamily:"'Inter',sans-serif",
                    fontSize:15, fontWeight:600,
                    cursor: (loading || !token) ? "not-allowed" : "pointer",
                    transition:"opacity .2s",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                  onMouseEnter={e => { if (!loading && token) e.currentTarget.style.opacity = ".88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                  {loading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round"
                        style={{ animation:"spin .8s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Updating…
                    </>
                  ) : (
                    <>
                      <IconShield />
                      Set New Password
                    </>
                  )}
                </button>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

                <p style={{ marginTop:18, fontSize:12.5, color:c.text3, textAlign:"center" }}>
                  Remember it?{" "}
                  <button onClick={() => navigate(loginPath)}
                    style={{ background:"none", border:"none", color:accentColor, fontWeight:600,
                      cursor:"pointer", fontSize:12.5, textDecoration:"underline",
                      textUnderlineOffset:3, padding:0 }}>
                    {isInvestor ? "Investor Sign In" : "Startup Sign In"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ position:"relative", zIndex:2, borderTop:`1px solid ${c.border}` }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 32px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:c.text, letterSpacing:"-0.3px" }}>FundIQ</div>
            <div style={{ fontSize:12, color:c.text3, marginTop:4 }}>Raise Smarter. Invest Sharper.</div>
          </div>
          <div style={{ display:"flex", gap:24 }}>
            {["Platform","Pricing","Blog","Privacy"].map(l => (
              <a key={l} href="#" style={{ fontSize:13, color:c.text3, textDecoration:"none" }}>{l}</a>
            ))}
          </div>
          <div style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:12, color:c.text3 }}>© 2025 FundIQ</div>
        </div>
      </footer>
    </div>
  );
}