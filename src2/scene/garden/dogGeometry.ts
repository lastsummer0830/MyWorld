// 강아지 지오메트리 — 척추를 따라 단면을 이어 붙인 **연속 표면 하나(loft)** 로 만든다.
//
// ★★ 2026-08-01 전면 재작성 (조아진: "풍선 이어붙인 것처럼 도형 이어붙이지 마라")
//
// 이전 강아지가 아이클레이/풍선으로 보인 원인은 배치나 색이 아니라 **문법**이었다:
//   ① 몸이 캡슐 하나였다 → 실루엣에 가슴·허리·엉덩이가 없다. 윤곽이 그냥 "혹의 연속"이다.
//   ② 무늬(등판·얼룩·볼의 탄·블레이즈)를 **또 다른 구**로 얹었다. 표면에 풍선을 붙인 것이다.
//      멀리서 보면 디테일은 사라지고 "겹친 덩어리들"만 남는다 — 그게 풍선으로 읽힌 정체다.
//   ③ 매끈한 구에는 털이 들어갈 자리가 없다. 아무리 잘 배치해도 점토가 된다.
//
// 그래서 문법을 셋 다 바꿨다:
//   ① 몸·머리·갈기·꼬리·다리를 각각 **단면(Section)을 이어 만든 연속 표면**으로 만든다.
//      단면마다 옆폭/위/아래 반경을 따로 줘서 "깊은 가슴 · 홀쭉한 허리 · 벌어진 엉덩이"를
//      **윤곽 자체에** 새긴다. 덩어리를 겹쳐서 흉내 내지 않는다.
//   ② 무늬는 mesh가 아니라 **정점 색**이다. 표면 위에 칠해지므로 경계가 표면을 타고 흐른다.
//   ③ 털은 표면의 **세로 결(홈)** 과 자락의 **톱니**로 만든다.
//      ★ 방사형으로 가닥을 심는 방법은 2026-08-01에 두 번 시도해 두 번 다 폭죽이 됐다.
//        털은 사방으로 뻗지 않고 몸을 따라 한 방향으로 눕는다. 결은 가시가 아니라 홈이다.
//
// 좌표 규약: 강아지는 +x를 본다. +y가 위, 강아지의 왼쪽은 −z (left = up × forward).
// 치수 단위는 모델 로컬(Dog.tsx에서 통째로 scale). 바닥이 y = 0이다.

import * as THREE from 'three';
import { COLOR } from '../palette';

const TAU = Math.PI * 2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 부드러운 문턱. 무늬 경계를 칼로 자르면 스티커를 붙인 것처럼 보인다 — 전부 이걸로 건넌다. */
const sstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const hash3 = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 3D 값잡음 — 등판 얼룩·경계 흔들기에 쓴다. 격자 8칸을 부드럽게 섞는다. */
function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz);
  return mix(
    mix(mix(c(0, 0, 0), c(1, 0, 0), sx), mix(c(0, 1, 0), c(1, 1, 0), sx), sy),
    mix(mix(c(0, 0, 1), c(1, 0, 1), sx), mix(c(0, 1, 1), c(1, 1, 1), sx), sy),
    sz,
  );
}

/**
 * 세로 결 — 반경을 각도에 따라 울린다.
 * 위상을 진행방향(u)에 따라 아주 천천히 밀어 **결이 몸을 따라 흐르게** 한다.
 * (u에 따라 빠르게 밀면 나선이 되어 소프트아이스크림이 된다 — 계수를 키우지 말 것)
 *
 * ★ 주파수 상한이 9인 이유: 단면을 N등분해 만드는데 N/2보다 빠른 파동은 표현이 안 되고
 *   엉뚱한 무늬로 되접힌다(에일리어싱). 제일 적은 다리가 18등분이라 9가 한계다.
 *   처음엔 19까지 썼다가 다리에 정체불명의 격자무늬가 생겼다.
 * ★ 굵은 파동(2a)을 섞는 게 중요하다. 가는 결만 있으면 멀리서 그냥 매끈해 보인다 —
 *   화면에서 실제로 "털 뭉치"로 읽히는 건 굵은 덩어리 쪽이다.
 */
