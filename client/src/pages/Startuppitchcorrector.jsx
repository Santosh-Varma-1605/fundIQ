import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTheme } from "../ThemeContext";

const DARK  = { bg:"#000", card:"#0d0d0d", border:"rgba(255,255,255,0.09)", text:"#fff", muted:"rgba(255,255,255,0.45)", hint:"rgba(255,255,255,0.18)", nav:"rgba(0,0,0,0.8)" };
const LIGHT = { bg:"#fff", card:"#f5f5f5", border:"rgba(0,0,0,0.08)", text:"#0a0a0a", muted:"rgba(0,0,0,0.45)", hint:"rgba(0,0,0,0.2)", nav:"rgba(255,255,255,0.85)" };

const CHIPS = [
  "Review my pitch deck introduction",
  "What's missing from my investor pitch?",
  "Make my traction section more compelling",
  "How do I pitch to Series A investors?",
];

export default function StartupPitchCorrector() {
  const navigate   = useNavigate();
  const { theme, setTheme } = useTheme();
  const c          = theme === "dark" ? DARK : LIGHT;

  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [fileName,   setFileName]   = useState("");

  const chatRef  = useRef(null);
  const textRef  = useRef(null);
  const fileRef  = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // ── File upload handler ─────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["text/plain", "text/markdown", "application/octet-stream"];
    const extOk   = /\.(txt|md)$/i.test(file.name);
    if (!allowed.includes(file.type) && !extOk) {
      alert("Only .txt or .md files are supported.");
      return;
    }

    setUploading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result?.trim();
      if (content) {
        setInput(prev =>
          prev
            ? `${prev}\n\n--- Uploaded: ${file.name} ---\n${content}`
            : `Here is my startup pitch from "${file.name}":\n\n${content}`
        );
      }
      setUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to read file.");
      setUploading(false);
    };
    reader.readAsText(file);

    // reset so the same file can be re-uploaded
    e.target.value = "";
  };

  // ── Send message ────────────────────────────────────────────
  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setFileName("");

    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/api/pitch/chat", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Icons ───────────────────────────────────────────────────
  const SunIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
  const SendIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  const UploadIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;

  // ── Styles (identical palette/structure to StartupAdvisor) ──
  const s = {
    shell:    { minHeight:"100vh", background:c.bg, color:c.text, fontFamily:"'DM Sans','Inter',sans-serif", display:"flex", flexDirection:"column", alignItems:"center" },
    nav:      { position:"fixed", top:0, left:0, right:0, zIndex:100, height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:c.nav, borderBottom:`1px solid ${c.border}`, backdropFilter:"blur(12px)" },
    chatWrap: { width:"100%", maxWidth:800, flex:1, overflowY:"auto", padding:"80px 24px 180px", display:"flex", flexDirection:"column", gap:20 },
    welcome:  { display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"60px 0 40px", gap:16 },
    chip:     { background:"transparent", border:`1px solid ${c.border}`, color:c.muted, fontFamily:"inherit", fontSize:12, padding:"8px 14px", borderRadius:8, cursor:"pointer" },
    bubble:   (role) => ({ maxWidth:"75%", padding:"12px 16px", borderRadius: role==="user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", fontSize:13.5, lineHeight:1.7, background: role==="user" ? c.text : c.card, color: role==="user" ? c.bg : c.text, border: role==="user" ? "none" : `1px solid ${c.border}` }),
    inputBar: { position:"fixed", bottom:0, left:0, right:0, padding:"12px 24px 16px", background:c.nav, borderTop:`1px solid ${c.border}`, backdropFilter:"blur(12px)" },
    inputWrap:{ display:"flex", gap:10, alignItems:"flex-end", background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:"10px 14px", maxWidth:800, margin:"0 auto" },
    sendBtn:  { width:32, height:32, borderRadius:8, background:c.text, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:c.bg, flexShrink:0 },
    uploadBtn:{ width:32, height:32, borderRadius:8, background:"transparent", border:`1px solid ${c.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:c.muted, flexShrink:0, position:"relative" },
    fileTag:  { display:"flex", alignItems:"center", gap:6, padding:"3px 10px", borderRadius:6, background:`${c.hint}`, border:`1px solid ${c.border}`, fontSize:11, color:c.muted, fontFamily:"monospace", maxWidth:800, margin:"0 auto 6px" },
  };

  return (
    <div style={s.shell}>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <button
          onClick={() => navigate("/")}
          style={{ background:"none", border:"none", color:c.text, cursor:"pointer", fontSize:18, fontWeight:700, letterSpacing:"-0.5px" }}
        >
          FundIQ
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", border:`1px solid ${c.border}`, borderRadius:100, fontSize:10, fontFamily:"monospace", color:c.muted, letterSpacing:"1px" }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:c.text, animation:"pulse 2s infinite" }}/>
          PITCH CORRECTOR
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button
            onClick={() => setTheme(t => t==="dark" ? "light" : "dark")}
            style={{ width:32, height:32, borderRadius:7, background:c.card, border:`1px solid ${c.border}`, color:c.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
          >
            {theme==="dark" ? <SunIcon/> : <MoonIcon/>}
          </button>
          <button
            onClick={() => navigate("/startup-dashboard")}
            style={{ height:32, padding:"0 14px", borderRadius:7, fontSize:12, fontFamily:"inherit", color:c.muted, background:"transparent", border:`1px solid ${c.border}`, cursor:"pointer" }}
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      {/* ── Chat area ── */}
      <div style={s.chatWrap} ref={chatRef}>

        {/* Welcome / empty state */}
        {messages.length === 0 && (
          <div style={s.welcome}>
            <div style={{ width:44, height:44, border:`1px solid ${c.border}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h1 style={{ fontSize:32, fontWeight:700, letterSpacing:"-1.5px" }}>AI Pitch Corrector</h1>
            <p style={{ fontSize:14, color:c.muted, maxWidth:400, lineHeight:1.75 }}>
              Paste your pitch, upload a <code style={{ fontSize:12, background:c.card, padding:"1px 6px", borderRadius:4, border:`1px solid ${c.border}` }}>.txt</code> or <code style={{ fontSize:12, background:c.card, padding:"1px 6px", borderRadius:4, border:`1px solid ${c.border}` }}>.md</code> file, or describe what you need — your startup profile is used automatically to give context-aware feedback.
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginTop:8 }}>
              {CHIPS.map(chip => (
                <button key={chip} style={s.chip} onClick={() => sendMessage(chip)}>{chip}</button>
              ))}
            </div>
            <div style={{ fontSize:11, color:c.hint, fontFamily:"monospace", marginTop:8 }}>
              Profile-aware · Not professional advice · Powered by Groq
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection: m.role==="user" ? "row-reverse" : "row" }}
          >
            <div style={{ width:26, height:26, borderRadius:6, background: m.role==="user" ? c.text : c.card, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontFamily:"monospace", color: m.role==="user" ? c.bg : c.muted, flexShrink:0 }}>
              {m.role==="user" ? "U" : "AI"}
            </div>
            <div style={s.bubble(m.role)}>
              {m.role==="assistant" && (
                <div style={{ fontSize:10, fontFamily:"monospace", color:c.hint, marginBottom:6, letterSpacing:"0.5px" }}>
                  PITCH CORRECTOR
                </div>
              )}
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:26, height:26, borderRadius:6, background:c.card, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontFamily:"monospace", color:c.muted, flexShrink:0 }}>AI</div>
            <div style={s.bubble("assistant")}>
              <div style={{ fontSize:10, fontFamily:"monospace", color:c.hint, marginBottom:6 }}>PITCH CORRECTOR</div>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width:4, height:4, borderRadius:"50%", background:c.muted, display:"inline-block", animation:`blink 1.2s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={s.inputBar}>

        {/* File name tag shown above input when a file is loaded */}
        {fileName && (
          <div style={s.fileTag}>
            <UploadIcon/>
            {fileName}
            <button
              onClick={() => { setFileName(""); setInput(""); }}
              style={{ background:"none", border:"none", color:c.muted, cursor:"pointer", fontSize:13, lineHeight:1, padding:0, marginLeft:2 }}
            >
              ×
            </button>
          </div>
        )}

        <div style={s.inputWrap}>
          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md"
            style={{ display:"none" }}
            onChange={handleFileUpload}
          />

          {/* Upload trigger */}
          <button
            style={s.uploadBtn}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Upload .txt or .md pitch file"
          >
            {uploading
              ? <span style={{ width:10, height:10, border:`1.5px solid ${c.muted}`, borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/>
              : <UploadIcon/>
            }
          </button>

          <textarea
            ref={textRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={1}
            placeholder="Paste your pitch, describe a section, or upload a file above…"
            style={{ background:"none", border:"none", outline:"none", color:c.text, fontFamily:"inherit", fontSize:13.5, resize:"none", flex:1, lineHeight:1.5 }}
          />

          <button
            style={s.sendBtn}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <SendIcon/>
          </button>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:c.hint, fontFamily:"monospace", marginTop:10 }}>
          AI feedback is not a substitute for professional pitch coaching or legal advice.
        </p>

        <style>{`
          @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
          @keyframes spin  { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </div>
  );
}