"use client";

import { createContext, useContext, useState, useCallback } from "react";

// ── 낮/밤 조명 프리셋 (여름 정원 기준) ────────────────────
export const PRESETS = {
  day: {
    ambientColor:     "#FFF4DC", // 따뜻하고 쨍한 여름 햇살 (웜 화이트)
    ambientIntensity: 0.5,       // 잔디 위 밝은 낮 분위기
    dirColor:         "#FFE9B8", // 살짝 골드가 도는 직사광
    dirIntensity:     2.5,
    pointColor:       "#FF9944",
    pointIntensity:   1.8,
  },
  night: {
    ambientColor:     "#1C2238", // 짙은 네이비의 여름밤 (겨울보다 살짝 온화)
    ambientIntensity: 0.4,       // 밤에도 정원 실루엣이 보이도록 유지
    dirColor:         "#4A5A9A", // 은은한 달빛
    dirIntensity:     0.8,
    pointColor:       "#FFD580", // 따뜻한 가로등 톤
    pointIntensity:   4.5,       // 밤에 가로등이 더 밝게 보이도록
  },
} as const;

export type Mode = "day" | "night";

interface DayNightCtx {
  mode:            Mode;
  toggle:          () => void;
  isTransitioning: boolean;
}

const DayNightContext = createContext<DayNightCtx>({
  mode:            "day",
  toggle:          () => {},
  isTransitioning: false,
});

export function useDayNight() {
  return useContext(DayNightContext);
}

export function DayNightProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("day");

  const toggle = useCallback(() => {
    setMode(prev => prev === "day" ? "night" : "day");
  }, []);

  return (
    <DayNightContext.Provider value={{ mode, toggle, isTransitioning: false }}>
      {children}
    </DayNightContext.Provider>
  );
}