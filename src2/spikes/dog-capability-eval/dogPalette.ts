// AJP-004 dog capability eval — 로컬 팔레트.
// 제품 `src2/scene/palette.ts`를 import하지 않는다(격리 조건). 값도 공유하지 않는다.
//
// 색 가족은 사진(Pick/2026-08-01_비교_모델vs사진.png 오른쪽)의 블루멀 셸티에서 뽑았다:
//   · 코트는 **차가운 은회색** 바탕에 검정 얼룩. 파랑이 아니라 회색에 파란 기가 도는 정도다.
//   · 흰색은 순백이 아니라 미색이 섞인 크림 흰색. 갈기·앞가슴·양말·꼬리 끝.
//   · 황갈(탄)은 **눈썹·볼·다리 아래 악센트뿐**이다. 두개골에 갈색 덩어리는 없다(실패 조건).

export const FUR = {
  /** 멀 바탕 은회색 */
  silver: '#9DA6B1',
  /** 옆구리 쪽 한 단 밝은 은회색 */
  silverLight: '#B3BAC3',
  /** 검정 얼룩 둘레의 중간 톤 — 멀의 얼룩덜룩함은 이 헤일로가 만든다 */
  charcoal: '#4B515B',
  /** 얼룩 본색 */
  black: '#262A31',
  white: '#F1EFE9',
  /** 배·안쪽처럼 빛이 덜 드는 흰 면 */
  whiteShade: '#D8D5CE',
  tan: '#B98B5C',
  tanLight: '#CBA277',
  /** 귀 안쪽 */
  earInner: '#8D7B6C',
  /** 입술선 */
  lip: '#2B2C31',
  nose: '#191A1F',
} as const;

export const EYE = {
  /** 눈꺼풀 테두리 — 눈이 얼굴에 박혀 보이게 하는 어두운 링 */
  rim: '#2A2C32',
  /** 강아지 기준 왼쪽(−z) */
  irisBlue: '#7196BC',
  /** 강아지 기준 오른쪽(+z) */
  irisBrown: '#4C301D',
  pupil: '#0C0D10',
  highlight: '#F6F9FC',
} as const;

/**
 * flat=1 실루엣 모드 팔레트.
 * 목적은 "색을 지우고 윤곽만 본다"이므로 몸은 한 색으로 뭉갠다.
 * 다만 눈·코는 남긴다 — 얼굴 방향이 사라지면 실루엣 판정 자체가 어려워진다.
 */
export const FLAT = {
  body: '#242932',
  nose: '#79818E',
  rim: '#79818E',
  irisBlue: '#9BC2E4',
  irisBrown: '#C89A6C',
  pupil: '#242932',
  highlight: '#FFFFFF',
  ground: '#E8EAE5',
  rim3d: '#D3D6D0',
  bg: '#F3F5F4',
} as const;

/** 무대 — 조형 판정을 방해하지 않는 중성 파스텔. bloom/안개/파티클 없음. */
export const STAGE = {
  groundDay: '#DCE0D6',
  groundNight: '#5C6370',
  rimDay: '#BDB6A2',
  rimNight: '#3F4048',
  bgDay: '#EAEEF0',
  bgNight: '#171D28',
} as const;

/** 낮/밤 조명 프리셋. URL 상태에서 첫 프레임에 확정되며 전환 애니메이션이 없다(캡처 재현성). */
export const LIGHT = {
  day: {
    sun: { color: '#FFF4DE', intensity: 2.4, position: [1.9, 2.6, 1.7] as [number, number, number] },
    ambient: { color: '#DCE7F2', intensity: 0.36 },
    hemi: { sky: '#CFE1FF', ground: '#C8CEB6', intensity: 0.55 },
  },
  night: {
    sun: { color: '#B9CBF0', intensity: 0.8, position: [-1.5, 2.3, -1.2] as [number, number, number] },
    ambient: { color: '#4E5C7A', intensity: 0.34 },
    hemi: { sky: '#3D4E70', ground: '#2E3A32', intensity: 0.46 },
  },
} as const;
