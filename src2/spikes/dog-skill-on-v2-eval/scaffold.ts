// AJP-004 · Skill-ON v2 · stage-1 — blue-merle Shetland Sheepdog 해부 scaffold.
//
// 이 파일은 landmarks.ts 의 카드에서만 좌표를 끌어온다. 기존 제품 dog 소스나
// 이전 dog capability-eval 소스는 읽지도 import 하지도 않았다(= 재설계 Skill의 clean eval).
//
// ── 부품 그래프(§1 decompose) ──────────────────────────────────────
//   trunk        ribcage · loin · croup            (Z축 단면 solid 3개, 서로 겹침)
//   neck         neckCore                          (숨은 지지대. 실루엣에 절대 나오지 않는다)
//   head         skull · cheek(L/R) · muzzle       (세 덩어리가 겹쳐 하나의 연속 쐐기)
//   ear          earPlate(L/R)                     (넓은 밑동 판 + 앞으로 꺾인 짧은 끝)
//   coat         ruff(L/R) · nape · flank(L/R) · pants(L/R)   (가장자리 열린 판)
//   foreleg      upperArm · forearm · pastern · paw (×2)
//   hindleg      thigh · lowerThigh · rearPastern · paw (×2)
//   tail         root · body · tip                 (겹치며 접선이 이어지는 3덩어리)
//
// ── generator span 규칙(§4) ────────────────────────────────────────
//   solid()/segment() 한 번 = 한 해부 영역. 아래 어디에도
//   skull→muzzle, neck→chest, trunk→tail, hip→paw 를 한 번에 훑는 호출이 없다.
//   아래턱 상자도 없다(주둥이는 턱까지 포함한 하나의 테이퍼 solid다).
//   귀는 튜브/스파이크가 아니라 납작한 판 단면을 쌓고 끝에서 각지게 꺾는다.

import * as THREE from 'three';
import type { Sec } from './facet';
import { arcGrid, flankGrid, merge, mirrorX, segment, skin, solid } from './facet';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** 사지·꼬리의 local +Y 를 "몸의 앞쪽"으로 고정한다 → up=앞, dn=뒤, w=좌우. */
const FWD = V(0, 0, 1);

/* ================================================================== *
 * 1. 몸통 — 갈비 / 허리 / 엉덩이
 *    등선을 거의 수평으로 유지한다(anti: saddle-backed tube).
 * ================================================================== */

function ribcage(): THREE.BufferGeometry {
  // 아래로 좁아지는 용골(kl/klv 작게) → 정면에서 가슴이 달걀이 아니라 좁은 흉곽으로 읽힌다.
  const keel = { kl: 0.5, klv: 0.86, ku: 0.78, kv: 0.74, widest: 0.1 };
  return solid([
    { z: 0.36, w: 0.1, up: 0.16, dn: 0.2, cy: 0.74, ...keel },
    { z: 0.22, w: 0.145, up: 0.25, dn: 0.235, cy: 0.75, ...keel },
    { z: 0.05, w: 0.155, up: 0.22, dn: 0.26, cy: 0.75, ...keel },
    { z: -0.12, w: 0.145, up: 0.2, dn: 0.22, cy: 0.755, ...keel },
  ]);
}

function loin(): THREE.BufferGeometry {
  return solid([
    { z: -0.12, w: 0.145, up: 0.2, dn: 0.22, cy: 0.755, ku: 0.78, kv: 0.74 },
    // 배가 살짝 올라붙는다(tuck). 아래가 평평하면 통짜 튜브가 된다.
    { z: -0.3, w: 0.125, up: 0.2, dn: 0.175, cy: 0.755, ku: 0.78, kv: 0.74 },
    { z: -0.44, w: 0.135, up: 0.19, dn: 0.175, cy: 0.755, ku: 0.78, kv: 0.74 },
  ]);
}

