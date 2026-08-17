// AJP-004 — hero tree.
// reference: /Lucario/MyRoom/idea_resources/요소/0c8a56239f696f395fbf8b35c6aefd9b.jpg
//
// reference에서 읽은 부분 그래프
//   뿌리판: 줄기 밑동에서 방사상으로 흘러나온 굵은 뿌리 리본. 일부는 땅 위로 솟았다가 다시 박힌다.
//   줄기: 밑동이 확 넓어지고(root flare) 위로 갈수록 가늘어진다. 곧지 않고 S자로 눕는다.
//   골격: 줄기 → 1차 가지 6개 → 2차 가지 → (윗부분) 3차 잔가지.
//         왼쪽 아래 가지는 잎이 없어 2차 가지까지 그대로 노출된다 — 이 "빈 곳"이 나무를 나무로 만든다.
//   수관: **구가 아니라 잎이다.** reference를 확대하면 수관은 열편이 있는 잎 한 장 한 장이
//         가지 끝마다 뭉쳐 붙은 것이고, 그 무리들이 모여 큰 덩어리로 읽힌다.
//         가장자리는 잎 윤곽 때문에 들쭉날쭉하고, 덩어리 사이 틈으로 어두운 가지가 그대로 보인다.
//   색: 햇빛 받는 윗면 연둣빛 노랑 → 중간 초록 → 아랫면 진초록. 줄기는 따뜻한 진갈색.
//   비율(이미지 기준): 잎 한 장 ≈ 전체 높이의 0.09, 수관 폭 ≈ 전체 높이의 1.1, 오른쪽이 더 무겁다.
//
// 1차 판정에서 깨진 지점과 이번 수정
//   - 수관이 거대한 구 몇 개 + 떠 있는 작은 공으로 읽혔다.
//     → lobedMass 수관을 전부 버리고, 잎(leafBlade 'lobed'/'fan') 무리로 다시 만든다.
//   - 잎 무리가 허공에 떠 있었다(좌표를 손으로 박아 넣었기 때문).
//     → 이제 잎 무리는 **가지 곡선 위에서만** 생성된다. 좌표를 따로 적을 수 없는 구조다
//       (leafSpray는 growLimb 안에서 끝점/중간점을 받아서만 호출된다).
//   - 가지가 수관에 먹혀 보이지 않았다.
//     → 가지를 끝점 지정 방식으로 바꿔 수관 실루엣을 가지 배치로 직접 설계하고,
//       1차 가지의 몸통 절반에는 잎을 달지 않는다(= 앞/뒤 모두에서 골격이 보이는 창).

import * as THREE from 'three';
import {
  Part,
  aimX,
  leafBlade,
  limbCurve,
  lobedMass,
  mergeParts,
  pathCurve,
  place,
  sampleRamp,
  taperedTube,
} from './geometry';
import { CANOPY, GreenFamily, STAGE, WOOD } from './palette';

const d = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).normalize();
const UP = new THREE.Vector3(0, 1, 0);

/** 결정적 요동(-1~1). Math.random을 쓰면 캡처마다 형태가 달라져 검수 자체가 성립하지 않는다. */
function wave(i: number, seed: number, k = 1): number {
  return (
    Math.sin(i * 1.73 + seed * 2.31 + k) * 0.62 + Math.sin(i * 3.11 - seed * 1.07 + k * 1.9) * 0.38
  );
}

/* ------------------------------------------------------------------ *
 * 줄기
 * ------------------------------------------------------------------ */

/** S자로 눕는 중심선. 밑동은 지면 아래에서 시작해 흙에 박힌 것처럼 보이게 한다. */
const TRUNK_POINTS = [
  new THREE.Vector3(0, -0.45, 0),
  new THREE.Vector3(0.02, 0.55, 0.06),
  new THREE.Vector3(-0.06, 1.5, -0.02),
  new THREE.Vector3(0.18, 2.35, -0.12),
  new THREE.Vector3(0.42, 3.05, -0.04),
  new THREE.Vector3(0.6, 3.6, 0.06),
];
/** 밑동 1.2 → 꼭대기 0.3. 첫 두 마디의 급한 변화가 root flare다. */
const TRUNK_RADII = [1.2, 0.7, 0.54, 0.46, 0.38, 0.3];

/* ------------------------------------------------------------------ *
 * 뿌리
 * ------------------------------------------------------------------ */

