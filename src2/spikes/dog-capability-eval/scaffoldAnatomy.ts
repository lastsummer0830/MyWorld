// AJP-004 dog capability eval — STAGE 1 해부 스캐폴드 수치.
//
// 정본: Pick/2026-08-01_비교_모델vs사진.png 의 **오른쪽 실사** (사용자의 블루멀 셸티).
// 실패 증거: Pick/2026-08-01_강아지_4면도.png (제품 강아지) + pass 1 표본.
// 여기에는 얼굴·무늬·눈·코 재질·애니메이션이 없다. 골격 덩어리와 실루엣만 있다.
//
// 바닥 y = 0, 강아지는 +x를 본다(왼쪽 −z).
// 실제로 서는 높이: 코트 포함 기갑선 H ≈ 0.92(러프 윗선), 두개골 꼭대기 1.08, 귀 끝 1.115.
//
// ─ 부위 그래프 (부모 → 자식은 "겹침"으로만 붙는다. 잇는 중심선이 없다) ─
//   몸통축   : 앞가슴 · 늑골 · 허리 · 엉덩이(+ 기갑 능선)
//   목       : 짧은 경사 다리(bridge). 뒤끝은 늑골 안, 앞끝은 두개골 안.
//   머리      : 두개골 ← 볼(좌우) ← 이마/스톱 ← 주둥이 ← 아래턱 ← 코 뭉치
//   귀       : 두개골 위 좌우 분리, 껍데기 + 앞으로 접힌 윗부분
//   앞다리    : 견갑 → 위팔 → 팔꿈치 → 아래팔 → 손목 → 계부 → 발
//   뒷다리    : 관골 → 허벅지 → 무릎 → 하퇴 → 비절(+ 비절끝) → 뒷계부 → 발
//   꼬리      : 엉덩이 안에서 시작하는 넓은 밑동 → 중간 → 끝(측면으로 납작)
//   코트 덩어리: 러프 · 옆구리 자락 · 펜츠 · 앞다리 페더 (전부 깊게 파묻힌다)
//
// ─ 주요 비율 ─
//   몸 길이(어깨끝 0.255 ~ 엉덩이 뒷선 −0.85)   1.105 = 1.20 H · 사진처럼 키보다 길다
//   팔꿈치 높이 0.505                           = 0.55 H
//   머리 길이(후두 0.315 ~ 코끝 0.775)          0.460 = 0.50 H · 몸 길이 ÷ 머리 = 2.4
//   두개골 0.265 : 보이는 주둥이 0.195           1 : 0.74 · 주둥이가 두개골보다 짧게 읽힌다
//   두개골 폭 0.208 / 볼 포함 0.230 / 주둥이 뿌리 폭 0.148 (= 두개골의 0.71)
//   귀 높이 0.070 / 두개골 높이 0.157            = 0.45
//   흉심(가슴 아래 0.50) = 팔꿈치 높이 · 배 0.59로 tuck-up · 코트 자락 0.43

import { jointSpec, type MassSpec } from './mass';

export type Part = { name: string; spec: MassSpec };

/** 좌우 대칭 부위의 부호. 1 = 강아지 오른쪽(+z), −1 = 왼쪽(−z) */
export type Side = 1 | -1;

// ── 몸통축 ───────────────────────────────────────────────────────────────
// 몸통 덩어리의 축은 전부 **뒤 → 앞(+x)** 으로 잡는다.
// 축을 −x로 잡으면 프레임 규약상 u가 뒤집혀 up/down이 서로 바뀐다(가슴 깊이·등선이 반대가 된다).
//
// 늑골은 "수평 통"이다. 4면도의 달걀 앞가슴을 만들지 않기 위해
// 최대 폭·최대 깊이를 팔꿈치 **뒤**(t 0.55~0.82)에 두고, 앞 단면(t 1)은 좁게 끝낸다.
// 아래선 0.4975 ≈ 팔꿈치 높이(흉심), 등선 0.8675.
const RIBCAGE: MassSpec = {
  from: [-0.3, 0.7],
  to: [0.2, 0.705],
  sections: [
    { t: 0, side: 0.125, up: 0.15, down: 0.16, round: 3 },
    { t: 0.25, side: 0.148, up: 0.16, down: 0.195, round: 3 },
    { t: 0.55, side: 0.155, up: 0.165, down: 0.205, round: 3.2 },
    { t: 0.82, side: 0.145, up: 0.16, down: 0.195, round: 3.2 },
    { t: 1, side: 0.085, up: 0.115, down: 0.14, round: 3 },
  ],
  radial: 14,
};

