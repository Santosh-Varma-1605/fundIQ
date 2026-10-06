// Mutual matches from GET /api/connections — the people who liked you back.
// Both sides' emails are exposed once a Connection exists, so this page is
// primarily a contact list: the swiping is done, the point now is to reach out.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { DARK, LIGHT, FONT_SERIF, FONT_MONO, FONT_SANS } from "../theme";
import { getConnections } from "../lib/smartMatchApi";

const ACCENTS = { startup: "#f59e0b", investor: "#6366f1" };

const SunIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

const fmtUsd = (n) => {
  if (n == null || n === "") return null;
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
};

function since(iso) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "TODAY";
  if (days === 1) return "YESTERDAY";
  if (days < 30) return `${days} DAYS AGO`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function ConnectionRow({ row, role, accent, c, onView }) {
  const p = row.profile || {};
  const viewingInvestor = role === "startup";

  // Two or three facts worth scanning, different per role.
  const facts = viewingInvestor
    ? [
        p.geo_focus,
        fmtUsd(p.check_min) && `${fmtUsd(p.check_min)} – ${fmtUsd(p.check_max)}`,
        p.risk_appetite && `${p.risk_appetite} risk`,
      ]
    : [
        p.sector,
        p.stage,
        fmtUsd(p.current_raise) && `raising ${fmtUsd(p.current_raise)}`,
      ];

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 18,
        padding: "20px 0", borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div style={{
        width: 44, height: 44, flexShrink: 0, borderRadius: 2,
        background: c.bgSurf, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 800, fontFamily: FONT_MONO, color: c.text2,
      }}>{(row.name || "?")[0].toUpperCase()}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, fontFamily: FONT_SERIF,
          letterSpacing: "-0.4px", color: c.text, marginBottom: 3,
        }}>{row.name || row.match_id}</div>

        <div style={{
          fontSize: 10, fontFamily: FONT_MONO, color: c.text3,
          letterSpacing: "0.8px", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {[row.match_id, ...facts.filter(Boolean)].join(" · ")}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: 9, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "1px",
        }}>{since(row.matchedAt)}</div>
        {row.sourceScore != null && (
          <div style={{
            fontSize: 18, fontWeight: 800, fontFamily: FONT_SERIF,
            color: accent, letterSpacing: "-0.8px", lineHeight: 1.2,
          }}>{Math.round(row.sourceScore * 100)}%</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {row.email && (
          <a
            href={`mailto:${row.email}?subject=${encodeURIComponent("Connecting via FundIQ")}`}
            style={{
              height: 34, padding: "0 14px", borderRadius: 2, background: accent,
              color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center",
            }}
          >Email</a>
        )}
        <button onClick={onView} style={{
          height: 34, padding: "0 14px", borderRadius: 2, background: "transparent",
          color: c.text2, border: `1px solid ${c.border}`, fontSize: 12,
          cursor: "pointer", fontFamily: "inherit",
        }}>Profile</button>
      </div>
    </div>
  );
}

