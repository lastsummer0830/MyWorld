// AJP-004 dog capability eval — 조형 커널.
//
// 제품 씬(`src2/scene/**`)과 식생 표본(`src2/spikes/capability-eval/**`)을 import하지 않는다.
// 판정 표본은 코드까지 격리해야 "제품에서 잘 되던 게 여기선 왜"가 생기지 않는다.
//
// 이 커널이 기존 dogGeometry.ts와 다른 점(= 실패 진단에 대응하는 지점):
//   ① **평행이송 프레임(parallel transport)**. 기존 loft는 단면 축을 매번 세계 up에서 다시 만들었고,
//      목처럼 진행방향이 수직에 가까워지는 구간에서 기준축이 튀었다(코드 주석의 "축 혼동"이 그것).
//      여기서는 시작 프레임 하나만 정하고 접선 변화를 따라 굴린다 → 어디서도 단면이 뒤집히지 않는다.
//   ② **coat 채널**. 갈기·펜츠·페더링을 별도 메시로 매달지 않는다. 몸통 표면의 반경을
//      세계 방향 로브로 부풀리는 authored 필드다. 베개가 붙을 자리가 애초에 없다.
//   ③ **non-indexed 사각형 단색 + 연속 법선**. 정점 색을 보간하면 무늬 경계가 번지고(기존 문제),
//      flat shading으로 도망가면 저폴리 각면이 무늬를 삼킨다. 그래서 색은 사각형 단위로 굽고,
//      법선은 격자에서 따로 계산해 매끈하게 유지한다 → 무늬가 표면을 타고 휘어도 번지지 않는다.
//   ④ 난수 없음. 모든 값이 authored 상수라 캡처가 재현된다.
//
// 좌표 규약(MyWorld 기존 규약 유지): 강아지는 +x를 본다. +y가 위, 강아지의 **왼쪽이 −z**.

import * as THREE from 'three';

const TAU = Math.PI * 2;

export type Vec3 = readonly [number, number, number];

/**
 * 털 실루엣 필드 한 채널.
 * `dir`는 세계 좌표 방향이다 — 단면 프레임이 목·다리에서 회전해도 갈기가 엉뚱한 데로 가지 않는다.
 * `mirror`는 ±z 대칭 로브(양쪽 볼·양쪽 펜츠)를 한 번만 적어도 되게 한다.
 */
export type CoatChannel = {
  readonly dir: Vec3;
  readonly sharp: number;
  readonly mirror?: boolean;
};

/**
 * 채널 표. 이름은 해부 부위이지 수치가 아니다 —
 * 단면마다 "여기서 갈기가 얼마나 두꺼운가"를 0~1 게인으로만 적는다.
 */
const CHANNEL_TABLE = {
  /** 앞가슴으로 쏟아지는 턱받이 */
  ruff: { dir: [0.9, -0.44, 0], sharp: 2.2 },
  /** 목 옆으로 퍼져 얼굴을 액자처럼 감싸는 부분 */
  ruffSide: { dir: [0.42, -0.2, 0.88], sharp: 2.4, mirror: true },
  /** 어깨 위를 덮는 갈기 뒷자락 */
  mane: { dir: [-0.3, 0.72, 0.62], sharp: 2.2, mirror: true },
  /** 턱 아래 볼털 */
  cheekCoat: { dir: [0.1, -0.62, 0.78], sharp: 3.0, mirror: true },
  /** 어깨 옆판 */
  shoulderCoat: { dir: [0.05, -0.12, 0.99], sharp: 3.0, mirror: true },
  /** 앞가슴 깊이(전흉) */
  brisket: { dir: [0.42, -0.9, 0], sharp: 2.6 },
  /** 옆구리 아래로 늘어지는 자락 — 다리를 짧아 보이게 하는 셸티 인상 */
  skirt: { dir: [0, -0.6, 0.8], sharp: 2.4, mirror: true },
  /** 뒷다리 바지털 */
  pants: { dir: [-0.72, -0.55, 0.42], sharp: 2.0, mirror: true },
  /** 엉덩이 위 코트 */
  rumpCoat: { dir: [-0.85, 0.45, 0.25], sharp: 2.4, mirror: true },
  /** 등선 코트 두께 */
  topline: { dir: [0, 1, 0], sharp: 3.0 },
  /** 다리 뒤 페더링 */
  feather: { dir: [-0.94, 0.06, 0.34], sharp: 2.0, mirror: true },
  /** 꼬리 깃 — 뒤쪽 */
  plumeBack: { dir: [-0.9, 0.3, 0], sharp: 1.8 },
  /** 꼬리 깃 — 옆으로 퍼지는 폭 */
  plumeSide: { dir: [-0.45, 0.05, 0.89], sharp: 2.2, mirror: true },
  /** 가운데 발가락 */
  toeMid: { dir: [0.72, -0.62, 0], sharp: 6 },
  /** 바깥 발가락 두 개 */
  toeOuter: { dir: [0.52, -0.5, 0.69], sharp: 6, mirror: true },
  /** 콧구멍 — 게인이 음수다(파낸다) */
  nostril: { dir: [0.36, -0.1, 0.93], sharp: 8, mirror: true },
} as const;