type RootSpec = {
  /** 방위(rad) */
  az: number;
  len: number;
  /** 옆으로 휘는 양. 0이면 바큇살처럼 뻗어 인공적으로 보인다. */
  curl: number;
  /** 중간 마디가 지면 위로 솟는 높이 */
  hump: number;
  /** 끝이 흙으로 박히는 깊이 */
  dip: number;
  /** 굵기 사다리 — 중간이 다시 굵어지면 옹이진 뿌리로 읽힌다 */
  radii: number[];
};

const ROOTS: RootSpec[] = [
  { az: 0.25, len: 2.05, curl: 0.42, hump: 0.16, dip: -0.16, radii: [0.4, 0.26, 0.29, 0.14, 0.05] },
  { az: 1.05, len: 1.5, curl: -0.3, hump: 0.07, dip: -0.2, radii: [0.36, 0.24, 0.18, 0.1, 0.04] },
  { az: 1.95, len: 1.85, curl: 0.34, hump: 0.13, dip: -0.14, radii: [0.38, 0.27, 0.22, 0.13, 0.05] },
  { az: 2.75, len: 1.3, curl: -0.2, hump: 0.04, dip: -0.22, radii: [0.33, 0.21, 0.16, 0.09, 0.04] },
  { az: 3.55, len: 1.95, curl: 0.46, hump: 0.18, dip: -0.12, radii: [0.42, 0.28, 0.31, 0.15, 0.05] },
  { az: 4.4, len: 1.45, curl: -0.36, hump: 0.06, dip: -0.24, radii: [0.35, 0.23, 0.19, 0.1, 0.04] },
  { az: 5.35, len: 1.7, curl: 0.26, hump: 0.11, dip: -0.18, radii: [0.37, 0.25, 0.2, 0.12, 0.04] },
];

function rootPath(spec: RootSpec): THREE.Vector3[] {
  const c = Math.cos(spec.az);
  const s = Math.sin(spec.az);
  // 접선 방향 — 여기에 curl을 실어 뿌리를 옆으로 흘린다.
  const tc = -s;
  const ts = c;
  const at = (f: number, y: number, curl: number) =>
    new THREE.Vector3(
      c * spec.len * f + tc * spec.len * curl,
      y,
      s * spec.len * f + ts * spec.len * curl,
    );
  return [
    new THREE.Vector3(c * 0.1, 0.66, s * 0.1),
    at(0.34, 0.2, spec.curl * 0.1),
    at(0.68, spec.hump, spec.curl * 0.32),
    at(1, spec.dip, spec.curl * 0.6),
  ];
}

/* ------------------------------------------------------------------ *
 * 잎 무리
 * ------------------------------------------------------------------ */

export type FoliageSpec = {
  /** 잎 길이(m). reference 비율 ≈ 전체 높이의 0.08~0.10. */
  size: number;
  /** 바깥층 잎 수 */
  count: number;
  /** 가지 끝 방향에서 벌어지는 최대 각(rad) */
  spread: number;
  family: GreenFamily;
  seed: number;
  /** 안쪽을 메우는 짧은 부채잎 수. 0이면 무리 속이 비어 보인다. */
  fill?: number;
  /** 가지 쪽으로 되접히는 잎 수. 부착부를 덮어 "가지에 달렸다"를 만든다. */
  back?: number;
};

const GOLDEN = 2.399963229728653;

function leafTint(family: GreenFamily, up: number, w: number) {
  const lit = new THREE.Color(family.lit);
  const mid = new THREE.Color(family.mid);
  const shade = new THREE.Color(family.shade);
  const t = THREE.MathUtils.clamp(up * 0.5 + 0.5 + w * 0.12, 0, 1);
  const c = new THREE.Color();
  if (t > 0.55) c.copy(mid).lerp(lit, (t - 0.55) / 0.45);
  else c.copy(shade).lerp(mid, t / 0.55);
  return {
    base: `#${c.clone().lerp(shade, 0.38).getHexString()}`,
    tip: `#${c.clone().lerp(lit, 0.3).getHexString()}`,
  };
}

/**
 * 가지 위 한 점에 달리는 잎 무리.
 *
 * 구를 놓고 색을 칠하는 대신 잎을 한 장씩 세운다. 실루엣은 잎 윤곽(열편)이 만들고,
 * 무리의 크기는 잎 길이가 정한다 — 그래서 확대해도 "구"가 나오지 않는다.
 * 모든 잎의 기부는 `at`(가지 중심선 위의 점) 근처에서 시작하므로 부착이 보인다.
 */
