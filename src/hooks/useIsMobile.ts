"use client";

import { useState, useEffect } from "react";

// maxTouchPoints > 0 → 터치 디바이스 (iOS/Android/태블릿 전부 포함)
// SSR 안전: 서버에서는 false, 클라이언트 마운트 후 확정
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(navigator.maxTouchPoints > 0);
  }, []);
  return isMobile;
}
