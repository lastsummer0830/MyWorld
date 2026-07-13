"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export interface ProjectDetail {
  title:       string;
  period:      string;
  status:      "completed" | "inprogress";
  images:      string[];
  summary:     string;
  background?: string;
  approach?:   string;
  features:    string[];
  skills:      string[];
  link?:       string;
  github?:     string;
}

interface Props {
  project: ProjectDetail;
  onClose: () => void;
}

export default function ProjectDetailPanel({ project, onClose }: Props) {
  const isMobile              = useIsMobile();
  const [idx, setIdx]         = useState(0);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const imgs       = project.images ?? [];
  const statusDone = project.status === "completed";

  // 모바일: 이미지 높이 작게, 전체화면 패널
  const imgH      = isMobile ? "200px" : "300px";
  const panelStyle: React.CSSProperties = isMobile
    ? { width: "100%", height: "100%", borderRadius: 0 }
    : { width: "min(680px, 92vw)", maxHeight: "88vh", borderRadius: "16px" };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
        background: "rgba(10,12,18,0.6)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        animation: closing ? "pdpFadeOut 0.28s ease both" : "pdpFadeIn 0.28s ease both",
      }}
    >
      <style>{`
        @keyframes pdpFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pdpFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes pdpPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes pdpSheetIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...panelStyle,
          background: "rgba(248,247,244,0.98)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          animation: closing ? "none" : isMobile
            ? "pdpSheetIn 0.38s cubic-bezier(0.22,1,0.36,1) both"
            : "pdpPanelIn 0.34s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* ── 이미지 영역 ── */}
        <div style={{ position: "relative", width: "100%", height: imgH, background: "#1a1814", flexShrink: 0 }}>
          {imgs.length > 0 ? (
            <img
              src={imgs[idx]} alt={`${project.title}-${idx}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
              NO PREVIEW
            </div>
          )}

          {imgs.length > 1 && (
            <>
              <button onClick={() => setIdx(p => (p - 1 + imgs.length) % imgs.length)} style={carouselBtn("left")}>‹</button>
              <button onClick={() => setIdx(p => (p + 1) % imgs.length)} style={carouselBtn("right")}>›</button>
              <div style={{ position: "absolute", bottom: "0.7rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.35rem" }}>
                {imgs.map((_, i) => (
                  <div key={i} onClick={() => setIdx(i)} style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                  }} />
                ))}
              </div>
            </>
          )}

          <button onClick={handleClose} style={{
            position: "absolute", top: "0.8rem", right: "0.8rem",
            width: "2rem", height: "2rem", borderRadius: "50%",
            background: "rgba(0,0,0,0.45)", border: "none", color: "#fff",
            cursor: "pointer", fontSize: "0.9rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* ── 내용 영역 ── */}
        <div
          style={{
            padding: isMobile ? "1.1rem 1.2rem" : "1.4rem 1.6rem",
            overflowY: "auto",
            paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom) + 1.2rem)" : "1.4rem",
          }}
          className="scroll-momentum"
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? "1.2rem" : "1.4rem", fontWeight: 800, color: "#1a1814", letterSpacing: "-0.01em" }}>
              {project.title}
            </h2>
            <span style={{
              flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
              padding: "0.25rem 0.6rem", borderRadius: "6px",
              color: statusDone ? "#2f7d52" : "#9a6b15",
              background: statusDone ? "rgba(70,170,110,0.14)" : "rgba(210,160,60,0.16)",
            }}>
              {statusDone ? "✓ COMPLETED" : "⟳ IN PROGRESS"}
            </span>
          </div>
          <p style={{ margin: "0 0 1rem", color: "#8a8478", fontSize: "0.82rem" }}>{project.period}</p>

          <p style={{ margin: "0 0 1.2rem", color: "#3a362e", fontSize: "0.95rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {project.summary}
          </p>

          {project.background && (
            <>
              <SectionLabel>💡 왜 만들었나</SectionLabel>
              <p style={{ margin: "0 0 1.2rem", color: "#4a463e", fontSize: "0.9rem", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                {project.background}
              </p>
            </>
          )}

          {project.approach && (
            <>
              <SectionLabel>🛠 어떻게 만들었나</SectionLabel>
              <p style={{ margin: "0 0 1.2rem", color: "#4a463e", fontSize: "0.9rem", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                {project.approach}
              </p>
            </>
          )}

          {project.features.length > 0 && (
            <>
              <SectionLabel>주요 기능</SectionLabel>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.2rem" }}>
                {project.features.map((f, i) => (
                  <li key={i} style={{ position: "relative", paddingLeft: "1.2rem", marginBottom: "0.4rem", color: "#4a463e", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    <span style={{ position: "absolute", left: 0, color: "#9a7d4a" }}>▸</span>
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}

          {project.skills.length > 0 && (
            <>
              <SectionLabel>기술 스택</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.4rem" }}>
                {project.skills.map((sk, i) => (
                  <span key={i} style={{
                    fontSize: "0.76rem", padding: "0.25rem 0.65rem", borderRadius: "6px",
                    background: "rgba(80,100,150,0.1)", border: "1px solid rgba(80,100,150,0.2)",
                    color: "#46506e", letterSpacing: "0.02em",
                  }}>{sk}</span>
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer" style={linkBtn(false)}>◈ GitHub</a>
            )}
            {project.link && (
              <a href={project.link} target="_blank" rel="noreferrer" style={linkBtn(true)}>↗ 사이트 방문</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
      <span style={{ color: "#9a7d4a", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em" }}>
        ✦ {children}
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(150,125,74,0.3), transparent)" }} />
    </div>
  );
}

const carouselBtn = (side: "left" | "right"): React.CSSProperties => ({
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  [side]: "0.6rem",
  width: "2.2rem", height: "2.2rem", borderRadius: "50%",
  background: "rgba(0,0,0,0.5)", border: "none", color: "#fff",
  fontSize: "1.5rem", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
});

const linkBtn = (primary: boolean): React.CSSProperties => ({
  display: "inline-block", textDecoration: "none",
  fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.03em",
  padding: "0.55rem 1.1rem", borderRadius: "8px",
  color: primary ? "#fff" : "#3a362e",
  background: primary ? "#3a4a6e" : "rgba(0,0,0,0.05)",
  border: primary ? "1px solid #3a4a6e" : "1px solid rgba(0,0,0,0.12)",
});
