import { useState } from "react";
import { FONT_SERIF, FONT_MONO } from "../theme";

export default function FeatureCard({ feature, c, isDark, onClick }) {
  const [hov, setHov] = useState(false);
  const { tag, title, desc, stat, icon } = feature;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? (isDark ? "#161616" : "#fff") : c.bgCard,
        border: `1px solid ${hov ? c.borderHi : c.border}`,
        borderRadius: 4,
        padding: "32px 30px 26px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
        boxShadow: hov ? c.shadow : "none",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "all .25s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div style={{
        position: "absolute", top: 14, right: 14, width: 18, height: 18,
        borderTop: `1.5px solid ${c.text3}`, borderRight: `1.5px solid ${c.text3}`,
        transition: "all .2s", transform: hov ? "scale(1.3)" : "scale(1)", opacity: hov ? 1 : 0.5,
      }} />
      <div style={{ marginBottom: 20 }}>{icon(c.text2)}</div>
      <div style={{ fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "2px", color: c.text3, marginBottom: 10, textTransform: "uppercase" }}>
        {tag}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: c.text, letterSpacing: "-0.4px", marginBottom: 10, fontFamily: FONT_SERIF, lineHeight: 1.25 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: c.text2, lineHeight: 1.7, flex: 1 }}>{desc}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1px", color: c.text3 }}>{stat}</div>
        <div style={{ fontSize: 10, fontFamily: FONT_MONO, letterSpacing: "1.5px", color: hov ? c.text : c.text3, transition: "color .2s" }}>OPEN →</div>
      </div>
    </div>
  );
}