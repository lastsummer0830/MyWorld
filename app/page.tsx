"use client";

import dynamic from "next/dynamic";
import { Component, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { DayNightProvider }  from "@/components/canvas/DayNightContext";
import { WeatherProvider }   from "@/components/canvas/WeatherContext";
import { SceneProvider, useScene } from "@/components/canvas/SceneContext";
import { AchievementProvider, useAchievements } from "@/components/achievements/AchievementContext";
import { AchievementPanel } from "@/components/achievements/AchievementUI";
import DayNightTransition    from "@/components/canvas/DayNightButton";
import WeatherButton         from "@/components/canvas/WeatherButton";
import PortfolioModal, { ModalType } from "@/components/ui/PortfolioModal";
import ProjectDetailPanel    from "@/components/ui/ProjectDetailPanel";
import MobileProjectList     from "@/components/ui/MobileProjectList";
import NavigationGuide       from "@/components/ui/NavigationGuide";
import NavMenu               from "@/components/ui/NavMenu";
import { PROJECTS_DATA }     from "@/components/room/portfolioData";
import { useIsMobile }       from "@/hooks/useIsMobile";

// ── WebGL 에러 바운더리 ───────────────────────────────────────
class WebGLErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{
        width: "100vw", height: "100vh", background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "1rem",
      }}>
        <p style={{ color: "rgba(180,160,255,0.9)", fontSize: "1rem", letterSpacing: "0.05em" }}>
          이 포트폴리오는 WebGL 환경이 필요합니다.
        </p>
        <p style={{ color: "rgba(140,120,200,0.6)", fontSize: "0.8rem", letterSpacing: "0.08em" }}>
          Chrome / Firefox / Edge 최신 버전에서 접속해주세요.
        </p>
      </div>
    );
  }
}

const SceneContainer = dynamic(() => import("@/components/canvas/SceneContainer"), {
  ssr: false,
  loading: () => (
    <div style={{ width:"100%", height:"100%", backgroundColor:"#000000", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"1rem" }}>
      <div style={{ width:"2.5rem", height:"2.5rem", border:"3px solid rgba(140,100,255,0.6)", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
      <p style={{ color:"rgba(180,160,255,0.6)", fontSize:"0.85rem", letterSpacing:"0.1em" }}>LOADING...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

// ── 루트 ─────────────────────────────────────────────────────
export default function Home() {
  return (
    <SceneProvider>
      <AchievementProvider>
        <DayNightProvider>
          <WeatherProvider>
            <SceneContent />
          </WeatherProvider>
        </DayNightProvider>
      </AchievementProvider>
    </SceneProvider>
  );
}

// ── 내부 컨텐츠 (SceneContext 사용) ───────────────────────────
function SceneContent() {
  const isMobile = useIsMobile();
  const [modal, setModal] = useState<ModalType | null>(null);
  const [projectListOpen, setProjectListOpen] = useState(false);
  const { mode, flash, enterMuseum, exitMuseum } = useScene();
  const { unlock } = useAchievements();
  const [isLocked, setIsLocked] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const visitedExhibits = useRef<Set<number>>(new Set());

  const inMuseum = mode === "museum";

  // 포인터 락 상태 추적 (PC 전용)
  useEffect(() => {
    if (isMobile) return;
    const onChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, [isMobile]);

  // 전시물 상세 열기 브릿지 (박물관 → DOM)
  useEffect(() => {
    (window as any).__openProjectDetail = (index: number) => {
      setDetailIndex(index);
      visitedExhibits.current.add(index);
      if (visitedExhibits.current.size >= PROJECTS_DATA.length) {
        unlock("connoisseur");
      }
    };
    return () => { (window as any).__openProjectDetail = undefined; };
  }, [unlock]);

  return (
    <>
      {/* 포트폴리오 모달 브릿지 */}
      <OpenModalBridge
        onOpen={setModal}
        onEnterMuseum={enterMuseum}
        onOpenProjectList={() => setProjectListOpen(true)}
      />

      <main style={{ width:"100vw", height:"100vh", overflow:"hidden", position:"relative", backgroundColor:"#000000" }}>
        <WebGLErrorBoundary>
          <SceneContainer />
        </WebGLErrorBoundary>

        {/* 방 UI (박물관 모드에서 숨김) */}
        {!inMuseum && (
          <>
            <NavMenu />
            <DayNightTransition />
            <WeatherButton />
            <NavigationGuide />
          </>
        )}

        {/* ── 박물관 UI (PC 전용) ── */}
        {inMuseum && !isMobile && (
          <>
            <AchievementPanel />

            {/* 포인터 락 안내 */}
            {!isLocked && detailIndex === null && (
              <div
                onClick={() => document.querySelector("canvas")?.requestPointerLock()}
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "12px",
                  padding: "1.2rem 2rem",
                  textAlign: "center",
                  display: "flex", flexDirection: "column", gap: "0.5rem",
                  pointerEvents: "none",
                }}>
                  <p style={{ color: "#fff", fontSize: "0.95rem", letterSpacing: "0.06em", margin: 0 }}>
                    클릭해서 갤러리 탐색
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", letterSpacing: "0.04em", margin: 0 }}>
                    WASD 이동 · 마우스 시점 · E 나가기
                  </p>
                </div>
              </div>
            )}

            {/* 크로스헤어 */}
            {isLocked && (
              <div style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none", zIndex: 50,
              }}>
                <div style={{ position: "absolute", width: 14, height: 1.5, background: "rgba(255,255,255,0.85)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 2px rgba(0,0,0,0.8)" }} />
                <div style={{ position: "absolute", width: 1.5, height: 14, background: "rgba(255,255,255,0.85)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 2px rgba(0,0,0,0.8)" }} />
                <div style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "#fff", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
              </div>
            )}

            {/* 나가기 버튼 */}
            <button
              onClick={exitMuseum}
              style={{
                position: "absolute", top: "1.4rem", left: "1.4rem", zIndex: 40,
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.6rem 1.1rem",
                background: "rgba(255,255,255,0.88)",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: "999px",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 700, color: "#333", letterSpacing: "0.08em",
              }}
            >
              ← 나가기
            </button>
          </>
        )}
      </main>

      {/* 씬 전환 플래시 오버레이 */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "#ffffff",
        opacity: flash ? 1 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: "none",
      }} />

      {/* 모바일 프로젝트 목록 */}
      {projectListOpen && (
        <MobileProjectList onClose={() => setProjectListOpen(false)} />
      )}

      {/* 프로젝트 상세 패널 (박물관 전시물 클릭) */}
      {detailIndex !== null && PROJECTS_DATA[detailIndex] && (
        <ProjectDetailPanel
          project={PROJECTS_DATA[detailIndex] as any}
          onClose={() => setDetailIndex(null)}
        />
      )}

      {/* 포트폴리오 모달 */}
      {modal && (
        <PortfolioModal type={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}

function OpenModalBridge({ onOpen, onEnterMuseum, onOpenProjectList }: {
  onOpen:             (t: ModalType) => void;
  onEnterMuseum:      () => void;
  onOpenProjectList:  () => void;
}) {
  if (typeof window !== "undefined") {
    (window as any).__openPortfolioModal = onOpen;
    (window as any).__enterMuseum        = onEnterMuseum;
    (window as any).__openProjectList    = onOpenProjectList;
  }
  return null;
}
