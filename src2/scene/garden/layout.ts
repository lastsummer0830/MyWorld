// 정원 배치 정본 — 오브젝트가 놓이는 자리를 여기 한 곳에 모은다.
// 좌표는 [x, z] (월드 미터). x+ 는 화면 오른쪽, z+ 는 카메라 앞쪽.
// 배치는 ISLAND_R_SAFE(약 18m) 원 안에서만 — 그 바깥은 가장자리가 불규칙해 땅이 없을 수 있다.

export type Spot = { pos: [number, number]; rotY?: number };

const D = Math.PI / 180;

/** 주요 구조물·생물의 자리. */
export const GARDEN = {
  // 중앙 살짝 뒤 — 정원의 중심. 그네벤치가 카메라를 향하도록 돌린다.
  pergola: { pos: [-3.5, -3], rotY: 45 * D } as Spot,
  // 카메라 앞쪽 — 맥북이 놓인 티테이블(포트폴리오 진입점)이 가장 잘 보이는 자리.
  teaTable: { pos: [5, 5.5], rotY: -18 * D } as Spot,
  // 오른쪽 뒤 — 연못 + 나무다리.
  pond: { pos: [9, -8], rotY: 0 } as Spot,
  // 왼쪽 뒤 구석 — 집 외관은 배경 오브젝트.
  house: { pos: [-11.5, -8], rotY: 18 * D } as Spot,
  // 티테이블 근처 — 나비를 보며 노는 강아지(주인공).
  dog: { pos: [7.5, 1], rotY: -120 * D } as Spot,
};

/**
 * 꽃밭 군락 — 가장자리를 따라 흩뿌린다.
 * 각 군락은 중심·반경과 대표 종(種)만 정하고, 실제 꽃은 Meadow가 시드 난수로 채운다.
 * ▸ 군락마다 한 종을 주력으로 심어야 "설계된 정원"으로 읽힌다(색만 랜덤이면 색종이 뿌린 티).
 */
export type FlowerSpecies = 'daisy' | 'primrose' | 'allium' | 'foxglove';
export const FLOWER_BEDS: {
  pos: [number, number];
  r: number;
  seed: number;
  n: number;
  species: FlowerSpecies;
}[] = [
  { pos: [-11, 3], r: 3.2, seed: 11, n: 22, species: 'daisy' },
  { pos: [-6, 8], r: 2.6, seed: 27, n: 14, species: 'primrose' },
  { pos: [12, 4], r: 2.8, seed: 43, n: 16, species: 'foxglove' },
  { pos: [1, -11], r: 3.0, seed: 58, n: 18, species: 'allium' },
  { pos: [13, -3], r: 2.2, seed: 71, n: 12, species: 'daisy' },
  { pos: [-9, -12], r: 2.4, seed: 90, n: 12, species: 'primrose' },
];

/** 잔디에 흩뿌리는 자잘한 풀 포기(디테일). */
export const GRASS_TUFTS: { pos: [number, number]; r: number; seed: number; n: number } = {
  pos: [0, 0],
  r: 17,
  seed: 7,
  n: 60,
};