export type CoatName = keyof typeof CHANNEL_TABLE;
export type CoatGains = Partial<Record<CoatName, number>>;

const CHANNELS = (Object.keys(CHANNEL_TABLE) as CoatName[]).map((name) => {
  const ch: CoatChannel = CHANNEL_TABLE[name];
  const d = new THREE.Vector3(ch.dir[0], ch.dir[1], ch.dir[2]).normalize();
  return {
    name,
    d,
    m: ch.mirror ? new THREE.Vector3(d.x, d.y, -d.z) : null,
    sharp: ch.sharp,
  };
});

/**
 * 단면 하나. 척추 위의 점 + 그 자리의 두께 + 그 자리의 털 게인.
 * `p`는 `[x, y]` 또는 `[x, y, z]`다 — 몸통·다리·꼬리는 z가 0으로 평면이라 두 값만 적는다.
 */
export type Section = {
  p: readonly number[];
  /** 단면 프레임의 +축 반경 (몸통에서는 등, 다리에서는 앞) */
  up: number;
  /** 단면 프레임의 −축 반경 (몸통에서는 배, 다리에서는 뒤) */
  down: number;
  /** 좌우(±z) 반경 */
  side: number;
  /** 1 = 타원. 키울수록 모서리가 살아나 쐐기가 된다(셸티 머리). */
  boxy?: number;
  coat?: CoatGains;
};

export type PaintCtx = {
  /** 사각형 중심의 세계 좌표 */
  p: THREE.Vector3;
  /** 척추 진행 0~1 */
  u: number;
  /** 단면각(rad). 0 = 단면 프레임의 +축 */
  a: number;
};

export type PaintFn = (out: THREE.Color, ctx: PaintCtx) => void;

export type LoftOptions = {
  /** 단면 등분수 */
  segs: number;
  /** 척추를 다시 뽑는 샘플 수 — authored 단면 사이를 Catmull-Rom으로 메운다 */
  samples: number;
  paint: PaintFn;
  capStart?: boolean;
  capEnd?: boolean;
};

/**
 * THREE.CatmullRomCurve3(curveType='catmullrom')와 **같은 파라미터화**로 스칼라를 보간한다.
 * 위치는 곡선에서, 반경은 여기서 뽑는데 두 파라미터가 어긋나면 굵기가 밀려 붙는다.
 * (그래서 getPointAt(호길이)이 아니라 getPoint(인덱스)를 쓴다.)
 */
function crScalar(v: readonly number[], u: number, tension = 0.5): number {
  const n = v.length - 1;
  if (n <= 0) return v[0] ?? 0;
  const t = Math.min(Math.max(u, 0), 1) * n;
  let i = Math.floor(t);
  if (i >= n) i = n - 1;
  const f = t - i;
  const p1 = v[i];
  const p2 = v[i + 1];
  const p0 = i > 0 ? v[i - 1] : 2 * p1 - p2;
  const p3 = i + 2 <= n ? v[i + 2] : 2 * p2 - p1;
  const t1 = tension * (p2 - p0);
  const t2 = tension * (p3 - p1);
  const c2 = -3 * p1 + 3 * p2 - 2 * t1 - t2;
  const c3 = 2 * p1 - 2 * p2 + t1 + t2;
  return p1 + t1 * f + c2 * f * f + c3 * f * f * f;
}

