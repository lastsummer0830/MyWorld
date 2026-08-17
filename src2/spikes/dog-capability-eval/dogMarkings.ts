// AJP-004 dog capability eval — 무늬(블루멀) 표.
//
// 규칙 셋만 지킨다.
//   ① **난수 없음.** 멀 얼룩은 잡음이 아니라 표다 — 몸통 여덟 개(큰 얼룩 6 + 점 2) + 머리 셋. 캡처가 재현된다.
//   ② **직사각형 없음.** 얼룩 경계는 (진행, 단면각) 공간의 타원을 authored 코사인 두 개로 흔든 것이다.
//      표면 좌표에서 정의하므로 등을 타고 옆구리로 **휘어 넘어간다** — 데칼처럼 잘리지 않는다.
//   ③ **황갈(탄)은 눈썹·볼·아랫옆구리·뒷다리 악센트뿐.** 두개골 갈색 얼룩은 실패 조건이라 없다.
//
// 색이 번지지 않는 이유는 여기가 아니라 loft 쪽이다: 색은 사각형 단위로 굽고 법선만 매끈하다.

import * as THREE from 'three';
import { FUR } from './dogPalette';
import type { PaintCtx, PaintFn } from './loft';

const TAU = Math.PI * 2;

const C = {
  silver: new THREE.Color(FUR.silver),
  silverLight: new THREE.Color(FUR.silverLight),
  charcoal: new THREE.Color(FUR.charcoal),
  black: new THREE.Color(FUR.black),
  white: new THREE.Color(FUR.white),
  whiteShade: new THREE.Color(FUR.whiteShade),
  tan: new THREE.Color(FUR.tan),
  tanLight: new THREE.Color(FUR.tanLight),
  earInner: new THREE.Color(FUR.earInner),
  lip: new THREE.Color(FUR.lip),
  eyeRim: new THREE.Color('#20232A'),
  nose: new THREE.Color(FUR.nose),
} as const;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const wrapPi = (v: number) => {
  let x = v;
  while (x > Math.PI) x -= TAU;
  while (x < -Math.PI) x += TAU;
  return x;
};

/** 구간 선형 사다리. 무늬 경계선을 좌표로 직접 적기 위한 것이다. */
function ramp(stops: readonly (readonly [number, number])[], x: number): number {
  if (x <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [x0, v0] = stops[i];
    const [x1, v1] = stops[i + 1];
    if (x <= x1) return v0 + ((v1 - v0) * (x - x0)) / (x1 - x0);
  }
  return last[1];
}

/** [a,b] 구간에서 1로 솟았다 내려오는 언덕. 목 둘레 흰 칼라를 국소적으로 들어올릴 때 쓴다. */
function hill(x: number, a: number, b: number): number {
  const s = clamp01((x - a) / (b - a));
  return 4 * s * (1 - s);
}

