// AJP-004 — 화단.
// reference: /Lucario/MyRoom/idea_resources/요소/b8b8f32ae3776982c8ada5a3693bbeb1.jpg
//
// reference에서 읽은 부분 그래프
//   꽃차례(왼쪽 3종): 곧은 꽃대 하나에 낱꽃이 층층이 돌려 붙는다.
//     - 낱꽃은 각진 종 모양 컵이고, 아래일수록 크고 활짝, 위로 갈수록 작고 오므린다.
//     - 꼭대기는 아직 안 핀 연둣빛-흰 봉오리 뭉치다. → 성장 단계가 한 그루 안에도 들어 있다.
//     - 색은 하나의 색상 안에서 아래(짙음) → 위(옅음)로 이어지는 명도 사다리다.
//     - 낱꽃 안쪽에 더 어두운 목구멍이 보인다(= 겉/속 두 겹 + 그림자).
//     - 기부에는 넓은 창끝 모양 잎이 로제트로 깔리고, 잎마다 접힘과 향이 다르다.
//     - 오른쪽 개체는 꽃이 적고 줄기와 잎이 더 보인다 = 더 이른 단계.
//   겹꽃(오른쪽 위 3종): 둥근 머리. 봉오리(꽉 닫힘, 초록 심이 보임) → 반개 → 만개.
//     겉 꽃잎이 크고 뒤로 젖혀지며, 안으로 갈수록 작고 곧게 선다. 아래에 초록 꽃받침 잎.
//   비율(이미지 기준): 기부 잎 길이 ≈ 전체 높이의 0.30, 잎 폭 ≈ 길이의 0.44,
//     맨 아래 낱꽃 지름 ≈ 전체 높이의 0.19. 잎이 크고 넓어서 아래쪽이 하나의 잎 매스로 읽힌다.
//
// 1차 판정에서 깨진 지점과 이번 수정
//   - 타원 위에 개체가 줄지어 선 것처럼 보였다 → 겹치는 authored 무리 3개(A/B/C)로 다시 짠다.
//   - 줄기·잎이 너무 작아 overview에서 사라졌다 → reference 비율대로 잎·낱꽃·키를 키운다.
//   - 앞쪽 겹꽃과 잎 무리가 흩뿌린 것처럼 보였다 → 무리 경계와 빈 곳에만 잎 무리를 넣어
//     바닥을 잇는 기부 잎 매스로 쓰고, 간격을 균일하게 두지 않는다.

import * as THREE from 'three';
import {
  BladeShape,
  Part,
  aimY,
  bellBlossom,
  discFan,
  leafBlade,
  lobedMass,
  mergeParts,
  pathCurve,
  place,
  taperedTube,
} from './geometry';
import { FOLIAGE, PEONY_PALETTE, SPIRE_PALETTE, SpirePalette } from './palette';

const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

/** 잎/꽃잎(+X로 자란다)을 방위 az, 들어올림 pitch로 향하게 하는 회전. */
function orient(az: number, pitch: number): THREE.Quaternion {
  const qAz = new THREE.Quaternion().setFromAxisAngle(UP, -az);
  const qPitch = new THREE.Quaternion().setFromAxisAngle(Z, pitch);
  return qAz.multiply(qPitch);
}

/* ------------------------------------------------------------------ *
 * 잎 배치
 * ------------------------------------------------------------------ */

type BladePlacement = {
  az: number;
  pitch: number;
  len: number;
  width: number;
  fold: number;
  droop: number;
  twist: number;
  color: string;
  shape?: BladeShape;
};

/**
 * 기부 로제트 3종. 잎마다 방위·들림·접힘·비틀림이 다르다 —
 * 같은 잎을 회전 복사하면 reference의 "제각각 향한 잎"이 나오지 않는다.
 *
 * 길이는 키 2.0m 개체 기준값이고, 개체마다 `rosetteScale`로 줄인다.
 * reference의 기부 잎은 전체 높이의 약 0.30이고 폭이 길이의 0.44다 —
 * 1차 판정에서 "잎이 너무 작아 읽히지 않는다"고 깨진 지점이 여기다.
 */