// 허리. 늑골보다 좁고 얕다 — 배 아래선이 0.55 → 0.59로 올라가며 tuck-up이 생긴다.
const LOIN: MassSpec = {
  from: [-0.58, 0.74],
  to: [-0.26, 0.72],
  sections: [
    { t: 0, side: 0.12, up: 0.125, down: 0.135, round: 3 },
    { t: 0.5, side: 0.115, up: 0.132, down: 0.14, round: 3 },
    { t: 1, side: 0.128, up: 0.14, down: 0.17, round: 3 },
  ],
  radial: 14,
};

// 엉덩이/골반. 위선이 앞쪽 0.88에서 꼬리 밑동 0.775로 떨어져 크룹 경사를 만든다.
const CROUP: MassSpec = {
  from: [-0.88, 0.7],
  to: [-0.52, 0.755],
  sections: [
    { t: 0, side: 0.08, up: 0.075, down: 0.11, round: 3 },
    { t: 0.2, side: 0.115, up: 0.1, down: 0.15, round: 3 },
    { t: 0.6, side: 0.14, up: 0.12, down: 0.17, round: 3 },
    { t: 1, side: 0.12, up: 0.125, down: 0.15, round: 3 },
  ],
  radial: 14,
};

/** 기갑 능선(0.895). 목 → 등으로 넘어가는 어깨 위 융기. 목이 등에 "꽂힌" 티를 없앤다. */
const WITHERS: MassSpec = {
  from: [-0.12, 0.855],
  to: [0.16, 0.845],
  sections: [
    { t: 0, side: 0.09, up: 0.035, down: 0.1, round: 3 },
    { t: 0.55, side: 0.105, up: 0.045, down: 0.11, round: 3 },
    { t: 1, side: 0.075, up: 0.03, down: 0.08, round: 3 },
  ],
};

/**
 * 전흉(prosternum). 앞다리 사이를 채우는 **작은** 덩어리다.
 * 4면도의 실패는 이 자리에 몸통만 한 달걀을 놓은 것이었다 — 여기서는
 * 폭 0.17 / 깊이 0.16으로 늑골보다 작고, 앞끝(x 0.255)이 어깨끝을 넘지 않는다.
 */
const FORECHEST: MassSpec = {
  from: [0.1, 0.585],
  to: [0.255, 0.64],
  sections: [
    { t: 0, side: 0.085, up: 0.075, down: 0.085, round: 3 },
    { t: 0.6, side: 0.078, up: 0.07, down: 0.08, round: 3 },
    { t: 1, side: 0.05, up: 0.045, down: 0.05, round: 3 },
  ],
};

/**
 * 목. 튜브가 아니라 **짧은 경사 다리**다.
 * 뒤끝(x 0.02)은 늑골·기갑 **안쪽**에서, 앞끝(x 0.375)은 두개골 **안쪽**에서 끝난다.
 * 그래서 밖에서 보이는 목 길이는 어깨끝~두개골 사이 한 뼘뿐이고,
 * 양 끝이 다른 덩어리에 잠겨 있어 "관 하나가 꽂힌" 실루엣이 나오지 않는다.
 */
