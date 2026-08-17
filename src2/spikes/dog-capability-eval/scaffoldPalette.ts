// AJP-004 dog capability eval — STAGE 1 무대 값.
//
// STAGE 1은 **형태만** 판정한다. 그래서 색 가족이 없다:
//   해부용 무광 중간회색 한 색 + 대비되는 중성 지면 + 그림자. 그게 전부다.
// 멀/탄/흰 무늬, 눈, 코 재질, 밤 모드, 블룸, 안개, 파티클은 여기 없어야 정상이다.
// (pass 1의 `dogPalette.ts`는 그 단계에서 쓰던 값이고 STAGE 1에서는 참조하지 않는다.)

export const SCAFFOLD = {
  /** 해부 재질 — 중간 회색. 밝은 지면과 붙어도 실루엣이 분리된다. */
  anatomy: '#8C9097',
  groundTop: '#E4E6E1',
  groundRim: '#C3C6C0',
  bg: '#F1F3F2',
} as const;

/** flat=1 — 조명 없는 단색 실루엣. 그림자도 끈다(윤곽 판정 방해). */
export const FLAT = {
  body: '#2B303A',
  groundTop: '#EDEFEE',
  groundRim: '#DDE0DE',
  bg: '#F5F7F6',
} as const;

/**
 * 3광원. 방향광 하나가 그림자와 면 대비를 만들고, 반구광이 아래쪽 면이
 * 새까맣게 죽는 것을 막는다. 그 이상은 조형 판정을 흐린다.
 */
export const LIGHT = {
  sun: { color: '#FFF6E6', intensity: 2.5, position: [1.9, 2.7, 1.6] as [number, number, number] },
  ambient: { color: '#DEE6F0', intensity: 0.34 },
  hemi: { sky: '#D6E3F5', ground: '#C9CDC2', intensity: 0.5 },
} as const;