const ROSETTES: Record<'wide' | 'upright' | 'young', BladePlacement[]> = {
  wide: [
    { az: 0.18, pitch: 0.14, len: 0.62, width: 0.27, fold: 0.4, droop: 0.42, twist: 0.2, color: FOLIAGE.leafTop },
    { az: 1.12, pitch: 0.3, len: 0.52, width: 0.23, fold: 0.48, droop: 0.3, twist: -0.28, color: FOLIAGE.leafMid },
    { az: 2.0, pitch: 0.07, len: 0.66, width: 0.29, fold: 0.36, droop: 0.5, twist: 0.12, color: FOLIAGE.leafDeep },
    { az: 2.95, pitch: 0.26, len: 0.46, width: 0.2, fold: 0.5, droop: 0.24, twist: 0.32, color: FOLIAGE.leafMid },
    { az: 3.88, pitch: 0.1, len: 0.6, width: 0.26, fold: 0.38, droop: 0.46, twist: -0.18, color: FOLIAGE.leafTop },
    { az: 4.72, pitch: 0.34, len: 0.42, width: 0.19, fold: 0.52, droop: 0.2, twist: 0.26, color: FOLIAGE.leafDeep },
    { az: 5.58, pitch: 0.18, len: 0.55, width: 0.24, fold: 0.42, droop: 0.38, twist: -0.1, color: FOLIAGE.leafMid },
  ],
  upright: [
    { az: 0.42, pitch: 0.5, len: 0.5, width: 0.21, fold: 0.5, droop: 0.22, twist: 0.18, color: FOLIAGE.leafTop },
    { az: 1.46, pitch: 0.32, len: 0.58, width: 0.25, fold: 0.44, droop: 0.32, twist: -0.24, color: FOLIAGE.leafMid },
    { az: 2.62, pitch: 0.56, len: 0.44, width: 0.19, fold: 0.56, droop: 0.16, twist: 0.3, color: FOLIAGE.leafDeep },
    { az: 3.62, pitch: 0.26, len: 0.6, width: 0.26, fold: 0.42, droop: 0.36, twist: 0.12, color: FOLIAGE.leafMid },
    { az: 4.7, pitch: 0.46, len: 0.48, width: 0.2, fold: 0.52, droop: 0.2, twist: -0.28, color: FOLIAGE.leafTop },
    { az: 5.72, pitch: 0.38, len: 0.52, width: 0.22, fold: 0.46, droop: 0.26, twist: 0.16, color: FOLIAGE.leafDeep },
  ],
  young: [
    { az: 0.28, pitch: 0.2, len: 0.44, width: 0.2, fold: 0.46, droop: 0.3, twist: 0.2, color: FOLIAGE.leafTop },
    { az: 1.22, pitch: 0.42, len: 0.36, width: 0.16, fold: 0.5, droop: 0.18, twist: -0.26, color: FOLIAGE.leafMid },
    { az: 2.36, pitch: 0.14, len: 0.48, width: 0.22, fold: 0.42, droop: 0.36, twist: 0.12, color: FOLIAGE.leafDeep },
    { az: 3.46, pitch: 0.36, len: 0.38, width: 0.17, fold: 0.48, droop: 0.22, twist: 0.3, color: FOLIAGE.leafMid },
    { az: 4.55, pitch: 0.18, len: 0.46, width: 0.2, fold: 0.44, droop: 0.32, twist: -0.16, color: FOLIAGE.leafTop },
    { az: 5.55, pitch: 0.48, len: 0.32, width: 0.14, fold: 0.54, droop: 0.14, twist: 0.24, color: FOLIAGE.leafDeep },
  ],
};

function pushBlade(parts: Part[], at: THREE.Vector3, b: BladePlacement) {
  parts.push({
    geo: place(
      leafBlade({
        length: b.len,
        width: b.width,
        fold: b.fold,
        droop: b.droop,
        twist: b.twist,
        // 기부 잎은 난형(넓은 창끝) — reference의 넓은 잎을 좁은 lance로 만들면 매스가 안 생긴다.
        shape: b.shape ?? 'broad',
      }),
      at,
      orient(b.az, b.pitch),
    ),
    color: b.color,
  });
}