const furWave = (a: number, u: number, seed: number) =>
  0.42 * Math.cos(5 * a + 1.7 * u + seed * 6.3) +
  0.34 * Math.cos(9 * a - 1.1 * u + seed * 11.1) +
  0.24 * Math.cos(2 * a + 3.1 * u + seed * 17.7);

/** 자락의 톱니 — 0~1. 각도마다 다른 길이로 털끝이 빠져나오게 한다(갈기 아랫자락·꼬리 끝). */
const frillWave = (a: number, seed: number) => {
  const w = 0.5 + 0.5 * Math.cos(11 * a + seed * 9.1) * Math.cos(5 * a - seed * 4.3);
  return w * w;
};

/** 단면 하나. 척추 위의 점 + 그 자리의 몸 두께. */
export type Section = {
  /** 단면 중심 */
  p: [number, number, number];
  /** 옆으로 뻗는 반경 (몸통 폭의 절반) */
  side: number;
  /** 위쪽 반경 — 등 */
  up: number;
  /** 아래쪽 반경 — 배. up과 따로 줘야 "깊은 가슴"이 나온다 */
  down: number;
  /** 1 = 타원 단면. 키울수록 각진 쐐기 (셸티 머리는 둥근 공이 아니라 쐐기다) */
  boxy?: number;
  /** 세로 결 깊이 — 반경 대비 비율. 0이면 매끈(코끝·발) */
  fur?: number;
  /** 진행 방향으로 삐져나오는 털끝 길이. 실루엣을 톱니로 만든다 */
  frill?: number;
};

/** 정점 색을 정하는 함수. (결과색, 정점 위치, 진행 0~1, 단면각 — 0이 등 위쪽) */
export type PaintFn = (out: THREE.Color, p: THREE.Vector3, u: number, a: number) => void;

/**
 * 재질 바탕색. 정점 색은 재질 색에 **곱해지므로**, 칠하려는 색을 그대로 넣으면
 * 바탕색만큼 어두워진다. 바탕으로 나눠서 넣어 "칠한 색 = 화면에 나오는 색"이 되게 한다.
 */
const BASE = new THREE.Color(COLOR.dogWhite);

/**
 * 단면들을 이어 하나의 닫힌 표면을 만든다.
 *
 * 각 단면의 좌표축은 척추의 진행방향에서 만든다(진행방향 ⊥ 옆축 ⊥ 위축).
 * 그래서 목이 위로 꺾이면 단면도 같이 기울고, 표면이 꺾인 자리에서 끊기지 않는다.
 */