function leafSpray(at: THREE.Vector3, dir: THREE.Vector3, spec: FoliageSpec): Part[] {
  const parts: Part[] = [];
  const axis = dir.clone().normalize();

  // 축에 수직인 국소 프레임. 축이 수직이어도 무너지지 않게 기준을 고른다.
  const side = new THREE.Vector3().crossVectors(axis, UP);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  side.normalize();
  const other = new THREE.Vector3().crossVectors(axis, side).normalize();

  const emit = (
    i: number,
    total: number,
    spread: number,
    lenScale: number,
    offset: number,
    shape: 'lobed' | 'fan',
    droopBias: number,
    phase: number,
  ) => {
    const u = (i + 0.5) / total;
    const w = wave(i, spec.seed, phase);
    const polar = spread * Math.sqrt(u) * (0.86 + 0.2 * w);
    const azm = i * GOLDEN + spec.seed + phase;

    const leafDir = axis
      .clone()
      .multiplyScalar(Math.cos(polar))
      .addScaledVector(side, Math.cos(azm) * Math.sin(polar))
      .addScaledVector(other, Math.sin(azm) * Math.sin(polar))
      // reference의 잎은 끝이 아래로 늘어진다. 전부 위로 뻗으면 성게처럼 보인다.
      .addScaledVector(UP, -droopBias)
      .normalize();

    const len = spec.size * lenScale * (0.84 + 0.24 * (0.5 + 0.5 * w));
    const tint = leafTint(spec.family, leafDir.y, w);

    parts.push({
      geo: place(
        leafBlade({
          length: len,
          width: len * (shape === 'fan' ? 0.72 : 0.62),
          fold: 0.34 + 0.14 * (0.5 + 0.5 * w),
          droop: 0.22 + 0.2 * (0.5 + 0.5 * w),
          shape,
          twist: 0.24 * w,
          tint,
        }),
        at.clone().addScaledVector(axis, offset * spec.size),
        aimX(leafDir, 0.42 * w),
      ),
    });
  };

  // 바깥층 — 실루엣을 만드는 잎. 끝 쪽에서 시작해 넓게 벌어진다.
  for (let i = 0; i < spec.count; i++) {
    emit(i, spec.count, spec.spread, 1, 0.1, 'lobed', 0.16, 0);
  }
  // 안쪽 채움 — 짧고 넓은 부채잎. 무리 속이 비어 하늘이 비치는 걸 막는다.
  const fill = spec.fill ?? Math.max(3, Math.round(spec.count * 0.42));
  for (let i = 0; i < fill; i++) {
    emit(i, fill, spec.spread * 0.62, 0.68, -0.05, 'fan', 0.1, 1.7);
  }
  // 되접힘 — 가지 쪽으로 눕는 잎. 부착부가 드러나 무리가 떠 보이지 않는다.
  const back = spec.back ?? 3;
  for (let i = 0; i < back; i++) {
    const w = wave(i, spec.seed, 3.3);
    const azm = i * GOLDEN + spec.seed * 1.4;
    const leafDir = axis
      .clone()
      .multiplyScalar(-0.55)
      .addScaledVector(side, Math.cos(azm) * 0.8)
      .addScaledVector(other, Math.sin(azm) * 0.8)
      .addScaledVector(UP, -0.3)
      .normalize();
    const len = spec.size * (0.62 + 0.16 * (0.5 + 0.5 * w));
    parts.push({
      geo: place(
        leafBlade({
          length: len,
          width: len * 0.66,
          fold: 0.42,
          droop: 0.34,
          shape: 'lobed',
          twist: 0.3 * w,
          tint: leafTint(spec.family, leafDir.y - 0.2, w),
        }),
        at.clone().addScaledVector(axis, -0.12 * spec.size),
        aimX(leafDir, 0.5 * w),
      ),
    });
  }

  return parts;
}

/* ------------------------------------------------------------------ *
 * 가지 골격
 * ------------------------------------------------------------------ */