const smooth = (v: number, a: number, b: number) => {
  const s = clamp01((v - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/**
 * 코트와 흰 면이 갈리는 선. **몸통 뒤에서는 낮고, 앞가슴·목에서 급히 솟는다** —
 * 이 한 줄이 셸티의 "가슴에서 턱까지 이어지는 흰 갈기"를 만든다. 갈기를 따로 매달지 않는 이유다.
 */
// ★ 값은 배선(배 표면의 실제 y)을 풀어서 맞췄다. 선이 배보다 낮으면 흰 면이 아예 안 나온다.
//   몸통 뒤쪽은 배가 높고(0.58~0.62) 선이 그보다 0.04쯤 위 → 좁은 흰 배 띠.
//   가슴은 배가 0.49까지 깊고 선이 0.60 → 넓은 흰 앞가슴. 이 낙차가 사진의 흰 분포다.
const COAT_LINE: readonly (readonly [number, number])[] = [
  [-0.8, 0.66],
  [-0.62, 0.645],
  [-0.4, 0.64],
  [-0.18, 0.625],
  [0.02, 0.6],
  [0.16, 0.678],
  [0.26, 0.82],
  [0.33, 0.95],
  [0.4, 1.012],
  [0.5, 1.035],
  [0.6, 1.075],
  [0.64, 1.13],
  [0.95, 1.17],
];

function coatLine(x: number, az: number): number {
  // 목 옆면에서 흰 칼라가 더 높이 올라간다. 정면에서만 흰 턱받이가 보이면 목도리처럼 읽힌다.
  return ramp(COAT_LINE, x) + 0.09 * hill(x, 0.26, 0.46) * smooth(az, 0.04, 0.095);
}

/** 얼룩 하나. (x, 단면각) 공간의 타원 + authored 로브 두 개. */
type Patch = {
  x: number;
  a: number;
  rx: number;
  ra: number;
  k3: number;
  p3: number;
  k5: number;
  p5: number;
};

/** 1 미만이면 얼룩 안, 1.35 미만이면 둘레의 중간톤. 이 헤일로가 멀 특유의 얼룩덜룩함이다. */
function patchField(q: Patch, x: number, a: number): number {
  const dx = (x - q.x) / q.rx;
  const da = wrapPi(a - q.a) / q.ra;
  const d = Math.hypot(dx, da);
  if (d > 2.4) return 9;
  const th = Math.atan2(da, dx);
  const edge = 1 + q.k3 * Math.cos(3 * th + q.p3) + q.k5 * Math.cos(5 * th + q.p5);
  return d / Math.max(0.4, edge);
}

/**
 * 몸통 멀 얼룩. 좌우가 일부러 어긋난다 — 대칭 얼룩은 무늬가 아니라 도색으로 보인다.
 * a = 0이 등 위쪽, a > 0이 강아지 왼쪽(−z).
 */
const BODY_PATCHES: readonly Patch[] = [
  { x: 0.02, a: 0.3, rx: 0.15, ra: 0.62, k3: 0.18, p3: 0.7, k5: 0.1, p5: 2.1 }, // 기갑 안장
  { x: -0.24, a: -0.24, rx: 0.15, ra: 0.66, k3: 0.16, p3: 2.4, k5: 0.11, p5: 0.5 }, // 등 가운데
  { x: -0.55, a: 0.12, rx: 0.12, ra: 0.72, k3: 0.2, p3: 1.2, k5: 0.09, p5: 3.0 }, // 엉덩이
  { x: -0.1, a: 1.05, rx: 0.11, ra: 0.4, k3: 0.22, p3: 0.3, k5: 0.12, p5: 1.7 }, // 왼쪽 갈비
  { x: -0.05, a: -1.12, rx: 0.09, ra: 0.36, k3: 0.24, p3: 2.9, k5: 0.1, p5: 0.9 }, // 오른쪽 갈비
  { x: 0.15, a: -0.86, rx: 0.08, ra: 0.34, k3: 0.2, p3: 1.9, k5: 0.12, p5: 2.6 }, // 오른쪽 어깨
];

/** 중간톤만 남는 작은 점 두 개. 큰 얼룩만 있으면 판이 비어 보인다. */
const BODY_SPECKS: readonly Patch[] = [
  { x: -0.36, a: 0.92, rx: 0.07, ra: 0.3, k3: 0.24, p3: 1.4, k5: 0.1, p5: 2.8 },
  { x: -0.3, a: -0.55, rx: 0.06, ra: 0.26, k3: 0.2, p3: 0.2, k5: 0.12, p5: 1.1 },
];

/** 머리 얼룩은 세계 (x, y)에서 잰다. 두개골이 작아 표면 좌표보다 이쪽이 통제하기 쉽다. */
type HeadPatch = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  k3: number;
  p3: number;
  /** +1 = 강아지 오른쪽(+z)만, −1 = 왼쪽만, 0 = 양쪽 */
  side: 1 | -1 | 0;
};

const HEAD_PATCHES: readonly HeadPatch[] = [
  { x: 0.505, y: 1.108, rx: 0.088, ry: 0.062, k3: 0.2, p3: 0.6, side: 1 },
  { x: 0.452, y: 1.132, rx: 0.074, ry: 0.058, k3: 0.22, p3: 2.2, side: -1 },
  { x: 0.442, y: 1.142, rx: 0.062, ry: 0.046, k3: 0.18, p3: 1.5, side: 0 }, // 정수리 — 두 얼룩을 잇는다
];

function headField(q: HeadPatch, x: number, y: number): number {
  const dx = (x - q.x) / q.rx;
  const dy = (y - q.y) / q.ry;
  const d = Math.hypot(dx, dy);
  if (d > 2.4) return 9;
  const th = Math.atan2(dy, dx);
  return d / Math.max(0.4, 1 + q.k3 * Math.cos(3 * th + q.p3));
}

/** 이마 블레이즈 반폭. 주둥이에서 넓고 이마로 갈수록 좁아진다. */
function blazeHalf(x: number): number {
  if (x < 0.462) return 0;
  if (x > 0.62) return 0.03;
  return 0.012 + 0.018 * smooth(x, 0.462, 0.62);
}

/** 입술선의 높이. 주둥이 아래 1/3 지점을 지나간다. */
const lipY = (x: number) => 1.034 - (0.012 * (x - 0.63)) / 0.17;

/** 머리 무늬. 겹침 순서 = 판정 순서이고, 뒤에 쓴 것이 이긴다. */
function paintHead(out: THREE.Color, p: THREE.Vector3) {
  const x = p.x;
  const y = p.y;
  const az = Math.abs(p.z);

  out.copy(C.silver);

  // ① 두개골 멀 얼룩 + 중간톤 헤일로
  for (const q of HEAD_PATCHES) {
    if (q.side === 1 && p.z < 0.015) continue;
    if (q.side === -1 && p.z > -0.015) continue;
    const d = headField(q, x, y);
    if (d < 1) out.copy(C.black);
    else if (d < 1.35) out.copy(C.charcoal);
  }

  // ② 코트 선 아래 = 흰 목·턱·주둥이. 몸통과 같은 함수를 써서 턱 밑에서 끊기지 않는다.
  if (y < coatLine(x, az)) out.copy(C.white);

  // ③ 블레이즈 — 주둥이에서 이마 가운데로 올라가는 흰 줄
  if (az < blazeHalf(x) && x < 0.8) out.copy(C.white);

  // ④ 황갈 — 눈썹과 볼. 사진에서 탄이 있는 곳은 여기와 다리 아래뿐이다.
  if (az > 0.028 && az < 0.092 && Math.hypot((x - 0.548) / 0.042, (y - 1.122) / 0.022) < 1) {
    out.copy(C.tanLight);
  }
  if (az > 0.062 && Math.hypot((x - 0.5) / 0.055, (y - 1.04) / 0.026) < 1) {
    out.copy(C.tan);
  }

  // ⑤ 입술선 — 주둥이가 흰 덩어리 하나로 뭉치지 않게 한 줄 넣는다.
  if (x > 0.63 && x < 0.802 && az > 0.012 && Math.abs(y - lipY(x)) < 0.005) out.copy(C.lip);

  // ⑥ 눈 테두리. 눈 조각이 얼굴에 얹힌 스티커로 보이지 않으려면 이 어두운 아몬드가 필요하다.
  if (az > 0.05 && Math.hypot((x - 0.556) / 0.05, (y - 1.098) / 0.032) < 1) out.copy(C.eyeRim);
}

/** 몸통 무늬. */
function paintBody(out: THREE.Color, p: THREE.Vector3, a: number) {
  const x = p.x;
  const y = p.y;
  const az = Math.abs(p.z);
  const line = coatLine(x, az);

  out.copy(C.silver);

  // 아랫옆구리 황갈 띠 — 흰 배와 은회색 코트 사이의 세이블 기미.
  if (y > line && y < line + 0.055 && az > 0.075 && x > -0.56 && x < 0.24) out.copy(C.tanLight);

  for (const q of BODY_SPECKS) if (patchField(q, x, a) < 1.15) out.copy(C.charcoal);
  for (const q of BODY_PATCHES) {
    const d = patchField(q, x, a);
    if (d < 1) out.copy(C.black);
    else if (d < 1.35) out.copy(C.charcoal);
  }

  if (y < line) out.copy(y < line - 0.16 ? C.whiteShade : C.white);
}

/** 몸통 + 머리를 한 껍데기로 칠한다. 경계는 목·두개골 이음(x = 0.40)이다. */
export const trunkPaint: PaintFn = (out, ctx: PaintCtx) => {
  if (ctx.p.x > 0.4) paintHead(out, ctx.p);
  else paintBody(out, ctx.p, ctx.a);
};

/**
 * 다리. 앞다리는 팔꿈치 아래로 통째로 흰 양말, 뒷다리는 허벅지가 코트색이고 비절 아래가 희다.
 * 단면각 a = 0이 다리의 **앞쪽**이라 황갈 악센트를 앞면에만 놓을 수 있다.
 */
export function legPaint(rear: boolean): PaintFn {
  return (out, ctx) => {
    const y = ctx.p.y;
    const fwd = Math.cos(ctx.a);

    if (rear) {
      out.copy(y > 0.36 ? C.silver : C.white);
      if (y > 0.3 && y < 0.5 && fwd > 0.45) out.copy(C.tan);
      if (y < 0.05) out.copy(C.whiteShade);
    } else {
      out.copy(y > 0.66 ? C.silver : C.white);
      if (y < 0.05) out.copy(C.whiteShade);
    }
  };
}

/** 꼬리 — 밑동은 코트색, 몸통은 짙고, 끝만 흰 깃. 띠를 더 넣으면 얼룩말이 된다. */
export const tailPaint: PaintFn = (out, ctx) => {
  const u = ctx.u;
  if (u < 0.22) out.copy(C.silver);
  else if (u < 0.8) out.copy(u > 0.34 && u < 0.56 ? C.black : C.charcoal);
  else out.copy(C.white);
};

/** 귀 — a = 0이 뒷면(바깥), a = π가 앞면(안쪽)이다. 접힌 끝이 가장 짙다. */
export const earPaint: PaintFn = (out, ctx) => {
  const u = ctx.u;
  const back = Math.cos(ctx.a);
  if (u < 0.16) out.copy(C.silver);
  else if (back < -0.25) out.copy(C.earInner);
  else out.copy(u > 0.6 ? C.black : C.charcoal);
};

/** 코 가죽. 위쪽 면만 한 단 밝게 둬서 검은 덩어리로 뭉치지 않게 한다. */
export const nosePaint: PaintFn = (out, ctx) => {
  out.copy(C.nose);
  if (Math.cos(ctx.a) > 0.55) out.copy(C.lip);
};
