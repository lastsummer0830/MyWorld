"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";

// ── 업적 정의 ─────────────────────────────────────────────────
export type AchievementId =
  | "first_step"
  | "look_up"
  | "dizzy"
  | "explorer"
  | "patience"
  | "moonwalk"
  | "do_not_touch"
  | "vandal"
  | "connoisseur"
  | "way_out";

export interface AchievementDef {
  id:    AchievementId;
  icon:  string;
  title: string;
  desc:  string;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  first_step: {
    id:    "first_step",
    icon:  "👣",
    title: "First Step",
    desc:  "첫 걸음을 떼셨네요. 환영합니다!",
  },
  look_up: {
    id:    "look_up",
    icon:  "👀",
    title: "Look Up",
    desc:  "천장에 뭐라도 있나요? 목 안 아파요?",
  },
  dizzy: {
    id:    "dizzy",
    icon:  "🌀",
    title: "Dizzy",
    desc:  "빙글빙글~ 어지럽지 않으세요?",
  },
  explorer: {
    id:    "explorer",
    icon:  "🧭",
    title: "Explorer",
    desc:  "안 가본 구석이 없으시네요",
  },
  patience: {
    id:    "patience",
    icon:  "⏳",
    title: "Patience",
    desc:  "가만히... 명상이라도 하시나요?",
  },
  moonwalk: {
    id:    "moonwalk",
    icon:  "🕴️",
    title: "Moonwalk",
    desc:  "뒤로 걸어서 탈출 성공! 혹시 마이클 잭슨?",
  },
  do_not_touch: {
    id:    "do_not_touch",
    icon:  "🏺",
    title: "Do Not Touch",
    desc:  "만지지 말랬잖아요!",
  },
  vandal: {
    id:    "vandal",
    icon:  "👟",
    title: "Vandal",
    desc:  "조각을 밟으셨네요. 아프겠다...",
  },
  connoisseur: {
    id:    "connoisseur",
    icon:  "🖼️",
    title: "Connoisseur",
    desc:  "작품을 전부 감상하셨군요. 안목이 좋으시네요",
  },
  way_out: {
    id:    "way_out",
    icon:  "🚪",
    title: "Way Out",
    desc:  "출구를 직접 찾아내셨네요",
  },
};

// ── 컨텍스트 ──────────────────────────────────────────────────
interface AchievementCtx {
  unlocked:  Set<AchievementId>;
  toasts:    { key: number; def: AchievementDef }[];
  unlock:    (id: AchievementId) => void;
  isUnlocked: (id: AchievementId) => boolean;
}

const AchievementContext = createContext<AchievementCtx>({
  unlocked:   new Set(),
  toasts:     [],
  unlock:     () => {},
  isUnlocked: () => false,
});

export const useAchievements = () => useContext(AchievementContext);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<Set<AchievementId>>(new Set());
  const [toasts, setToasts]     = useState<{ key: number; def: AchievementDef }[]>([]);
  const keyCounter              = useRef(0);
  const unlockedRef             = useRef<Set<AchievementId>>(new Set());

  const unlock = useCallback((id: AchievementId) => {
    // ref 가드 — StrictMode 이중 호출 / 중복 트리거 방지
    if (unlockedRef.current.has(id)) return;
    unlockedRef.current.add(id);

    setUnlocked(new Set(unlockedRef.current));

    const key = keyCounter.current++;
    const def = ACHIEVEMENTS[id];
    setToasts(t => [...t, { key, def }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.key !== key));
    }, 4000);
  }, []);

  const isUnlocked = useCallback((id: AchievementId) => unlocked.has(id), [unlocked]);

  return (
    <AchievementContext.Provider value={{ unlocked, toasts, unlock, isUnlocked }}>
      {children}
    </AchievementContext.Provider>
  );
}
