// AJP-004 · prop capability eval — 파스텔 물뿌리개의 기능 부재 그래프.
//
// 스케일: 제품 정본과 같은 1 unit = 1m. 몸통 높이 0.33m, 손잡이 꼭대기 0.48m —
// 실제 정원 물뿌리개 크기다. 능력 표본이라도 제품 스케일에서 벗어나면 판정이 무의미해진다.
//
// 부재 그래프(장식보다 먼저 정한다):
//   몸통(회전체, 하중 부재)
//     ├─ 굽 : 바닥 평면 접지 → 밖으로 벌어지는 굽 → 배
//     ├─ 배 : 최대폭 y=0.128 에서 어깨로 좁아진다
//     ├─ 아가리 : 밖으로 말린 롤 → 안쪽 벽 → 안바닥 (벽 두께와 열린 구멍이 한 면에서 나온다)
//     └─ 어깨 몰딩 : 강조색 한 줄
//   주둥이(앞, +Z)
//     ├─ 몸통 아래에서 시작해 벽을 뚫고 나온다(= 실제 물뿌리개의 사이펀 구조)
//     ├─ 접합 칼라 : 벽을 뚫고 나오는 지점을 감싸는 커프
//     └─ 장미머리 : 나팔 → 테두리 롤 → 살짝 팬 면 → 물구멍 7개
//   손잡이(띠 하나)
//     ├─ 앞 어깨 벽에서 나와 아가리 위를 넘고
//     ├─ 뒤로 내려와 배 뒤를 감싸 쥐는 구간이 되고
//     ├─ 배 뒤 벽 속으로 들어간다 (= 실루엣에서 아치 구멍 + 쥐는 구멍 두 개가 한 띠에서 나온다)
//     └─ 브래킷 패드 2장 : 띠가 몸통을 뚫는 두 자리
//
// 접합 원칙: 띠·관의 끝점은 **바깥벽과 안쪽벽 사이(벽 두께 밴드) 안**에 둔다.
//   - 표면에 갖다 대면 각도가 조금만 틀어져도 뜬다(= floating join).
//   - 반대로 너무 깊이 넣어 안쪽벽까지 지나가면, 끝동강이 **아가리 너머로 보인다**.
//     (1차 캡처 front/three-quarter 에서 손잡이 발과 브래킷이 열린 통 안에 떠 있었다.)
//   그래서 발끝은 radiusAt(바깥) 과 radiusAt(안쪽) 사이에 앉히고, 벽을 지나는 지점만 패드로 덮는다.
//
// 방위(CAN_YAW): 주둥이와 손잡이는 YZ 평면 하나에 저술한다(설계가 읽히는 좌표계).
// 그 평면을 그대로 두면 front/back 뷰의 화면 가로축이 ±X 라 주둥이·손잡이가 **한 세로선으로 붕괴**한다
// (2차 캡처: 주둥이가 통 위로 솟은 굴뚝, 아치는 아예 그 뒤에 숨었다).
// 조형을 다시 만들지 않고 완성된 부재 그래프 전체를 한 번 돌려 다섯 뷰 모두에서 옆모습을 남긴다.

import * as THREE from 'three';
import { CAN } from './palette';
import { aim, curve, DEG, merge, normalAt, place, Pt, radiusAt, revolve, sweep, taperStops } from './geom';

const SEG = 16;

/**
 * 완성된 물뿌리개 전체를 Y축으로 돌리는 각도. 몸통이 회전체라 이 회전은 오직
 * 주둥이·손잡이·브래킷의 **방위**만 바꾼다.
 *
 * 40° 를 고른 근거(전부 직교 투영의 화면 가로축에 투영한 값이다):
 *   front/back : 주둥이가 sin40 = 0.64 배로 옆으로 빠진다 → 끝이 축에서 0.26,
 *                몸통 최대 반지름 0.137 의 1.9배라 장미머리가 통 밖에 확실히 선다.
 *   left/right : cos40 = 0.77 배. 옆모습이 조금 짧아질 뿐 주둥이·손잡이 관계는 그대로다.
 *   three-quarter : 0.99 배로 오히려 길어진다(주둥이가 시선과 거의 직각).
 * 더 키우면 옆뷰가, 더 줄이면 정면뷰가 무너진다.
 */
const CAN_YAW = -40 * DEG;

/* ------------------------------------------------------------------ *
 * 몸통 윤곽 — 바닥 중심 → 바깥벽 → 아가리 → 안쪽벽 → 안바닥 중심
 * ------------------------------------------------------------------ */