/** 로제트를 개체 크기에 맞춰 줄인다. 구조(방위·들림·접힘)는 그대로 둔다. */
function pushRosette(parts: Part[], rosette: keyof typeof ROSETTES, scale: number) {
  for (const blade of ROSETTES[rosette]) {
    pushBlade(parts, new THREE.Vector3(0, 0.02, 0), {
      ...blade,
      len: blade.len * scale,
      width: blade.width * scale,
    });
  }
}

/* ------------------------------------------------------------------ *
 * 꽃차례
 * ------------------------------------------------------------------ */

export type SpireSpec = {
  height: number;
  /** 꼭대기가 쏠리는 방향(m). 0이면 막대기처럼 곧아 보인다. */
  lean: [number, number];
  stemR: [number, number];
  tiers: number;
  perTier: number;
  /** 줄기 t 기준: 꽃차례 시작 / 다 핀 꽃의 끝 / 봉오리 끝 */
  bloomFrom: number;
  bloomTo: number;
  budTo: number;
  /** 아래 낱꽃 / 위 낱꽃 크기 */
  headR: [number, number];
  /** 아래 낱꽃이 벌어진 정도. 어린 개체는 작게 준다. */
  openBottom: number;
  palette: SpirePalette;
  rosette: keyof typeof ROSETTES;
  /** 줄기 잎: [줄기 t, 방위, 길이, 들림] */
  stemLeaves: [number, number, number, number][];
  /** 마디 위치(줄기 t) */
  nodes: number[];
  budRows: number;
};

function spireLadder(p: SpirePalette, f: number): { outer: string; inner: string } {
  const c = new THREE.Color();
  if (f < 0.5) c.set(p.deep).lerp(new THREE.Color(p.mid), f * 2);
  else c.set(p.mid).lerp(new THREE.Color(p.pale), (f - 0.5) * 2);
  const inner = c.clone().lerp(new THREE.Color(p.inner), 0.55);
  return { outer: `#${c.getHexString()}`, inner: `#${inner.getHexString()}` };
}