/** 접선에 수직인 성분만 남긴 −z. 몸통·다리·꼬리·귀 전부 옆축이 ±z가 되게 고정한다. */
function seedSide(t: THREE.Vector3): THREE.Vector3 {
  const s = new THREE.Vector3(0, 0, -1).addScaledVector(t, t.z);
  if (s.lengthSq() < 1e-8) {
    s.set(0, 1, 0).addScaledVector(t, -t.y);
  }
  return s.normalize();
}

/**
 * 단면들을 이어 닫힌 껍데기 하나를 만든다.
 *
 * 반환 geometry: non-indexed. position / normal(격자에서 계산한 연속 법선) / color(사각형 단색).
 */
export function loft(sections: readonly Section[], opts: LoftOptions): THREE.BufferGeometry {
  const { segs, samples, paint } = opts;
  const capStart = opts.capStart ?? true;
  const capEnd = opts.capEnd ?? true;

  const pts = sections.map((s) => new THREE.Vector3(s.p[0], s.p[1], s.p[2] ?? 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

  const upV = sections.map((s) => s.up);
  const dnV = sections.map((s) => s.down);
  const sdV = sections.map((s) => s.side);
  const bxV = sections.map((s) => s.boxy ?? 1);

  // 실제로 쓰인 채널만 남긴다. 안 쓴 채널까지 매 정점에서 도는 건 낭비다.
  const used = CHANNELS.map((ch) => ({
    ch,
    values: sections.map((s) => s.coat?.[ch.name] ?? 0),
  })).filter((e) => e.values.some((v) => v !== 0));

  // ── 프레임: 시작만 정하고 접선 변화를 따라 굴린다(평행이송) ──
  const centers: THREE.Vector3[] = [];
  const tans: THREE.Vector3[] = [];
  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    centers.push(curve.getPoint(u));
    tans.push(curve.getTangent(u).normalize());
  }

  const sideAx: THREE.Vector3[] = [];
  const upAx: THREE.Vector3[] = [];
  const q = new THREE.Quaternion();
  for (let i = 0; i < samples; i++) {
    let s: THREE.Vector3;
    if (i === 0) {
      s = seedSide(tans[0]);
    } else {
      q.setFromUnitVectors(tans[i - 1], tans[i]);
      s = sideAx[i - 1].clone().applyQuaternion(q);
      // 수치 오차 누적 방지 — 접선 성분을 매번 걷어낸다.
      s.addScaledVector(tans[i], -s.dot(tans[i]));
      if (s.lengthSq() < 1e-10) s = seedSide(tans[i]);
      s.normalize();
    }
    sideAx.push(s);
    upAx.push(new THREE.Vector3().crossVectors(tans[i], s).normalize());
  }

  // ── 정점 격자 ──
  const grid: THREE.Vector3[][] = [];
  const dir = new THREE.Vector3();
  const base = new THREE.Vector3();

  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    const upR = Math.max(0.0015, crScalar(upV, u));
    const dnR = Math.max(0.0015, crScalar(dnV, u));
    const sdR = Math.max(0.0015, crScalar(sdV, u));
    const k = 1 / Math.max(0.2, crScalar(bxV, u));
    const gains = used.map((e) => crScalar(e.values, u));

    const ring: THREE.Vector3[] = [];
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * TAU;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const ey = Math.sign(ca) * Math.pow(Math.abs(ca), k);
      const ez = Math.sign(sa) * Math.pow(Math.abs(sa), k);
      const rv = ey >= 0 ? upR : dnR;

      base
        .copy(upAx[i])
        .multiplyScalar(ey * rv)
        .addScaledVector(sideAx[i], ez * sdR);

      const len = base.length();
      if (len < 1e-9) {
        ring.push(centers[i].clone());
        continue;
      }
      dir.copy(base).divideScalar(len);

      let swell = 0;
      for (let g = 0; g < used.length; g++) {
        const gain = gains[g];
        if (gain === 0) continue;
        const ch = used[g].ch;
        let d = dir.dot(ch.d);
        if (ch.m) {
          const dm = dir.dot(ch.m);
          if (dm > d) d = dm;
        }
        if (d > 0) swell += gain * Math.pow(d, ch.sharp);
      }

      ring.push(centers[i].clone().addScaledVector(base, 1 + swell));
    }
    grid.push(ring);
  }

  // ── 연속 법선: 격자 위 중앙차분. flat shading으로 도망가지 않는다. ──
  const nrm: THREE.Vector3[][] = [];
  const dU = new THREE.Vector3();
  const dV = new THREE.Vector3();
  for (let i = 0; i < samples; i++) {
    const row: THREE.Vector3[] = [];
    const iA = Math.min(samples - 1, i + 1);
    const iB = Math.max(0, i - 1);
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      const j2 = (j - 1 + segs) % segs;
      dU.subVectors(grid[iA][j], grid[iB][j]);
      dV.subVectors(grid[i][j1], grid[i][j2]);
      const n = new THREE.Vector3().crossVectors(dU, dV);
      if (n.lengthSq() < 1e-14) n.copy(upAx[i]);
      row.push(n.normalize());
    }
    nrm.push(row);
  }

  // ── 방출: 사각형 하나 = 색 하나 ──
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const rgb = new THREE.Color();
  const mid = new THREE.Vector3();
  const ctx: PaintCtx = { p: mid, u: 0, a: 0 };

  const push = (p: THREE.Vector3, n: THREE.Vector3) => {
    pos.push(p.x, p.y, p.z);
    nor.push(n.x, n.y, n.z);
    col.push(rgb.r, rgb.g, rgb.b);
  };

  for (let i = 0; i < samples - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const j2 = (j + 1) % segs;
      const A = grid[i][j];
      const B = grid[i + 1][j];
      const C = grid[i + 1][j2];
      const D = grid[i][j2];

      mid.copy(A).add(B).add(C).add(D).multiplyScalar(0.25);
      ctx.u = (i + 0.5) / (samples - 1);
      ctx.a = ((j + 0.5) / segs) * TAU;
      paint(rgb, ctx);

      push(A, nrm[i][j]);
      push(B, nrm[i + 1][j]);
      push(C, nrm[i + 1][j2]);
      push(A, nrm[i][j]);
      push(C, nrm[i + 1][j2]);
      push(D, nrm[i][j2]);
    }
  }

  // 끝마감. 정점 법선은 고리의 연속 법선을 그대로 쓰고 꼭짓점만 접선을 준다 —
  // 그래야 코끝·엉덩이 끝이 잘린 원반으로 보이지 않는다.
  const cap = (ring: number, first: boolean) => {
    const R = grid[ring];
    const N = nrm[ring];
    const apex = centers[ring];
    const apexN = tans[ring].clone().multiplyScalar(first ? -1 : 1);
    for (let j = 0; j < segs; j++) {
      const j2 = (j + 1) % segs;
      mid.copy(apex).add(R[j]).add(R[j2]).multiplyScalar(1 / 3);
      ctx.u = first ? 0 : 1;
      ctx.a = ((j + 0.5) / segs) * TAU;
      paint(rgb, ctx);
      if (first) {
        push(apex, apexN);
        push(R[j], N[j]);
        push(R[j2], N[j2]);
      } else {
        push(apex, apexN);
        push(R[j2], N[j2]);
        push(R[j], N[j]);
      }
    }
  };
  if (capStart) cap(0, true);
  if (capEnd) cap(samples - 1, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  return geo;
}