export function loft(
  sections: Section[],
  opts: { segs?: number; seed?: number; paint: PaintFn },
): THREE.BufferGeometry {
  const { segs = 20, seed = 0.37, paint } = opts;
  const n = sections.length;

  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];

  const c = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const sideAx = new THREE.Vector3();
  const upAx = new THREE.Vector3();
  const ref = new THREE.Vector3();
  const v = new THREE.Vector3();
  const rgb = new THREE.Color();

  const put = (p: THREE.Vector3, u: number, a: number, shade = 1) => {
    pos.push(p.x, p.y, p.z);
    paint(rgb, p, u, a);
    col.push((rgb.r * shade) / BASE.r, (rgb.g * shade) / BASE.g, (rgb.b * shade) / BASE.b);
  };

  for (let i = 0; i < n; i++) {
    const s = sections[i];
    const prev = sections[Math.max(0, i - 1)];
    const next = sections[Math.min(n - 1, i + 1)];

    c.set(s.p[0], s.p[1], s.p[2]);
    tan
      .set(next.p[0] - prev.p[0], next.p[1] - prev.p[1], next.p[2] - prev.p[2])
      .normalize();

    // 진행방향이 수직에 가까우면 위쪽을 기준축으로 쓸 수 없다(외적이 0이 된다). 그땐 앞쪽을 기준으로.
    ref.set(0, 1, 0);
    if (Math.abs(tan.y) > 0.88) ref.set(1, 0, 0);
    sideAx.crossVectors(ref, tan).normalize();
    upAx.crossVectors(tan, sideAx).normalize();

    const u = i / (n - 1);
    const k = 1 / (s.boxy ?? 1);
    const fur = s.fur ?? 0;
    const frill = s.frill ?? 0;

    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * TAU;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // 초타원 단면 — k가 1이면 타원, 작아질수록 모서리가 살아나 쐐기가 된다
      const ey = Math.sign(ca) * Math.pow(Math.abs(ca), k);
      const ez = Math.sign(sa) * Math.pow(Math.abs(sa), k);

      const w = furWave(a, u, seed);
      const r = 1 + fur * w;
      const ry = (ey >= 0 ? s.up : s.down) * r;

      v.copy(c)
        .addScaledVector(upAx, ey * ry)
        .addScaledVector(sideAx, ez * s.side * r);
      if (frill > 0) v.addScaledVector(tan, frill * frillWave(a, seed));

      /**
       * ★ 음영을 색에 구워 넣는다 (2026-08-01 실측 후 추가).
       *   이 정원은 채움광이 세서(그늘/양지 비 0.77) 표면의 얕은 굴곡이 빛만으로는 안 드러난다.
       *   실제로 결을 새겨 놓고도 화면에서는 매끈한 흰 덩어리로 나왔다 — 다시 풍선이다.
       *   → 골은 어둡게, 마루는 밝게, 배 쪽은 한 단계 더 어둡게 **미리 칠해 둔다.**
       *   빛이 아무리 평평해도 털의 결과 부피가 남는다. 저폴리 에셋의 상투 수단이자 정공법.
       */
      put(v, u, a, (1 + 0.16 * w * (fur > 0 ? 1 : 0)) * (1 - 0.13 * clamp01(-ey)));
    }
  }

  // 옆면 — 사각형을 둘로 쪼갠다. 바깥을 보게 감는 방향을 맞춰야 한다(뒤집히면 밤처럼 어둡게 나온다).
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const j2 = (j + 1) % segs;
      const A = i * segs + j;
      const B = i * segs + j2;
      const C = (i + 1) * segs + j2;
      const D = (i + 1) * segs + j;
      idx.push(A, C, B, A, D, C);
    }
  }

  // 양 끝 마감 — 중심점 하나를 두고 부채꼴로 덮는다. 끝 단면을 작게 두면 눈에 띄지 않는다.
  const capAt = (ring: number, first: boolean) => {
    const s = sections[ring];
    const center = pos.length / 3;
    v.set(s.p[0], s.p[1], s.p[2]);
    put(v, first ? 0 : 1, 0);
    for (let j = 0; j < segs; j++) {
      const j2 = (j + 1) % segs;
      const A = ring * segs + j;
      const B = ring * segs + j2;
      if (first) idx.push(center, A, B);
      else idx.push(center, B, A);
    }
  };
  capAt(0, true);
  capAt(n - 1, false);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ── 무늬 팔레트 ──────────────────────────────────────────────────
const cWhite = new THREE.Color(COLOR.dogWhite);
const cSilver = new THREE.Color(COLOR.dogSilver);
const cMerle = new THREE.Color(COLOR.dogMerle);
const cCoal = new THREE.Color(COLOR.dogCharcoal);
const cTan = new THREE.Color(COLOR.dogTan);
const tmp = new THREE.Color();