type LimbSpec = {
  /** 부모 곡선 위 붙는 위치(0~1). 시작점이 부모 중심선이므로 접합부가 자연히 겹친다. */
  at: number;
  /** 끝점(나무 로컬 좌표). 수관 실루엣은 이 끝점 분포가 설계한다. */
  to: [number, number, number];
  /** 중간 마디를 밀어내는 휨 */
  bow: [number, number, number];
  /** 시작 굵기 = 붙는 자리의 부모 굵기 × taper */
  taper: number;
  tip: number;
  color: string;
  /** 끝에 달리는 잎 무리. 없으면 잎이 없는 노출 가지다(= 설계된 틈). */
  tuft?: FoliageSpec;
  /** 가지 중간에 달리는 잎 무리 [곡선 t, 무리]. 1차 가지는 t ≥ 0.7만 쓴다. */
  along?: [number, FoliageSpec][];
  children?: LimbSpec[];
};

/** 잎 무리 축약 생성기. 표를 읽을 수 있게 유지하려고 둔다. */
const tuft = (
  size: number,
  count: number,
  family: GreenFamily,
  seed: number,
  spread = 1.12,
): FoliageSpec => ({ size, count, spread, family, seed });

/**
 * 1차 가지 6개. 끝점을 직접 적어 수관의 층·비대칭을 설계한다.
 *
 * 설계된 덩어리(=끝점 무리)
 *   꼭대기 첨탑 y 5.9~6.9  (leader) — 가장 밝다
 *   왼쪽 위 단  y 4.9~5.9  (leftUp)
 *   오른쪽 위 단 y 4.3~5.6 (rightUp) — 오른쪽이 더 무겁다
 *   앞-오른쪽 큰 덩어리 z 1.5~2.1, y 3.5~4.4 (frontRight)
 *   뒤 덩어리 z -2.1~-2.5 (back)
 *   왼쪽 아래 단 y 3.5~3.9 (leftLow) — 가장 성기고, 몸통은 완전히 노출된다
 *
 * 설계된 틈(잎을 두지 않는 곳)
 *   앞-가운데 x -0.8~1.0 / z > 0.5 / y < 3.4  → 정면에서 줄기·분기점이 보인다
 *   왼쪽 아래 가지 몸통 전체                  → 1차·2차 가지가 그대로 노출된다
 *   뒤-왼쪽 낮은 곳 x < -0.5 / z < -1.2 / y < 3.8 → 뒤 각도에서 골격이 보인다
 */
