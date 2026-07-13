/**
 * Performance.ts
 */

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // 터치 디바이스(모바일/태블릿)는 3D 렌더 부담이 크므로 저사양으로 처리
  if (navigator.maxTouchPoints > 0) return true;
  return (navigator.hardwareConcurrency ?? 4) <= 4;
}

const LOW_END = isLowEndDevice();
export const LOW_END_DEVICE = LOW_END;

export const CANVAS_PERF = {
  dpr: [1, LOW_END ? 1 : 2] as [number, number],
  gl: {
    antialias:       !LOW_END,
    powerPreference: "high-performance" as const,
    stencil:         false,
    depth:           true,
  },
} as const;

export const ENV_PERF = {
  preset:     "sunset" as const,
  background: false,
  blur:       0.5,
  resolution: LOW_END ? 64 : 128,
} as const;

export const FRAMELOOP_ALWAYS = "always" as const;
export const FRAMELOOP_DEMAND = "demand" as const;
