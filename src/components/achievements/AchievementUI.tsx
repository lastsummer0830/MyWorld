"use client";

import { useState } from "react";
import { useAchievements, ACHIEVEMENTS, AchievementId } from "./AchievementContext";

// ── 토스트 알림 (게임 업적 스타일) ────────────────────────────
export function AchievementToasts() {
  const { toasts } = useAchievements();

  return (
    <>
      <style>{`
        @keyframes achToastIn {
          0%   { opacity: 0; transform: translateX(120%) scale(0.9); }
          60%  { opacity: 1; transform: translateX(-8%)  scale(1.02); }
          100% { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>
      <div style={{
        position: "fixed", top: "4rem", right: "1.4rem",
        zIndex: 200,
        display: "flex", flexDirection: "column", gap: "0.6rem",
        pointerEvents: "none",
      }}>
        {toasts.map(({ key, def }) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: "0.9rem",
            minWidth: "270px",
            padding: "0.85rem 1.1rem",
            background: "linear-gradient(135deg, rgba(28,24,18,0.96), rgba(44,36,24,0.96))",
            border: "1px solid rgba(220,180,90,0.5)",
            borderRadius: "12px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.4), 0 0 16px rgba(220,180,90,0.15)",
            animation: "achToastIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}>
            <div style={{
              fontSize: "1.8rem", lineHeight: 1,
              filter: "drop-shadow(0 0 6px rgba(255,210,120,0.5))",
            }}>
              {def.icon}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <span style={{
                color: "#E8C870", fontSize: "0.68rem", fontWeight: 700,
                letterSpacing: "0.14em",
              }}>
                🏆 업적 달성
              </span>
              <span style={{ color: "#FFF4E0", fontSize: "0.95rem", fontWeight: 700 }}>
                {def.title}
              </span>
              <span style={{ color: "rgba(220,210,190,0.7)", fontSize: "0.76rem" }}>
                {def.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── 업적 목록 패널 (트로피 버튼 → 토글) ───────────────────────
export function AchievementPanel() {
  const { isUnlocked, unlocked } = useAchievements();
  const [open, setOpen] = useState(false);

  const ids       = Object.keys(ACHIEVEMENTS) as AchievementId[];
  const total     = ids.length;
  const doneCount = unlocked.size;

  return (
    <>
      {/* 트로피 버튼 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", top: "1.4rem", right: "1.4rem",
          zIndex: 60,
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.55rem 0.95rem",
          background: "rgba(28,24,18,0.82)",
          border: "1px solid rgba(220,180,90,0.4)",
          borderRadius: "999px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          color: "#E8C870", fontSize: "0.72rem", fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        🏆 {doneCount}/{total}
      </button>

      {/* 패널 */}
      {open && (
        <div style={{
          position: "fixed", top: "3.8rem", right: "1.4rem",
          zIndex: 60,
          width: "300px",
          background: "rgba(20,17,12,0.94)",
          border: "1px solid rgba(220,180,90,0.3)",
          borderRadius: "14px",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          padding: "1rem",
          display: "flex", flexDirection: "column", gap: "0.55rem",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "0.3rem",
          }}>
            <span style={{ color: "#E8C870", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em" }}>
              ACHIEVEMENTS
            </span>
            <span style={{ color: "rgba(220,200,160,0.5)", fontSize: "0.72rem" }}>
              {doneCount} / {total}
            </span>
          </div>

          {ids.map(id => {
            const def  = ACHIEVEMENTS[id];
            const done = isUnlocked(id);
            return (
              <div key={id} style={{
                display: "flex", alignItems: "center", gap: "0.7rem",
                padding: "0.5rem 0.6rem",
                borderRadius: "8px",
                background: done ? "rgba(220,180,90,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${done ? "rgba(220,180,90,0.25)" : "rgba(255,255,255,0.05)"}`,
                opacity: done ? 1 : 0.5,
              }}>
                <div style={{ fontSize: "1.3rem", filter: done ? "none" : "grayscale(1)" }}>
                  {done ? def.icon : "🔒"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                  <span style={{ color: done ? "#FFF4E0" : "rgba(200,195,180,0.7)", fontSize: "0.82rem", fontWeight: 600 }}>
                    {def.title}
                  </span>
                  <span style={{ color: "rgba(200,190,170,0.55)", fontSize: "0.7rem" }}>
                    {done ? def.desc : "???"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