const BODY: Pt[] = [
  { r: 0.0, y: 0.006 }, //    0 바닥 중심 — 살짝 파인 굽바닥(실제 용기의 오목 바닥)
  { r: 0.086, y: 0.0 }, //    1 접지선. 지면과 면이 겹치지 않게 굽 테두리만 닿는다
  { r: 0.103, y: 0.011 }, //  2 굽이 밖으로 벌어진다
  { r: 0.111, y: 0.03 }, //   3 굽 끝  · 재질 경계
  { r: 0.128, y: 0.076 }, //  4
  { r: 0.137, y: 0.128 }, //  5 최대폭
  { r: 0.132, y: 0.186 }, //  6
  { r: 0.118, y: 0.238 }, //  7 어깨
  { r: 0.106, y: 0.276 }, //  8 목
  { r: 0.104, y: 0.298 }, //  9 아가리 밑 · 재질 경계
  { r: 0.117, y: 0.312 }, // 10 밖으로 말린 롤
  { r: 0.114, y: 0.327 }, // 11 아가리 꼭대기
  { r: 0.097, y: 0.322 }, // 12 안쪽 모서리
  { r: 0.092, y: 0.3 }, //   13 안쪽 벽 시작 · 재질 경계
  { r: 0.098, y: 0.24 }, //  14
  { r: 0.12, y: 0.14 }, //   15 안쪽 배
  { r: 0.112, y: 0.06 }, //  16
  { r: 0.068, y: 0.03 }, //  17
  { r: 0.0, y: 0.024 }, //   18 안바닥 중심
];

/** 바깥 벽 구간. 표면 위치·법선을 물을 때 이 구간만 본다. */
const OUT_FROM = 1;
const OUT_TO = 11;

/** 안쪽 벽 구간(위 → 아래). 발끝을 여기보다 더 깊이 넣으면 아가리 너머로 보인다. */
const IN_FROM = 13;
const IN_TO = 18;

/**
 * 높이 y 에서 벽 두께 밴드 안의 발끝 반지름. 손잡이 발끝은 전부 이 값으로 잡는다.
 * 밴드가 0.017~0.020 밖에 안 되고 띠 두께가 그만큼 있으니, 정중앙이 아니라
 * 바깥쪽으로 치우쳐 앉힌다 — 밖으로 삐져나온 만큼은 브래킷 패드가 덮지만,
 * 안쪽벽을 뚫고 들어간 만큼은 아가리 너머로 그냥 보이기 때문이다.
 */
const WALL_BIAS = 0.62;

function wallMid(y: number): number {
  const outer = radiusAt(BODY, y, OUT_FROM, OUT_TO);
  const inner = radiusAt(BODY, y, IN_FROM, IN_TO);
  return inner + (outer - inner) * WALL_BIAS;
}

/** 몸통 표면의 한 점과 그 바깥 법선. 접합 패드를 앉히는 유일한 경로다. */
function surface(y: number, sign: 1 | -1) {
  const r = radiusAt(BODY, y, OUT_FROM, OUT_TO);
  const n = normalAt(BODY, y, OUT_FROM, OUT_TO);
  return {
    point: new THREE.Vector3(0, y, sign * r),
    normal: new THREE.Vector3(0, n.y, sign * n.x).normalize(),
  };
}

/* ------------------------------------------------------------------ *
 * 접합 패드 — 띠가 몸통을 뚫는 자리를 덮는 브래킷
 * ------------------------------------------------------------------ */

function padProfile(radius: number): Pt[] {
  return [
    { r: 0.0, y: -0.016 },
    { r: radius, y: -0.016 },
    { r: radius, y: -0.003 },
    { r: radius * 0.86, y: 0.006 },
    { r: radius * 0.52, y: 0.012 },
    { r: 0.0, y: 0.015 },
  ];
}

/** 표면 점에서 법선을 따라 살짝 파묻은 패드. 가장자리가 몸통 곡률에 먹혀 "눌러 붙은" 판이 된다. */
function pad(y: number, sign: 1 | -1, radius: number, sink = 0.007): THREE.BufferGeometry {
  const s = surface(y, sign);
  return place(
    revolve(padProfile(radius), SEG),
    s.point.addScaledVector(s.normal, -sink),
    aim(s.normal),
  );
}

/* ------------------------------------------------------------------ *
 * 주둥이 — 배 아래에서 벽을 뚫고 앞위로 뻗는다
 * ------------------------------------------------------------------ */