export default function Connections({ role = "startup" }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const c = isDark ? DARK : LIGHT;
  const accent = ACCENTS[role];

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getConnections()
      .then((data) => { setRows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => {
        if (err.status === 401) { navigate(`/${role}-login`); return; }
        setError(err.message || "Could not load your matches.");
        setLoading(false);
      });
  }, [role, navigate]);

  const viewRoute = (id) =>
    role === "startup" ? `/investor-view/${id}` : `/startup-view/${id}`;

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: FONT_SANS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", background: c.navBg,
        borderBottom: `1px solid ${c.border}`, backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 22, height: 22, clipPath: "polygon(50% 0%,100% 100%,0% 100%)", background: c.text }}/>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.5px", fontFamily: FONT_SERIF }}>FundIQ</span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 7, padding: "4px 12px",
          borderRadius: 2, border: `1px solid ${accent}33`, background: `${accent}11`,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent }}/>
          <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: accent, letterSpacing: "1.5px" }}>
            MATCHES
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate(`/${role}-smart-match`)} style={{
            height: 34, padding: "0 14px", borderRadius: 2, fontSize: 12, fontWeight: 600,
            color: c.text2, background: "transparent", border: `1px solid ${c.border}`,
            cursor: "pointer", fontFamily: "inherit",
          }}>Keep swiping</button>
          <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} style={{
            width: 34, height: 34, borderRadius: 2, background: c.togBg,
            border: `1px solid ${c.togBd}`, display: "flex", alignItems: "center",
            justifyContent: "center", color: c.text, cursor: "pointer",
          }}>{isDark ? <SunIcon/> : <MoonIcon/>}</button>
          <button onClick={() => navigate(`/${role}-dashboard`)} style={{
            height: 34, padding: "0 14px", borderRadius: 2, fontSize: 12, fontWeight: 500,
            color: c.text2, background: "transparent", border: `1px solid ${c.border}`,
            cursor: "pointer", fontFamily: "inherit",
          }}>← Dashboard</button>
        </div>
      </nav>

      <div style={{
        maxWidth: 860, margin: "0 auto", padding: "96px 32px 72px",
        animation: "fadeUp .5s ease both",
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "3px",
            color: c.text3, marginBottom: 10, textTransform: "uppercase",
          }}>◆ Mutual interest</div>
          <h1 style={{
            fontSize: "clamp(30px,4.5vw,52px)", fontWeight: 800, fontFamily: FONT_SERIF,
            letterSpacing: "-2.2px", lineHeight: 1.02, color: c.text, marginBottom: 14,
          }}>
            Your <span style={{ fontStyle: "italic", fontWeight: 400 }}>matches</span>.
          </h1>
          <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.7, maxWidth: 440 }}>
            {role === "startup"
              ? "Investors who liked you back. Both sides have opted in, so reach out directly."
              : "Startups who liked you back. Both sides have opted in, so reach out directly."}
          </p>
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{
              width: 28, height: 28, border: `2px solid ${c.border}`,
              borderTopColor: accent, borderRadius: "50%", animation: "spin .8s linear infinite",
            }}/>
          </div>
        )}

        {error && !loading && (
          <div style={{
            border: `1px solid ${c.border}`, borderRadius: 2, padding: "28px 32px",
            textAlign: "center", background: c.bgCard,
          }}>
            <p style={{ fontSize: 14, color: c.text2, marginBottom: 18 }}>{error}</p>
            <button onClick={() => navigate(`/${role}-smart-match`)} style={{
              height: 38, padding: "0 20px", borderRadius: 2, background: accent,
              color: "#fff", border: "none", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Go to Smart Match →</button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{
            border: `1px dashed ${c.border}`, borderRadius: 2, padding: "56px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 30, fontFamily: FONT_SERIF, fontWeight: 800, color: c.text3, marginBottom: 14 }}>◆</div>
            <div style={{
              fontSize: 18, fontFamily: FONT_SERIF, fontWeight: 700,
              color: c.text, marginBottom: 10,
            }}>No matches yet</div>
            <p style={{
              fontSize: 13, color: c.text2, lineHeight: 1.7,
              maxWidth: 340, margin: "0 auto 22px",
            }}>
              A match happens when you and the other side both swipe right.
              Keep swiping — likes you've already sent stay pending until they reciprocate.
            </p>
            <button onClick={() => navigate(`/${role}-smart-match`)} style={{
              height: 40, padding: "0 22px", borderRadius: 2, background: accent,
              color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>Start swiping →</button>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              paddingBottom: 14, borderBottom: `2px solid ${c.text}`,
            }}>
              <div style={{
                fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "2px", color: c.text3,
              }}>{rows.length} CONNECTION{rows.length === 1 ? "" : "S"}</div>
              <div style={{
                fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "2px", color: c.text3,
              }}>COMPATIBILITY</div>
            </div>

            {rows.map((row) => (
              <ConnectionRow
                key={row.match_id}
                row={row}
                role={role}
                accent={accent}
                c={c}
                onView={() => navigate(viewRoute(row.match_id))}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}