// ── 몸통 ────────────────────────────────────────────────────────
//
// 뒤(꼬리)에서 앞(목)으로 간다. 실루엣의 승부처는 세 곳이다:
//   · 엉덩이는 옆으로 벌어지고(펜츠), · 허리는 홀쭉하게 들어가고, · 가슴은 아래로 깊다.
// 이 세 개가 윤곽에 안 나타나면 무슨 짓을 해도 소시지가 된다.
// ★ 2차 수정: 목을 **세우고 짧게** 했다. 1차에서는 목이 몸통 높이 그대로 앞으로 뻗어
//   머리가 가슴 앞에 매달렸다 — 개미핥기가 된 원인이 이것이다.
//   개는 어깨 위로 목이 솟고 머리가 **등선보다 확실히 높이** 있어야 개로 읽힌다.
const BODY: Section[] = [
  { p: [-0.335, 0.472, 0], side: 0.030, up: 0.030, down: 0.030, fur: 0.06 },
  { p: [-0.300, 0.474, 0], side: 0.078, up: 0.076, down: 0.076, fur: 0.08 },
  { p: [-0.250, 0.482, 0], side: 0.120, up: 0.104, down: 0.108, fur: 0.09 },
  { p: [-0.190, 0.478, 0], side: 0.134, up: 0.108, down: 0.120, fur: 0.10 }, //  엉덩이 — 제일 넓다
  { p: [-0.115, 0.470, 0], side: 0.102, up: 0.096, down: 0.078, fur: 0.08 }, //  허리 — 잘록
  { p: [-0.045, 0.462, 0], side: 0.100, up: 0.102, down: 0.096, fur: 0.07 },
  { p: [0.035, 0.458, 0], side: 0.110, up: 0.112, down: 0.120, fur: 0.07 },
  { p: [0.115, 0.464, 0], side: 0.117, up: 0.116, down: 0.140, fur: 0.07 }, //  가슴 — 제일 깊다
  { p: [0.190, 0.480, 0], side: 0.118, up: 0.120, down: 0.124, fur: 0.08 },
  { p: [0.240, 0.508, 0], side: 0.100, up: 0.110, down: 0.108, fur: 0.06 },
  { p: [0.272, 0.560, 0], side: 0.084, up: 0.090, down: 0.088, fur: 0.06 }, //  목 밑동
  { p: [0.288, 0.640, 0], side: 0.070, up: 0.072, down: 0.072, fur: 0.06 },
  { p: [0.296, 0.710, 0], side: 0.056, up: 0.056, down: 0.056, fur: 0.04 },
];

/**
 * 몸통 무늬 — 흰 바탕에 **등판만** 은회색, 그 위에 검은 띠.
 *
 * ★ 사진을 다시 봐야 하는 부분: 등의 검정은 동글동글한 점이 아니라 **척추를 가로지르는 띠**다.
 *   그래서 잡음을 x축으로만 촘촘하게 준다(점무늬로 뿌리면 달마시안이 된다).
 * ★ 등판 경계는 반드시 흔들어야 한다. 매끈한 선으로 자르면 색칠이 아니라 스티커가 된다.
 */
const bodyPaint: PaintFn = (out, p, u, a) => {
  out.copy(cWhite);

  const wobble = (vnoise(p.x * 7.5, p.y * 7.5, p.z * 7.5) - 0.5) * 0.42;
  let saddle = sstep(0.14, 0.40, Math.cos(a) + wobble); //  등에서 옆구리 위쪽까지, 경계는 좁게
  saddle *= sstep(0.34, 0.22, p.x); //  갈기에 닿기 전에 끝난다
  saddle *= sstep(-0.34, -0.28, p.x);

  if (saddle > 0.002) {
    // ★ 2차 수정: 1차 렌더에서 등판이 거의 안 보였다. 한낮 햇빛 아래 흰 몸이 이기기 때문에
    //   무늬는 팔레트에서 고른 것보다 **한 단계 더 짙게** 넣어야 화면에서 겨우 읽힌다.
    const band = vnoise(p.x * 11, p.y * 3.5, p.z * 3.5);
    tmp.copy(cSilver).lerp(cCoal, sstep(0.40, 0.60, band));
    out.lerp(tmp, saddle);
  }
};

