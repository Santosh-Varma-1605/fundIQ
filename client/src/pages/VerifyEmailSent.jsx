import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const IconMail = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const DARK = {
  bg:"#000", bgCard:"#0a0a0a",
  border:"rgba(255,255,255,0.08)", borderHi:"rgba(255,255,255,0.20)",
  text:"#fff", text2:"rgba(255,255,255,0.52)", text3:"rgba(255,255,255,0.26)",
  navBg:"rgba(0,0,0,0.72)", grid:"rgba(255,255,255,0.045)",
  togBg:"rgba(255,255,255,0.07)", togBd:"rgba(255,255,255,0.12)",
};
const LIGHT = {
  bg:"#fff", bgCard:"#fafafa",
  border:"rgba(0,0,0,0.07)", borderHi:"rgba(0,0,0,0.18)",
  text:"#0a0a0a", text2:"rgba(0,0,0,0.50)", text3:"rgba(0,0,0,0.28)",
  navBg:"rgba(255,255,255,0.82)", grid:"rgba(0,0,0,0.048)",
  togBg:"rgba(0,0,0,0.05)", togBd:"rgba(0,0,0,0.10)",
};

export default function VerifyEmailSent() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme, setTheme } = useTheme();

  const { email, role } = location.state || { email: "", role: "startup" };
  const isInvestor  = role === "investor";
  const accentColor = isInvestor ? "#6366f1" : "#22c55e";
  const roleLabel   = isInvestor ? "Investor" : "Startup";
  const loginPath   = isInvestor ? "/investor-login" : "/startup-login";

  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const [cooldown,  setCooldown]  = useState(false);

  const c = theme === "dark" ? DARK : LIGHT;

 const handleResend = async () => {
  if (cooldown || !email) return;

  setResending(true);

  try {
    await fetch(`http://localhost:5000/api/auth/${role}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "User",
        lastName: "User",
        email: email.toLowerCase().trim()
      }),
    });

    setResent(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60000);

  } finally {
    setResending(false);
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
        <button onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:9, background:"none", border:"none", color:c.text, cursor:"pointer", padding:0 }}>
          <div style={{ width:20, height:20, clipPath:"polygon(50% 0%,100% 100%,0% 100%)", background:c.text }}/>
          <span style={{ fontSize:17, fontWeight:700, letterSpacing:"-0.3px" }}>FundIQ</span>
        </button>

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
            style={{ height:36, padding:"0 16px", borderRadius:8, fontSize:13, fontWeight:500,
              fontFamily:"'Inter',sans-serif", color:c.text2, background:"transparent",
              border:`1px solid ${c.border}`, cursor:"pointer" }}>
            {isInvestor ? "Investor Sign In" : "Startup Sign In"}
          </button>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ position:"relative", zIndex:2, minHeight:"100vh", display:"flex",
        alignItems:"center", justifyContent:"center", paddingTop:64, paddingBottom:40 }}>

        <div style={{ width:480, background:c.bgCard, border:`1px solid ${c.border}`,
          borderRadius:16, padding:"48px 40px", textAlign:"center" }}>

          {/* Icon */}
          <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 24px",
            background:`${accentColor}12`, border:`1px solid ${accentColor}30`,
            display:"flex", alignItems:"center", justifyContent:"center", color:accentColor }}>
            <IconMail />
          </div>

          {/* Role badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:6,
            padding:"4px 12px", borderRadius:100, marginBottom:20,
            border:`1px solid ${accentColor}40`, background:`${accentColor}10` }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:accentColor }}/>
            <span style={{ fontSize:11, fontFamily:"'SF Mono','Fira Code',monospace",
              color:accentColor, letterSpacing:"1px", textTransform:"uppercase" }}>
              {roleLabel} Portal
            </span>
          </div>

          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-1px", color:c.text, marginBottom:12 }}>
            Check your inbox
          </h1>
          <p style={{ fontSize:14, color:c.text2, lineHeight:1.75, marginBottom:8 }}>
            We sent a verification link to
          </p>
          <p style={{ fontSize:15, fontWeight:600, color:c.text, marginBottom:28,
            padding:"8px 16px", background:c.border === "rgba(255,255,255,0.08)"
              ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            borderRadius:8, display:"inline-block" }}>
            {email || "your email"}
          </p>

          <p style={{ fontSize:13.5, color:c.text2, lineHeight:1.7, marginBottom:32 }}>
            Click the link in the email to verify your account and get straight into your {roleLabel.toLowerCase()} dashboard. The link expires in <strong style={{ color:c.text }}>24 hours</strong>.
          </p>

          {/* Steps */}
          <div style={{ textAlign:"left", marginBottom:32,
            background: theme==="dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border:`1px solid ${c.border}`, borderRadius:10, padding:"20px 24px" }}>
            {[
              ["1", "Open your email app"],
              ["2", `Find the email from FundIQ`],
              ["3", "Click \"Verify Email Address\""],
              ["4", "You'll land straight on your dashboard"],
            ].map(([n, text]) => (
              <div key={n} style={{ display:"flex", alignItems:"center", gap:14,
                marginBottom: n === "4" ? 0 : 14 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                  background:`${accentColor}18`, border:`1px solid ${accentColor}40`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:accentColor }}>{n}</span>
                </div>
                <span style={{ fontSize:13.5, color:c.text2 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Resend */}
          <div style={{ padding:"16px", marginBottom:24,
            background: theme==="dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            border:`1px solid ${c.border}`, borderRadius:10 }}>
            <p style={{ fontSize:13, color:c.text3, marginBottom:10 }}>
              Didn't get it? Check your spam folder or resend.
            </p>
            {resent && (
              <p style={{ fontSize:12.5, color:accentColor, marginBottom:8 }}>
                ✓ A new verification email has been sent.
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={resending || cooldown}
              style={{ height:38, padding:"0 20px", borderRadius:100,
                background: (resending || cooldown) ? `${accentColor}40` : accentColor,
                color:"#fff", border:"none", fontFamily:"'Inter',sans-serif",
                fontSize:13, fontWeight:600,
                cursor: (resending || cooldown) ? "not-allowed" : "pointer",
                transition:"opacity .2s" }}>
              {resending ? "Sending…" : cooldown ? "Resent! Wait 60s to try again" : "Resend Verification Email"}
            </button>
          </div>

          {/* Back to login */}
          <button onClick={() => navigate(loginPath)}
            style={{ background:"none", border:"none", color:c.text3,
              fontFamily:"'Inter',sans-serif", fontSize:13, cursor:"pointer",
              transition:"color .15s" }}
            onMouseEnter={e => e.target.style.color = c.text}
            onMouseLeave={e => e.target.style.color = c.text3}>
            ← Back to {isInvestor ? "Investor" : "Startup"} Sign In
          </button>
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