/**
 * 얕은 돔 원반. 눈(홍채·동공·하이라이트)처럼 표면에 얹히는 작은 조각용이다.
 * 평평한 판으로 두면 조명이 안 걸려 스티커가 되므로 가운데를 살짝 띄운다.
 */
export function domeDisc(
  rx: number,
  ry: number,
  dome: number,
  sides = 20,
  /** 윤곽을 아몬드로 만드는 지수. 1이면 타원, 커질수록 눈초리가 뾰족해진다. */
  almond = 1,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const rings = [
    { s: 1, z: 0 },
    { s: 0.62, z: dome * 0.72 },
  ];
  for (const r of rings) {
    for (let k = 0; k < sides; k++) {
      const th = (k / sides) * TAU;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const y = Math.sign(s) * Math.pow(Math.abs(s), almond) * (1 + 0.18 * c);
      pos.push(rx * r.s * c, ry * r.s * y, r.z);
    }
  }
  const center = pos.length / 3;
  pos.push(0, 0, dome);

  // 감기 방향은 +z(바깥)를 향해야 한다. 뒤집으면 눈이 밤처럼 새까맣게 나온다.
  for (let k = 0; k < sides; k++) {
    const k2 = (k + 1) % sides;
    idx.push(k, k2, sides + k2, k, sides + k2, sides + k);
    idx.push(sides + k, sides + k2, center);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