const NECK: MassSpec = {
  from: [0.02, 0.815],
  to: [0.375, 0.975],
  sections: [
    { t: 0, side: 0.12, up: 0.105, down: 0.13, round: 3 },
    { t: 0.45, side: 0.098, up: 0.09, down: 0.115, round: 3 },
    { t: 1, side: 0.078, up: 0.075, down: 0.088, round: 3 },
  ],
};

// ── 머리 ────────────────────────────────────────────────────────────────
// 셸티의 머리는 "쐐기"지만, 쐐기의 뒤쪽 2/3는 두개골 덩어리여야 한다.
// 두개골이 얇으면 주둥이 길이와 무관하게 쥐/개미핥기로 읽힌다.
const SKULL: MassSpec = {
  from: [0.315, 1.005],
  to: [0.58, 0.992],
  sections: [
    // t0은 후두 마개다. 여기서 갑자기 잘리면 옆면에서 뒤통수가 "썰린" 각이 남는다.
    { t: 0, side: 0.058, up: 0.042, down: 0.05, round: 3 },
    { t: 0.12, side: 0.086, up: 0.064, down: 0.074, round: 3.2 },
    { t: 0.3, side: 0.104, up: 0.076, down: 0.082, round: 3.4 },
    { t: 0.7, side: 0.1, up: 0.072, down: 0.08, round: 3.4 },
    { t: 1, side: 0.078, up: 0.06, down: 0.072, round: 3 },
  ],
};

/** 볼/광대. 머리에서 가장 넓은 자리를 눈 아래에 만든다(폭 0.230). */
const cheek = (s: Side): MassSpec => ({
  from: [0.36, 0.975],
  to: [0.545, 0.962],
  z: s * 0.07,
  sections: [
    { t: 0, side: 0.038, up: 0.045, down: 0.052, round: 3 },
    { t: 0.5, side: 0.045, up: 0.05, down: 0.06, round: 3 },
    { t: 1, side: 0.032, up: 0.038, down: 0.045, round: 3 },
  ],
  radial: 10,
});

/**
 * 이마. 앞면(x 0.605)이 주둥이 뿌리 위로 돌출해 **스톱 단차**를 만든다.
 * 스톱은 색이 아니라 이 단차(0.04~0.065)로만 읽혀야 한다.
 */
const BROW: MassSpec = {
  from: [0.495, 1.012],
  to: [0.605, 0.995],
  sections: [
    { t: 0, side: 0.086, up: 0.038, down: 0.055, round: 3.4 },
    { t: 1, side: 0.072, up: 0.028, down: 0.05, round: 3.4 },
  ],
  radial: 10,
};

/** 주둥이. 보이는 길이 0.195 = 두개골 0.265의 0.74배. 뿌리 폭은 두개골의 0.71배로 굵다. */
const MUZZLE: MassSpec = {
  from: [0.545, 0.968],
  to: [0.752, 0.957],
  sections: [
    { t: 0, side: 0.074, up: 0.048, down: 0.052, round: 3 },
    { t: 0.45, side: 0.064, up: 0.042, down: 0.048, round: 3 },
    { t: 1, side: 0.05, up: 0.036, down: 0.04, round: 3.6 },
  ],
  radial: 10,
};

/** 아래턱. 주둥이가 얇은 원뿔로 읽히지 않게 아래쪽에 실제 깊이를 준다. */
const JAW: MassSpec = {
  from: [0.555, 0.93],
  to: [0.738, 0.928],
  sections: [
    { t: 0, side: 0.058, up: 0.022, down: 0.03, round: 3 },
    { t: 1, side: 0.042, up: 0.018, down: 0.024, round: 3 },
  ],
  radial: 10,
};

/** 코 뭉치 — **재질이 아니라 형태다.** 주둥이 끝을 뭉툭하게 닫아 뾰족한 끝을 막는다. */
const NOSE: MassSpec = {
  from: [0.735, 0.959],
  to: [0.775, 0.952],
  sections: [
    { t: 0, side: 0.042, up: 0.03, down: 0.032, round: 3.5 },
    { t: 1, side: 0.03, up: 0.022, down: 0.024, round: 3.5 },
  ],
  radial: 10,
};