export function buildSpire(spec: SpireSpec): THREE.BufferGeometry {
  const parts: Part[] = [];
  const h = spec.height;
  const [lx, lz] = spec.lean;

  // 꽃대 — 아래가 굵고 위로 가늘어지며, 끝이 한쪽으로 쏠린다.
  const stem = pathCurve([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lx * 0.05, h * 0.34, lz * 0.05),
    new THREE.Vector3(lx * 0.42, h * 0.72, lz * 0.42),
    new THREE.Vector3(lx, h, lz),
  ]);
  const stemRadii = [spec.stemR[0] * 1.35, spec.stemR[0], spec.stemR[0] * 0.78, spec.stemR[1]];
  parts.push({
    geo: taperedTube(stem, stemRadii, { radial: 6, segments: 22 }),
    color: FOLIAGE.stem,
  });

  const radiusAt = (t: number) =>
    THREE.MathUtils.lerp(spec.stemR[0], spec.stemR[1], THREE.MathUtils.clamp(t, 0, 1));

  // 마디 — 굵기가 잠깐 부풀었다 돌아온다. 여기서 잎이 나온다.
  for (const t of spec.nodes) {
    const r = radiusAt(t);
    const node = pathCurve([
      stem.getPointAt(Math.max(0, t - 0.035)),
      stem.getPointAt(t),
      stem.getPointAt(Math.min(1, t + 0.035)),
    ]);
    parts.push({
      geo: taperedTube(node, [r * 1.02, r * 1.55, r * 1.02], { radial: 6, segments: 6, caps: false }),
      color: FOLIAGE.stemPale,
    });
  }

  // 낱꽃 — 층마다 크기·벌어짐·색이 바뀐다. 층 사이 방위는 어긋나게 돌려 나선으로 감긴다.
  const tiers = Math.max(1, spec.tiers);
  for (let i = 0; i < tiers; i++) {
    const f = tiers === 1 ? 0 : i / (tiers - 1);
    const t = THREE.MathUtils.lerp(spec.bloomFrom, spec.bloomTo, f);
    const base = stem.getPointAt(t);
    const r = THREE.MathUtils.lerp(spec.headR[0], spec.headR[1], f);
    const depth = r * 1.35;
    const flare = THREE.MathUtils.lerp(spec.openBottom, 0.72, f);
    const { outer, inner } = spireLadder(spec.palette, f);
    const stemR = radiusAt(t);

    for (let j = 0; j < spec.perTier; j++) {
      const az = (j / spec.perTier) * Math.PI * 2 + i * 0.42;
      const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      // 아래 꽃은 바깥-아래로 늘어지고, 위로 갈수록 들린다.
      const dir = out.clone().multiplyScalar(0.86).addScaledVector(UP, -0.34 + 0.86 * f).normalize();
      const q = aimY(dir);
      const at = base.clone().addScaledVector(out, stemR * 0.85);

      // 꽃받침 → 겉 꽃부리 → 속 꽃부리 → 목구멍. 층마다 조금씩 안으로 밀어 깊이를 만든다.
      parts.push({
        geo: place(bellBlossom({ r: r * 0.62, depth: depth * 0.3, lobes: 4, flare: 1, rise: 0.3 }), at, q),
        color: FOLIAGE.calyx,
      });
      parts.push({
        geo: place(bellBlossom({ r, depth, lobes: 5, flare, rise: 0.16 }), at.clone().addScaledVector(dir, depth * 0.1), q),
        color: outer,
      });
      parts.push({
        geo: place(
          bellBlossom({ r: r * 0.6, depth: depth * 0.62, lobes: 5, flare: flare * 0.94, rise: 0.1 }),
          at.clone().addScaledVector(dir, depth * 0.34),
          q,
        ),
        color: inner,
      });
      parts.push({
        geo: place(discFan(r * 0.34, 8), at.clone().addScaledVector(dir, depth * 0.5), q),
        color: spec.palette.throat,
      });
    }
  }

  // 봉오리 — 위로 갈수록 작고 연두에서 흰빛으로 빠진다. 아직 안 핀 단계가 한 그루 안에 남는다.
  const budStart = spec.bloomTo + (spec.budTo - spec.bloomTo) * 0.08;
  for (let i = 0; i < spec.budRows; i++) {
    const f = spec.budRows === 1 ? 0 : i / (spec.budRows - 1);
    const t = THREE.MathUtils.lerp(budStart, spec.budTo, f);
    const base = stem.getPointAt(t);
    const r = THREE.MathUtils.lerp(spec.headR[1] * 0.78, spec.headR[1] * 0.3, f);
    const count = f > 0.66 ? 3 : 4;
    const color = new THREE.Color(FOLIAGE.bud).lerp(new THREE.Color(FOLIAGE.budPale), f * 0.85);
    for (let j = 0; j < count; j++) {
      const az = (j / count) * Math.PI * 2 + i * 0.9;
      const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      const at = base.clone().addScaledVector(out, radiusAt(t) * 0.9 + r * 0.5).addScaledVector(UP, r * 0.4);
      parts.push({
        geo: place(
          lobedMass({
            radius: r,
            seed: 3 + i * 2.3 + j,
            jitter: 0.1,
            scale: [0.82, 1.5, 0.82],
            lobes: [{ dir: UP.clone(), gain: 0.24, sharp: 2 }],
          }),
          at,
          aimY(out.clone().multiplyScalar(0.35).addScaledVector(UP, 1).normalize()),
        ),
        color: `#${color.getHexString()}`,
      });
    }
  }

  // 줄기 잎 — 위로 갈수록 작아지고 꽃차례 아래에서 끊긴다.
  for (const [t, az, len, pitch] of spec.stemLeaves) {
    const at = stem.getPointAt(t);
    pushBlade(parts, at.clone().addScaledVector(new THREE.Vector3(Math.cos(az), 0, Math.sin(az)), radiusAt(t) * 0.8), {
      az,
      pitch,
      len,
      width: len * 0.3,
      fold: 0.46,
      droop: 0.34,
      twist: 0.2,
      color: FOLIAGE.leafMid,
    });
  }

  for (const blade of ROSETTES[spec.rosette]) {
    pushBlade(parts, new THREE.Vector3(0, 0.02, 0), blade);
  }

  return mergeParts(parts);
}

/* ------------------------------------------------------------------ *
 * 겹꽃 (성장 단계)
 * ------------------------------------------------------------------ */

