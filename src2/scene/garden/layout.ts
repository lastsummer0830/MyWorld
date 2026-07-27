// 정원 배치 정본 — 오브젝트가 놓이는 자리와 "무엇이 어디에 심기는가"를 여기 한 곳에 모은다.
// 좌표는 [x, z] (월드 미터). x+ 는 화면 오른쪽, z+ 는 카메라 앞쪽.
// 배치는 ISLAND_R_SAFE(약 18m) 원 안에서만 — 그 바깥은 가장자리가 불규칙해 땅이 없을 수 있다.

import { islandRadius } from '../constants';
import { mulberry32 } from './rng';

export type Spot = { pos: [number, number]; rotY?: number };

const D = Math.PI / 180;
const TAU = Math.PI * 2;

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
 * 나무 자리.
 * ▸ 섬에 수직 요소가 집·퍼걸러뿐이라 실루엣이 납작했다. 나무는 **가장자리 쪽**에 두어
 *   가운데(퍼걸러·티테이블·강아지)를 가리지 않으면서 섬의 윤곽을 만든다.
 * ▸ 큰 벚나무 하나를 주인공으로 두고 나머지는 조연 — 같은 크기로 늘어놓으면 가로수길이 된다.
 */
export const TREES: {
  pos: [number, number];
  species: 'cherry' | 'lemon';
  scale: number;
  seed: number;
}[] = [
  { pos: [-7.5, -11], species: 'cherry', scale: 1.15, seed: 501 }, //  집 오른편 뒤 — 주인공
  { pos: [8.5, 10.5], species: 'cherry', scale: 0.82, seed: 502 }, //  앞쪽 오른편 조연
  { pos: [12.5, 2.5], species: 'lemon', scale: 1.0, seed: 503 }, //  연못과 꽃밭 사이
  { pos: [-13.5, -1.5], species: 'lemon', scale: 0.88, seed: 504 }, //  집 앞 왼편
];

// ═══════════════════════════════════════════════════════════════════
//  식재 구조 — 시안 v5 "코티지 가든" (2026-07-22 조아진 컨펌본 이식)
// ═══════════════════════════════════════════════════════════════════

/**
 * ★★ 정원 구성의 근본 규칙. 여기를 이해하지 않고 아래 값을 만지면 같은 실수로 되돌아간다.
 *
 * 실패한 두 방향:
 *   ① 섬 전체에 잔디 포기를 균일하게 뿌림 → "바닥 위에 잔디를 복붙한" 꼴 (2026-07-22 지적).
 *   ② 잔디 원 + 가장자리 보더 → 보더 폭만 조절하니 꽃이 늘 바깥 링에만 남음
 *      ("꽃이 왜 양쪽에만 있냐" 2026-07-22 지적).
 *
 * → **순서를 뒤집는다.** 잔디밭 모양을 먼저 정하고, **섬에서 잔디를 뺀 나머지 전부가 식재다.**
 *   "보더·화단"이라는 개념 자체를 쓰지 않는다. 그래야 식재가 링이 아니라 정원 곳곳에
 *   크고 작은 덩이로 자연히 흩어진다.
 */

/**
 * 잔디밭 = 원들의 합집합으로 만든 **굽이치는 띠**. 집 쪽에서 시작해 앞쪽으로 흘러나간다.
 * ▸ 폭이 넓은 데(광장)와 좁은 데(길목)가 번갈아 나와야 "흐르는" 느낌이 난다.
 * ▸ 원을 키우면 잔디가 넓어지는 게 아니라 **식재가 줄어든다**. 둘은 한 몸이다.
 */