const SPOUT_CTRL = [
  new THREE.Vector3(0, 0.072, 0.09), // 몸통 안 — 물을 바닥부터 끌어올리는 자리
  new THREE.Vector3(0, 0.088, 0.17),
  new THREE.Vector3(0, 0.142, 0.252),
  new THREE.Vector3(0, 0.216, 0.334),
  // 끝. 1차 캡처에서 마지막 구간이 47° 로 치솟아 장미머리가 하늘을 보고,
  // back 뷰에서는 아가리 위로 솟은 굴뚝처럼 읽혔다. 마지막 구간을 31° 로 눕힌다.
  new THREE.Vector3(0, 0.258, 0.404),
];
const SPOUT_N = 22;

/** 관이 몸통 바깥면을 지나는 지점. 칼라를 정확히 여기에 감는다. */
const SPOUT_EXIT = { y: 0.08, dir: new THREE.Vector3(0, 0.196, 0.98).normalize() };

// 윤곽은 항상 y 오름차순으로 적는다 — revolve 의 바깥 법선이 그 순서에서 나온다.
//
// 1차 캡처: 좁은 쪽 반지름(0.031)이 그 자리 관 반경(≈0.035)보다 작아 관이 칼라를 **뚫고 나왔다**.
// left/three-quarter 에서 접합부가 커프가 아니라 깨진 쐐기로 읽힌 원인이다.
// 이제 전 구간이 관보다 굵다 — 커프가 관을 완전히 물어야 접합이 접합으로 읽힌다.
function collarProfile(): Pt[] {
  return [
    { r: 0.042, y: -0.03 }, // 몸통에 박히는 넓은 쪽
    { r: 0.056, y: -0.012 },
    { r: 0.058, y: 0.008 },
    { r: 0.045, y: 0.028 },
    { r: 0.04, y: 0.034 }, // 관(≈0.034)을 무는 좁은 쪽
  ];
}

/* ------------------------------------------------------------------ *
 * 장미머리 — 나팔 → 테두리 → 팬 면 → 물구멍
 * ------------------------------------------------------------------ */

// 1차 캡처 three-quarter(flat) 에서 장미머리가 **막대 끝의 동그란 알**로 읽혔다.
// 나팔 길이가 짧아 실루엣에 원뿔이 안 남고, 테두리 롤이 얇아 옆에서 링이 안 보였다.
// 지름을 1.16배 키우고 나팔 구간(1→4)을 길게 눕혀 원뿔이 실루엣에 남게 한다.
const ROSE: Pt[] = [
  { r: 0.0, y: -0.02 },
  { r: 0.03, y: -0.02 },
  { r: 0.036, y: 0.006 },
  { r: 0.051, y: 0.04 },
  { r: 0.066, y: 0.07 },
  { r: 0.072, y: 0.084 }, // 5 · 재질 경계 — 테두리 롤을 두껍게(옆에서 링으로 보인다)
  { r: 0.068, y: 0.091 },
  { r: 0.06, y: 0.084 }, //  7 · 재질 경계
  { r: 0.057, y: 0.076 },
  { r: 0.0, y: 0.071 },
];

/** 팬 면의 높이. 구멍 원판을 면에서 딱 0.001 만 띄워 z-fighting 없이 "뚫린 점"으로 읽히게 한다. */
function roseFaceY(r: number): number {
  return 0.071 + (r / 0.057) * 0.005;
}

function holeProfile(): Pt[] {
  return [
    { r: 0.0, y: -0.024 },
    { r: 0.0092, y: -0.024 },
    { r: 0.0092, y: 0.0 },
    { r: 0.0, y: 0.0 },
  ];
}

/** 물구멍 배치 — 바깥 6개 + 가운데 1개. 면이 커진 만큼 링 반지름도 같이 키운다. */
const HOLE_RING = 0.034;

/* ------------------------------------------------------------------ *
 * 손잡이 — 앞 어깨 → 아가리 위 → 뒤 → 배 뒤. 띠 하나.
 * ------------------------------------------------------------------ */