// ── 갈기(러프) ──────────────────────────────────────────────────
//
// 셸티의 인상은 8할이 이것이다 — 머리보다 넓게 퍼져 얼굴을 액자처럼 감싸는 흰 갈기.
// 목을 따라 감는 게 아니라 **턱 밑에서 시작해 어깨 위로 흘러내리는 원뿔**로 만든다.
// 뒤쪽 끝(어깨 위)에 톱니 자락을 줘서 털이 뒤로 눕게 한다. 진행방향이 뒤라서 자락도 뒤로 뻗는다.
// ★ 2차 수정: 1차 렌더에서 갈기가 **아예 안 보였다.** 몸통과 같은 흰색인데 크기가 몸통과
//   비슷해서 그냥 어깨의 살로 읽힌 것이다. 갈기는 어중간하면 없는 것과 같다 —
//   몸통 폭의 두 배 가까이 키우고, 자락을 뒤로 길게 빼서 **경계가 보이게** 했다.
const RUFF: Section[] = [
  { p: [0.318, 0.650, 0], side: 0.044, up: 0.040, down: 0.050, fur: 0.06 },
  { p: [0.300, 0.606, 0], side: 0.104, up: 0.094, down: 0.100, fur: 0.13 },
  { p: [0.272, 0.562, 0], side: 0.164, up: 0.142, down: 0.152, fur: 0.16 },
  { p: [0.236, 0.528, 0], side: 0.192, up: 0.164, down: 0.180, fur: 0.17 },
  { p: [0.192, 0.506, 0], side: 0.196, up: 0.166, down: 0.194, fur: 0.17, frill: 0.03 },
  { p: [0.148, 0.496, 0], side: 0.170, up: 0.150, down: 0.162, fur: 0.16, frill: 0.05 },
  { p: [0.108, 0.490, 0], side: 0.120, up: 0.114, down: 0.112, fur: 0.13, frill: 0.05 },
  { p: [0.078, 0.490, 0], side: 0.044, up: 0.044, down: 0.044, fur: 0.07, frill: 0.03 },
];

const ruffPaint: PaintFn = (out, p, u, a) => {
  out.copy(cWhite);
  const up = Math.cos(a);
  // 어깨 위로 넘어가는 뒷자락 윗면에만 은회색이 스민다 (사진의 갈기 뒤쪽이 회색빛).
  // 이 회색이 등판 무늬와 이어져야 갈기가 "몸에서 자란 털"로 보인다.
  out.lerp(cSilver, sstep(0.45, 0.98, up) * sstep(0.45, 0.92, u) * 0.5);
  // 목 아래 깊은 곳은 살짝 가라앉혀 부피를 만든다. 흰색 덩어리는 평평해 보인다.
  out.lerp(cSilver, sstep(-0.35, -1.0, up) * 0.28);
  // ★ 뒷자락(몸통에 닿는 쪽)에 그늘을 구워 **갈기와 몸의 경계선**을 만든다.
  //   둘 다 흰색이라 이 선이 없으면 갈기가 어깨살로 읽힌다(1~5차 렌더에서 계속 그랬다).
  out.multiplyScalar(1 - 0.22 * sstep(0.55, 1.0, u));
};

