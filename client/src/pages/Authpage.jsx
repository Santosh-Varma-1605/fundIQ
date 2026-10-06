import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

/* ─── ICONS ─── */
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
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
/* [Redesign] Monochrome G-mark — the real Google logo is inherently
   colorful, which would break a strict black-and-white theme. */
const IconGoogle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9.5"/>
    <text x="12" y="16" textAnchor="middle" fontSize="11" fontFamily="Arial, sans-serif" fill="currentColor" stroke="none">G</text>
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
};

export default function AuthPage({ role }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const isInvestor    = role === "investor";
  const dashboardPath = isInvestor ? "/investor-dashboard" : "/startup-dashboard";
  const forgotPath    = isInvestor ? "/investor-forgot"    : "/startup-forgot";
  const roleLabel     = isInvestor ? "Investor"            : "Startup";

  const [view,      setView]      = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [focus,     setFocus]     = useState(null);
  const [hov,       setHov]       = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const c = theme === "dark" ? DARK : LIGHT;
  /* [Redesign] Single monochrome accent — reuses the existing btnFill
     tokens (white-on-black / black-on-white) instead of a per-role color. */
  const ink = c.btnFill;
  const inkFg = c.btnFillFg;
  const clearError = () => setError("");

  /* ── Password strength ── */
  const hasLength   = password.length >= 8;
  const hasUpper    = /[A-Z]/.test(password);
  const hasNumber   = /[0-9]/.test(password);
  const isStrong    = hasLength && hasUpper && hasNumber;
  const strengthPct = [hasLength, hasUpper, hasNumber].filter(Boolean).length / 3;

  /* ── Login ── */
 const handleLogin = async () => {
  clearError();

  if (!email.trim() || !password) {
    setError("Please enter your email and password.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`http://localhost:5000/api/auth/${role}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password
      }),
    });

    const data = await res.json();

    if (!data.success) {

      if (data.unverified) {
        navigate("/verify-email-sent", {
          state: { email, role }
        });
        return;
      }

      setError(data.message || "Invalid credentials.");
      return;
    }

    localStorage.setItem("token", data.token);
    navigate(dashboardPath);

  } catch {
    setError("Network error — please try again.");
  } finally {
    setLoading(false);
  }
};
  /* ── Signup ── */
  const handleSignup = async () => {
  clearError();

  if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
    setError("All fields are required.");
    return;
  }

  if (!isStrong) {
    setError("Password must be 8+ characters, include an uppercase letter and a number.");
    return;
  }

  if (password !== confirm) {
    setError("Passwords do not match.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`http://localhost:5000/api/auth/${role}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        password
      }),
    });

    const data = await res.json();

    if (data.success || data.resent) {
      navigate("/verify-email-sent", {
        state: { email, role }
      });
      return;
    }

    setError(data.message || "Registration failed.");

  } catch {
    setError("Network error — please try again.");
  } finally {
    setLoading(false);
  }
};

  const onKeyDown = (e) => { if (e.key === "Enter") view === "login" ? handleLogin() : handleSignup(); };

  /* ── Style helpers ── */
  const inp = (f, extra = {}) => ({
    width:"100%", height:46, background:c.input,
    border:`1px solid ${focus===f ? c.inputFocus : c.inputBd}`,
    borderRadius:8, color:c.text, fontFamily:"'Inter',sans-serif",
    fontSize:14, padding:"0 14px 0 40px", outline:"none",
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

  /* [Redesign] Grid + fade mask only — the colorful rainbow gradient
     block that used to sit behind the grid has been removed entirely. */
  const GridBg = () => (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(${c.grid} 1px,transparent 1px),linear-gradient(90deg,${c.grid} 1px,transparent 1px)`,
        backgroundSize:"80px 80px" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:`linear-gradient(to bottom,${c.bg} 0%,transparent 10%,transparent 55%,${c.bg} 100%),
                   linear-gradient(to right,${c.bg} 0%,transparent 6%,transparent 94%,${c.bg} 100%)` }}/>
    </>
  );

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

  return (
    <div style={{ minHeight:"100vh", background:c.bg, color:c.text, fontFamily:"'Inter',sans-serif", position:"relative", overflowX:"hidden" }}>
      <GridBg />

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px",
        background:c.navBg, borderBottom:`1px solid ${c.border}`,
        backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)" }}>
        <button onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:9, background:"none", border:"none", color:c.text, cursor:"pointer", padding:0 }}>
          <div style={{ width:20, height:20, clipPath:"polygon(50% 0%,100% 100%,0% 100%)", background:c.text }}/>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.3px" }}>FundIQ</span>
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:100,
          border:`1px solid ${c.border}`, background:c.hover }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:c.text }}/>
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace", color:c.text2, letterSpacing:"0.5px" }}>
            {roleLabel.toUpperCase()} PORTAL
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setTheme(t => t==="dark" ? "light" : "dark")}
            style={{ width:36, height:36, borderRadius:8, background:c.togBg, border:`1px solid ${c.togBd}`,
              display:"flex", alignItems:"center", justifyContent:"center", color:c.text, cursor:"pointer" }}>
            {theme==="dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => navigate(isInvestor ? "/startup-login" : "/investor-login")}
            style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13, fontWeight:500,
              fontFamily:"'Inter',sans-serif", color:c.text2, background:"transparent",
              border:`1px solid ${c.border}`, cursor:"pointer" }}>
            {isInvestor ? "Startup Portal →" : "Investor Portal →"}
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
              border:`1px solid ${c.border}`, background:c.hover }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:c.text }}/>
              <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace",
                color:c.text2, letterSpacing:"1px", textTransform:"uppercase" }}>
                {roleLabel} Portal
              </span>
            </div>

            <h1 style={{ fontSize:"clamp(30px,3.2vw,46px)", fontWeight:800,
              letterSpacing:"-1.8px", lineHeight:1.08, color:c.text, marginBottom:14 }}>
              {isInvestor
                ? <>Find your next<br/>great investment.</>
                : <>Raise smarter.<br/>Close faster.</>}
            </h1>
            <p style={{ fontSize:15, color:c.text2, lineHeight:1.75, maxWidth:300 }}>
              {isInvestor
                ? "Access deal flow, viability scores, and founder matches — all in one intelligence platform."
                : "Submit your pitch, get a fundability score, and connect with the right investors."}
            </p>

            <div style={{ marginTop:36, display:"flex", gap:24 }}>
              {(isInvestor
                ? [["3,800+","Active Investors"],["94%","Match Accuracy"],["$2.4B","Deployed"]]
                : [["12K+","Startups"],["94%","Accuracy"],["$2.4B","Raised"]]
              ).map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize:20, fontWeight:800, letterSpacing:"-1px", color:c.text }}>{n}</div>
                  <div style={{ fontSize:11, color:c.text3, marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — card */}
          <div style={{ width:420, flexShrink:0, background:c.bgCard,
            border:`1px solid ${c.border}`, borderRadius:16, overflow:"hidden" }}>

            {/* Tab switcher */}
            <div style={{ display:"flex", borderBottom:`1px solid ${c.border}` }}>
              {["login","signup"].map(v => (
                <button key={v} onClick={() => { setView(v); clearError(); setPassword(""); setConfirm(""); }}
                  style={{ flex:1, height:52, background:"none", border:"none",
                    borderBottom: view===v ? `2px solid ${c.text}` : "2px solid transparent",
                    color: view===v ? c.text : c.text3,
                    fontFamily:"'Inter',sans-serif", fontSize:14,
                    fontWeight: view===v ? 600 : 400,
                    cursor:"pointer", transition:"color .15s", marginBottom:"-1px" }}>
                  {v === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <div style={{ padding:"28px 32px 32px" }}>

              {/* Error banner */}
              {error && (
                <div style={{ marginBottom:16, padding:"11px 14px",
                  background:c.errorBg, border:`1px solid ${c.errorBd}`, borderRadius:8 }}>
                  <p style={{ fontSize:13, color:c.errorText, margin:0, lineHeight:1.5 }}>{error}</p>
                </div>
              )}

              {/* Google SSO */}
              <button
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                  height:46, borderRadius:8, width:"100%", marginBottom:20,
                  border:`1px solid ${hov==="google" ? c.borderHi : c.border}`,
                  background: hov==="google" ? c.hover : "transparent",
                  color:c.text, fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500,
                  cursor:"pointer", transition:"background .15s, border-color .15s" }}
                onMouseEnter={() => setHov("google")}
                onMouseLeave={() => setHov(null)}
                onClick={() => { window.location.href = `http://localhost:5000/api/auth/google?role=${role}`; }}>
                <IconGoogle />
                Continue with Google
              </button>

              {/* OR divider */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ flex:1, height:1, background:c.border }}/>
                <span style={{ fontFamily:"'SF Mono','Fira Code',monospace", fontSize:11, color:c.text3, letterSpacing:"1px" }}>OR</span>
                <div style={{ flex:1, height:1, background:c.border }}/>
              </div>

              {/* Signup — first/last name */}
              {view === "signup" && (
                <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                  <div style={{ flex:1 }}>
                    <label style={lbl}>First name</label>
                    <input type="text" placeholder="Jane" value={firstName}
                      onChange={e => { setFirstName(e.target.value); clearError(); }}
                      style={{ ...inp("fn"), paddingLeft:14 }}
                      onFocus={() => setFocus("fn")} onBlur={() => setFocus(null)}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={lbl}>Last name</label>
                    <input type="text" placeholder="Smith" value={lastName}
                      onChange={e => { setLastName(e.target.value); clearError(); }}
                      style={{ ...inp("ln"), paddingLeft:14 }}
                      onFocus={() => setFocus("ln")} onBlur={() => setFocus(null)}/>
                  </div>
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Email address</label>
                <div style={{ position:"relative" }}>
                  <span style={icoWrap}><IconMail /></span>
                  <input type="email" placeholder="you@company.com" value={email}
                    onChange={e => { setEmail(e.target.value); clearError(); }}
                    onKeyDown={onKeyDown} style={inp("email")}
                    onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}/>
                </div>
              </div>

              {/* PASSWORD — with live strength feedback on signup */}
              <div style={{ marginBottom: view==="login" ? 8 : 14 }}>
                <label style={lbl}>Password</label>
                <div style={{ position:"relative" }}>
                  <span style={icoWrap}><IconLock /></span>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError(); }}
                    onKeyDown={onKeyDown}
                    style={{
                      ...inp("password", { paddingRight:42 }),
                      borderColor: view==="signup" && password.length > 0 && !isStrong
                        ? "#ef4444"
                        : focus==="password" ? c.inputFocus : c.inputBd,
                    }}
                    onFocus={() => setFocus("password")}
                    onBlur={() => setFocus(null)}
                  />
                  <button onClick={() => setShowPass(p => !p)}
                    style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", color:c.text3, cursor:"pointer", display:"flex", padding:0 }}>
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>

                {/* Strength bar — signup only. Weak/almost stay semantic red/amber;
                    "strong" now uses the monochrome ink token instead of a brand color. */}
                {view === "signup" && password.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:3, borderRadius:2, background:c.border, overflow:"hidden" }}>
                      <div style={{
                        height:"100%", borderRadius:2,
                        width:`${strengthPct * 100}%`,
                        background: strengthPct < 0.34 ? "#ef4444" : strengthPct < 1 ? "#f59e0b" : ink,
                        transition:"width .3s, background .3s",
                      }}/>
                    </div>
                    <p style={{
                      fontSize:11.5, marginTop:5, margin:"5px 0 0",
                      color: strengthPct < 0.34
                        ? (theme==="dark" ? "#f87171" : "#dc2626")
                        : strengthPct < 1 ? "#f59e0b" : c.text,
                    }}>
                      {strengthPct < 0.34 ? "Weak" : strengthPct < 1 ? "Almost there" : "Strong password ✓"}
                    </p>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD — with match indicator */}
              {view === "signup" && (
                <div style={{ marginBottom:8 }}>
                  <label style={lbl}>Confirm password</label>
                  <div style={{ position:"relative" }}>
                    <span style={icoWrap}><IconLock /></span>
                    <input
                      type={showConf ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); clearError(); }}
                      onKeyDown={onKeyDown}
                      style={{
                        ...inp("confirm", { paddingRight:42 }),
                        borderColor: confirm.length > 0
                          ? password === confirm ? c.inputFocus : "#ef4444"
                          : focus==="confirm" ? c.inputFocus : c.inputBd,
                      }}
                      onFocus={() => setFocus("confirm")}
                      onBlur={() => setFocus(null)}
                    />
                    <button onClick={() => setShowConf(p => !p)}
                      style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)",
                        background:"none", border:"none", color:c.text3, cursor:"pointer", display:"flex", padding:0 }}>
                      {showConf ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>

                  {confirm.length > 0 && (
                    <p style={{
                      fontSize:11.5, marginTop:5, margin:"5px 0 0",
                      color: password === confirm ? c.text : (theme==="dark" ? "#f87171" : "#dc2626"),
                    }}>
                      {password === confirm ? "Passwords match ✓" : "Passwords do not match"}
                    </p>
                  )}
                </div>
              )}

              {/* Forgot password — login only */}
              {view === "login" && (
                <div style={{ textAlign:"right", marginBottom:24 }}>
                  <button onClick={() => navigate(forgotPath)}
                    style={{ background:"none", border:"none", color:c.text3, fontSize:12.5,
                      cursor:"pointer", fontFamily:"inherit", transition:"color .15s" }}
                    onMouseEnter={e => e.target.style.color = c.text}
                    onMouseLeave={e => e.target.style.color = c.text3}>
                    Forgot password?
                  </button>
                </div>
              )}

              {view === "signup" && <div style={{ height:24 }} />}

              {/* Submit */}
              <button
                onClick={view === "login" ? handleLogin : handleSignup}
                disabled={loading}
                style={{ width:"100%", height:48, borderRadius:100,
                  background: loading ? c.hover : ink,
                  color: loading ? c.text2 : inkFg,
                  border: loading ? `1px solid ${c.border}` : "none",
                  fontFamily:"'Inter',sans-serif",
                  fontSize:15, fontWeight:600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition:"opacity .2s, background .2s",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = ".88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round"
                      style={{ animation:"spin .8s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    {view === "login" ? "Signing in…" : "Creating account…"}
                  </>
                ) : (
                  view === "login" ? `Sign In as ${roleLabel}` : `Create ${roleLabel} Account`
                )}
              </button>
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

              {view === "signup" && (
                <p style={{ marginTop:14, fontSize:11.5, color:c.text3, textAlign:"center", lineHeight:1.6 }}>
                  By signing up you agree to our{" "}
                  <span style={{ color:c.text2, cursor:"pointer" }}>Terms of Service</span>{" "}and{" "}
                  <span style={{ color:c.text2, cursor:"pointer" }}>Privacy Policy</span>.
                </p>
              )}
            </div>
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