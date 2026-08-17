// AJP-004 · Skill-ON v2 · stage-1 — faceted 조형 헬퍼.
//
// 이 파일은 제품 씬(`src2/scene/**`)도, 기존 dog 구현도, 기존 capability-eval 헬퍼도
// import 하지 않는다. 재설계 Skill 평가이므로 기술 기반부터 격리한다.
//
// 설계 제약(=/myworld-procedural-modeling · references/animal-scaffold-eval.md §4):
//   - 편의 generator 하나가 두 개 이상의 해부 영역을 가로지르면 안 된다.
//     그래서 여기 있는 도구는 전부 "한 영역짜리 조각"만 만든다.
//     nose-to-tail / skull-to-muzzle / neck-to-chest / trunk-to-tail / hip-to-paw 를
//     한 번의 호출로 만들 수 있는 API 자체를 두지 않는다.
//   - 모든 값은 결정적이다. Math.random 이 있으면 캡처마다 형태가 달라져 판정이 성립하지 않는다.
//   - 결과는 전부 non-indexed position-only geometry다. 병합 뒤 한 번에 법선을 굽는다(= flat shading).

import * as THREE from 'three';

export const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ *
 * 삼각형 버퍼
 * ------------------------------------------------------------------ */

/** non-indexed 삼각형 누적기. quad(a,b,c,d)는 cross(b-a, c-a)가 앞면이다. */
export class Tri {
  private readonly pos: number[] = [];

  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }

  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3): void {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  geo(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    return geo;
  }
}

/* ------------------------------------------------------------------ *
 * 배치 · 병합
 * ------------------------------------------------------------------ */

const IDENTITY_Q = new THREE.Quaternion();
const UNIT_S = new THREE.Vector3(1, 1, 1);

export function place(
  geo: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation?: THREE.Quaternion,
  scale?: THREE.Vector3,
): THREE.BufferGeometry {
  geo.applyMatrix4(
    new THREE.Matrix4().compose(position, rotation ?? IDENTITY_Q, scale ?? UNIT_S),
  );
  return geo;
}

/**
 * local +Z 를 `dir`로, local +Y 를 `upRef`의 직교 성분으로 보내는 회전.
 *
 * 다리·귀·꼬리처럼 축이 기울어진 조각은 "월드 좌표를 직접 찍는" 대신
 * 로컬에서 단면을 저술하고 이 프레임으로 붙인다. 그래야 단면의 좌우(local X)와
 * 앞뒤(local Y)가 해부학적으로 무엇인지 코드에서 고정된다.
 */
export function frame(dir: THREE.Vector3, upRef: THREE.Vector3): THREE.Quaternion {
  const z = dir.clone().normalize();
  const y = upRef.clone().addScaledVector(z, -upRef.dot(z));
  if (y.lengthSq() < 1e-8) {
    y.set(0, 1, 0).addScaledVector(z, -z.y);
    if (y.lengthSq() < 1e-8) y.set(1, 0, 0).addScaledVector(z, -z.x);
  }
  y.normalize();
  // 오른손 좌표계: x × y = z 가 되려면 x = y × z 여야 한다.
  const x = new THREE.Vector3().crossVectors(y, z);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

/** X에 대해 거울. 좌우 대칭 부위는 왼쪽만 저술하고 이걸로 뒤집는다(감기 방향도 뒤집는다). */
export function mirrorX(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const src = geo.getAttribute('position') as THREE.BufferAttribute;
  const out = new Float32Array(src.count * 3);
  const order = [0, 2, 1];
  for (let t = 0; t < src.count; t += 3) {
    for (let k = 0; k < 3; k++) {
      const i = t + order[k];
      const o = (t + k) * 3;
      out[o] = -src.getX(i);
      out[o + 1] = src.getY(i);
      out[o + 2] = src.getZ(i);
    }
  }
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(out, 3));
  return geo2;
}