function croup(): THREE.BufferGeometry {
  return solid([
    { z: -0.44, w: 0.135, up: 0.19, dn: 0.18, cy: 0.755, ku: 0.78, kv: 0.76 },
    { z: -0.58, w: 0.15, up: 0.19, dn: 0.21, cy: 0.745, ku: 0.78, kv: 0.76 },
    // 엉덩이가 완만히 떨어진다. 여기서 꼬리 뿌리가 나온다.
    { z: -0.7, w: 0.115, up: 0.13, dn: 0.2, cy: 0.735, ku: 0.74, kv: 0.72 },
    { z: -0.76, w: 0.065, up: 0.075, dn: 0.145, cy: 0.72, ku: 0.7, kv: 0.68 },
  ]);
}

/* ================================================================== *
 * 2. 목 — 짧고 완전히 감춰지는 지지대
 *    animal-scaffold-eval.md §4: 숨은 지지 primitive는 허용된다.
 *    이 조각의 실루엣이 보이면 그 자체가 실패(neck stalk)다.
 * ================================================================== */

function neckCore(): THREE.BufferGeometry {
  return segment(
    V(0, 0.93, 0.2),
    V(0, 1.09, 0.4),
    [
      { z: 0, w: 0.1, up: 0.09, dn: 0.1 },
      { z: 1, w: 0.078, up: 0.07, dn: 0.078 },
    ],
    V(0, 1, 0),
  );
}

/* ================================================================== *
 * 3. 머리 — 두개골 쐐기 + 뺨 평면 + 짧은 테이퍼 주둥이
 *    세 덩어리가 겹쳐 "연속된 개 쐐기"가 되게 한다.
 *    분리된 아래턱 상자 없음, 두개골-주둥이 관통 튜브 없음.
 * ================================================================== */

function skull(): THREE.BufferGeometry {
  // ku/kv 를 크게 → 셸티 특유의 평평한 정수리 평면이 남는다.
  const flatTop = { ku: 0.88, kv: 0.94, kl: 0.7, klv: 0.74 };
  return solid([
    { z: 0.34, w: 0.045, up: 0.02, dn: 0.06, cy: 1.145, ...flatTop },
    { z: 0.4, w: 0.085, up: 0.045, dn: 0.085, cy: 1.135, ...flatTop },
    { z: 0.47, w: 0.095, up: 0.045, dn: 0.09, cy: 1.13, ...flatTop },
    { z: 0.545, w: 0.082, up: 0.035, dn: 0.09, cy: 1.115, ...flatTop },
    // stop. 여기서 주둥이가 이어받는다(겹침 구간).
    { z: 0.585, w: 0.068, up: 0.025, dn: 0.085, cy: 1.1, ...flatTop },
  ]);
}

/** 광대/뺨 평면. 주둥이 뿌리를 두개골 덩어리에 묶어 "기둥 위 상자" 오독을 없앤다. */
function cheek(): THREE.BufferGeometry {
  return solid([
    { z: 0.39, w: 0.042, up: 0.045, dn: 0.048, cx: 0.062, cy: 1.078, ku: 0.8, kv: 0.78 },
    { z: 0.5, w: 0.042, up: 0.05, dn: 0.05, cx: 0.06, cy: 1.076, ku: 0.8, kv: 0.78 },
    { z: 0.575, w: 0.032, up: 0.04, dn: 0.042, cx: 0.05, cy: 1.078, ku: 0.8, kv: 0.78 },
    { z: 0.625, w: 0.018, up: 0.026, dn: 0.028, cx: 0.038, cy: 1.082, ku: 0.8, kv: 0.78 },
  ]);
}