const PRIMARIES: LimbSpec[] = [
  // 왼쪽 아래 — reference의 "빈 가지". 몸통과 2차 가지에 잎을 달지 않는다.
  {
    at: 0.55,
    to: [-3.55, 3.5, 0.6],
    bow: [0, 0.72, 0.16],
    taper: 0.6,
    tip: 0.055,
    color: WOOD.limb,
    tuft: tuft(0.5, 8, CANOPY.shade, 4.7, 1.24),
    children: [
      // 잎이 없는 2차 가지 — 창 안쪽에서 골격이 계속 이어지는 걸 보여 준다.
      {
        at: 0.36,
        to: [-2.35, 4.1, 1.3],
        bow: [0, 0.34, 0.06],
        taper: 0.6,
        tip: 0.028,
        color: WOOD.twig,
        children: [
          {
            at: 0.58,
            to: [-2.15, 4.25, 1.95],
            bow: [0, 0.16, 0],
            taper: 0.58,
            tip: 0.018,
            color: WOOD.twig,
          },
        ],
      },
      {
        at: 0.68,
        to: [-3.62, 4.35, -0.4],
        bow: [0, 0.36, 0],
        taper: 0.58,
        tip: 0.028,
        color: WOOD.twig,
        tuft: tuft(0.52, 9, CANOPY.shade, 6.1),
      },
      {
        at: 0.92,
        to: [-3.95, 3.9, 0.9],
        bow: [0, 0.22, 0],
        taper: 0.52,
        tip: 0.024,
        color: WOOD.twig,
        tuft: tuft(0.5, 8, CANOPY.shade, 18.1),
      },
    ],
  },
  // 앞-오른쪽 — 화면 앞으로 나오는 가장 큰 덩어리를 떠받친다.
  {
    at: 0.62,
    to: [2.55, 3.55, 1.55],
    bow: [0.16, 0.62, 0.26],
    taper: 0.6,
    tip: 0.055,
    color: WOOD.limb,
    tuft: tuft(0.66, 12, CANOPY.mid, 5.6),
    along: [[0.86, tuft(0.5, 7, CANOPY.mid, 15.2, 0.95)]],
    children: [
      {
        at: 0.42,
        to: [1.35, 4.15, 2.05],
        bow: [0, 0.3, 0.1],
        taper: 0.58,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.62, 11, CANOPY.mid, 16.5),
        along: [[0.66, tuft(0.46, 6, CANOPY.shade, 9.3, 0.9)]],
      },
      {
        at: 0.72,
        to: [2.95, 4.4, 0.75],
        bow: [0.05, 0.34, 0],
        taper: 0.56,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.6, 10, CANOPY.mid, 11.9),
      },
      {
        at: 0.94,
        to: [3.15, 3.5, 2.05],
        bow: [0, 0.18, 0.06],
        taper: 0.5,
        tip: 0.026,
        color: WOOD.twig,
        tuft: tuft(0.58, 10, CANOPY.mid, 13.7),
      },
    ],
  },
  // 뒤 — tree-back에서 수관을 받치는 가지.
  {
    at: 0.7,
    to: [-1.35, 4.05, -2.45],
    bow: [-0.1, 0.58, -0.16],
    taper: 0.58,
    tip: 0.05,
    color: WOOD.limb,
    tuft: tuft(0.58, 10, CANOPY.shade, 2.2),
    along: [[0.82, tuft(0.46, 6, CANOPY.shade, 19.6, 0.95)]],
    children: [
      {
        at: 0.45,
        to: [-0.25, 4.8, -2.35],
        bow: [0, 0.32, 0],
        taper: 0.56,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.6, 10, CANOPY.shade, 8.8),
      },
      {
        at: 0.76,
        to: [-2.4, 4.7, -2.1],
        bow: [-0.06, 0.3, 0],
        taper: 0.54,
        tip: 0.028,
        color: WOOD.twig,
        tuft: tuft(0.58, 10, CANOPY.shade, 21.3),
      },
    ],
  },
  // 오른쪽 위 — 오른쪽을 더 무겁게 만드는 단.
  {
    at: 0.8,
    to: [2.85, 4.85, -0.55],
    bow: [0.16, 0.52, -0.12],
    taper: 0.58,
    tip: 0.05,
    color: WOOD.limb,
    tuft: tuft(0.6, 11, CANOPY.upper, 3.1),
    along: [[0.8, tuft(0.48, 7, CANOPY.mid, 12.4, 0.95)]],
    children: [
      {
        at: 0.4,
        to: [2.15, 5.6, 0.45],
        bow: [0, 0.3, 0.05],
        taper: 0.56,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.62, 11, CANOPY.upper, 7.4),
      },
      {
        at: 0.74,
        to: [3.6, 5.2, -1.35],
        bow: [0.05, 0.26, 0],
        taper: 0.54,
        tip: 0.028,
        color: WOOD.twig,
        tuft: tuft(0.6, 10, CANOPY.upper, 22.6),
        along: [[0.62, tuft(0.44, 6, CANOPY.mid, 24.4, 0.9)]],
      },
      {
        at: 0.94,
        to: [3.6, 4.25, 0.4],
        bow: [0, 0.16, 0.05],
        taper: 0.5,
        tip: 0.026,
        color: WOOD.twig,
        tuft: tuft(0.56, 9, CANOPY.mid, 25.8),
      },
    ],
  },
  // 왼쪽 위
  {
    at: 0.88,
    to: [-2.55, 5.05, 0.15],
    bow: [-0.16, 0.56, 0.06],
    taper: 0.56,
    tip: 0.05,
    color: WOOD.limb,
    tuft: tuft(0.6, 11, CANOPY.upper, 9.9),
    along: [[0.78, tuft(0.48, 7, CANOPY.upper, 27.1, 0.95)]],
    children: [
      {
        at: 0.42,
        to: [-1.55, 5.9, -0.75],
        bow: [0, 0.28, 0],
        taper: 0.56,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.62, 11, CANOPY.upper, 28.5),
      },
      {
        at: 0.76,
        to: [-3.4, 5.35, 0.85],
        bow: [-0.05, 0.24, 0.05],
        taper: 0.54,
        tip: 0.028,
        color: WOOD.twig,
        tuft: tuft(0.6, 10, CANOPY.upper, 29.8),
        along: [[0.64, tuft(0.44, 6, CANOPY.shade, 31.2, 0.9)]],
      },
      {
        at: 0.95,
        to: [-3.25, 4.5, -0.6],
        bow: [0, 0.14, 0],
        taper: 0.5,
        tip: 0.026,
        color: WOOD.twig,
        tuft: tuft(0.56, 9, CANOPY.shade, 32.6),
      },
    ],
  },
  // 정단부 — 줄기가 그대로 이어지는 리더. 첨탑을 만든다.
  {
    at: 0.99,
    to: [0.7, 6.35, -0.1],
    bow: [0.12, 0.16, 0],
    taper: 0.88,
    tip: 0.05,
    color: WOOD.limb,
    tuft: tuft(0.66, 12, CANOPY.sunlit, 1.4, 1.0),
    children: [
      {
        at: 0.34,
        to: [-0.4, 5.85, 0.8],
        bow: [0, 0.24, 0.05],
        taper: 0.58,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.6, 10, CANOPY.upper, 33.9),
      },
      {
        at: 0.58,
        to: [1.8, 6.1, 0.55],
        bow: [0.05, 0.22, 0.05],
        taper: 0.56,
        tip: 0.03,
        color: WOOD.twig,
        tuft: tuft(0.62, 11, CANOPY.sunlit, 35.3),
      },
      {
        at: 0.8,
        to: [0.15, 6.8, -0.7],
        bow: [0, 0.2, 0],
        taper: 0.54,
        tip: 0.028,
        color: WOOD.twig,
        tuft: tuft(0.58, 10, CANOPY.sunlit, 36.7),
      },
      {
        at: 0.96,
        to: [1.45, 6.9, -0.3],
        bow: [0.04, 0.18, 0],
        taper: 0.5,
        tip: 0.026,
        color: WOOD.twig,
        tuft: tuft(0.56, 10, CANOPY.sunlit, 38.1),
      },
    ],
  },
];