/** 조각들을 하나의 mesh geometry로 합친다. 입력 geometry는 소비된다(dispose). */
export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let total = 0;
  for (const p of parts) total += (p.getAttribute('position') as THREE.BufferAttribute).count;

  const pos = new Float32Array(total * 3);
  let head = 0;
  for (const p of parts) {
    const a = p.getAttribute('position') as THREE.BufferAttribute;
    pos.set(a.array as Float32Array, head);
    head += a.count * 3;
    p.dispose();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // non-indexed에서의 computeVertexNormals = 면 법선. material.flatShading과 같은 결과를 굽는다.
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

/* ------------------------------------------------------------------ *
 * 단면 solid — "한 영역짜리" 덩어리
 * ------------------------------------------------------------------ */

/**
 * local XY 평면의 8각 단면. local +Z 를 따라 쌓아서 하나의 해부 영역을 만든다.
 *
 * 8각인 이유: 4각은 상자로 읽히고(= box muzzle 실패), 12각 이상은 low-poly에서
 * 면이 뭉개져 authored plane 이 사라진다. 8각이면 위/옆/아래 평면이 각각 살아 있다.
 *
 * ku/kv 는 위쪽 모서리, kl/klv 는 아래쪽 모서리의 "각짐"이다.
 *   ku=0.9, kv=0.95 → 넓은 평평한 윗면(두개골 정수리).
 *   kl=0.45, klv=0.85 → 아래로 좁아지는 용골(흉곽 brisket).
 *   kl=0.95, klv=0.98 → 평평한 바닥(발바닥).
 * widest 는 가장 넓은 점의 높이다(양수면 up 기준, 음수면 dn 기준).
 */
export type Sec = {
  z: number;
  /** 좌우 반폭(local ±X) */
  w: number;
  /** 단면 중심에서 위로(local +Y) */
  up: number;
  /** 단면 중심에서 아래로(local -Y) */
  dn: number;
  /** 단면 중심 자체의 이동 — 곡선 객체 없이 축을 휘게 한다 */
  cx?: number;
  cy?: number;
  ku?: number;
  kv?: number;
  kl?: number;
  klv?: number;
  widest?: number;
};

function loop(s: Sec): THREE.Vector3[] {
  const ku = s.ku ?? 0.72;
  const kv = s.kv ?? 0.72;
  const kl = s.kl ?? 0.72;
  const klv = s.klv ?? 0.72;
  const cx = s.cx ?? 0;
  const cy = s.cy ?? 0;
  const wd = s.widest ?? 0;
  const ym = wd >= 0 ? wd * s.up : wd * s.dn;
  const P = (x: number, y: number) => new THREE.Vector3(cx + x, cy + y, s.z);

  // 위 → +X쪽 → 아래 → -X쪽. (+Z에서 보면 시계방향 = 시작 캡 법선이 -Z)
  return [
    P(0, s.up),
    P(s.w * ku, s.up * kv),
    P(s.w, ym),
    P(s.w * kl, -s.dn * klv),
    P(0, -s.dn),
    P(-s.w * kl, -s.dn * klv),
    P(-s.w, ym),
    P(-s.w * ku, s.up * kv),
  ];
}

/**
 * 단면 목록을 하나의 닫힌 solid로 잇는다. **한 번의 호출 = 한 해부 영역**이 규칙이다.
 * z가 내림차순이면 뒤집어서 감기 방향을 유지한다(저술 순서를 자유롭게 두기 위함).
 */
export function solid(secs: Sec[], caps: { start?: boolean; end?: boolean } = {}): THREE.BufferGeometry {
  const list = secs[secs.length - 1].z < secs[0].z ? [...secs].reverse() : secs;
  const rings = list.map(loop);
  const n = 8;
  const buf = new Tri();

  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r];
    const B = rings[r + 1];
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n;
      buf.quad(A[k], B[k], B[k2], A[k2]);
    }
  }

  const center = (s: Sec) => new THREE.Vector3(s.cx ?? 0, s.cy ?? 0, s.z);
  if (caps.start !== false) {
    const A = rings[0];
    const c = center(list[0]);
    for (let k = 0; k < n; k++) buf.tri(c, A[k], A[(k + 1) % n]);
  }
  if (caps.end !== false) {
    const B = rings[rings.length - 1];
    const c = center(list[list.length - 1]);
    for (let k = 0; k < n; k++) buf.tri(c, B[(k + 1) % n], B[k]);
  }

  return buf.geo();
}

/**
 * 시작점 → 끝점 사이의 한 영역짜리 뼈마디.
 * `secs[].z` 는 0..1 비율이고 실제 길이는 두 점 사이 거리에서 나온다.
 * upRef 가 local +Y 를 정하므로, 사지에 (0,0,1)을 주면 up=앞, dn=뒤, w=좌우가 된다.
 */
export function segment(
  a: THREE.Vector3,
  b: THREE.Vector3,
  secs: Sec[],
  upRef: THREE.Vector3 = new THREE.Vector3(0, 0, 1),
  caps: { start?: boolean; end?: boolean } = {},
): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  const geo = solid(secs.map((s) => ({ ...s, z: s.z * len })), caps);
  return place(geo, a.clone(), frame(b.clone().sub(a), upRef));
}

/* ------------------------------------------------------------------ *
 * 열린 판(shell) — 코트 면
 * ------------------------------------------------------------------ */