function muzzle(): THREE.BufferGeometry {
  // 평면·단면 양쪽으로 동시에 테이퍼. widest 를 아래로 내려 입술선이 가장 넓게 한다.
  const wedge = { ku: 0.62, kv: 0.66, kl: 0.6, klv: 0.72, widest: -0.3 };
  return solid([
    { z: 0.575, w: 0.062, up: 0.03, dn: 0.078, cy: 1.098, ...wedge },
    { z: 0.645, w: 0.052, up: 0.026, dn: 0.066, cy: 1.086, ...wedge },
    { z: 0.715, w: 0.043, up: 0.023, dn: 0.052, cy: 1.07, ...wedge },
    { z: 0.775, w: 0.035, up: 0.02, dn: 0.038, cy: 1.052, ...wedge },
    // 뭉툭한 코 끝. 색은 넣지 않는다(stage-1 제외 항목).
    { z: 0.795, w: 0.02, up: 0.012, dn: 0.02, cy: 1.046, ...wedge },
  ]);
}

/* ================================================================== *
 * 4. 귀 — 넓은 밑동 판 + 앞으로 꺾인 짧은 끝
 *    local +Z = 자라는 방향, local +Y = 바깥쪽(귀의 폭), local X = 앞뒤(두께).
 *    → 정면에서 귀가 "넓은 짧은 삼각형"으로 보인다(가늘고 긴 뿔이 아니다).
 *    끝의 앞 꺾임은 cx 를 급히 밀어 각진 crease 로 만든다(부드러운 곡선 스윕 금지).
 * ================================================================== */

function ear(): THREE.BufferGeometry {
  const base = V(0.068, 1.155, 0.435);
  const growth = V(Math.sin(16 * (Math.PI / 180)), Math.cos(16 * (Math.PI / 180)), -0.139);
  const tip = base.clone().addScaledVector(growth.clone().normalize(), 0.148);

  return segment(
    base,
    tip,
    [
      { z: 0, w: 0.017, up: 0.05, dn: 0.042, ku: 0.82, kv: 0.8 },
      { z: 0.34, w: 0.015, up: 0.043, dn: 0.033, ku: 0.8, kv: 0.78 },
      // 접힘 시작
      { z: 0.64, w: 0.012, up: 0.031, dn: 0.02, cx: 0.012, ku: 0.78, kv: 0.76 },
      // 앞으로 꺾인 끝(각짐)
      { z: 0.82, w: 0.01, up: 0.021, dn: 0.012, cx: 0.036, ku: 0.76, kv: 0.74 },
      { z: 1, w: 0.007, up: 0.011, dn: 0.006, cx: 0.056, ku: 0.74, kv: 0.72 },
    ],
    // upRef = 월드 +X → local +Y 가 바깥쪽. 귀 판이 옆이 아니라 앞을 향한다.
    V(1, 0, 0),
  );
}

/* ================================================================== *
 * 5. 코트 판 — 전부 가장자리가 열린 판
 *    닫힌 회전체를 쓰지 않는다. 정면/후면 실루엣이 달걀이 되면 즉시 실패다.
 * ================================================================== */

/**
 * ruff 한 쪽. 각도는 정면(0°)에서 개의 왼쪽(+)으로.
 * 좌우 판이 -26°..+26° 구간에서 서로 겹쳐 **층진 앞자락**을 만들고,
 * 뒤쪽(138°~222°)은 비워 둔다 → 몸을 감싼 풍선이 아니다.
 * 아래로 갈수록 각도 폭이 줄어 자락이 뾰족하게 끝난다(pendant oval 회피).
 */
function ruffPlate(): THREE.BufferGeometry {
  const grid = arcGrid(
    [
      { y: 1.13, r: 0.125, a0: -26, a1: 138, cz: 0.3 },
      { y: 1.04, r: 0.155, a0: -26, a1: 140, cz: 0.3 },
      { y: 0.93, r: 0.175, a0: -24, a1: 138, cz: 0.3 },
      { y: 0.82, r: 0.18, a0: -22, a1: 130, cz: 0.3 },
      { y: 0.7, r: 0.165, a0: -18, a1: 112, cz: 0.3 },
      { y: 0.6, r: 0.135, a0: -12, a1: 86, cz: 0.3 },
      { y: 0.52, r: 0.095, a0: -6, a1: 56, cz: 0.3 },
    ],
    11,
  );
  return skin(grid, 0.026, true);
}

