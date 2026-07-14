// 아이소메트릭 씬의 기하 상수 — 카메라 각도와 타일 단위의 유일한 정본.
// 여기 값을 바꾸면 씬 전체의 문법이 바뀐다. 개별 컴포넌트에서 각도·거리를 다시 계산하지 않는다.

import * as THREE from 'three';

/** 월드 1타일 = 1 유닛. 모든 오브젝트의 발밑 좌표는 이 격자에 스냅한다. */
export const TILE = 1;

/**
 * 정원 판 한 변의 타일 수 = 미터.
 * ★ 이 판이 주인공이다. 바깥 풍경은 어디까지나 배경 — 첫 화면에서 판이 화면을 지배해야 한다.
 * 32m는 퍼걸러·연못·나무다리·꽃밭·집 외관이 다 들어가고 강아지가 뛸 여백까지 남는다.
 */
export const GRID = 32;

/** 잔디층 두께. */
export const GRASS_H = 0.8;

/** 흙 단면 두께 — 가장자리가 층으로 보여야 "땅을 도려내 온 조각"으로 읽힌다. */
export const SLAB_H = 1.6;

/** 카메라 거리. ortho라 크기에는 영향이 없고, 잘림(near/far) 여유를 만드는 값이다. */
export const CAM_D = 20;

/**
 * 내려보는 각 30° (게임식 2:1 디메트릭).
 * ★ 아이소메트릭 룩을 만드는 건 "카메라를 고정하는 것"이 아니라 "직교 투영(원근 왜곡 없음)"이다.
 *   그래서 마우스로 360° 돌려도 미니어처 느낌은 유지된다. 부각만 이 값으로 잠근다.
 */
export const CAM_ELEV_DEG = 30;

/** OrbitControls의 polar angle(+Y축 기준)로 환산한 값. 이 각으로 상·하를 잠근다. */
export const CAM_POLAR = THREE.MathUtils.degToRad(90 - CAM_ELEV_DEG);

/** 초기 카메라 위치 — 수평 45°, 부각 30°. */
export const CAM_POS: [number, number, number] = [
  CAM_D,
  CAM_D * Math.SQRT2 * Math.tan(THREE.MathUtils.degToRad(CAM_ELEV_DEG)),
  CAM_D,
];

/**
 * 첫 화면의 배율 — 정원 판이 화면을 꽉 채우게 잡는다.
 * 45° 회전된 판이라 화면상 가로폭은 한 변의 √2배, 세로는 거기에 부각 30°의 sin(=0.5)이 곱해진다.
 * 여백을 남기면 판이 작아 보이고 바깥 풍경에 시선을 뺏긴다 — 판이 주인공이므로 꽉 채운다.
 */
export const fitZoom = (w: number, h: number) => {
  const sceneW = GRID * TILE * Math.SQRT2;
  const sceneH = sceneW * 0.5 + (GRASS_H + SLAB_H);
  return Math.min(w / sceneW, h / sceneH) * 1.0;
};

/** 휠 확대 범위 — 기본 배율 대비 배수. 축소 쪽을 넉넉히 열어 정원 전경까지 물러날 수 있게 한다. */
export const ZOOM_MIN = 0.22;
export const ZOOM_MAX = 5.0;

/** 오브젝트를 클릭해 "안으로 들어갔을 때"의 배율. */
export const ZOOM_FOCUS = 2.6;

/** 주광 위치 — 두 면의 명암이 갈려야 입체감이 생긴다. */
export const SUN_POS: [number, number, number] = [-9, 14, -6];

/** 좌표를 타일 격자에 맞춘다. */
export const snap = (v: number) => Math.round(v / TILE) * TILE;