/**
 * 격자 표면에 두께를 준 열린 판.
 *
 * ruff / 옆구리 코트 / 뒷다리 pants 는 몸을 "감싸는 달걀"이 아니라
 * 몸을 **따라 흐르는 가장자리 열린 판**이어야 한다(= chest egg 실패 회피).
 * 그래서 닫힌 회전체가 아니라, 네 변이 전부 열린 격자에 두께만 입힌다.
 *
 * grid[i][j] : i = 행, j = 열. 법선은 (∂/∂j) × (∂/∂i).
 */
export function skin(grid: THREE.Vector3[][], thickness: number, flip = false): THREE.BufferGeometry {
  const R = grid.length;
  const C = grid[0].length;
  const s = flip ? -1 : 1;
  const h = thickness / 2;

  const out: THREE.Vector3[][] = [];
  const inn: THREE.Vector3[][] = [];

  for (let i = 0; i < R; i++) {
    out.push([]);
    inn.push([]);
    for (let j = 0; j < C; j++) {
      const di = grid[Math.min(R - 1, i + 1)][j].clone().sub(grid[Math.max(0, i - 1)][j]);
      const dj = grid[i][Math.min(C - 1, j + 1)].clone().sub(grid[i][Math.max(0, j - 1)]);
      const n = new THREE.Vector3().crossVectors(dj, di).multiplyScalar(s);
      if (n.lengthSq() < 1e-12) n.set(0, 0, 1);
      n.normalize();
      out[i].push(grid[i][j].clone().addScaledVector(n, h));
      inn[i].push(grid[i][j].clone().addScaledVector(n, -h));
    }
  }

  const buf = new Tri();
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < C - 1; j++) {
      buf.quad(out[i][j], out[i][j + 1], out[i + 1][j + 1], out[i + 1][j]);
      buf.quad(inn[i][j], inn[i + 1][j], inn[i + 1][j + 1], inn[i][j + 1]);
    }
  }
  // 네 변의 테두리. 판의 "잘린 가장자리"가 실루엣에 남아야 코트가 층으로 읽힌다.
  for (let i = 0; i < R - 1; i++) {
    buf.quad(out[i][0], out[i + 1][0], inn[i + 1][0], inn[i][0]);
    buf.quad(out[i][C - 1], inn[i][C - 1], inn[i + 1][C - 1], out[i + 1][C - 1]);
  }
  for (let j = 0; j < C - 1; j++) {
    buf.quad(out[0][j], out[0][j + 1], inn[0][j + 1], inn[0][j]);
    buf.quad(out[R - 1][j], inn[R - 1][j], inn[R - 1][j + 1], out[R - 1][j + 1]);
  }
  return buf.geo();
}

/** 세로축을 감는 호 한 줄. 각도는 +Z(정면)에서 +X(개의 왼쪽)로 잰다. */
export type ArcRow = { y: number; r: number; a0: number; a1: number; cx?: number; cz?: number };

/** 위→아래로 늘어놓은 호 격자. ruff·pants 처럼 몸을 부분적으로 감는 판에 쓴다. */
export function arcGrid(rows: ArcRow[], cols: number): THREE.Vector3[][] {
  return rows.map((row) => {
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j < cols; j++) {
      const a = THREE.MathUtils.lerp(row.a0, row.a1, j / (cols - 1)) * DEG;
      pts.push(
        new THREE.Vector3(
          (row.cx ?? 0) + Math.sin(a) * row.r,
          row.y,
          (row.cz ?? 0) + Math.cos(a) * row.r,
        ),
      );
    }
    return pts;
  });
}

/** 몸통을 따라 흐르는 옆구리 판의 한 열(= 하나의 z 위치에서 위→아래로 내려가는 줄). */
export type FlankCol = { z: number; x: number; top: number; bottom: number };

/**
 * 옆구리 코트 격자. `bulge` 는 위→아래 각 단계의 옆으로 부푼 정도다.
 * 맨 위를 작게 두면 등마루 쪽에서 판이 몸 안으로 들어가 테두리가 보이지 않고,
 * 가운데를 1.0으로 두면 갈비 위에서 부풀었다가 아래 자락에서 다시 말려 들어간다.
 */
export function flankGrid(cols: FlankCol[], bulge: number[]): THREE.Vector3[][] {
  return cols.map((c) =>
    bulge.map((b, j) =>
      new THREE.Vector3(
        c.x * b,
        THREE.MathUtils.lerp(c.top, c.bottom, j / (bulge.length - 1)),
        c.z,
      ),
    ),
  );
}
