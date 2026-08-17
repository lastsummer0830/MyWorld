// AJP-004 vegetation capability eval — 로컬 팔레트.
// 제품 `src2/scene/palette.ts`를 import하지 않는다(격리 조건). 값도 공유하지 않는다.
//
// reference에서 뽑은 색 가족:
//   나무(0c8a56...): 햇빛 받는 연둣빛 노랑 → 중간 초록 → 그늘 진초록, 줄기는 따뜻한 진갈색.
//   꽃(b8b8f3...): 하나의 색상 안에서 아래(짙음) → 위(옅음)로 이어지는 명도 사다리 + 어두운 목구멍.
// 색 수를 늘려 조형 부족을 가리지 않는다. 각 가족은 3~4단으로 묶는다.

export const WOOD = {
  /** 줄기 본체 */
  trunk: '#4C3828',
  /** 뿌리·근원부 — 흙에 가까워질수록 약간 밝고 탁하다 */
  root: '#5B452F',
  /** 1차 가지 */
  limb: '#453325',
  /** 2차 가지 — 가늘고 어둡게 빠진다 */
  twig: '#3A2B20',
} as const;

export type GreenFamily = { lit: string; mid: string; shade: string };

/** 수관 덩어리의 명도 가족. 위쪽 덩어리는 밝게, 아래·뒤 덩어리는 그늘로 묶는다. */
export const CANOPY: Record<'sunlit' | 'upper' | 'mid' | 'shade', GreenFamily> = {
  sunlit: { lit: '#D2DB63', mid: '#A9C048', shade: '#6F9038' },
  upper: { lit: '#C4D257', mid: '#98B542', shade: '#5F8433' },
  mid: { lit: '#AEC64C', mid: '#82A63C', shade: '#4E742E' },
  shade: { lit: '#8FB244', mid: '#648E34', shade: '#3E6229' },
};

/** 잎·줄기 초록. 꽃대와 로제트 잎이 같은 가족을 쓰되 명도만 갈린다. */
export const FOLIAGE = {
  stem: '#5A7F3C',
  stemPale: '#6F9247',
  leafTop: '#4E7A38',
  leafMid: '#3F6A31',
  leafDeep: '#2F5528',
  calyx: '#456F33',
  bud: '#B9CE86',
  budPale: '#DCE7B4',
} as const;

/**
 * 꽃차례 색 사다리. reference 3종(자주 / 산호 / 흰-분홍)을 그대로 옮긴다.
 * `deep`은 맨 아래 다 핀 꽃, `pale`은 위쪽 갓 핀 꽃, `throat`은 목구멍 그림자다.
 */
export type SpirePalette = {
  deep: string;
  mid: string;
  pale: string;
  inner: string;
  throat: string;
};

export const SPIRE_PALETTE: Record<'plum' | 'coral' | 'blush', SpirePalette> = {
  plum: { deep: '#5B2748', mid: '#8E4372', pale: '#C88BB4', inner: '#D7A6C6', throat: '#3A162C' },
  coral: { deep: '#9C2F2F', mid: '#D0574A', pale: '#F0A78C', inner: '#F6C3AA', throat: '#5E1A1C' },
  blush: { deep: '#9C6A6A', mid: '#D3A0A2', pale: '#F0DADA', inner: '#F7ECEA', throat: '#6B4344' },
};

/** 겹꽃(작약형) 3단계. 봉오리는 짙고 초록 심이 보이며, 활짝 필수록 옅어진다. */
export const PEONY_PALETTE = {
  bud: { outer: '#6E3160', mid: '#8E4A7C', inner: '#B07FA0', core: '#8FB16A' },
  half: { outer: '#E0836A', mid: '#F0A98B', inner: '#F8CDAE', core: '#CFE0A2' },
  open: { outer: '#EBD3D3', mid: '#F6E6E4', inner: '#FDF6F2', core: '#E8E2C0' },
} as const;

/** 무대 — 조형 판정을 방해하지 않는 중성 파스텔. */
export const STAGE = {
  groundDay: '#D8DEC6',
  groundNight: '#5A6270',
  soilDay: '#C3B49A',
  soilNight: '#514E4C',
  rimDay: '#B9A88C',
  rimNight: '#3F4048',
  bgDay: '#E9EEF0',
  bgNight: '#161C27',
} as const;

/** 낮/밤 조명 프리셋. URL 상태에서 바로 확정되며 전환 애니메이션이 없다(캡처 재현성). */
export const LIGHT = {
  day: {
    sun: { color: '#FFF4DE', intensity: 2.5, position: [9, 12, 6] as [number, number, number] },
    ambient: { color: '#DCE7F2', intensity: 0.34 },
    hemi: { sky: '#CFE1FF', ground: '#C6D2A4', intensity: 0.55 },
  },
  night: {
    sun: { color: '#B9CBF0', intensity: 0.75, position: [-7, 10, -5] as [number, number, number] },
    ambient: { color: '#4E5C7A', intensity: 0.32 },
    hemi: { sky: '#3D4E70', ground: '#2E3A32', intensity: 0.45 },
  },
} as const;