// ── 머리 ────────────────────────────────────────────────────────
//
// 셸티 머리는 **쐐기**다 — 옆에서 보면 이마와 주둥이가 거의 한 직선이고, 위에서 보면 삼각형.
// 그래서 boxy를 올려 단면 모서리를 살린다(공으로 만들면 곰인형이 된다).
// 원점은 목 위 관절. 여기서 앞으로 나가면서 가늘어진다.
// ★ 2차 수정: 1차는 주둥이가 너무 길고 두개골이 좁아 개미핥기였다.
//   길이를 0.29 → 0.24로 줄이고 두개골을 넓혔다. 주둥이 끝을 아래로 처지게(y가 내려간다)
//   두면 옆에서 볼 때 코가 살짝 숙여져 개의 옆얼굴이 된다 — 수평으로 뻗으면 관이 된다.
const HEAD: Section[] = [
  { p: [-0.050, -0.020, 0], side: 0.050, up: 0.050, down: 0.050, fur: 0.06 },
  { p: [-0.015, 0.000, 0], side: 0.080, up: 0.074, down: 0.076, boxy: 1.15, fur: 0.07 },
  { p: [0.028, 0.008, 0], side: 0.092, up: 0.080, down: 0.084, boxy: 1.3, fur: 0.07 }, //  귀 사이
  { p: [0.068, 0.002, 0], side: 0.086, up: 0.068, down: 0.086, boxy: 1.35, fur: 0.07 }, //  눈·뺨
  { p: [0.102, -0.008, 0], side: 0.062, up: 0.046, down: 0.066, boxy: 1.3, fur: 0.05 }, //  스톱
  { p: [0.136, -0.020, 0], side: 0.042, up: 0.032, down: 0.044, boxy: 1.4, fur: 0.04 },
  { p: [0.180, -0.030, 0], side: 0.034, up: 0.026, down: 0.035, boxy: 1.5, fur: 0.03 },
  { p: [0.218, -0.038, 0], side: 0.028, up: 0.022, down: 0.028, boxy: 1.5, fur: 0.02 },
  { p: [0.240, -0.042, 0], side: 0.018, up: 0.015, down: 0.018, boxy: 1.4 },
];

/**
 * 얼굴 무늬 — 이 강아지를 "우리 집 개"로 만드는 건 전부 여기 있다.
 * 두개골은 어두운 merle, 옆면은 더 짙은 검정, 볼과 눈두덩에 황갈색,
 * 그리고 주둥이에서 이마 한가운데로 올라가는 **흰 블레이즈**.
 */
const headPaint: PaintFn = (out, p) => {
  const x = p.x;
  const y = p.y;
  const z = Math.abs(p.z);

  out.copy(cWhite);

  // ① 두개골은 어두운 바탕. 주둥이로 갈수록 흰색으로 빠진다.
  const skull = sstep(0.165, 0.085, x);
  tmp.copy(cMerle).lerp(cCoal, sstep(0.022, 0.062, z)); //  옆면·귀 밑이 가장 짙다
  out.lerp(tmp, skull);

  // ② 볼의 탄 — 눈 아래에서 귀 쪽으로 번지는 황갈색
  const cheek = 1 - clamp01(Math.hypot(x - 0.050, (y + 0.040) * 1.5, z - 0.074) / 0.080);
  out.lerp(cTan, sstep(0.05, 0.75, cheek) * 0.92);

  // ③ 눈두덩 위 탄 점 — 셸티 얼굴의 "눈썹". 이게 표정을 만든다.
  const brow = 1 - clamp01(Math.hypot(x - 0.048, (y - 0.042) * 1.3, z - 0.050) / 0.044);
  out.lerp(cTan, sstep(0.05, 0.8, brow) * 0.85);

  // ④ 흰 블레이즈 — 주둥이에서 이마로. 앞으로 갈수록 넓어진다.
  const w = 0.024 + 0.028 * sstep(-0.01, 0.12, x);
  out.lerp(cWhite, sstep(w, w * 0.5, z) * sstep(-0.03, 0.02, x));

  // ⑤ 턱·목 아래는 전부 희다
  out.lerp(cWhite, sstep(-0.035, -0.075, y));
};