/** 목덜미 판. ruff 두 장이 비워 둔 뒤통수-기갑 사이를 덮어 목이 보이지 않게 한다. */
function napePlate(): THREE.BufferGeometry {
  const grid = arcGrid(
    [
      { y: 1.14, r: 0.1, a0: 118, a1: 242, cz: 0.32 },
      { y: 1.06, r: 0.125, a0: 116, a1: 244, cz: 0.31 },
      { y: 0.99, r: 0.15, a0: 118, a1: 242, cz: 0.3 },
      { y: 0.94, r: 0.16, a0: 124, a1: 236, cz: 0.28 },
    ],
    13,
  );
  return skin(grid, 0.024, true);
}

/** 옆구리 코트. 등마루에서 몸 안으로 들어가고 아래 자락에서 다시 말려 든다. */
function flankPlate(): THREE.BufferGeometry {
  const grid = flankGrid(
    [
      { z: 0.3, x: 0.125, top: 0.915, bottom: 0.62 },
      { z: 0.12, x: 0.17, top: 1.005, bottom: 0.45 },
      { z: -0.06, x: 0.178, top: 0.985, bottom: 0.42 },
      { z: -0.24, x: 0.163, top: 0.975, bottom: 0.44 },
      { z: -0.42, x: 0.16, top: 0.965, bottom: 0.47 },
      { z: -0.58, x: 0.152, top: 0.945, bottom: 0.52 },
      { z: -0.7, x: 0.115, top: 0.885, bottom: 0.6 },
    ],
    [0.1, 0.68, 1.0, 0.98, 0.84, 0.6],
  );
  return skin(grid, 0.024, false);
}

/**
 * 뒷다리 pants. 옆~뒤 옆구리만 덮고 뒤 중심선에서는 닫지 않는다.
 * → 꼬리가 엉덩이에서 그대로 나올 자리를 남긴다.
 */
function pantsPlate(): THREE.BufferGeometry {
  const grid = arcGrid(
    [
      { y: 0.9, r: 0.145, a0: 94, a1: 168, cz: -0.56 },
      { y: 0.78, r: 0.17, a0: 92, a1: 170, cz: -0.56 },
      { y: 0.64, r: 0.18, a0: 90, a1: 170, cz: -0.56 },
      { y: 0.52, r: 0.165, a0: 94, a1: 164, cz: -0.56 },
      { y: 0.43, r: 0.135, a0: 100, a1: 156, cz: -0.56 },
      { y: 0.37, r: 0.1, a0: 108, a1: 148, cz: -0.56 },
    ],
    9,
  );
  return skin(grid, 0.024, true);
}

/* ================================================================== *
 * 6. 사지 — 앞뒤의 관절 리듬을 다르게 한다
 *    앞: 어깨→(뒤로)팔꿈치→(수직)손목→(살짝 앞)발  = 거의 곧은 기둥
 *    뒤: 엉덩이→(앞으로)무릎→(뒤로)비절→(앞으로)발 = 뚜렷한 지그재그
 *    막대기가 되지 않도록 마디마다 굵기가 바뀌고 발이 확실히 넓다.
 * ================================================================== */

const FORE_X = 0.105;
const HIND_X = 0.115;

