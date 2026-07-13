// ── 갤러리 폰트 경로 (/public/fonts/ 기준) ───────────────────
// 실제 사용하는 4개만 평탄하게 보관 (안 쓰는 weight/italic/variable 제거됨)

const BASE = "/fonts";

export const FONT_EN_LIGHT   = `${BASE}/JosefinSans-Light.ttf`;
export const FONT_EN_REGULAR = `${BASE}/JosefinSans-Regular.ttf`;
export const FONT_EN_SEMI    = `${BASE}/JosefinSans-SemiBold.ttf`;
export const FONT_KR         = `${BASE}/NotoSansKR-Regular.ttf`;

/** 텍스트에 한글이 포함되면 KR 폰트, 아니면 EN 폰트 반환 */
export function pickFont(text: string, weight: "light" | "regular" | "semi" = "regular"): string {
  if (/[가-힯]/.test(text)) return FONT_KR;
  return weight === "light" ? FONT_EN_LIGHT
       : weight === "semi"  ? FONT_EN_SEMI
       : FONT_EN_REGULAR;
}
