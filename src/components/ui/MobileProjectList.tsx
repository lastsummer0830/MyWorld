"use client";

import { useState } from "react";
import { PROJECTS_DATA } from "@/components/room/portfolioData";
import ProjectDetailPanel from "@/components/ui/ProjectDetailPanel";

interface Props {
  onClose: () => void;
}

export default function MobileProjectList({ onClose }: Props) {
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [closing, setClosing]         = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 320);
  };

  return (
    <>
      <style>{`
        @keyframes listSheetIn  { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes listSheetOut { from { transform: translateY(0); } to { transform: translateY(100%); } }
      `}</style>

      {/* 딤 오버레이 — 3D 씬이 위에 살짝 보임 */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 90,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      />

      {/* Bottom Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:   "fixed",
          bottom:     0,
          left:       0,
          right:      0,
          zIndex:     91,
          maxHeight:  "80dvh",
          backgroundColor: "#09071C",
          border:     "1px solid rgba(140,100,255,0.3)",
          borderRadius: "20px 20px 0 0",
          boxShadow:  "0 -8px 40px rgba(100,60,255,0.2)",
          display:    "flex",
          flexDirection: "column",
          animation:  closing
            ? "listSheetOut 0.32s cubic-bezier(0.22,1,0.36,1) both"
            : "listSheetIn  0.42s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* 드래그 핸들 */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0" }}>
          <div style={{ width: "2.5rem", height: "4px", borderRadius: "2px", background: "rgba(140,100,255,0.35)" }} />
        </div>

        {/* 헤더 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.9rem 1.4rem",
          borderBottom: "1px solid rgba(140,100,255,0.15)",
        }}>
          <span style={{ color: "#C8B0FF", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.2em" }}>
            PROJECTS
          </span>
          <button
            onClick={handleClose}
            style={{
              background: "none", border: "1px solid rgba(140,100,255,0.3)",
              borderRadius: "50%", width: "2rem", height: "2rem",
              color: "rgba(200,180,255,0.7)", cursor: "pointer", fontSize: "0.85rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* 프로젝트 카드 목록 */}
        <div
          style={{ overflowY: "auto", padding: "0.8rem 1rem", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          className="scroll-momentum"
        >
          {PROJECTS_DATA.map((proj, i) => (
            <button
              key={i}
              onClick={() => setDetailIndex(i)}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        "0.85rem",
                width:      "100%",
                padding:    "0.9rem",
                marginBottom: "0.6rem",
                background: "rgba(255,255,255,0.03)",
                border:     "1px solid rgba(140,100,255,0.13)",
                borderRadius: "12px",
                cursor:     "pointer",
                textAlign:  "left",
              }}
            >
              {/* 썸네일 */}
              <div style={{
                width: "64px", height: "48px", borderRadius: "8px",
                flexShrink: 0, overflow: "hidden",
                background: "rgba(100,60,200,0.18)",
                border: "1px solid rgba(140,100,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {proj.images?.[0] ? (
                  <img
                    src={proj.images[0]} alt={proj.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "1.2rem" }}>💻</span>
                )}
              </div>

              {/* 텍스트 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <p style={{ margin: 0, color: "#D8D0FF", fontSize: "0.92rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {proj.title}
                  </p>
                  <span style={{
                    flexShrink: 0, fontSize: "0.62rem", padding: "0.12rem 0.45rem", borderRadius: "4px",
                    color:       proj.status === "completed" ? "#70D0A0" : "#F0B040",
                    background:  proj.status === "completed" ? "rgba(70,200,120,0.12)" : "rgba(240,180,40,0.12)",
                    border:      `1px solid ${proj.status === "completed" ? "rgba(70,200,120,0.25)" : "rgba(240,180,40,0.25)"}`,
                  }}>
                    {proj.status === "completed" ? "완료" : "진행중"}
                  </span>
                </div>
                <p style={{ margin: 0, color: "rgba(180,170,220,0.6)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {proj.skills.slice(0, 3).join(" · ")}
                </p>
              </div>

              <span style={{ color: "rgba(140,100,255,0.5)", fontSize: "1rem", flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* 프로젝트 상세 패널 */}
      {detailIndex !== null && PROJECTS_DATA[detailIndex] && (
        <ProjectDetailPanel
          project={PROJECTS_DATA[detailIndex] as any}
          onClose={() => setDetailIndex(null)}
        />
      )}
    </>
  );
}