// ── 귀 ──────────────────────────────────────────────────────────
//
// 머리 위에 서고 **윗절반만 앞으로 접힌다**(tipped ear). 접힘은 회전이 아니라 축을 꺾어서 만든다 —
// 그래야 접힌 자리가 끊기지 않고 한 장으로 이어진다. 축이 수직이라 loft의 기준축이 바뀌므로
// (side = 두께, up = 앞쪽, down = 뒤쪽)로 읽힌다.
const EAR: Section[] = [
  { p: [-0.004, 0, 0], side: 0.040, up: 0.030, down: 0.026 },
  { p: [0.000, 0.028, 0], side: 0.033, up: 0.026, down: 0.022 },
  { p: [0.008, 0.052, 0], side: 0.025, up: 0.021, down: 0.017 },
  { p: [0.024, 0.070, 0], side: 0.016, up: 0.015, down: 0.012 }, //  여기서 앞으로 꺾인다
  { p: [0.045, 0.078, 0], side: 0.009, up: 0.009, down: 0.007 },
  { p: [0.059, 0.076, 0], side: 0.003, up: 0.003, down: 0.002 },
];

/** 귀는 검정, 끝만 흰 점 — 조아진이 짚은 이 강아지의 표식이라 또렷하게 남긴다. */
const earPaint: PaintFn = (out, p, u) => {
  out.copy(cCoal);
  out.lerp(cWhite, sstep(0.6, 0.92, u));
};

// ── 꼬리 ────────────────────────────────────────────────────────
//
// 뒤로 누우면서 위로 휘는 깃털(plume). 곧은 막대에 털을 붙이는 게 아니라
// **축 자체가 휘고** 중간이 제일 두꺼워야 깃털로 읽힌다. 끝에 톱니 자락.
// ★ 2차 수정: 1차는 길고 곧아서 **뿔**로 보였다. 짧고 굵게, 더 휘게 바꿨다.
const TAIL: Section[] = [
  { p: [0, 0, 0], side: 0.040, up: 0.040, down: 0.040, fur: 0.06 },
  { p: [-0.024, 0.056, 0], side: 0.054, up: 0.050, down: 0.060, fur: 0.10 },
  { p: [-0.052, 0.108, 0], side: 0.062, up: 0.057, down: 0.072, fur: 0.13 },
  { p: [-0.086, 0.152, 0], side: 0.058, up: 0.053, down: 0.070, fur: 0.14 },
  { p: [-0.122, 0.184, 0], side: 0.046, up: 0.042, down: 0.057, fur: 0.14, frill: 0.03 },
  { p: [-0.156, 0.202, 0], side: 0.030, up: 0.028, down: 0.038, fur: 0.13, frill: 0.05 },
  { p: [-0.180, 0.208, 0], side: 0.012, up: 0.011, down: 0.015, fur: 0.08, frill: 0.03 },
];

const tailPaint: PaintFn = (out, p, u, a) => {
  out.copy(cWhite);
  // 꼬리 밑동 위쪽에만 짙은 얼룩 (사진에서 꼬리 뿌리가 검다)
  tmp.copy(cSilver).lerp(cMerle, 0.6);
  out.lerp(tmp, sstep(0.30, 0.02, u) * sstep(-0.2, 0.6, Math.cos(a)) * 0.9);
};

// ── 다리 ────────────────────────────────────────────────────────
//
// 관절 원점에서 아래로 내려간다. 축이 수직이라 (side = 좌우, up = 앞쪽, down = 뒤쪽)이다.
// → **뒤쪽 반경(down)만 키우면 그게 페더링**이다. 털을 따로 붙이지 않는다.
const LEG_FRONT: Section[] = [
  { p: [0, 0, 0], side: 0.058, up: 0.056, down: 0.062, fur: 0.05 },
  { p: [0, -0.070, 0], side: 0.052, up: 0.052, down: 0.082, fur: 0.08 }, //  뒤로 늘어진 페더링
  { p: [0.005, -0.145, 0], side: 0.042, up: 0.044, down: 0.076, fur: 0.09 },
  { p: [0.012, -0.220, 0], side: 0.030, up: 0.031, down: 0.052, fur: 0.07, frill: 0.025 },
  { p: [0.016, -0.290, 0], side: 0.024, up: 0.024, down: 0.026, fur: 0.04 },
  { p: [0.020, -0.345, 0], side: 0.026, up: 0.028, down: 0.028, fur: 0.03 },
  { p: [0.030, -0.376, 0], side: 0.031, up: 0.035, down: 0.030, fur: 0.02 }, //  발
  { p: [0.038, -0.390, 0], side: 0.021, up: 0.023, down: 0.019 },
];