// ── 귀 ──────────────────────────────────────────────────────────────────
// 로컬 좌표: 밑동이 원점, 위가 +y, 넓은 면이 z(측면). 배치는 EAR_PLACE가 한다.
// 총 높이 0.070 = 두개골 높이(0.157)의 0.45 이하. 곡선·갈고리·뿔 금지 조건이라
// 축은 직선 두 개뿐이고, 윗부분이 앞(+x)으로 꺾이는 것만이 유일한 방향 변화다.
const EAR_SHELL: MassSpec = {
  from: [0, 0],
  to: [0.011, 0.05],
  sections: [
    { t: 0, side: 0.033, up: 0.015, down: 0.017, round: 3 },
    { t: 0.5, side: 0.027, up: 0.012, down: 0.013, round: 3 },
    { t: 1, side: 0.019, up: 0.009, down: 0.01, round: 3 },
  ],
  radial: 10,
};

/** 윗 1/4 앞접힘. 밑동 대비 약 48° 앞으로 꺾인다(= semi-prick). */
const EAR_FOLD: MassSpec = {
  from: [0.009, 0.048],
  to: [0.03, 0.07],
  sections: [
    { t: 0, side: 0.019, up: 0.009, down: 0.01, round: 3 },
    { t: 1, side: 0.009, up: 0.005, down: 0.005, round: 3 },
  ],
  radial: 10,
};

/**
 * 귀 배치. 밑동은 두개골 표면보다 약 0.02 안쪽에 잠긴다(붙임 자국 방지).
 * z ±0.058, 밑동 폭 0.066 → 안쪽 모서리 간격 0.05로 확실히 분리된다.
 */
export const EAR_PLACE = {
  position: [0.395, 1.045] as const,
  z: 0.058,
  /** x축 회전으로 바깥으로 눕히는 각(rad) */
  tilt: 0.3,
};

// ── 꼬리 ────────────────────────────────────────────────────────────────
// 축이 아래로 향하므로 up = 앞쪽, down = 뒤쪽 두께다.
// side(측면 반폭)를 평면 내 두께보다 작게 잡아 **측면으로 납작한 깃**을 만든다.
// 밑동(x −0.80)은 크룹(−0.88까지) 안에서 시작한다 → 갈고리처럼 떨어져 나오지 않는다.
const TAIL_BASE: MassSpec = {
  from: [-0.8, 0.76],
  to: [-0.905, 0.63],
  sections: [
    { t: 0, side: 0.05, up: 0.085, down: 0.078, round: 3 },
    { t: 1, side: 0.046, up: 0.082, down: 0.074, round: 3 },
  ],
  radial: 10,
};

const TAIL_MID: MassSpec = {
  from: [-0.895, 0.64],
  to: [-0.975, 0.43],
  sections: [
    { t: 0, side: 0.046, up: 0.09, down: 0.076, round: 3 },
    { t: 1, side: 0.04, up: 0.085, down: 0.07, round: 3 },
  ],
  radial: 10,
};

const TAIL_TIP: MassSpec = {
  from: [-0.97, 0.44],
  to: [-0.985, 0.255],
  sections: [
    { t: 0, side: 0.04, up: 0.08, down: 0.062, round: 3 },
    { t: 0.6, side: 0.032, up: 0.062, down: 0.048, round: 3 },
    { t: 1, side: 0.018, up: 0.032, down: 0.024, round: 3 },
  ],
  radial: 10,
};