function foreLimb(): THREE.BufferGeometry[] {
  const upperArm = segment(
    V(FORE_X, 0.82, 0.31),
    V(FORE_X, 0.53, 0.245),
    [
      { z: 0, w: 0.062, up: 0.075, dn: 0.075, ku: 0.8, kv: 0.78 },
      { z: 0.5, w: 0.055, up: 0.062, dn: 0.058 },
      { z: 1, w: 0.042, up: 0.048, dn: 0.042 },
    ],
    FWD,
  );

  const forearm = segment(
    V(FORE_X, 0.545, 0.248),
    V(FORE_X - 0.003, 0.19, 0.258),
    [
      { z: 0, w: 0.042, up: 0.05, dn: 0.042 },
      { z: 0.45, w: 0.033, up: 0.04, dn: 0.03 },
      { z: 1, w: 0.029, up: 0.03, dn: 0.024 },
    ],
    FWD,
  );

  const pastern = segment(
    V(FORE_X - 0.003, 0.2, 0.257),
    V(FORE_X - 0.003, 0.075, 0.268),
    [
      { z: 0, w: 0.03, up: 0.032, dn: 0.026 },
      { z: 1, w: 0.028, up: 0.028, dn: 0.024 },
    ],
    FWD,
  );

  // 발은 월드 Z 단면으로 저술한다. 바닥(kl/klv≈1)이 평평해야 접지가 읽힌다.
  const flat = { ku: 0.74, kv: 0.72, kl: 0.95, klv: 0.98 };
  const paw = solid([
    { z: 0.215, w: 0.04, up: 0.055, dn: 0.055, cx: FORE_X - 0.003, cy: 0.055, ...flat },
    { z: 0.265, w: 0.055, up: 0.042, dn: 0.042, cx: FORE_X - 0.003, cy: 0.042, ...flat },
    { z: 0.315, w: 0.052, up: 0.03, dn: 0.03, cx: FORE_X - 0.003, cy: 0.03, ...flat },
    { z: 0.34, w: 0.036, up: 0.018, dn: 0.018, cx: FORE_X - 0.003, cy: 0.018, ...flat },
  ]);

  return [upperArm, forearm, pastern, paw];
}

function hindLimb(): THREE.BufferGeometry[] {
  const thigh = segment(
    V(HIND_X, 0.82, -0.53),
    V(HIND_X - 0.002, 0.48, -0.425),
    [
      { z: 0, w: 0.085, up: 0.1, dn: 0.095, ku: 0.8, kv: 0.78 },
      { z: 0.5, w: 0.072, up: 0.085, dn: 0.075 },
      { z: 1, w: 0.05, up: 0.055, dn: 0.048 },
    ],
    FWD,
  );

  const lowerThigh = segment(
    V(HIND_X - 0.002, 0.49, -0.428),
    V(HIND_X - 0.005, 0.235, -0.535),
    [
      { z: 0, w: 0.05, up: 0.058, dn: 0.05 },
      { z: 0.5, w: 0.04, up: 0.046, dn: 0.036 },
      { z: 1, w: 0.031, up: 0.03, dn: 0.026 },
    ],
    FWD,
  );

  const rearPastern = segment(
    V(HIND_X - 0.005, 0.245, -0.532),
    V(HIND_X - 0.007, 0.072, -0.505),
    [
      { z: 0, w: 0.031, up: 0.032, dn: 0.028 },
      { z: 1, w: 0.028, up: 0.028, dn: 0.023 },
    ],
    FWD,
  );

  const flat = { ku: 0.74, kv: 0.72, kl: 0.95, klv: 0.98 };
  const paw = solid([
    { z: -0.555, w: 0.036, up: 0.05, dn: 0.05, cx: HIND_X - 0.007, cy: 0.05, ...flat },
    { z: -0.51, w: 0.05, up: 0.038, dn: 0.038, cx: HIND_X - 0.007, cy: 0.038, ...flat },
    { z: -0.47, w: 0.047, up: 0.028, dn: 0.028, cx: HIND_X - 0.007, cy: 0.028, ...flat },
    { z: -0.448, w: 0.032, up: 0.016, dn: 0.016, cx: HIND_X - 0.007, cy: 0.016, ...flat },
  ]);

  return [thigh, lowerThigh, rearPastern, paw];
}

/* ================================================================== *
 * 7. 꼬리 — 엉덩이 안에서 시작해 접선이 이어지는 3덩어리
 *    첫 마디의 시작 단면이 croup 내부에 있어야 "떨어진 덩어리"가 되지 않는다.
 *    단면은 좌우로 얇고 앞뒤로 넓다 = 옆에서 깃털처럼 퍼지는 plume.
 * ================================================================== */