export const LAWN: [number, number, number][] = [
  // 본류 — 집 앞에서 티테이블 쪽으로 크게 휘어 흐른다
  [-8.6, -3.4, 3.9],
  [-6.2, -0.6, 4.5],
  [-3.2, 1.4, 4.9],
  [0.4, 2.8, 5.1],
  [3.8, 4.4, 4.5],
  [6.8, 5.8, 3.5],
  // 퍼걸러~티테이블 사이 열린 목
  [-1.6, -1.8, 3.9],
  [2.4, 0.2, 3.7],
  [5.6, 1.6, 3.0],
  // 앞쪽으로 흘러나가는 만
  [-4.2, 5.8, 3.7],
  [-0.4, 7.6, 3.3],
  [3.0, 8.4, 2.8],
  // 곁가지로 파고드는 좁은 목
  [-9.4, 1.6, 3.0],
  [1.2, -4.4, 2.9],
  [4.8, -2.2, 2.5],
  // ★★ 잔디가 섬 가장자리에 **닿는**(트이는) 지점 2곳.
  //   이게 없으면 식재가 무조건 섬을 한 바퀴 두르는 **닫힌 링**이 되어 "바깥은 전부 수풀"이 된다.
  //   실제 정원도 잔디가 담장에 닿는 데가 있다.
  //
  //   ⚠ 시안(2D 평면도)의 좌표는 여기까지 오다 말았다 — 섬 가장자리(반경 20~22m)에서
  //     실제로 잔디인 각도가 **0%**, 즉 트인 데가 한 곳도 없었다(2026-07-27 실측).
  //     평면도에선 점이 작아 티가 안 났지만 3D에선 2m짜리 관목 링이 섬을 완전히 둘러쌌다.
  //     → 끝의 두 원을 가장자리 밖까지 밀어 **17° / 13° 폭으로 실제로 뚫었다.**
  [-8.0, 9.6, 4.0],
  [-11.0, 12.4, 3.4],
  [-12.0, 13.4, 3.6], //  앞쪽 왼편이 트임 (123°~140°)
  [11.4, -1.6, 3.4],
  [14.0, -2.6, 2.8],
  [18.7, -3.5, 3.6], //  오른쪽 옆구리가 트임 (343°~356°)
];

/**
 * 잔디 경계까지의 부호 거리. **음수 = 잔디 안**, 양수 = 식재 구역(클수록 잔디에서 멂).
 * 이 값 하나가 정원의 문법이다 — 식재 여부·키·종·밀도가 전부 여기서 파생된다.
 */
export function lawnDist(x: number, z: number) {
  let d = Infinity;
  for (const [cx, cz, r] of LAWN) {
    const t = Math.hypot(x - cx, z - cz) - r;
    if (t < d) d = t;
  }
  return d;
}

/**
 * 완만한 잡음(0~1 근처) — 식재 밀도에 얼룩을 준다.
 * ★ 식재 구역이 균일하면 그건 그냥 "잔디 도배"를 "수풀 도배"로 바꾼 것일 뿐이다.
 *   빽빽한 데와 성긴 데가 있어야 사람이 심은 정원으로 읽힌다.
 */
export function plantDensity(x: number, z: number) {
  return (
    0.52 +
    0.3 * Math.sin(x * 0.29 + 1.3) * Math.cos(z * 0.25 - 0.8) +
    0.18 * Math.sin((x + z) * 0.17 + 2.1) +
    0.12 * Math.cos((x - z) * 0.36 - 1.1)
  );
}

/** 식재를 심지 않는 구역 — 물속·건물 바닥. (퍼걸러·티테이블은 잔디 한복판이라 자동 제외된다.) */
const NO_PLANT: { x: number; z: number; r: number }[] = [
  { x: GARDEN.pond.pos[0], z: GARDEN.pond.pos[1], r: 5.2 },
  { x: GARDEN.house.pos[0], z: GARDEN.house.pos[1], r: 3.0 },
];

/** 식재 층 — 잔디에서 먼 정도로 갈린다. back이 가장 키가 크다. */
export type PlantLayer = 'back' | 'mid' | 'front';

/**
 * 층 경계(m). 실측 분포로 잡은 값 — front 22% / mid 36% / back 41%.
 * ★ 시안(2D 평면도)은 1.8·4.2를 썼지만 그대로 옮기면 back이 65%가 된다. 평면도에선 점 크기가
 *   2배 차이라 티가 안 났지만, 3D에선 섬 바깥쪽이 통째로 키큰 관목이 되어 **층이 사라진다**
 *   (= 도배를 관목으로 반복하는 꼴). d는 최대 14까지 나오므로 경계를 바깥으로 밀었다.
 */
const LAYER_MID = 2.6;
const LAYER_BACK = 7.0;