// 1차 캡처의 실패: 아치 두 발과 D 고리 윗발이 **열린 통 속에서 끝났다.**
// (y=0.235~0.252 에서 |z|=0.086~0.088 인데 그 높이의 안쪽벽은 r≈0.097 이다 →
//  발끝과 브래킷 원판이 아가리 너머 어두운 안쪽에 그대로 떠 보였다.)
// 그래서 모든 발을 wallMid(y) 로 잡아 바깥벽과 안쪽벽 **사이**에 파묻었다.
//
// 2차 캡처의 실패: 아치와 D 고리를 **뒤 어깨 안에서 각각 끝냈더니**, 옆·3/4 뷰에서
// 배 뒤의 작은 고리가 설명되지 않는 두 번째 손잡이(혹은 장식)로 읽혔다.
// 두 띠를 이어 하나의 경로로 만든다. 이제 아치 구멍과 쥐는 구멍은 **한 부재의 두 개구**이고,
// 몸통을 뚫는 자리는 앞 어깨·뒤 배 두 곳뿐이다.
//
// 뒤 구간(y 0.29→0.13)은 몸통 바깥면에서 0.03~0.05 떨어뜨린다. 붙이면 개구가 사라져
// 다시 벽의 무늬가 되고, 더 띄우면 손잡이가 아니라 뒤로 뻗은 꼬리가 된다.
const HANDLE_CTRL = [
  new THREE.Vector3(0, 0.258, wallMid(0.258)), // 앞 어깨 벽 속
  new THREE.Vector3(0, 0.306, 0.142), // 아가리 롤(r=0.117)보다 밖으로 빠져나온다
  new THREE.Vector3(0, 0.404, 0.122),
  new THREE.Vector3(0, 0.466, 0.03), // 꼭대기 — 아가리 위를 넘는다
  new THREE.Vector3(0, 0.448, -0.06),
  new THREE.Vector3(0, 0.375, -0.145),
  new THREE.Vector3(0, 0.288, -0.166), // 여기서 어깨 안으로 들어가지 않고 뒤로 계속 내려간다
  new THREE.Vector3(0, 0.208, -0.19), // 쥐는 구간
  new THREE.Vector3(0, 0.163, -0.198),
  new THREE.Vector3(0, 0.13, -0.184),
  new THREE.Vector3(0, 0.108, -wallMid(0.108)), // 배 뒤 벽 속
];
const HANDLE_N = 44;

/* ------------------------------------------------------------------ *
 * 조립
 * ------------------------------------------------------------------ */

export type CanPart = {
  key: string;
  color: string;
  geometry: THREE.BufferGeometry;
  /** 열린 면(안쪽 벽·칼라·몰딩)은 뒷면도 그려야 구멍 안이 뚫려 보이지 않는다. */
  open?: boolean;
};

