// Fires only when POST /api/swipe comes back with isMatch: true — meaning
// the other side had already liked you and a Connection row was just created.
// Both parties' emails are now exposed to each other, so the one action worth
// offering here is "email them".

import { useEffect } from "react";
import { FONT_MONO, FONT_SERIF } from "../../theme";

export default function MatchModal({ card, connection, role, accent, c, onClose, onViewMatches }) {
  // Esc closes. Without this the modal traps a keyboard-driven user, who is
  // exactly the person swiping fast enough to hit a match.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const email = card?.profile?.email;
  const them  = card?.name || "your match";
  const other = role === "startup" ? "investor" : "startup";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        animation: "fadeUp .25s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, background: c.bgCard,
          border: `1px solid ${accent}55`, borderRadius: 2,
          padding: "36px 32px", textAlign: "center", boxShadow: c.shadow,
        }}
      >
        <div style={{
          width: 52, height: 52, margin: "0 auto 20px", borderRadius: 2,
          border: `1px solid ${accent}55`, background: `${accent}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: accent,
        }}>♥</div>

        <div style={{
          fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "3px",
          color: c.text3, textTransform: "uppercase", marginBottom: 12,
        }}>◆ Mutual interest</div>

        <h2 style={{
          fontSize: 30, fontWeight: 800, fontFamily: FONT_SERIF,
          letterSpacing: "-1.4px", lineHeight: 1.1, color: c.text, marginBottom: 12,
        }}>
          It's a <span style={{ fontStyle: "italic", fontWeight: 400 }}>match</span>.
        </h2>

        <p style={{ fontSize: 14, lineHeight: 1.65, color: c.text2, marginBottom: 24 }}>
          <strong style={{ color: c.text, fontWeight: 700 }}>{them}</strong> liked you back.
          You can reach out to each other directly now.
        </p>

        {email && (
          <div style={{
            background: c.bgSurf, border: `1px solid ${c.border}`, borderRadius: 2,
            padding: "12px 14px", marginBottom: 20,
          }}>
            <div style={{
              fontSize: 8, fontFamily: FONT_MONO, color: c.text3,
              letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 5,
            }}>{other} contact</div>
            <div style={{
              fontSize: 13, fontFamily: FONT_MONO, color: c.text, overflowWrap: "anywhere",
            }}>{email}</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {email && (
            <a
              href={`mailto:${email}?subject=${encodeURIComponent("Connecting via FundIQ")}`}
              style={{
                height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 2, background: accent, color: "#fff", textDecoration: "none",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.3px",
              }}
            >Send an email</a>
          )}

          <button onClick={onViewMatches} style={{
            height: 40, borderRadius: 2, background: "transparent", color: c.text2,
            border: `1px solid ${c.border}`, fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>View all matches</button>

          <button onClick={onClose} style={{
            height: 36, background: "none", border: "none", color: c.text3,
            fontSize: 11, cursor: "pointer", fontFamily: FONT_MONO,
            letterSpacing: "1.5px", textTransform: "uppercase",
          }}>Keep swiping · Esc</button>
        </div>

        {connection?.sourceScore != null && (
          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.border}`,
            fontSize: 9, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1px",
          }}>
            MATCHED AT {Math.round(connection.sourceScore * 100)}% COMPATIBILITY
          </div>
        )}
      </div>
    </div>
  );
}