// ── 앞다리 ──────────────────────────────────────────────────────────────
// 어깨끝(0.190, 0.780) → 팔꿈치(0.118, 0.505) → 손목(0.152, 0.185) → 발(중심 0.184).
// 발 중심이 어깨끝 아래에 오도록 맞췄다(체중선). 관절마다 덩어리를 남겨
// "굵기가 일정한 막대"가 되지 않게 한다.
const frontLeg = (s: Side): Part[] => [
  {
    name: 'scapula',
    spec: {
      from: [0.045, 0.885],
      to: [0.195, 0.775],
      z: s * 0.108,
      sections: [
        { t: 0, side: 0.042, up: 0.06, down: 0.075, round: 3 },
        { t: 0.5, side: 0.052, up: 0.055, down: 0.075, round: 3 },
        { t: 1, side: 0.05, up: 0.048, down: 0.058, round: 3 },
      ],
      radial: 10,
    },
  },
  {
    name: 'upper-arm',
    spec: {
      from: [0.19, 0.78],
      to: [0.118, 0.505],
      z: s * 0.112,
      sections: [
        { t: 0, side: 0.058, up: 0.07, down: 0.062, round: 3 },
        { t: 0.5, side: 0.052, up: 0.055, down: 0.05, round: 3 },
        { t: 1, side: 0.046, up: 0.048, down: 0.044, round: 3 },
      ],
      radial: 10,
    },
  },
  { name: 'elbow', spec: jointSpec(0.12, 0.505, s * 0.11, 0.055) },
  {
    name: 'forearm',
    spec: {
      from: [0.118, 0.505],
      to: [0.15, 0.195],
      z: s * 0.108,
      sections: [
        { t: 0, side: 0.05, up: 0.052, down: 0.058, round: 3 },
        { t: 0.5, side: 0.043, up: 0.042, down: 0.046, round: 3 },
        { t: 1, side: 0.038, up: 0.036, down: 0.038, round: 3 },
      ],
      radial: 10,
    },
  },
  { name: 'carpus', spec: jointSpec(0.152, 0.185, s * 0.104, 0.044) },
  {
    name: 'pastern',
    spec: {
      // 앞 계부는 앞으로 약간 눕는다. 뒷 계부(수직)와 대비되는 리듬.
      from: [0.15, 0.19],
      to: [0.172, 0.07],
      z: s * 0.102,
      sections: [
        { t: 0, side: 0.04, up: 0.038, down: 0.04, round: 3 },
        { t: 1, side: 0.037, up: 0.034, down: 0.036, round: 3 },
      ],
      radial: 10,
    },
  },
  {
    name: 'front-paw',
    spec: {
      // 축이 정확히 수평이고 down이 전 구간 0.036 → 바닥면이 y = 0에 평평하게 놓인다.
      // round 5~6이라 밑면이 넓게 눌린 면으로 닿는다(점·못 발톱 금지 조건).
      from: [0.128, 0.036],
      to: [0.24, 0.036],
      z: s * 0.1,
      clampY: 0,
      sections: [
        { t: 0, side: 0.046, up: 0.036, down: 0.036, round: 5 },
        { t: 0.4, side: 0.054, up: 0.034, down: 0.036, round: 6 },
        { t: 0.8, side: 0.052, up: 0.03, down: 0.036, round: 6 },
        { t: 1, side: 0.04, up: 0.024, down: 0.036, round: 5 },
      ],
      radial: 12,
    },
  },
];

