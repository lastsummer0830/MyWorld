// AJP-004 · prop capability eval — 소품 조형 헬퍼.
//
// 이 파일은 제품 씬(`src2/scene/**`)도, 기존 capability-eval 스파이크도 import 하지 않는다.
// 능력 평가라 기술 기반부터 격리한다. 외부 모델·텍스처는 쓰지 않는다.
//
// 설계 제약(/myworld-procedural-modeling §2 "Props and style grammar"):
//   - 물뿌리개는 "회전체 몸통 + 저술된 곡선을 따라 흐르는 관/띠"다.
//     그래서 도구는 revolve(회전체)와 sweep(단면 스윕) 둘뿐이고,
//     박스·구를 늘어놓는 API 는 두지 않는다.
//   - 모든 값은 결정적이다. Math.random 이 있으면 캡처마다 형태가 달라져 판정이 성립하지 않는다.
//   - 결과는 전부 non-indexed position-only geometry다. 마지막에 한 번 법선을 굽는다(= flat shading).

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
    geo.computeVertexNormals();
    return geo;
  }
}

/** 좌표를 옮긴다(회전·크기 포함). 입력 geometry를 그대로 변형해 돌려준다. */
export function place(
  geo: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation?: THREE.Quaternion,
): THREE.BufferGeometry {
  geo.applyMatrix4(
    new THREE.Matrix4().compose(
      position,
      rotation ?? new THREE.Quaternion(),
      new THREE.Vector3(1, 1, 1),
    ),
  );
  return geo;
}

/** 조각들을 하나의 geometry로 합친다. 입력 geometry는 소비된다(dispose). */
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
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

/** local +Y 를 dir 로 보내는 회전. 주둥이 끝·접합 패드처럼 축이 기울어진 조각에 쓴다. */
export function aim(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
}

/* ------------------------------------------------------------------ *
 * 회전체 — 몸통·굽·아가리·장미머리
 * ------------------------------------------------------------------ */

/** (반지름, 높이) 윤곽 한 점. 아래에서 위로, 바깥을 타고 올라가 안쪽으로 내려온다. */
export type Pt = { r: number; y: number };

const AXIS_EPS = 1e-5;

/**
 * 윤곽선을 Y축으로 돌린 면.
 *
 * 윤곽을 "바닥 중심 → 바깥벽 → 아가리 → 안쪽벽 → 안바닥 중심" 순서로 한 줄에 저술하면
 * 벽 두께와 열린 구멍이 **하나의 연속면**에서 나온다. 바깥통과 안쪽통을 따로 만들어
 * 겹쳐 놓는 방식(= 접합이 뜨는 흔한 실패)을 애초에 못 하게 하는 구조다.
 *
 * `from`/`to` 로 같은 윤곽의 일부 구간만 뽑을 수 있다. 구간을 이어 붙이면(겹치지 않게)
 * 정점이 정확히 공유되므로, 굽·몸통·아가리·안쪽에 서로 다른 재질을 주면서도 면이 갈라지지 않는다.
 */
export function revolve(profile: Pt[], segments: number, from = 0, to = profile.length - 1): THREE.BufferGeometry {
  const buf = new Tri();
  const at = (i: number, j: number) => {
    const a = (j / segments) * Math.PI * 2;
    return new THREE.Vector3(profile[i].r * Math.cos(a), profile[i].y, profile[i].r * Math.sin(a));
  };

  for (let i = from; i < to; i++) {
    const rA = profile[i].r;
    const rB = profile[i + 1].r;
    if (rA <= AXIS_EPS && rB <= AXIS_EPS) continue;
    for (let j = 0; j < segments; j++) {
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i + 1, j + 1);
      const d = at(i, j + 1);
      // 축 위의 점(r=0)은 한 점으로 모이므로 사각형이 삼각형으로 무너진다.
      // 면적 0 삼각형을 남기면 법선이 NaN 이 되므로 여기서 걸러낸다.
      if (rA <= AXIS_EPS) buf.tri(a, b, c);
      else if (rB <= AXIS_EPS) buf.tri(a, b, d);
      else buf.quad(a, b, c, d);
    }
  }
  return buf.geo();
}