function growLimb(
  parent: { curve: THREE.CatmullRomCurve3; radii: number[] },
  spec: LimbSpec,
  wood: Part[],
  foliage: Part[],
) {
  const start = parent.curve.getPointAt(spec.at);
  const parentR = sampleRamp(parent.radii, spec.at);
  const curve = limbCurve(start, new THREE.Vector3(...spec.to), new THREE.Vector3(...spec.bow));
  const r0 = parentR * spec.taper;
  const radii = [r0, r0 * 0.74, r0 * 0.46, spec.tip];

  wood.push({ geo: taperedTube(curve, radii, { radial: 6, segments: 16 }), color: spec.color });

  // 잎 무리는 여기서만 생긴다 — 가지 곡선 위의 점과 그 자리의 접선을 받는다.
  if (spec.tuft) {
    foliage.push(...leafSpray(curve.getPointAt(1), curve.getTangentAt(1), spec.tuft));
  }
  for (const [t, mid] of spec.along ?? []) {
    foliage.push(...leafSpray(curve.getPointAt(t), curve.getTangentAt(t), mid));
  }

  for (const child of spec.children ?? []) growLimb({ curve, radii }, child, wood, foliage);
}

/* ------------------------------------------------------------------ *
 * 조립
 * ------------------------------------------------------------------ */

export type TreeGeometry = { wood: THREE.BufferGeometry; foliage: THREE.BufferGeometry };

export function buildHeroTree(): TreeGeometry {
  const trunk = pathCurve(TRUNK_POINTS);
  const wood: Part[] = [];
  const foliage: Part[] = [];

  // 밑동이 놓인 흙 두둑. 뿌리가 허공에서 끝나지 않게 지면과 만나는 자리를 만든다.
  wood.push({
    geo: place(
      lobedMass({
        radius: 1.85,
        seed: 31.4,
        jitter: 0.09,
        scale: [1, 0.17, 1],
        lobes: [
          { dir: d(1, 0, 0.3), gain: 0.2 },
          { dir: d(-0.7, 0, 0.6), gain: 0.17 },
          { dir: d(-0.2, 0, -1), gain: 0.15 },
        ],
      }),
      new THREE.Vector3(0, -0.02, 0),
    ),
    color: STAGE.soilDay,
  });

  wood.push({
    geo: taperedTube(trunk, TRUNK_RADII, { radial: 10, segments: 34 }),
    color: WOOD.trunk,
  });

  for (const spec of ROOTS) {
    wood.push({
      geo: taperedTube(pathCurve(rootPath(spec)), spec.radii, { radial: 6, segments: 18 }),
      color: WOOD.root,
    });
  }

  for (const spec of PRIMARIES) {
    growLimb({ curve: trunk, radii: TRUNK_RADII }, spec, wood, foliage);
  }

  return { wood: mergeParts(wood), foliage: mergeParts(foliage) };
}