function tail(): THREE.BufferGeometry[] {
  const root = segment(
    V(0, 0.895, -0.6),
    V(0, 0.775, -0.755),
    [
      { z: 0, w: 0.058, up: 0.062, dn: 0.062 },
      { z: 1, w: 0.048, up: 0.075, dn: 0.07 },
    ],
    FWD,
  );

  const body = segment(
    V(0, 0.79, -0.74),
    V(0, 0.5, -0.855),
    [
      { z: 0, w: 0.048, up: 0.078, dn: 0.075 },
      { z: 0.5, w: 0.042, up: 0.09, dn: 0.08 },
      { z: 1, w: 0.032, up: 0.07, dn: 0.06 },
    ],
    FWD,
  );

  const tip = segment(
    V(0, 0.52, -0.85),
    V(0, 0.3, -0.815),
    [
      { z: 0, w: 0.032, up: 0.068, dn: 0.058 },
      { z: 0.6, w: 0.022, up: 0.045, dn: 0.038 },
      { z: 1, w: 0.01, up: 0.016, dn: 0.014 },
    ],
    FWD,
  );

  return [root, body, tip];
}

/* ================================================================== *
 * 조립
 * ================================================================== */

/** 왼쪽(+X)만 저술하고 오른쪽은 거울로 만든다. 우측 옆면은 landmarks.INFERRED 로 표시된 가정이다. */
function pair(make: () => THREE.BufferGeometry): THREE.BufferGeometry[] {
  const left = make();
  const right = mirrorX(left);
  return [left, right];
}

function pairAll(make: () => THREE.BufferGeometry[]): THREE.BufferGeometry[] {
  const left = make();
  return [...left, ...left.map(mirrorX)];
}

/**
 * stage-1 scaffold 하나. 단일 값 재질로 그릴 것을 전제로 vertex color 를 넣지 않는다.
 * 눈·코 색·입선·마킹·merle·털가닥·애니메이션은 전부 stage-1 제외 항목이라 여기 없다.
 */
export function buildDogScaffoldV2(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    ribcage(),
    loin(),
    croup(),
    neckCore(),
    skull(),
    muzzle(),
    ...pair(cheek),
    ...pair(ear),
    ...pair(ruffPlate),
    napePlate(),
    ...pair(flankPlate),
    ...pair(pantsPlate),
    ...pairAll(foreLimb),
    ...pairAll(hindLimb),
    ...tail(),
  ];
  return merge(parts);
}

/** 검수 메모용 — 실제 만들어진 부품 수를 보고서에 그대로 쓰기 위해. */
export const PART_COUNT = {
  trunk: 3,
  neck: 1,
  head: 4,
  ears: 2,
  coatPlates: 7,
  foreLimbs: 8,
  hindLimbs: 8,
  tail: 3,
} as const;

/** mirrorX 로 만든 조각은 미검증 가정(오른쪽 옆면 = 왼쪽의 거울)에 기대고 있다. */
export const MIRRORED_PARTS = ['cheek', 'ear', 'ruffPlate', 'flankPlate', 'pantsPlate', 'foreLimb', 'hindLimb'] as const;

/** 여기서 만든 좌표가 인용한 landmark 파일. 보고서에서 근거 경로로 쓴다. */
export const LANDMARK_SOURCE = './landmarks.ts';

/** 지면 접지 확인용 — 네 발 바닥은 전부 y=0 이어야 한다. */
export const GROUND_CONTACTS: ReadonlyArray<[number, number, number]> = [
  [FORE_X - 0.003, 0, 0.278],
  [-(FORE_X - 0.003), 0, 0.278],
  [HIND_X - 0.007, 0, -0.5],
  [-(HIND_X - 0.007), 0, -0.5],
];

// 미사용 import 경고를 피하려고 남기는 재수출이 아니라, 외부에서 단면 타입을 참조할 수 있게 한다.
export type { Sec };