/** 윤곽선에서 특정 높이의 반지름. 접합 패드·몰딩을 몸통 표면에 정확히 앉히는 데 쓴다. */
export function radiusAt(profile: Pt[], y: number, from: number, to: number): number {
  for (let i = from; i < to; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if ((y >= a.y && y <= b.y) || (y <= a.y && y >= b.y)) {
      const t = Math.abs(b.y - a.y) < 1e-6 ? 0 : (y - a.y) / (b.y - a.y);
      return THREE.MathUtils.lerp(a.r, b.r, t);
    }
  }
  return profile[to].r;
}

/** 윤곽선의 바깥 법선(단면 평면 기준). 패드를 표면에 수직으로 세울 때 쓴다. */
export function normalAt(profile: Pt[], y: number, from: number, to: number): THREE.Vector2 {
  const d = 0.004;
  const r0 = radiusAt(profile, y - d, from, to);
  const r1 = radiusAt(profile, y + d, from, to);
  // 접선 (dr, dy) 의 오른쪽 법선 = (dy, -dr) → 반지름이 줄면 법선이 위로 눕는다.
  return new THREE.Vector2(2 * d, -(r1 - r0)).normalize();
}

/* ------------------------------------------------------------------ *
 * 스윕 — 주둥이 관, 손잡이 띠
 * ------------------------------------------------------------------ */

/** 스윕 단면의 반폭/반두께. 관은 w=h(원), 손잡이 띠는 w>h(납작한 띠). */
export type Sect = { w: number; h: number };

/**
 * 저술된 경로를 따라 8각 단면을 흘린다.
 *
 * 8각인 이유: 4각은 각재로 읽히고, 16각 이상은 low-poly에서 면이 뭉개져
 * authored plane 이 사라진다. 8각이면 위·옆·아래 면이 각각 살아 있다.
 *
 * `sideRef` 는 단면의 가로축(=띠의 폭 방향)이다. YZ 평면 안에서 도는 손잡이·주둥이에
 * (1,0,0) 을 주면 폭이 항상 좌우로 눕는다 — 실제 물뿌리개 손잡이의 단면 방향이다.
 */
export function sweep(
  path: THREE.Vector3[],
  sect: Sect[],
  sideRef = new THREE.Vector3(1, 0, 0),
  caps: { start?: boolean; end?: boolean } = {},
): THREE.BufferGeometry {
  const n = path.length;
  const rings: THREE.Vector3[][] = [];

  for (let i = 0; i < n; i++) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(n - 1, i + 1)];
    const t = next.clone().sub(prev).normalize();
    const side = sideRef.clone().addScaledVector(t, -sideRef.dot(t));
    if (side.lengthSq() < 1e-8) side.set(0, 0, 1).addScaledVector(t, -t.z);
    side.normalize();
    const up = new THREE.Vector3().crossVectors(t, side).normalize();

    const ring: THREE.Vector3[] = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ring.push(
        path[i]
          .clone()
          .addScaledVector(side, Math.cos(a) * sect[i].w)
          .addScaledVector(up, Math.sin(a) * sect[i].h),
      );
    }
    rings.push(ring);
  }

  const buf = new Tri();
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < 8; k++) {
      const k2 = (k + 1) % 8;
      buf.quad(rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]);
    }
  }
  if (caps.start !== false) {
    const A = rings[0];
    for (let k = 0; k < 8; k++) buf.tri(path[0], A[(k + 1) % 8], A[k]);
  }
  if (caps.end !== false) {
    const B = rings[n - 1];
    for (let k = 0; k < 8; k++) buf.tri(path[n - 1], B[k], B[(k + 1) % 8]);
  }
  return buf.geo();
}

/** 제어점을 부드러운 경로로 편다. 손잡이 아치·주둥이 곡선은 꺾인 선분이면 안 된다. */
export function curve(points: THREE.Vector3[], count: number, tension = 0.5): THREE.Vector3[] {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', tension).getSpacedPoints(count - 1);
}

/** 경로 길이 비율(t)에 따른 단면 변화. 접합부는 굵고 끝은 가늘다 = 구조가 보이는 taper. */
export function taperStops(count: number, stops: { t: number; w: number; h: number }[]): Sect[] {
  const out: Sect[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s].t && t <= stops[s + 1].t) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const k = Math.abs(b.t - a.t) < 1e-6 ? 0 : (t - a.t) / (b.t - a.t);
    out.push({ w: THREE.MathUtils.lerp(a.w, b.w, k), h: THREE.MathUtils.lerp(a.h, b.h, k) });
  }
  return out;
}