// ── 뒷다리 ──────────────────────────────────────────────────────────────
// 관골(−0.605, 0.730) → 무릎(−0.508, 0.418) → 비절(−0.663, 0.208) → 발(중심 −0.649).
// 무릎은 앞으로, 비절은 뒤로 — 앞다리의 거의 수직인 리듬과 확실히 다르다.
const rearLeg = (s: Side): Part[] => [
  {
    name: 'pelvis',
    spec: {
      // 축은 +x(몸통 규약과 동일). 관골 덩어리는 엉덩이와 허벅지 양쪽에 잠긴다.
      from: [-0.72, 0.7],
      to: [-0.56, 0.735],
      z: s * 0.075,
      sections: [
        { t: 0, side: 0.062, up: 0.12, down: 0.08, round: 3 },
        { t: 0.5, side: 0.078, up: 0.15, down: 0.1, round: 3 },
        { t: 1, side: 0.07, up: 0.13, down: 0.11, round: 3 },
      ],
      radial: 10,
    },
  },
  {
    name: 'thigh',
    spec: {
      from: [-0.605, 0.73],
      to: [-0.505, 0.42],
      z: s * 0.095,
      sections: [
        { t: 0, side: 0.08, up: 0.115, down: 0.105, round: 3 },
        { t: 0.5, side: 0.072, up: 0.09, down: 0.085, round: 3 },
        { t: 1, side: 0.058, up: 0.062, down: 0.058, round: 3 },
      ],
      radial: 10,
    },
  },
  { name: 'stifle', spec: jointSpec(-0.508, 0.418, s * 0.092, 0.058) },
  {
    name: 'crus',
    spec: {
      from: [-0.508, 0.418],
      to: [-0.66, 0.215],
      z: s * 0.09,
      sections: [
        { t: 0, side: 0.056, up: 0.07, down: 0.075, round: 3 },
        { t: 0.5, side: 0.048, up: 0.052, down: 0.058, round: 3 },
        { t: 1, side: 0.04, up: 0.038, down: 0.045, round: 3 },
      ],
      radial: 10,
    },
  },
  { name: 'hock', spec: jointSpec(-0.663, 0.208, s * 0.088, 0.046) },
  {
    name: 'hock-point',
    spec: {
      // 뒤로 튀어나온 비절 끝. 뒷다리 실루엣의 각을 만든다.
      from: [-0.65, 0.225],
      to: [-0.712, 0.242],
      z: s * 0.088,
      sections: [
        { t: 0, side: 0.036, up: 0.03, down: 0.032, round: 3 },
        { t: 1, side: 0.026, up: 0.02, down: 0.022, round: 3 },
      ],
      radial: 10,
    },
  },
  {
    name: 'rear-pastern',
    spec: {
      from: [-0.66, 0.212],
      to: [-0.652, 0.068],
      z: s * 0.088,
      sections: [
        { t: 0, side: 0.04, up: 0.038, down: 0.042, round: 3 },
        { t: 1, side: 0.035, up: 0.032, down: 0.034, round: 3 },
      ],
      radial: 10,
    },
  },
  {
    name: 'rear-paw',
    spec: {
      // 앞발보다 조금 작고 좁다(0.102 × 0.096 vs 0.112 × 0.108).
      from: [-0.7, 0.034],
      to: [-0.598, 0.034],
      z: s * 0.093,
      clampY: 0,
      sections: [
        { t: 0, side: 0.04, up: 0.03, down: 0.034, round: 5 },
        { t: 0.4, side: 0.048, up: 0.032, down: 0.034, round: 6 },
        { t: 0.8, side: 0.046, up: 0.028, down: 0.034, round: 6 },
        { t: 1, side: 0.036, up: 0.022, down: 0.034, round: 5 },
      ],
      radial: 12,
    },
  },
];

// ── 코트 덩어리 ──────────────────────────────────────────────────────────
// 장모종인지 **실루엣만으로** 판정하기 위한 최소 덩어리다. 털 결·색·가닥은 없다.
// 전부 다른 덩어리 안에서 시작해 안에서 끝난다 — 매달린 베개가 생길 자리가 없다.

/**
 * 러프. 목 축을 따라 놓인 하나의 덩어리이고, 뒤끝은 기갑·늑골 안,
 * 앞끝은 볼·아래턱 안에 잠긴다. 가장 넓은 자리(반폭 0.185)를 **어깨 위**에 두어
 * 앞가슴에 매단 풍선이 되지 않게 했다.
 */
const RUFF: MassSpec = {
  from: [-0.06, 0.76],
  to: [0.3, 0.918],
  sections: [
    { t: 0, side: 0.13, up: 0.06, down: 0.14, round: 3 },
    { t: 0.35, side: 0.185, up: 0.115, down: 0.23, round: 3 },
    { t: 0.7, side: 0.175, up: 0.11, down: 0.215, round: 3 },
    { t: 1, side: 0.095, up: 0.075, down: 0.11, round: 3 },
  ],
  radial: 14,
};