/**
 * 키·크기를 정할 때 쓰는 **포화되는** 거리(0~1).
 * ★ d에 그냥 비례시키면 안 된다. 잔디에서 14m 떨어진 섬 가장자리 관목이 3m짜리가 되어
 *   섬을 두르는 벽이 되고, 그 뒤의 집·연못을 가린다. 7m 넘어가면 더 자라지 않게 잘라 둔다.
 */
export const plantGrow = (d: number) => Math.min(Math.max(d, 0), LAYER_BACK) / LAYER_BACK;

export type PlantPt = {
  x: number;
  z: number;
  /** lawnDist 값. 키·크기를 여기서 파생시킨다. */
  d: number;
  layer: PlantLayer;
  /** 개체 회전(rad) */
  a: number;
  /** 크기 변주 0.7~1.4 */
  s: number;
  /** 색·형태 선택용 0~1 */
  c: number;
};

/**
 * 섬 전체를 훑으며 **"잔디가 아닌 곳"** 에 심을 자리를 뽑는다.
 *
 * ★ 키는 잔디에서 먼 정도(d)로 정한다 — 잔디 가엔 낮은 꽃, 안쪽으로 갈수록 키큰 관목.
 *   이 층이 있어야 정원에 깊이가 생긴다(전부 같은 키면 그게 바로 도배다).
 * ★ 잔디 가장자리는 확률적으로 솎어 경계가 **스미게** 한다. 딱 끊기면 오려붙인 티가 난다.
 *
 * @param tries 후보 추첨 횟수. 실제 반환 개수는 이것의 25~30% 안팎이다(위 필터들 때문).
 */
export function samplePlanting(tries: number, seed: number): PlantPt[] {
  const rand = mulberry32(seed);
  const out: PlantPt[] = [];

  for (let i = 0; i < tries; i++) {
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * islandRadius(a) * 0.985;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const d = lawnDist(x, z);

    if (d < -1.3) continue; //  잔디 한복판 — 비운다
    if (d < 0.6 && rand() > Math.exp((d - 0.6) * 1.5)) continue; //  잔디 가로 갈수록 성기게
    if (rand() > plantDensity(x, z)) continue; //  밀도 얼룩
    if (NO_PLANT.some((e) => Math.hypot(x - e.x, z - e.z) < e.r)) continue;

    out.push({
      x,
      z,
      d,
      layer: d > LAYER_BACK ? 'back' : d > LAYER_MID ? 'mid' : 'front',
      a: rand() * TAU,
      s: 0.7 + rand() * 0.7,
      c: rand(),
    });
  }
  return out;
}

// ── 꽃 종(種) ────────────────────────────────────────────────────
export type FlowerSpecies = 'daisy' | 'primrose' | 'allium' | 'foxglove';

/** 키큰 종 / 낮은 종. 층(layer)에 따라 어느 쪽에서 고를지가 갈린다. */
const TALL_SPECIES: FlowerSpecies[] = ['foxglove', 'allium'];
const LOW_SPECIES: FlowerSpecies[] = ['daisy', 'primrose'];

/**
 * ★★ 꽃의 종은 **위치로 정한다.** 점마다 랜덤으로 뽑으면 색종이 뿌린 티가 난다.
 *   (이 원칙은 예전 layout.ts 주석에 이미 적혀 있었는데 지키지 않고 있었다.)
 *   완만한 잡음을 좌표에 걸면 가까운 꽃끼리 같은 종이 되어 **드리프트(무리)** 가 생긴다.
 *   ▸ 1할만 다른 그룹에서 섞어 경계를 흐린다 — 완벽히 구획되면 그건 그것대로 인공적이다.
 */
export function speciesAt(x: number, z: number, tall: boolean, roll: number): FlowerSpecies {
  const group = (roll < 0.1 ? !tall : tall) ? TALL_SPECIES : LOW_SPECIES;
  const v =
    Math.sin(x * 0.205 + 0.7) * Math.cos(z * 0.175 - 1.4) +
    0.62 * Math.sin(x * 0.13 - z * 0.155 + 2.2) +
    0.34 * Math.cos(x * 0.31 + z * 0.28 - 0.5);
  const t = (v + 1.96) / 3.92; //  0~1로 정규화
  return group[Math.min(group.length - 1, Math.max(0, Math.floor(t * group.length)))];
}