export type PeonySpec = {
  stemH: number;
  lean: [number, number];
  /** 0 = 꽉 닫힌 봉오리, 1 = 만개 */
  opening: number;
  palette: (typeof PEONY_PALETTE)[keyof typeof PEONY_PALETTE];
  headR: number;
  rosette: keyof typeof ROSETTES;
};

export function buildPeony(spec: PeonySpec): THREE.BufferGeometry {
  const parts: Part[] = [];
  const h = spec.stemH;
  const [lx, lz] = spec.lean;

  const stem = pathCurve([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lx * 0.15, h * 0.4, lz * 0.15),
    new THREE.Vector3(lx * 0.6, h * 0.75, lz * 0.6),
    new THREE.Vector3(lx, h, lz),
  ]);
  parts.push({
    geo: taperedTube(stem, [0.018, 0.014, 0.012, 0.011], { radial: 6, segments: 16 }),
    color: FOLIAGE.stem,
  });

  const head = stem.getPointAt(1);
  const tip = stem.getTangentAt(1);
  const R = spec.headR;
  const o = spec.opening;

  // 꽃받침 — 머리 아래에서 바깥-아래로 젖혀진 초록 잎.
  for (let k = 0; k < 4; k++) {
    const az = (k / 4) * Math.PI * 2 + 0.4;
    pushBlade(parts, head.clone().addScaledVector(UP, -R * 0.28), {
      az,
      pitch: -0.55 + o * 0.12,
      len: R * 0.95,
      width: R * 0.4,
      fold: 0.5,
      droop: 0.28,
      twist: 0.18,
      color: k % 2 === 0 ? FOLIAGE.calyx : FOLIAGE.leafDeep,
    });
  }

  // 겉 → 중간 → 속. 벌어질수록 겉이 눕고 속은 늦게 열린다.
  const ring = (
    count: number,
    radius: number,
    lift: number,
    pitchClosed: number,
    pitchOpen: number,
    len: number,
    width: number,
    color: string,
    phase: number,
  ) => {
    const pitch = THREE.MathUtils.lerp(pitchClosed, pitchOpen, o);
    for (let k = 0; k < count; k++) {
      const az = (k / count) * Math.PI * 2 + phase;
      const at = head
        .clone()
        .addScaledVector(new THREE.Vector3(Math.cos(az), 0, Math.sin(az)), radius)
        .addScaledVector(UP, lift);
      parts.push({
        geo: place(
          leafBlade({
            length: len,
            width,
            fold: 0.62,
            droop: 0.55 - o * 0.25,
            shape: 'petal',
            twist: 0.12,
            segments: 4,
          }),
          at,
          orient(az, pitch),
        ),
        color,
      });
    }
  };

  ring(7, R * 0.34, R * 0.1, 1.32, 0.28, R * 1.05, R * 0.62, spec.palette.outer, 0.15);
  ring(6, R * 0.24, R * 0.34, 1.42, 0.72, R * 0.78, R * 0.5, spec.palette.mid, 0.62);
  ring(5, R * 0.14, R * 0.52, 1.5, 1.05, R * 0.52, R * 0.36, spec.palette.inner, 1.05);

  // 심 — 봉오리에서는 초록 심이 그대로 보이고, 만개하면 옅은 화심만 남는다.
  parts.push({
    geo: place(
      lobedMass({
        radius: R * (0.3 - o * 0.08),
        seed: 5.5 + o * 3,
        jitter: 0.14,
        scale: [1, 0.8 + o * 0.2, 1],
        lobes: [
          { dir: UP.clone(), gain: 0.22, sharp: 2 },
          { dir: new THREE.Vector3(0.7, 0.4, 0.6).normalize(), gain: 0.16, sharp: 2.4 },
        ],
      }),
      head.clone().addScaledVector(UP, R * (0.62 - o * 0.12)),
      aimY(tip),
    ),
    color: spec.palette.core,
  });

  for (const blade of ROSETTES[spec.rosette]) {
    pushBlade(parts, new THREE.Vector3(0, 0.02, 0), { ...blade, len: blade.len * 0.72, width: blade.width * 0.8 });
  }

  return mergeParts(parts);
}

/* ------------------------------------------------------------------ *
 * 잎 무리 — 화단 바닥을 이어 주는 잎만 있는 개체
 * ------------------------------------------------------------------ */