/**
 * 옆구리 자락. 축을 **앞(+x)** 으로 잡아야 up/down이 그대로 위/아래가 된다(프레임 규약).
 * 늑골보다 0.033 넓고, 아래로 0.43까지 내려와 팔꿈치(0.505)선을 덮는다 —
 * 장모종의 낮은 몸선을 만들되, 다리는 자락 아래로 계속 보인다.
 * 안쪽 모서리(z 0.072)가 늑골(0.155) 한참 안에 있어 매달린 판이 되지 않는다.
 */
const flankSkirt = (s: Side): MassSpec => ({
  from: [-0.52, 0.625],
  to: [0.07, 0.585],
  z: s * 0.13,
  sections: [
    { t: 0, side: 0.04, up: 0.085, down: 0.08, round: 3 },
    { t: 0.3, side: 0.055, up: 0.105, down: 0.15, round: 3 },
    { t: 0.7, side: 0.058, up: 0.11, down: 0.165, round: 3 },
    { t: 1, side: 0.045, up: 0.09, down: 0.11, round: 3 },
  ],
  radial: 12,
});

/** 펜츠. 축이 아래로 향하므로 down(=뒤쪽)을 크게 줘 허벅지 뒤로 흐르는 자락을 만든다. */
const pants = (s: Side): MassSpec => ({
  from: [-0.59, 0.74],
  to: [-0.7, 0.33],
  z: s * 0.098,
  sections: [
    { t: 0, side: 0.085, up: 0.09, down: 0.13, round: 3 },
    { t: 0.45, side: 0.098, up: 0.075, down: 0.165, round: 3 },
    { t: 0.8, side: 0.08, up: 0.05, down: 0.13, round: 3 },
    { t: 1, side: 0.055, up: 0.03, down: 0.08, round: 3 },
  ],
  radial: 12,
});

/** 앞다리 페더링. 아래팔 **뒤쪽**으로만 퍼지는 얇은 깃. */
const frontFeather = (s: Side): MassSpec => ({
  from: [0.098, 0.545],
  to: [0.135, 0.25],
  z: s * 0.112,
  sections: [
    { t: 0, side: 0.052, up: 0.02, down: 0.055, round: 3 },
    { t: 0.5, side: 0.05, up: 0.015, down: 0.08, round: 3 },
    { t: 1, side: 0.04, up: 0.01, down: 0.045, round: 3 },
  ],
  radial: 10,
});

/** 중앙(비대칭 없음) 덩어리 */
export const CORE_PARTS: readonly Part[] = [
  { name: 'ribcage', spec: RIBCAGE },
  { name: 'loin', spec: LOIN },
  { name: 'croup', spec: CROUP },
  { name: 'withers', spec: WITHERS },
  { name: 'forechest', spec: FORECHEST },
  { name: 'neck', spec: NECK },
  { name: 'ruff', spec: RUFF },
  { name: 'skull', spec: SKULL },
  { name: 'brow', spec: BROW },
  { name: 'muzzle', spec: MUZZLE },
  { name: 'jaw', spec: JAW },
  { name: 'nose-mass', spec: NOSE },
  { name: 'tail-base', spec: TAIL_BASE },
  { name: 'tail-mid', spec: TAIL_MID },
  { name: 'tail-tip', spec: TAIL_TIP },
];

/** 좌우 한 쪽 부위 전체 */
export function sideParts(s: Side): Part[] {
  return [
    { name: 'cheek', spec: cheek(s) },
    ...frontLeg(s),
    ...rearLeg(s),
    { name: 'flank-skirt', spec: flankSkirt(s) },
    { name: 'pants', spec: pants(s) },
    { name: 'front-feather', spec: frontFeather(s) },
  ];
}

export const EAR_PARTS: readonly Part[] = [
  { name: 'ear-shell', spec: EAR_SHELL },
  { name: 'ear-fold', spec: EAR_FOLD },
];
