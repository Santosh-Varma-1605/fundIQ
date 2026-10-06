// The draggable card. Hand-written with pointer events rather than pulling in
// an animation library — it's ~60 lines of transform maths and avoids adding
// a dependency for one screen.
//
// The parent drives programmatic swipes (buttons, arrow keys) through a ref,
// so the keyboard path gets the same exit animation as a drag instead of the
// card vanishing instantly.

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { FONT_MONO, FONT_SERIF } from "../../theme";
import ScoreRing from "./ScoreRing";
import FitBreakdown from "./FitBreakdown";
import CandidateBody from "./CandidateBody";

const THRESHOLD = 120;   // px of horizontal travel that commits a swipe
const EXIT_MS   = 280;   // must match the transition below
const EXIT_X    = 700;   // how far off-screen the card flies

function Badge({ children, c, tone = "neutral", accent }) {
  const color = tone === "accent" ? accent : c.text3;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 9, fontFamily: FONT_MONO, letterSpacing: "1px",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: 2,
      border: `1px solid ${tone === "accent" ? `${accent}44` : c.border}`,
      background: tone === "accent" ? `${accent}0e` : c.tag,
      color, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Stamp({ label, color, opacity, rotate }) {
  return (
    <div style={{
      position: "absolute", top: 28, [rotate < 0 ? "right" : "left"]: 24,
      transform: `rotate(${rotate}deg)`, opacity,
      border: `3px solid ${color}`, borderRadius: 3,
      padding: "4px 14px", pointerEvents: "none", zIndex: 5,
      fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800,
      letterSpacing: "3px", color,
      transition: "opacity 0.12s linear",
    }}>{label}</div>
  );
}

const SwipeCard = forwardRef(function SwipeCard(
  { card, role, accent, c, onSwipe, interactive = true, depth = 0 },
  ref
) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState(null);      // "like" | "pass" | null
  const start = useRef({ x: 0, y: 0 });
  const committed = useRef(false);             // guards drag + keypress racing

  const commit = useCallback((dir) => {
    if (committed.current) return;
    committed.current = true;
    setExit(dir);
    setDrag((d) => ({ ...d, active: false }));
    // Fire after the animation starts, not after it finishes — the parent
    // drops the card from the queue and the next one is already behind it.
    setTimeout(() => onSwipe(dir), EXIT_MS);
  }, [onSwipe]);

  useImperativeHandle(ref, () => ({ swipe: commit }), [commit]);

  const onPointerDown = (e) => {
    if (!interactive || exit) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  const onPointerMove = (e) => {
    if (!drag.active) return;
    setDrag({
      x: e.clientX - start.current.x,
      y: e.clientY - start.current.y,
      active: true,
    });
  };

  const onPointerUp = () => {
    if (!drag.active) return;
    if (drag.x > THRESHOLD)       commit("like");
    else if (drag.x < -THRESHOLD) commit("pass");
    else setDrag({ x: 0, y: 0, active: false });  // spring back
  };

  // ── transform ──────────────────────────────────────────────────
  let transform, transition;
  if (exit) {
    const dir = exit === "like" ? 1 : -1;
    transform = `translate(${dir * EXIT_X}px, ${drag.y}px) rotate(${dir * 22}deg)`;
    transition = `transform ${EXIT_MS}ms cubic-bezier(.3,0,.7,1), opacity ${EXIT_MS}ms linear`;
  } else if (drag.active) {
    transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.055}deg)`;
    transition = "none";                     // must track the pointer exactly
  } else {
    const scale = 1 - depth * 0.035;
    transform = `translateY(${depth * 12}px) scale(${scale})`;
    transition = "transform 0.28s cubic-bezier(.2,.8,.3,1)";
  }

  const likeOp = Math.max(0, Math.min(drag.x / 90, 1));
  const passOp = Math.max(0, Math.min(-drag.x / 90, 1));

  // Memoised so a pointermove re-render only touches the wrapper's transform
  // and never reconciles the SVG ring, the fit pills or the body grid.
  const content = useMemo(() => {
    const p = card.profile || {};
    const subtitle = role === "startup"
      ? card.match_id
      : `${card.match_id}${p.hq_country ? ` · ${p.hq_country}` : ""}`;

    return (
      <>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 24, fontWeight: 800, fontFamily: FONT_SERIF,
              letterSpacing: "-1px", lineHeight: 1.1, color: c.text,
              marginBottom: 5, overflowWrap: "anywhere",
            }}>{card.name || "Unnamed"}</div>
            <div style={{
              fontSize: 9, fontFamily: FONT_MONO, color: c.text3,
              letterSpacing: "1.5px",
            }}>{subtitle}</div>
          </div>
          <ScoreRing score={card.reciprocal_score ?? card.score ?? 0} accent={accent} c={c} />
        </div>

        {(card.resurfaced || card.stage_relaxed) && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {card.resurfaced && <Badge c={c} accent={accent}>Seen before</Badge>}
            {card.stage_relaxed && (
              <Badge c={c} accent={accent} tone="accent">Outside your stage focus</Badge>
            )}
          </div>
        )}

        <CandidateBody card={card} role={role} accent={accent} c={c} />

        {card.features && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
            <FitBreakdown features={card.features} accent={accent} c={c} />
          </div>
        )}
      </>
    );
  }, [card, role, accent, c]);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute", inset: 0,
        background: c.bgCard,
        border: `1px solid ${drag.active ? c.borderHi : c.border}`,
        borderRadius: 2,
        boxShadow: depth === 0 ? c.shadow : "none",
        padding: "26px 28px",
        overflow: "hidden",
        cursor: interactive ? (drag.active ? "grabbing" : "grab") : "default",
        touchAction: "none",                 // stop the browser scrolling instead
        userSelect: "none",
        transform, transition,
        opacity: exit ? 0 : 1,
        zIndex: 10 - depth,
        willChange: "transform",
      }}
    >
      {interactive && (
        <>
          <Stamp label="LIKE" color="#22c55e" opacity={likeOp} rotate={-14} />
          <Stamp label="PASS" color="#ef4444" opacity={passOp} rotate={14} />
        </>
      )}
      {content}
    </div>
  );
});

export default SwipeCard;