export function buildTuft(rosette: keyof typeof ROSETTES, scale: number): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (const blade of ROSETTES[rosette]) {
    pushBlade(parts, new THREE.Vector3(0, 0.015, 0), {
      ...blade,
      len: blade.len * scale,
      width: blade.width * scale * 1.05,
      pitch: blade.pitch * 0.7,
    });
  }
  return mergeParts(parts);
}

/* ------------------------------------------------------------------ *
 * authored 변주 목록
 * ------------------------------------------------------------------ */

export type PlantKey =
  | 'plumTall'
  | 'plumYoung'
  | 'coralTall'
  | 'coralMid'
  | 'blushMid'
  | 'blushYoung'
  | 'peonyBud'
  | 'peonyHalf'
  | 'peonyOpen'
  | 'tuftWide'
  | 'tuftUpright';

/**
 * 구조 변주 목록. 회전·스케일 난수가 아니라 성장 단계, 층 수, 꽃 벌어짐,
 * 기움, 잎 배치가 서로 다르다 — reference의 3개체 비교가 요구하는 차이다.
 */
export const PLANT_BUILDERS: Record<PlantKey, () => THREE.BufferGeometry> = {
  // 다 자란 자주색 — 층이 가장 많고 아래 꽃이 가장 활짝 열렸다.
  plumTall: () =>
    buildSpire({
      height: 1.5,
      lean: [0.08, 0.04],
      stemR: [0.028, 0.014],
      tiers: 6,
      perTier: 5,
      bloomFrom: 0.4,
      bloomTo: 0.8,
      budTo: 0.99,
      headR: [0.085, 0.05],
      openBottom: 1.08,
      palette: SPIRE_PALETTE.plum,
      rosette: 'wide',
      stemLeaves: [
        [0.16, 0.7, 0.2, 0.34],
        [0.29, 3.6, 0.16, 0.42],
      ],
      nodes: [0.16, 0.29, 0.39],
      budRows: 4,
    }),
  // 같은 종의 이른 단계 — 아래 두 층만 피고 위는 봉오리다.
  plumYoung: () =>
    buildSpire({
      height: 0.88,
      lean: [-0.1, 0.07],
      stemR: [0.021, 0.011],
      tiers: 3,
      perTier: 4,
      bloomFrom: 0.44,
      bloomTo: 0.66,
      budTo: 0.99,
      headR: [0.066, 0.042],
      openBottom: 0.9,
      palette: SPIRE_PALETTE.plum,
      rosette: 'young',
      stemLeaves: [[0.2, 2.2, 0.15, 0.4]],
      nodes: [0.2, 0.34],
      budRows: 5,
    }),
  coralTall: () =>
    buildSpire({
      height: 1.34,
      lean: [-0.17, 0.09],
      stemR: [0.026, 0.013],
      tiers: 5,
      perTier: 5,
      bloomFrom: 0.4,
      bloomTo: 0.76,
      budTo: 0.98,
      headR: [0.082, 0.048],
      openBottom: 1.04,
      palette: SPIRE_PALETTE.coral,
      rosette: 'upright',
      stemLeaves: [
        [0.18, 2.9, 0.19, 0.3],
        [0.31, 5.6, 0.15, 0.46],
      ],
      nodes: [0.18, 0.31, 0.42],
      budRows: 4,
    }),
  coralMid: () =>
    buildSpire({
      height: 1.05,
      lean: [0.13, -0.11],
      stemR: [0.023, 0.012],
      tiers: 4,
      perTier: 4,
      bloomFrom: 0.42,
      bloomTo: 0.72,
      budTo: 0.99,
      headR: [0.072, 0.044],
      openBottom: 0.96,
      palette: SPIRE_PALETTE.coral,
      rosette: 'young',
      stemLeaves: [[0.22, 1.2, 0.16, 0.36]],
      nodes: [0.22, 0.36],
      budRows: 4,
    }),
  blushMid: () =>
    buildSpire({
      height: 1.12,
      lean: [-0.09, -0.15],
      stemR: [0.024, 0.012],
      tiers: 4,
      perTier: 5,
      bloomFrom: 0.42,
      bloomTo: 0.74,
      budTo: 0.98,
      headR: [0.076, 0.046],
      openBottom: 1,
      palette: SPIRE_PALETTE.blush,
      rosette: 'upright',
      stemLeaves: [
        [0.2, 4.4, 0.17, 0.32],
        [0.33, 1.6, 0.14, 0.44],
      ],
      nodes: [0.2, 0.33],
      budRows: 4,
    }),
  // 가장 이른 단계 — 잎이 상대적으로 크고 꽃차례가 짧다.
  blushYoung: () =>
    buildSpire({
      height: 0.74,
      lean: [0.06, 0.12],
      stemR: [0.019, 0.01],
      tiers: 2,
      perTier: 4,
      bloomFrom: 0.48,
      bloomTo: 0.62,
      budTo: 1,
      headR: [0.06, 0.044],
      openBottom: 0.84,
      palette: SPIRE_PALETTE.blush,
      rosette: 'wide',
      stemLeaves: [],
      nodes: [0.24],
      budRows: 5,
    }),
  peonyBud: () => buildPeony({ stemH: 0.42, lean: [0.05, 0.03], opening: 0.12, palette: PEONY_PALETTE.bud, headR: 0.115, rosette: 'young' }),
  peonyHalf: () => buildPeony({ stemH: 0.5, lean: [-0.07, 0.05], opening: 0.55, palette: PEONY_PALETTE.half, headR: 0.13, rosette: 'young' }),
  peonyOpen: () => buildPeony({ stemH: 0.46, lean: [0.04, -0.08], opening: 1, palette: PEONY_PALETTE.open, headR: 0.14, rosette: 'wide' }),
  tuftWide: () => buildTuft('wide', 0.78),
  tuftUpright: () => buildTuft('upright', 0.62),
};

