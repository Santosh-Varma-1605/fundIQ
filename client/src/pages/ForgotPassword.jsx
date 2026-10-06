import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
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

const DARK = {
  bg:"#000", bgCard:"#0a0a0a",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.20)",
  text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)",
  navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)",
  hover:"rgba(255,255,255,0.04)", btnFill:"#fff", btnFillFg:"#000",
  togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)",
  green:"#22c55e", greenBg:"rgba(34,197,94,0.06)", greenBd:"rgba(34,197,94,0.18)",
  input:"rgba(255,255,255,0.04)", inputBd:"rgba(255,255,255,0.10)", inputFocus:"rgba(255,255,255,0.22)",
};
const LIGHT = {
  bg:"#fff", bgCard:"#fafafa",
  border:"rgba(0,0,0,0.07)", borderHi:"rgba(0,0,0,0.18)",
  text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)",
  navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)",
  hover:"rgba(0,0,0,0.03)", btnFill:"#0a0a0a", btnFillFg:"#fff",
  togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)",
  green:"#16a34a", greenBg:"rgba(22,163,74,0.06)", greenBd:"rgba(22,163,74,0.18)",
  input:"rgba(0,0,0,0.02)", inputBd:"rgba(0,0,0,0.10)", inputFocus:"rgba(0,0,0,0.22)",
};

/**
 * role prop: "investor" | "startup"
 * Routed via:
 *   /investor-forgot  → <ForgotPassword role="investor" />
 *   /startup-forgot   → <ForgotPassword role="startup"  />
 */
