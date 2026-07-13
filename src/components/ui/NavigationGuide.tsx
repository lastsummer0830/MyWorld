"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function NavigationGuide() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 3200);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const fadeTimer = setTimeout(() => setFading(true), 5000);
    const hideTimer = setTimeout(() => setVisible(false), 6200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      onClick={() => { setFading(true); setTimeout(() => setVisible(false), 1000); }}
      style={{
        position:   "fixed",
        inset:      0,
        zIndex:     50,
        display:    "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom) + 72px)" : "6vh",
        pointerEvents: "auto",
        opacity:    fading ? 0 : 1,
        transition: "opacity 1.2s ease",
      }}
    >
      <div style={styles.card}>
        <div style={styles.starRow}>
          {["✦", "·", "✦", "·", "✦"].map((s, i) => (
            <span key={i} style={{ opacity: i % 2 === 0 ? 0.8 : 0.3 }}>{s}</span>
          ))}
        </div>

        {isMobile ? <MobileGuide /> : <PcGuide />}

        <p style={styles.dismiss}>탭하면 닫힙니다</p>
      </div>
    </div>
  );
}

// ── PC 안내 ───────────────────────────────────────────────────
function PcGuide() {
  return (
    <div style={styles.guides}>
      <GuideItem icon={<MouseIcon highlight="left" />} label="좌클릭 드래그" desc="시점 회전" />
      <Divider />
      <GuideItem icon={<MouseIcon highlight="right" />} label="우클릭 드래그" desc="시점 이동" />
      <Divider />
      <GuideItem icon={<MouseIcon highlight="scroll" />} label="스크롤" desc="줌 인/아웃" />
      <Divider />
      <GuideItem icon={<span style={styles.clickIcon}>✦</span>} label="오브젝트 클릭" desc="인터랙션" />
    </div>
  );
}

// ── 모바일 안내 ───────────────────────────────────────────────
function MobileGuide() {
  return (
    <div style={styles.guides}>
      <GuideItem icon={<TouchIcon type="drag" />} label="드래그" desc="시점 회전" />
      <Divider />
      <GuideItem icon={<TouchIcon type="pinch" />} label="핀치" desc="줌 인/아웃" />
      <Divider />
      <GuideItem icon={<TouchIcon type="tap" />} label="탭" desc="인터랙션" />
    </div>
  );
}

// ── 아이콘 컴포넌트 ───────────────────────────────────────────
function GuideItem({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div style={styles.guideItem}>
      <div style={styles.iconWrap}>{icon}</div>
      <div style={styles.guideText}>
        <p style={styles.guideLabel}>{label}</p>
        <p style={styles.guideDesc}>{desc}</p>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={styles.dividerV} />;
}

function MouseIcon({ highlight }: { highlight: "left" | "right" | "scroll" }) {
  const C = { border: "rgba(140,100,255,0.35)", accent: "rgba(170,255,68,0.7)", dim: "rgba(140,100,255,0.3)" };
  return (
    <div style={{ width:"1.4rem", height:"2rem", border:`1.5px solid ${C.border}`, borderRadius:"0.7rem", position:"relative", display:"flex", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"0.28rem", left:"50%", transform:"translateX(-50%)", width:"0.22rem", height:"0.45rem", borderRadius:"2px", background: highlight === "scroll" ? C.accent : C.dim }} />
      <div style={{ flex:1, background: highlight === "left" ? "rgba(170,255,68,0.2)" : "transparent", borderRight:`0.5px solid ${C.border}`, marginTop:"0.7rem", borderRadius:"0 0 0 0.5rem" }} />
      <div style={{ flex:1, background: highlight === "right" ? "rgba(140,100,255,0.2)" : "transparent", marginTop:"0.7rem", borderRadius:"0 0 0.5rem 0" }} />
    </div>
  );
}

function TouchIcon({ type }: { type: "drag" | "pinch" | "tap" }) {
  const accent = "rgba(170,255,68,0.85)";
  const dim    = "rgba(170,255,68,0.35)";

  if (type === "drag") return (
    <div style={{ position:"relative", width:"2rem", height:"2rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:"1.3rem", lineHeight:1 }}>☝️</span>
      <span style={{ position:"absolute", bottom:0, right:0, fontSize:"0.55rem", color:accent, fontWeight:700 }}>↻</span>
    </div>
  );

  if (type === "pinch") return (
    <div style={{ width:"2rem", height:"2rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.1rem" }}>
      <span style={{ fontSize:"1rem", transform:"scaleX(-1)" }}>🤏</span>
    </div>
  );

  return (
    <div style={{ width:"2rem", height:"2rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:"1.3rem" }}>👆</span>
    </div>
  );
}

// ── 스타일 ────────────────────────────────────────────────────
const C = {
  bg:      "#08071A",
  border:  "rgba(140,100,255,0.35)",
  accent:  "#AAFF44",
  dim:     "rgba(160,150,200,0.5)",
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: C.bg,
    border:          `1px solid ${C.border}`,
    borderRadius:    "16px",
    boxShadow:       `0 0 40px rgba(100,60,255,0.2), 0 0 80px rgba(60,20,120,0.1)`,
    padding:         "1.2rem 1.6rem",
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    gap:             "1rem",
    backdropFilter:  "blur(8px)",
    cursor:          "pointer",
    maxWidth:        "calc(100vw - 2rem)",
  },
  starRow: {
    display: "flex", gap: "0.5rem",
    color: C.accent, fontSize: "0.7rem", letterSpacing: "0.2em",
  },
  guides: {
    display: "flex", alignItems: "center", gap: "1.2rem",
  },
  guideItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem",
  },
  iconWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "2.4rem", height: "2.4rem",
  },
  clickIcon: {
    fontSize: "1.6rem", color: C.accent,
    filter: "drop-shadow(0 0 6px rgba(170,255,68,0.6))",
  },
  guideText: { textAlign: "center" },
  guideLabel: {
    color: C.accent, fontSize: "0.72rem", fontWeight: 600,
    letterSpacing: "0.06em", margin: 0,
  },
  guideDesc: {
    color: C.dim, fontSize: "0.65rem", margin: "0.15rem 0 0",
  },
  dividerV: {
    width: "1px", height: "3.5rem",
    background: `linear-gradient(to bottom, transparent, ${C.border}, transparent)`,
  },
  dismiss: {
    color: C.dim, fontSize: "0.62rem", letterSpacing: "0.08em", margin: 0,
  },
};
