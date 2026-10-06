// One page serves both roles, the same way Arbiter does. A startup sees
// investor cards, an investor sees startup cards.
//
// Owns: the card queue, prefetching, keyboard shortcuts, optimistic swipes,
// and the two different kinds of empty.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { DARK, LIGHT, FONT_SERIF, FONT_MONO, FONT_SANS } from "../theme";
import { getFeed, swipe as swipeApi } from "../lib/smartMatchApi";
import SwipeCard from "../components/smartmatch/SwipeCard";
import MatchModal from "../components/smartmatch/MatchModal";
import DetailPanel from "../components/smartmatch/DetailPanel";

const ACCENTS = { startup: "#f59e0b", investor: "#6366f1" };

const BATCH     = 15;  // cards per fetch
const LOW_WATER = 5;   // top up when the queue falls to this
const VISIBLE   = 3;   // cards rendered in the stack

const SunIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

export default function SmartMatch({ role = "startup" }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const c = isDark ? DARK : LIGHT;
  const accent = ACCENTS[role];

  const [queue, setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [drained, setDrained] = useState(false);
  const [match, setMatch]   = useState(null);
  const [toast, setToast]   = useState("");
  const [stats, setStats]   = useState({ liked: 0, passed: 0 });

  // Everything swiped this session. The backend demotes passed cards rather
  // than deleting them, so without carrying these in `exclude` a card you
  // just passed can return at the tail of the very next batch.
  const swiped  = useRef(new Set());
  const topCard = useRef(null);
  const fetching = useRef(false);

  const loadMore = useCallback(async (reset = false) => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const held = reset ? [] : queue.map((x) => x.match_id);
      const data = await getFeed(role, {
        limit: BATCH,
        exclude: [...held, ...swiped.current],
      });

      setDrained(Boolean(data.poolDrained));
      setQueue((q) => {
        const base = reset ? [] : q;
        const seen = new Set(base.map((x) => x.match_id));
        // Dedupe defensively — exclude should prevent repeats, but a card
        // arriving twice would render two elements with the same key.
        return [...base, ...(data.cards || []).filter((x) => !seen.has(x.match_id))];
      });
      setError("");
    } catch (err) {
      if (err.status === 401) { navigate(`/${role}-login`); return; }
      setError(err.message || "Could not load your deck.");
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, [role, queue, navigate]);

  useEffect(() => { loadMore(true); /* eslint-disable-next-line */ }, [role]);

  // Top up before the user hits the bottom, so the deck never visibly stalls.
  useEffect(() => {
    if (!loading && queue.length <= LOW_WATER && !drained) loadMore();
  }, [queue.length, loading, drained, loadMore]);

  const handleSwipe = useCallback((dir) => {
    const card = queue[0];
    if (!card) return;

    // Optimistic: the card is already gone visually, so drop it and let the
    // POST resolve in the background. A failed write shows a toast rather
    // than rewinding the deck — rewinding would be more confusing than the
    // lost swipe, and the Interaction log is append-only anyway.
    setQueue((q) => q.slice(1));
    swiped.current.add(card.match_id);
    setStats((s) => dir === "like"
      ? { ...s, liked: s.liked + 1 }
      : { ...s, passed: s.passed + 1 });

    swipeApi(card.match_id, dir)
      .then((res) => {
        if (res?.isMatch) setMatch({ card, connection: res.connection });
      })
      .catch((err) => {
        setToast(err.status === 401 ? "Session expired" : `Could not save that ${dir}`);
        setTimeout(() => setToast(""), 2600);
      });
  }, [queue]);

  // ← pass, → like. Keyboard is what makes this fast on a desktop — you can
  // triage 30 cards without touching the mouse.
  useEffect(() => {
    const onKey = (e) => {
      if (match) return;                                  // modal has focus
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); topCard.current?.swipe("pass"); }
      if (e.key === "ArrowRight") { e.preventDefault(); topCard.current?.swipe("like"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match]);

  const top = queue[0];
  const stack = queue.slice(0, VISIBLE);

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: FONT_SANS }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg) } }

        .sm-layout {
          display: grid; grid-template-columns: 440px 1fr; gap: 32px;
          max-width: 1180px; margin: 0 auto; padding: 88px 32px 48px;
          align-items: start;
        }
        .sm-panel { display: block; }
        @media (max-width: 1000px) {
          .sm-layout { grid-template-columns: 1fr; max-width: 480px; }
          .sm-panel { display: none; }
        }
        .sm-deck { position: relative; height: 580px; }
        .sm-btn {
          display: flex; align-items: center; justify-content: center;
          border-radius: 2px; cursor: pointer; background: ${c.bgCard};
          transition: background .15s, border-color .15s, transform .1s;
        }
        .sm-btn:hover { background: ${c.hover}; }
        .sm-btn:active { transform: scale(0.94); }
      `}</style>

      {/* ── NAV ── */}
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
            SMART MATCH
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate(`/${role}-connections`)} style={{
            height: 34, padding: "0 14px", borderRadius: 2, fontSize: 12, fontWeight: 600,
            color: c.text2, background: "transparent", border: `1px solid ${c.border}`,
            cursor: "pointer", fontFamily: "inherit",
          }}>Matches</button>
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

      <div className="sm-layout">
        {/* ── DECK COLUMN ── */}
        <div style={{ animation: "fadeUp .5s ease both" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "3px",
              color: c.text3, marginBottom: 8, textTransform: "uppercase",
            }}>◆ {role === "startup" ? "Investors for you" : "Startups for you"}</div>
            <h1 style={{
              fontSize: "clamp(26px,3.4vw,40px)", fontWeight: 800, fontFamily: FONT_SERIF,
              letterSpacing: "-1.6px", lineHeight: 1.05, color: c.text,
            }}>
              Swipe to <span style={{ fontStyle: "italic", fontWeight: 400 }}>connect</span>.
            </h1>
          </div>

          <div className="sm-deck">
            {stack.map((card, i) => (
              <SwipeCard
                key={card.match_id}
                ref={i === 0 ? topCard : null}
                card={card}
                role={role}
                accent={accent}
                c={c}
                depth={i}
                interactive={i === 0}
                onSwipe={handleSwipe}
              />
            ))}

            {!top && (
              <EmptyState
                loading={loading || fetching.current}
                drained={drained}
                error={error}
                c={c} accent={accent} role={role} navigate={navigate}
                onRetry={() => { setLoading(true); loadMore(true); }}
              />
            )}
          </div>

          {/* ── CONTROLS ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 16, marginTop: 24,
          }}>
            <button
              className="sm-btn"
              onClick={() => topCard.current?.swipe("pass")}
              disabled={!top}
              aria-label="Pass"
              style={{
                width: 56, height: 56, border: `1px solid ${c.border}`,
                color: "#ef4444", fontSize: 22, opacity: top ? 1 : 0.35,
              }}
            >✕</button>

            <div style={{
              fontSize: 9, fontFamily: FONT_MONO, color: c.text3,
              letterSpacing: "1.5px", textAlign: "center", minWidth: 96,
            }}>
              <div>← PASS · LIKE →</div>
              <div style={{ marginTop: 5, color: c.text2 }}>
                {stats.liked} liked · {stats.passed} passed
              </div>
            </div>

            <button
              className="sm-btn"
              onClick={() => topCard.current?.swipe("like")}
              disabled={!top}
              aria-label="Like"
              style={{
                width: 56, height: 56, border: `1px solid ${accent}55`,
                color: accent, fontSize: 20, opacity: top ? 1 : 0.35,
              }}
            >♥</button>
          </div>
        </div>

        {/* ── DETAIL PANEL ── */}
        <div className="sm-panel" style={{ animation: "fadeUp .6s .1s ease both" }}>
          <DetailPanel card={top} role={role} accent={accent} c={c} />
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: c.bgSurf, border: `1px solid ${c.borderHi}`, borderRadius: 2,
          padding: "11px 18px", fontSize: 12, color: c.text, zIndex: 400,
          fontFamily: FONT_MONO, letterSpacing: "0.5px", boxShadow: c.shadow,
        }}>{toast}</div>
      )}

      {match && (
        <MatchModal
          card={match.card}
          connection={match.connection}
          role={role}
          accent={accent}
          c={c}
          onClose={() => setMatch(null)}
          onViewMatches={() => navigate(`/${role}-connections`)}
        />
      )}
    </div>
  );
}

// ── empty states ───────────────────────────────────────────────
// Three distinct situations that must not look alike: still fetching,
// genuinely seen everyone, and something broke.

function EmptyState({ loading, drained, error, c, accent, role, navigate, onRetry }) {
  const wrap = {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center",
    border: `1px dashed ${c.border}`, borderRadius: 2, padding: 32,
  };

  if (error) {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 14, color: c.text2, maxWidth: 280, lineHeight: 1.6 }}>{error}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onRetry} style={{
            height: 36, padding: "0 18px", borderRadius: 2, background: accent,
            color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit",
          }}>Retry</button>
          <button onClick={() => navigate(`/${role}-profile`)} style={{
            height: 36, padding: "0 18px", borderRadius: 2, background: "transparent",
            color: c.text2, border: `1px solid ${c.border}`, fontSize: 12, cursor: "pointer",
            fontFamily: "inherit",
          }}>Check profile</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={wrap}>
        <div style={{
          width: 28, height: 28, border: `2px solid ${c.border}`,
          borderTopColor: accent, borderRadius: "50%", animation: "spin .8s linear infinite",
        }}/>
        <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: c.text3, letterSpacing: "2px" }}>
          LOADING MORE
        </div>
      </div>
    );
  }

  // poolDrained — Qdrant genuinely has nothing left, not a retrieval shortfall.
  // Say so honestly rather than implying more is coming.
  return (
    <div style={wrap}>
      <div style={{ fontSize: 32, fontFamily: FONT_SERIF, fontWeight: 800, color: c.text3 }}>◆</div>
      <div style={{ fontSize: 17, fontFamily: FONT_SERIF, fontWeight: 700, color: c.text }}>
        {drained ? "You've seen everyone" : "That's all for now"}
      </div>
      <div style={{ fontSize: 13, color: c.text2, maxWidth: 300, lineHeight: 1.65 }}>
        {drained
          ? `You've been through every ${role === "startup" ? "investor" : "startup"} that matches your profile. Ones you passed will resurface over the coming weeks.`
          : "Check back shortly — more candidates are being matched."}
      </div>
      <button onClick={() => navigate(`/${role}-connections`)} style={{
        height: 36, padding: "0 18px", borderRadius: 2, background: "transparent",
        color: accent, border: `1px solid ${accent}55`, fontSize: 12, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit", marginTop: 4,
      }}>View your matches →</button>
    </div>
  );
}