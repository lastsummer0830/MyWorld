// 지피 식생 지오메트리 — 바닥을 덮는 풀 포기·잎무더기.
//
// ★ 왜 갈아엎었나 (2026-07-22)
//   이전 버전은 "삼각형 1장짜리 곧은 블레이드"를 방사형으로 5개 세운 포기 한 종류뿐이었다.
//   전부 같은 각도로 뻗은 뾰족한 직선이라 잔디밭이 **왁스 바른 머리처럼 균일하게 삐죽**거렸다.
//   레퍼런스(요소/97e83730 긴잔디 포기, 6f73041 풀군락)의 잔디는 정반대다:
//     ① 블레이드가 **휘어져 늘어진다** — 곧은 선이 아니라 아치. 이게 "부드러움"의 정체.
//     ② 끝이 **뾰족한 것과 뭉툭한 것이 섞여** 있다.
//     ③ 포기 안에서 **길이 편차가 크다** — 짧은 것 사이로 몇 가닥만 길게 솟는다.
//
//   그래서 블레이드를 "곧은 삼각형"에서 **길이 방향 세그먼트로 휘는 띠(strip)** 로 바꾸고,
//   빌더 하나(makeTuftGeometry)에 파라미터를 주는 방식으로 short/soft/tall 세 종을 뽑는다.
//
// 명도 그라데이션(밑동 어둡게 → 팁 밝게)은 vertexColor에 구워 두고,
// 실제 초록 색조는 InstancedMesh의 instanceColor로 포기마다 다르게 곱한다.
//   → 밑동이 짙고 끝이 밝은 풀 + 포기별 색 변주를 인스턴싱 한 번으로 얻는다.

import * as THREE from 'three';

const TAU = Math.PI * 2;

/**
 * ★★ 법선을 위로 눕힌다 — 스타일라이즈드 식생의 핵심 트릭 (건드리기 전에 읽을 것)
 *
 * 블레이드는 거의 서 있는 면이라, 기하학적으로 정직한 법선을 쓰면 **위에서 오는 햇빛을 거의 못 받는다.**
 * 그러면 잔디가 밝은 바닥보다 어둡게 찍혀 "잔디밭"이 아니라 바닥 위에 흩뿌린 **때 얼룩**이 된다.
 * (실측 2026-07-22: 팔레트를 아무리 밝게 올려도 안 잡혔다 — 색이 아니라 조명 문제였다.)
 *
 * 그래서 법선을 +Y 쪽으로 강하게 섞는다. 잔디 덩어리 전체가 바닥과 같은 빛을 받아 한 밭으로 읽히고,
 * 입체감은 면 각도가 아니라 **밑동→팁 vertexColor 그라데이션**이 만든다.
 *
 * ⚠ 이 법선이 먹히려면 재질의 `flatShading`이 **꺼져 있어야** 한다.
 *   flatShading은 법선 속성을 무시하고 프래그먼트 미분으로 면 법선을 다시 만들기 때문이다.
 */
function biasNormalsUp(geo: THREE.BufferGeometry, k = 0.78) {
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < nrm.count; i++) {
    v.fromBufferAttribute(nrm, i);
    v.multiplyScalar(1 - k);
    v.y += k;
    v.normalize();
    nrm.setXYZ(i, v.x, v.y, v.z);
  }
  nrm.needsUpdate = true;
  return geo;
}

/** 시드 해시 — 블레이드마다 결정적인 변주값을 뽑는다(난수 대신, 빌드마다 같은 모양). */
const hash = (i: number, s: number) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type TuftOpts = {
  /** 포기 하나에 들어가는 블레이드 수 */
  blades?: number;
  /** 블레이드 길이(호를 편 길이) */
  h?: number;
  /** 밑동 반폭 */
  w?: number;
  /** 팁이 수직에서 얼마나 눕는가(rad). 클수록 늘어진 아치 */
  tilt?: number;
  /** 길이 방향 분할 수. 2면 살짝 꺾인 정도, 4면 부드러운 호 */
  seg?: number;
  /** 0 = 뾰족한 끝, 1 = 뭉툭하게 잘린 끝 */
  blunt?: number;
  /** 포기 안에서 밑동이 벌어지는 반경 */
  spread?: number;
  /** 블레이드별 길이 편차(0~1). 클수록 "몇 가닥만 길게" */
  jitter?: number;
  /**
   * 밑동 명도(그라데이션 시작점). 낮을수록 뿌리쪽이 어둡다.
   * ★ 0.4대로 내리지 말 것 — 블레이드는 대부분 서 있는 면이라 햇빛(+Y)을 얕게 받는데
   *   거기에 어두운 램프까지 곱하면 밝은 바닥 위에 **지저분한 올리브색 얼룩**으로 찍힌다.
   *   실측(2026-07-22): base 0.42 = 잔디가 바닥보다 어두워 "스크럽 덤불"이 됐다. 0.7대라야 잔디로 읽힌다.
   */
  base?: number;
};