export function buildWateringCan(): CanPart[] {
  /* 몸통 — 하나의 윤곽을 구간으로 잘라 값만 달리한다. 정점이 공유되므로 면이 갈라지지 않는다.
     1차 캡처에서 굽(0→0.03)이 30° 부각에서 배에 가려 바닥이 전혀 무겁지 않았다.
     굽 / 아랫배 / 배 세 단으로 나눠 아래에서 위로 값이 올라가게 한다. */
  const foot = revolve(BODY, SEG, 0, 3);
  const base = revolve(BODY, SEG, 3, 5);
  const belly = revolve(BODY, SEG, 5, 9);
  const lip = revolve(BODY, SEG, 9, 13);
  const inner = revolve(BODY, SEG, 13, 18);

  /* 어깨 몰딩 — 몸통 표면에서 0.0045 만 솟은 한 줄. 강조색은 여기와 장미 테두리에만 쓴다.
     1차 캡처에서 이 띠가 그림 전체에서 가장 센 요소라 몸통을 위아래로 잘라 놨다.
     폭과 돌출을 함께 줄여 "테두리 장식"으로 물러나게 한다. */
  const molding = revolve(
    [
      { r: radiusAt(BODY, 0.236, OUT_FROM, OUT_TO), y: 0.236 },
      { r: radiusAt(BODY, 0.241, OUT_FROM, OUT_TO) + 0.0045, y: 0.241 },
      { r: radiusAt(BODY, 0.256, OUT_FROM, OUT_TO) + 0.0045, y: 0.256 },
      { r: radiusAt(BODY, 0.261, OUT_FROM, OUT_TO), y: 0.261 },
    ],
    SEG,
  );

  /* 주둥이 관 — 접합부가 굵고 끝이 가늘다. taper 자체가 구조 설명이다. */
  const spoutPath = curve(SPOUT_CTRL, SPOUT_N, 0.5);
  const spoutTube = sweep(
    spoutPath,
    taperStops(SPOUT_N, [
      { t: 0, w: 0.036, h: 0.036 },
      { t: 0.18, w: 0.032, h: 0.032 },
      { t: 0.55, w: 0.026, h: 0.026 },
      { t: 1, w: 0.02, h: 0.02 },
    ]),
  );
  const exit = surface(SPOUT_EXIT.y, 1);
  const collar = place(revolve(collarProfile(), SEG), exit.point.clone(), aim(SPOUT_EXIT.dir));

  /* 장미머리 — 관 끝 접선 방향으로 세운다. 위앞을 향해야 실제 물뿌리개 자세다. */
  const tip = spoutPath[SPOUT_N - 1];
  const tipDir = tip.clone().sub(spoutPath[SPOUT_N - 3]).normalize();
  const tipQ = aim(tipDir);
  const roseFlare = place(revolve(ROSE, SEG, 0, 5), tip.clone(), tipQ);
  const roseRim = place(revolve(ROSE, SEG, 5, 7), tip.clone(), tipQ);
  const roseFace = place(revolve(ROSE, SEG, 7, 9), tip.clone(), tipQ);

  const holes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const rr = HOLE_RING;
    holes.push(
      place(
        revolve(holeProfile(), 8),
        new THREE.Vector3(Math.cos(a) * rr, roseFaceY(rr) + 0.001, Math.sin(a) * rr)
          .applyQuaternion(tipQ)
          .add(tip),
        tipQ,
      ),
    );
  }
  holes.push(
    place(
      revolve(holeProfile(), 8),
      new THREE.Vector3(0, roseFaceY(0) + 0.001, 0).applyQuaternion(tipQ).add(tip),
      tipQ,
    ),
  );

  /* 손잡이 — 발치가 두껍고 잡는 구간이 얇다.
     1차 캡처 front/back(flat) 에서 띠가 폭 0.03~0.042 밖에 안 돼 **철사**로 읽혔다.
     띠 폭(w = X 방향)을 키워야 대칭면을 비스듬히 보는 뷰에서도 "손잡이 띠"가 된다.
     경로가 하나라 t 는 앞발(0) → 꼭대기(≈0.34) → 뒤 어깨(≈0.72) → 뒤 배 발(1) 순이다. */
  const handlePath = curve(HANDLE_CTRL, HANDLE_N, 0.5);
  const handle = sweep(
    handlePath,
    taperStops(HANDLE_N, [
      // 발끝 두께(h)는 벽 두께 밴드(≈0.019)를 넘기면 안쪽벽을 뚫는다. 폭(w)만 키운다.
      { t: 0, w: 0.029, h: 0.0125 },
      { t: 0.1, w: 0.024, h: 0.011 },
      { t: 0.55, w: 0.0225, h: 0.0105 },
      { t: 0.88, w: 0.025, h: 0.011 },
      { t: 1, w: 0.029, h: 0.0125 },
    ]),
  );

  /* 브래킷 — 띠가 바깥벽을 지나는 지점을 덮는다. 반지름은 그 자리 띠 반폭(0.029)보다 반드시 커야 한다.
     띠가 하나가 되면서 뚫는 자리도 앞 어깨·뒤 배 두 곳으로 줄었다. */
  const pads = merge([pad(0.268, 1, 0.036), pad(0.112, -1, 0.036)]);

  const parts: CanPart[] = [
    { key: 'foot', color: CAN.bodyDeep, geometry: foot },
    { key: 'base', color: CAN.bodyBase, geometry: base },
    { key: 'belly', color: CAN.body, geometry: belly },
    { key: 'lip', color: CAN.lip, geometry: lip },
    { key: 'inner', color: CAN.inner, geometry: inner, open: true },
    { key: 'molding', color: CAN.accent, geometry: molding, open: true },
    { key: 'spout', color: CAN.hardware, geometry: spoutTube },
    { key: 'collar', color: CAN.hardwareDeep, geometry: collar, open: true },
    { key: 'rose-flare', color: CAN.hardware, geometry: roseFlare, open: true },
    { key: 'rose-rim', color: CAN.accent, geometry: roseRim, open: true },
    { key: 'rose-face', color: CAN.hardwareDeep, geometry: roseFace, open: true },
    { key: 'rose-holes', color: CAN.hole, geometry: merge(holes) },
    { key: 'handle', color: CAN.hardware, geometry: handle },
    { key: 'brackets', color: CAN.hardwareDeep, geometry: pads },
  ];

  /* 마지막에 완성품 전체를 한 번 돌린다. 부재를 각각 돌리면 접합부가 어긋난다.
     bounding box 도 이 회전 뒤에 잡혀야 무대의 fitZoom 이 실제 투영 크기를 본다. */
  const yaw = new THREE.Matrix4().makeRotationY(CAN_YAW);
  for (const part of parts) part.geometry.applyMatrix4(yaw);

  return parts;
}

/** 전체 bounding box. 카메라 프레이밍을 눈대중이 아니라 실제 투영 크기에서 뽑기 위한 값이다. */
export function canBounds(parts: CanPart[]): THREE.Box3 {
  const box = new THREE.Box3();
  for (const part of parts) {
    part.geometry.computeBoundingBox();
    box.union(part.geometry.boundingBox as THREE.Box3);
  }
  return box;
}