/** 뒷다리 — 허벅지가 뒤로 부풀고(펜츠) 비절이 뒤로 꺾인다. 앞다리와 실루엣이 달라야 개로 보인다. */
const LEG_REAR: Section[] = [
  { p: [0, 0, 0], side: 0.062, up: 0.060, down: 0.078, fur: 0.06 },
  { p: [0.026, -0.078, 0], side: 0.058, up: 0.058, down: 0.100, fur: 0.09 },
  { p: [0.040, -0.150, 0], side: 0.045, up: 0.046, down: 0.090, fur: 0.10 }, //  무릎 — 앞으로
  { p: [-0.010, -0.222, 0], side: 0.031, up: 0.032, down: 0.050, fur: 0.08, frill: 0.025 }, //  비절 — 뒤로
  { p: [0.004, -0.288, 0], side: 0.024, up: 0.025, down: 0.026, fur: 0.04 },
  { p: [0.018, -0.348, 0], side: 0.026, up: 0.028, down: 0.027, fur: 0.03 },
  { p: [0.030, -0.378, 0], side: 0.031, up: 0.035, down: 0.030, fur: 0.02 },
  { p: [0.038, -0.390, 0], side: 0.021, up: 0.023, down: 0.019 },
];

const legPaint =
  (rear: boolean): PaintFn =>
  (out, p, u) => {
    out.copy(cWhite);
    if (rear) out.lerp(cTan, sstep(0.30, 0.05, u) * 0.22); //  허벅지 위쪽에 옅은 황갈색
  };

// ── 조립에 쓰는 관절 위치 ────────────────────────────────────────
/** Dog.tsx가 group을 놓는 자리. 지오메트리와 좌표가 어긋나면 부품이 떠 보이므로 한곳에 모은다. */
export const JOINT = {
  head: [0.278, 0.742, 0] as [number, number, number],
  tail: [-0.300, 0.496, 0] as [number, number, number],
  legFront: [0.186, 0.436, 0.068] as [number, number, number],
  legRear: [-0.205, 0.442, 0.076] as [number, number, number],
  /** 머리 로컬 — 코·눈·귀 */
  nose: [0.248, -0.040, 0] as [number, number, number],
  eye: [0.072, 0.021, 0.064] as [number, number, number],
  ear: [0.018, 0.060, 0.048] as [number, number, number],
};

// segs는 그냥 매끄러움 조절 손잡이가 아니다 — furWave의 최고 주파수(9)의 두 배 이상이어야
// 결이 되접히지 않는다(위 furWave의 ★ 참고). 그래서 어느 부품도 18 밑으로 내리지 않는다.
export const buildBody = () => loft(BODY, { segs: 28, seed: 0.21, paint: bodyPaint });
export const buildRuff = () => loft(RUFF, { segs: 30, seed: 0.63, paint: ruffPaint });
export const buildHead = () => loft(HEAD, { segs: 22, seed: 0.41, paint: headPaint });
export const buildEar = () => loft(EAR, { segs: 10, seed: 0.11, paint: earPaint });
export const buildTail = () => loft(TAIL, { segs: 20, seed: 0.77, paint: tailPaint });
export const buildLeg = (rear: boolean) =>
  loft(rear ? LEG_REAR : LEG_FRONT, {
    segs: 18,
    seed: rear ? 0.31 : 0.53,
    paint: legPaint(rear),
  });