/**
 * 풀 포기 하나. 블레이드는 밑동에서 수직으로 출발해 팁으로 갈수록 `tilt`만큼 바깥으로 휜다.
 * 각 세그먼트를 미소각으로 적분해 이동시키므로 꺾인 선이 아니라 자연스러운 호가 나온다.
 */
export function makeTuftGeometry(opts: TuftOpts = {}) {
  const {
    blades = 6,
    h = 0.42,
    w = 0.085,
    tilt = 0.55,
    seg = 3,
    blunt = 0,
    spread = 0.05,
    jitter = 0.55,
    base = 0.72,
  } = opts;

  const pos: number[] = [];
  const col: number[] = [];

  for (let j = 0; j < blades; j++) {
    // 방사 방향 — 균등 분할에 해시 흔들림을 더해 "부채꼴 티"를 지운다
    const yaw = (j / blades) * TAU + hash(j, 1) * 1.25;
    const dx = Math.cos(yaw);
    const dz = Math.sin(yaw);
    const px = -dz; //  yaw에 수직 = 블레이드 폭 방향
    const pz = dx;

    // 블레이드별 변주: 길이·눕는 정도·폭
    const bh = h * (1 - jitter * 0.5 + hash(j, 2) * jitter);
    const bt = tilt * (0.45 + hash(j, 3) * 1.1);
    const hw = w * (0.75 + hash(j, 4) * 0.5);
    const r0 = spread * (0.3 + hash(j, 5) * 0.7); //  밑동이 중심에서 조금씩 비켜난다

    const step = bh / seg;
    let cx = dx * r0;
    let cy = 0;
    let cz = dz * r0;

    // 링 = 길이 방향 단면(좌우 두 점). 링과 링 사이를 사각형 두 장으로 잇는다.
    const ring: number[][] = [];
    const shade: number[] = [];
    for (let i = 0; i <= seg; i++) {
      if (i > 0) {
        // 세그먼트 중간 각도로 이동 — 미소각 적분이라 호가 매끄럽다
        const am = ((i - 0.5) / seg) * bt;
        cx += dx * Math.sin(am) * step;
        cz += dz * Math.sin(am) * step;
        cy += Math.cos(am) * step;
      }
      const t = i / seg;
      // 폭 프로파일: blunt=0이면 팁에서 0(뾰족), blunt=1이면 팁에 폭이 절반 남는다(뭉툭)
      const halfw = hw * ((1 - blunt) * (1 - t) + blunt * (1 - 0.5 * t * t));
      ring.push([cx - px * halfw, cy, cz - pz * halfw, cx + px * halfw, cy, cz + pz * halfw]);
      shade.push(base + (1 - base) * t);
    }

    for (let i = 0; i < seg; i++) {
      const a = ring[i];
      const b = ring[i + 1];
      const sa = shade[i];
      const sb = shade[i + 1];
      // 사각형 = 삼각형 2장 (a左,a右,b右) + (a左,b右,b左)
      pos.push(a[0], a[1], a[2], a[3], a[4], a[5], b[3], b[4], b[5]);
      col.push(sa, sa, sa, sa, sa, sa, sb, sb, sb);
      pos.push(a[0], a[1], a[2], b[3], b[4], b[5], b[0], b[1], b[2]);
      col.push(sa, sa, sa, sb, sb, sb, sb, sb, sb);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return biasNormalsUp(geo, 0.8);
}

/**
 * 잔디밭 기본 포기 — 낮고 **뭉툭**하다.
 * 바닥 대부분을 이걸로 덮어야 "부드러운 잔디"로 읽힌다. 뾰족한 건 소수여야 한다.
 */
export const makeSoftTuftGeometry = () =>
  makeTuftGeometry({ blades: 6, h: 0.34, w: 0.082, tilt: 0.8, seg: 3, blunt: 0.5, spread: 0.06 });

/** 섞어 심는 뾰족 포기 — 소수만. 뭉툭한 잔디 사이의 악센트. */
export const makeSpikyTuftGeometry = () =>
  makeTuftGeometry({ blades: 5, h: 0.46, w: 0.07, tilt: 0.42, seg: 2, blunt: 0.1, spread: 0.04 });

/**
 * 긴 잔디(tall grass) — 군락으로만 심는다.
 * 레퍼런스처럼 크게 휘어 늘어지고 길이 편차가 커야 한다(몇 가닥만 길게 솟는 실루엣).
 */
export const makeTallGrassGeometry = () =>
  makeTuftGeometry({
    blades: 9,
    h: 1.15,
    w: 0.075,
    tilt: 1.05,
    seg: 4,
    blunt: 0.15,
    spread: 0.09,
    jitter: 0.85,
    base: 0.6, //  기본 잔디보다 살짝만 짙게 — 뒤로 물러나되 어둡게 찍히면 안 된다
  });

/**
 * 잎무더기(관목형 지피식물) — 예전엔 눌린 정20면체 한 덩이라 그냥 **초록 돌멩이**였다.
 * 레퍼런스(97e83730)의 관목은 "작은 잎이 무더기로 뭉친 덩어리"다. 그래서 반구 표면에
 * 작은 잎 카드를 흩어 붙여 만든다. 잎 카드의 법선을 반구 바깥으로 두면 어느 각도에서 봐도
 * 잎이 서 있는 것처럼 읽힌다.
 */
export function makeLeafyMoundGeometry(leaves = 16, r = 0.26, squash = 0.62) {
  const pos: number[] = [];
  const col: number[] = [];

  const n = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const up = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const v = new THREE.Vector3();

  for (let k = 0; k < leaves; k++) {
    // 반구 위에 고르게 — 위쪽에 조금 더 몰리게(윗면이 비면 민둥산으로 보인다)
    const phi = Math.acos(1 - hash(k, 7) * 0.92) * 0.95;
    const theta = hash(k, 8) * TAU;
    n.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));

    // 잎 카드가 놓일 평면(법선 = n): 수평 접선 tan, 표면을 따라 올라가는 up
    tan.crossVectors(UP, n);
    if (tan.lengthSq() < 1e-4) tan.set(1, 0, 0); //  정수리에서 축퇴 방지
    tan.normalize();
    up.crossVectors(tan, n).normalize();

    // 잎 밑동 위치 — 반구를 눌러 납작한 덩어리로
    const px = n.x * r;
    const py = n.y * r * squash; //  y만 눌러 납작한 덩어리로
    const pz = n.z * r;

    const lh = r * (0.55 + hash(k, 9) * 0.45); //  잎 길이
    const lw = lh * (0.34 + hash(k, 10) * 0.16); //  잎 반폭
    const roll = (hash(k, 11) - 0.5) * 0.9; //  잎마다 살짝 비틀기
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);

    // 잎 로컬 좌표(마름모): 밑동 → 좌/우 → 팁. 삼각형 2장.
    const L: [number, number][] = [
      [0, 0],
      [-lw, lh * 0.45],
      [lw, lh * 0.45],
      [0, lh],
    ];
    const world = L.map(([lx, ly]) => {
      const rx = lx * cr - ly * sr;
      const ry = lx * sr + ly * cr;
      v.set(px, py, pz).addScaledVector(tan, rx).addScaledVector(up, ry);
      return [v.x, v.y, v.z] as [number, number, number];
    });

    // 명암: 덩어리 아래쪽 잎은 어둡게(자기 그늘), 잎 팁으로 갈수록 밝게
    const lo = 0.74 + n.y * 0.22;
    const s0 = lo * 0.84;
    const s1 = lo;
    const push = (a: number, b: number, c: number, sa: number, sb: number, sc: number) => {
      pos.push(...world[a], ...world[b], ...world[c]);
      col.push(sa, sa, sa, sb, sb, sb, sc, sc, sc);
    };
    push(0, 1, 3, s0, s1, s1);
    push(0, 3, 2, s0, s1, s1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  // 관목은 덩어리 볼륨이 보여야 하므로 잔디만큼 세게 눕히지 않는다.
  return biasNormalsUp(geo, 0.5);
}