/** 화단 배치 — 전부 authored 상수다. 난수 scatter를 쓰지 않는다. */
export type BedEntry = { key: PlantKey; x: number; z: number; rotY: number };

/**
 * 뒤(z-)에 큰 꽃차례, 가운데에 중간 키, 앞(z+)에 어린 개체와 겹꽃.
 * 높이 사다리가 있어야 멀리서 하나의 매스로, 가까이서 개체로 읽힌다.
 */
export const BED_LAYOUT: BedEntry[] = [
  { key: 'plumTall', x: -1.12, z: -0.78, rotY: 0.35 },
  { key: 'coralTall', x: -0.28, z: -0.95, rotY: -0.85 },
  { key: 'plumTall', x: 0.62, z: -0.72, rotY: 2.15 },
  { key: 'blushMid', x: 1.48, z: -0.5, rotY: 1.15 },
  { key: 'coralTall', x: -1.88, z: -0.28, rotY: -0.4 },
  { key: 'coralMid', x: 0.12, z: -0.18, rotY: 2.6 },
  { key: 'blushMid', x: 1.92, z: 0.35, rotY: 0.2 },
  { key: 'plumYoung', x: -1.02, z: 0.32, rotY: -1.55 },
  { key: 'coralMid', x: 1.02, z: 0.18, rotY: 0.75 },
  { key: 'blushYoung', x: -1.72, z: 0.72, rotY: 1.9 },
  { key: 'blushYoung', x: 0.48, z: 0.62, rotY: -0.6 },
  { key: 'peonyOpen', x: -0.48, z: 0.78, rotY: 0.9 },
  { key: 'peonyHalf', x: 0.22, z: 1.02, rotY: -0.45 },
  { key: 'peonyBud', x: -1.28, z: 1.05, rotY: 1.75 },
  { key: 'peonyHalf', x: 1.32, z: 0.92, rotY: 2.4 },
  { key: 'tuftWide', x: -2.15, z: 0.34, rotY: 0.5 },
  { key: 'tuftWide', x: 0.92, z: -1.05, rotY: -1.2 },
  { key: 'tuftUpright', x: 1.72, z: -0.98, rotY: 0.8 },
  { key: 'tuftUpright', x: -0.72, z: -0.42, rotY: 2.05 },
  { key: 'tuftWide', x: 0.72, z: 1.18, rotY: -0.3 },
  { key: 'tuftUpright', x: -1.95, z: 1.12, rotY: 1.35 },
];