export default function ForgotPassword({ role = "startup" }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const isInvestor = role === "investor";

  /* role-specific routes */
  const loginPath  = isInvestor ? "/investor-login" : "/startup-login";
  const accentColor = isInvestor ? "#6366f1" : "#22c55e";
  const roleLabel   = isInvestor ? "Investor"   : "Startup";

  const [email,   setEmail]   = useState("");
  const [focus,   setFocus]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const c = theme === "dark" ? DARK : LIGHT;

  /* ── Submit → POST /api/auth/{role}/forgot-password ── */
  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/auth/${role}/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true); // always show success — don't reveal whether email exists
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

  const inp = {
    width:"100%", height:46, background:c.input,
    border:`1px solid ${focus==="email" ? c.inputFocus : c.inputBd}`,
    borderRadius:8, color:c.text, fontFamily:"'Inter',sans-serif",
    fontSize:14, padding:"0 14px 0 40px", outline:"none",
    transition:"border-color .2s", boxSizing:"border-box",
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

        {/* Role badge — shows which portal this belongs to */}
        <div style={{ display:"flex", alignItems:"center", gap:6,
          padding:"4px 12px", borderRadius:100,
          border:`1px solid ${accentColor}33`,
          background:`${accentColor}11` }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor }}/>
          <span style={{ fontSize:12, fontFamily:"'SF Mono','Fira Code',monospace",
            color:accentColor, letterSpacing:"0.5px" }}>
            {roleLabel.toUpperCase()} PORTAL
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Theme toggle */}
          <button onClick={() => setTheme(t => t==="dark" ? "light" : "dark")}
            style={{ width:36, height:36, borderRadius:8, background:c.togBg, border:`1px solid ${c.togBd}`,
              display:"flex", alignItems:"center", justifyContent:"center", color:c.text, cursor:"pointer" }}>
            {theme==="dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Back to role-specific login → /investor-login or /startup-login */}
          <button onClick={() => navigate(loginPath)}
            style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13.5, fontWeight:500,
              fontFamily:"'Inter',sans-serif", color:c.text, background:"transparent",
              border:`1px solid ${c.borderHi}`, cursor:"pointer" }}>
            {isInvestor ? "Investor Sign In" : "Startup Sign In"}
          </button>

          {/* Switch to the other portal */}
          <button onClick={() => navigate(isInvestor ? "/startup-login" : "/investor-login")}
            style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13.5, fontWeight:600,
              fontFamily:"'Inter',sans-serif", color: theme==="dark" ? "#000" : "#fff",
              background: accentColor, border:"none", cursor:"pointer" }}>
            {isInvestor ? "Startup Portal" : "Investor Portal"}
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ position:"relative", zIndex:2, minHeight:"100vh", display:"flex",
        alignItems:"center", justifyContent:"center", paddingTop:64, paddingBottom:40 }}>
        <div style={{ display:"flex", alignItems:"center", width:"100%", maxWidth:960, padding:"0 24px" }}>

          {/* LEFT */}
          <div style={{ flex:1, paddingRight:72 }}>

            {/* Role badge */}
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
              Reset your<br/>password.
            </h1>
            <p style={{ fontSize:15, color:c.text2, lineHeight:1.75, maxWidth:320 }}>
              Enter your registered email and we'll send a secure link to get you back in.
            </p>
          </div>

          {/* RIGHT — card */}
          <div style={{ width:420, flexShrink:0, background:c.bgCard,
            border:`1px solid ${c.border}`, borderRadius:16, padding:"36px 36px 32px" }}>

            {/* Back to role-specific login */}
            <button onClick={() => navigate(loginPath)}
              style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
                color:c.text3, fontFamily:"'Inter',sans-serif", fontSize:13,
                cursor:"pointer", marginBottom:28, padding:0, transition:"color .15s" }}
              onMouseEnter={e => e.currentTarget.style.color = c.text}
              onMouseLeave={e => e.currentTarget.style.color = c.text3}>
              <IconArrowLeft />
              Back to {isInvestor ? "Investor" : "Startup"} Sign In
            </button>

            {sent ? (
              /* SUCCESS STATE */
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"12px 0" }}>
                <div style={{ color:accentColor, marginBottom:20 }}><IconCheck /></div>
                <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.6px", color:c.text, marginBottom:10 }}>
                  Check your inbox
                </h2>
                <p style={{ fontSize:14, color:c.text2, lineHeight:1.75, maxWidth:300, marginBottom:24 }}>
                  We sent a reset link to <strong style={{ color:c.text }}>{email}</strong>.<br/>
                  It expires in 15 minutes.
                </p>
                <div style={{ width:"100%", padding:"12px 16px", marginBottom:24,
                  background: isInvestor ? "rgba(99,102,241,0.06)" : "rgba(34,197,94,0.06)",
                  border:`1px solid ${isInvestor ? "rgba(99,102,241,0.18)" : "rgba(34,197,94,0.18)"}`,
                  borderRadius:8 }}>
                  <p style={{ fontSize:12.5, color:accentColor, lineHeight:1.65, margin:0 }}>
                    Didn't get it? Check spam or{" "}
                    <button onClick={() => setSent(false)}
                      style={{ background:"none", border:"none", color:accentColor, fontWeight:600,
                        cursor:"pointer", fontSize:12.5, textDecoration:"underline", padding:0 }}>
                      try again
                    </button>.
                  </p>
                </div>
                {/* Back to role-specific login */}
                <button onClick={() => navigate(loginPath)}
                  style={{ width:"100%", height:48, borderRadius:100,
                    background:accentColor, color:"#fff", border:"none",
                    fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:600, cursor:"pointer" }}>
                  Back to {isInvestor ? "Investor" : "Startup"} Sign In
                </button>
              </div>
            ) : (
              /* FORM STATE */
              <>
                <div style={{ marginBottom:28 }}>
                  <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.8px", color:c.text, marginBottom:6 }}>
                    Forgot password?
                  </h2>
                  <p style={{ fontSize:13.5, color:c.text2, lineHeight:1.7 }}>
                    Enter the email linked to your {roleLabel.toLowerCase()} account.
                  </p>
                </div>

                <div style={{ marginBottom:28 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:c.text3, marginBottom:6,
                    display:"block", fontFamily:"'Inter',sans-serif", letterSpacing:"0.3px" }}>
                    Email address
                  </label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
                      color:c.text3, display:"flex", alignItems:"center", pointerEvents:"none" }}>
                      <IconMail />
                    </span>
                    <input type="email" placeholder="you@company.com" value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && handleSubmit()}
                      style={inp}
                      onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}/>
                  </div>
                </div>

                {/* Submit → POST /api/auth/{role}/forgot-password */}
                <button onClick={handleSubmit} disabled={loading}
                  style={{ width:"100%", height:48, borderRadius:100,
                    background: loading ? `${accentColor}66` : accentColor,
                    color:"#fff", border:"none", fontFamily:"'Inter',sans-serif",
                    fontSize:15, fontWeight:600,
                    cursor: loading ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>

                <p style={{ marginTop:18, fontSize:12.5, color:c.text3, textAlign:"center" }}>
                  Remember your password?{" "}
                  {/* Back to role-specific login */}
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