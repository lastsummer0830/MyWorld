// AJP-004 vegetation capability eval — 조형 헬퍼.
// 이 파일은 제품 씬(`src2/scene/**`)을 import하지 않는다. 평가 샘플은 기술적으로도 격리한다.
//
// 원칙(=/myworld-procedural-modeling):
//   - primitive는 숨은 지지대까지다. 실루엣은 authored geometry가 만든다.
//   - 모든 형태는 결정적이다. Math.random을 쓰면 캡처마다 형태가 달라져 검수 자체가 성립하지 않는다.
//   - 변주는 "구조 파라미터"로 준다(가지 방향, 성장 단계, 잎 배치). 회전·스케일 난수는 변주가 아니다.

import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * 병합
 * ------------------------------------------------------------------ */

/** 병합 대상 조각. `geo`에 color 속성이 있으면 그것을 쓰고, 없으면 `color` 하나로 칠한다. */
export type Part = { geo: THREE.BufferGeometry; color?: THREE.ColorRepresentation };

/**
 * 조각들을 vertex color를 가진 하나의 non-indexed geometry로 합친다.
 *
 * 식물 하나가 100개 넘는 조각으로 이뤄지므로 mesh를 그대로 나누면 draw call이 터진다.
 * 대신 조각마다 색을 굽고 mesh 하나로 합친다 — 꽃차례의 아래→위 명도 사다리처럼
 * "재질이 아니라 조형이 만드는 색 변화"를 그대로 유지할 수 있다.
 *
 * ★ 입력 geometry는 소비된다(dispose). 재사용할 geometry를 넘기지 말 것.
 */
export function mergeParts(parts: Part[]): THREE.BufferGeometry {
  const chunks: { pos: Float32Array; col: Float32Array }[] = [];
  const tmp = new THREE.Color();
  let total = 0;

  for (const part of parts) {
    const src = part.geo;
    const flat = src.index ? src.toNonIndexed() : src;
    const posAttr = flat.getAttribute('position');
    const count = posAttr.count;

    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = posAttr.getX(i);
      pos[i * 3 + 1] = posAttr.getY(i);
      pos[i * 3 + 2] = posAttr.getZ(i);
    }

    const col = new Float32Array(count * 3);
    const srcCol = flat.getAttribute('color');
    if (srcCol) {
      for (let i = 0; i < count; i++) {
        col[i * 3] = srcCol.getX(i);
        col[i * 3 + 1] = srcCol.getY(i);
        col[i * 3 + 2] = srcCol.getZ(i);
      }
    } else {
      tmp.set(part.color ?? '#ffffff');
      for (let i = 0; i < count; i++) {
        col[i * 3] = tmp.r;
        col[i * 3 + 1] = tmp.g;
        col[i * 3 + 2] = tmp.b;
      }
    }

    chunks.push({ pos, col });
    total += count;
    if (flat !== src) flat.dispose();
    src.dispose();
  }

  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let head = 0;
  for (const chunk of chunks) {
    pos.set(chunk.pos, head);
    col.set(chunk.col, head);
    head += chunk.pos.length;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // non-indexed에서의 computeVertexNormals는 면 법선을 그대로 준다 = flat shading.
  // material.flatShading을 켜서 파생값으로 다시 구할 필요가 없다.
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** 조각을 제자리에 놓는다. 조형 코드는 항상 로컬 원점에서 만들고 여기서 배치한다. */
export function place(
  geo: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation?: THREE.Quaternion,
  scale?: THREE.Vector3,
): THREE.BufferGeometry {
  const m = new THREE.Matrix4().compose(
    position,
    rotation ?? IDENTITY_Q,
    scale ?? UNIT_S,
  );
  geo.applyMatrix4(m);
  return geo;
}

const IDENTITY_Q = new THREE.Quaternion();
const UNIT_S = new THREE.Vector3(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);

/** +Y를 `dir`로 향하게 하는 회전. 꽃부리·잎처럼 축이 있는 조각을 붙일 때 쓴다. */
export function aimY(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
}

const X = new THREE.Vector3(1, 0, 0);

/**
 * +X를 `dir`로 향하게 하되, 잎면(+Y)이 최대한 하늘을 보도록 축 둘레로 굴린다.
 * `setFromUnitVectors`만 쓰면 잎면이 어디를 볼지 통제되지 않아 무리가 뒤엉킨 판때기로 보인다.
 * `roll`은 그 위에 얹는 authored 비틀림이다.
 */
export function aimX(dir: THREE.Vector3, roll = 0): THREE.Quaternion {
  const f = dir.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(X, f);

  // f에 수직인 성분만 남긴 "위" 방향. f가 수직이면 기준이 사라지므로 임의 축으로 대체한다.
  const up = new THREE.Vector3(0, 1, 0).addScaledVector(f, -f.y);
  if (up.lengthSq() < 1e-6) up.set(0, 0, 1);
  up.normalize();

  const y = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  const cos = THREE.MathUtils.clamp(y.dot(up), -1, 1);
  const sign = new THREE.Vector3().crossVectors(y, up).dot(f) < 0 ? -1 : 1;
  return new THREE.Quaternion().setFromAxisAngle(f, Math.acos(cos) * sign + roll).multiply(q);
}

/* ------------------------------------------------------------------ *
 * 삼각형 버퍼
 * ------------------------------------------------------------------ */

/** non-indexed 삼각형을 쌓는 얇은 버퍼. 법선은 병합 뒤 한 번에 계산한다. */
export class TriBuffer {
  private readonly pos: number[] = [];

  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }

  /** 시계 반대 방향(a→b→c→d)으로 넘기면 cross(b-a, c-a)가 앞면이 된다. */
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3) {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  geo(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    return geo;
  }
}

/**
 * 같은 정점 수를 가진 고리들을 아래에서 위로 잇는다.
 * 꽃부리 컵, 꽃받침, 화방처럼 "고리 프로필"로 정의되는 조형은 전부 이걸로 만든다.
 */
export function stripRings(rings: THREE.Vector3[][], buf = new TriBuffer()): TriBuffer {
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r];
    const B = rings[r + 1];
    const n = A.length;
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n;
      buf.quad(A[k], B[k], B[k2], A[k2]);
    }
  }
  return buf;
}

/** 고리를 한 점으로 닫는다. `outward=false`면 아래쪽(바닥)을 향한다. */
export function capRing(
  ring: THREE.Vector3[],
  apex: THREE.Vector3,
  outward: boolean,
  buf = new TriBuffer(),
): TriBuffer {
  const n = ring.length;
  for (let k = 0; k < n; k++) {
    const k2 = (k + 1) % n;
    if (outward) buf.tri(apex, ring[k2], ring[k]);
    else buf.tri(apex, ring[k], ring[k2]);
  }
  return buf;
}

/** y=0 평면의 다각형 원반. 꽃 목구멍(throat)처럼 안쪽 깊이를 만드는 데 쓴다. */
export function discFan(radius: number, sides: number): THREE.BufferGeometry {
  const buf = new TriBuffer();
  const center = new THREE.Vector3(0, 0, 0);
  const ring: THREE.Vector3[] = [];
  for (let k = 0; k < sides; k++) {
    const a = (k / sides) * Math.PI * 2;
    ring.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return capRing(ring, center, true, buf).geo();
}

/* ------------------------------------------------------------------ *
 * 줄기·가지 — 굵기가 변하는 관
 * ------------------------------------------------------------------ */

/** 조형용 곡선. 가지에 자식 가지를 붙이려면 곡선 자체가 필요하므로 따로 만든다. */
export function pathCurve(points: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

/** 굵기 사다리에서 t 위치의 굵기. 자식 가지가 부모 굵기를 물려받을 때도 쓴다. */
export function sampleRamp(ramp: number[], t: number): number {
  const n = ramp.length - 1;
  const x = THREE.MathUtils.clamp(t, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return THREE.MathUtils.lerp(ramp[i], ramp[i + 1], x - i);
}

/**
 * 굵기가 변하는 관. `TubeGeometry`는 반지름이 상수라 줄기·가지에 쓸 수 없다.
 * `radii`는 곡선 길이에 균등 배분되는 굵기 사다리다 — 뿌리의 울퉁불퉁한 마디도 여기서 나온다.
 */
export function taperedTube(
  curve: THREE.CatmullRomCurve3,
  radii: number[],
  opts: { radial?: number; segments?: number; caps?: boolean } = {},
): THREE.BufferGeometry {
  const radial = opts.radial ?? 6;
  const segments = opts.segments ?? Math.max(8, (curve.points.length - 1) * 5);
  const caps = opts.caps ?? true;
  const frames = curve.computeFrenetFrames(segments, false);

  const buf = new TriBuffer();
  const rings: THREE.Vector3[][] = [];
  const centers: THREE.Vector3[] = [];
  const P = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, P);
    centers.push(P.clone());
    const r = sampleRamp(radii, t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const ring: THREE.Vector3[] = [];
    for (let k = 0; k < radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      ring.push(
        new THREE.Vector3(
          P.x + N.x * cx + B.x * cz,
          P.y + N.y * cx + B.y * cz,
          P.z + N.z * cx + B.z * cz,
        ),
      );
    }
    rings.push(ring);
  }

  stripRings(rings, buf);
  if (caps) {
    capRing(rings[0], centers[0], false, buf);
    capRing(rings[rings.length - 1], centers[centers.length - 1], true, buf);
  }
  return buf.geo();
}

/**
 * 가지 곡선. 방향·길이가 아니라 **끝점**을 직접 지정한다.
 *
 * 각도로 지정하면 가지 끝이 어디에 놓일지 코드에서 통제되지 않고,
 * 그러면 수관을 "가지 끝에 달린 잎 무리"로 만들 수 없어 결국 허공의 덩어리로 되돌아간다.
 * 시작점이 부모 중심선 위에 있으므로 접합부는 자연히 겹친다(붙여 놓은 티가 나지 않는다).
 * `bow`는 중간 마디를 밀어내는 휨이다 — 직선 막대가 되지 않게 한다.
 */
export function limbCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  bow: THREE.Vector3,
): THREE.CatmullRomCurve3 {
  return pathCurve([
    start.clone(),
    start.clone().lerp(end, 0.34).addScaledVector(bow, 0.6),
    start.clone().lerp(end, 0.7).addScaledVector(bow, 1),
    end.clone(),
  ]);
}

/* ------------------------------------------------------------------ *
 * 잎·꽃잎 — 뾰족한 윤곽 + 접힘 + 처짐
 * ------------------------------------------------------------------ */

export type BladeShape = 'lance' | 'petal' | 'broad' | 'lobed' | 'fan';

export type BladeSpec = {
  length: number;
  width: number;
  /** 가운데 잎맥을 기준으로 가장자리가 내려가는 정도. 접힘이 없으면 그냥 종잇조각이 된다. */
  fold: number;
  /** 끝으로 갈수록 아래로 처지는 양(음수면 위로 치켜든다). */
  droop: number;
  /**
   * 'lance' = 좁은 잎, 'petal' = 꽃잎, 'broad' = 기부가 넓은 로제트 잎,
   * 'lobed' = 열편이 있는 수관 잎, 'fan' = 짧고 넓은 3열편 잎.
   */
  shape?: BladeShape;
  /** 잎맥 축을 따라 비트는 각(rad). 같은 무리에서도 잎마다 향이 달라진다. */
  twist?: number;
  segments?: number;
  /**
   * 잎 한 장 안의 명도 변화(기부 → 끝). reference의 잎은 단색 판이 아니라
   * 기부가 어둡고 끝이 밝다 — 이게 없으면 무리가 한 덩어리 색으로 뭉갠다.
   */
  tint?: { base: THREE.ColorRepresentation; tip: THREE.ColorRepresentation };
};

/**
 * 열편(lobe) 윤곽 사다리. 가장자리가 나갔다 들어왔다 하는 리듬이 실루엣을 "잎"으로 만든다.
 * 매끈한 함수형 윤곽(lance/petal)으로는 이 리듬이 나오지 않는다.
 */
const PROFILES: Partial<Record<BladeShape, number[]>> = {
  // 기부가 넓은 창끝-난형 잎 — 꽃 reference의 기부 로제트.
  broad: [0.14, 0.62, 0.9, 1.0, 0.94, 0.76, 0.46, 0.0],
  // 5열편(단풍형) — 나무 reference 수관 잎의 기본형.
  lobed: [0.1, 0.34, 0.22, 0.86, 0.46, 1.0, 0.4, 0.44, 0.0],
  // 3열편 부채 — 무리 안쪽을 메우는 짧고 넓은 잎.
  fan: [0.16, 0.52, 0.36, 1.0, 0.58, 0.84, 0.3, 0.0],
};

function halfWidth(shape: BladeShape, s: number): number {
  if (shape === 'petal') {
    return s <= 0.55
      ? Math.pow(s / 0.55, 0.55)
      : Math.max(0.06, Math.pow(1 - (s - 0.55) / 0.45, 0.45));
  }
  return s <= 0.28
    ? Math.pow(s / 0.28, 0.6)
    : Math.max(0.04, Math.pow(1 - (s - 0.28) / 0.72, 0.9));
}

/**
 * 잎 한 장. +X로 자라고 +Y가 위, 폭은 ±Z.
 * 잎맥(가운데)·좌우 가장자리 3열로 만들어 접힘과 처짐이 실루엣에 남게 한다.
 * 열편 윤곽이 있는 shape는 사다리 길이가 곧 분절 수다(윤곽이 뭉개지면 열편이 사라진다).
 */
export function leafBlade(spec: BladeSpec): THREE.BufferGeometry {
  const shape = spec.shape ?? 'lance';
  const profile = PROFILES[shape];
  const segments = profile ? profile.length - 1 : (spec.segments ?? 5);
  const twist = spec.twist ?? 0;
  const buf = new TriBuffer();

  const rib: THREE.Vector3[] = [];
  const left: THREE.Vector3[] = [];
  const right: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const s = i / segments;
    const w = spec.width * (profile ? profile[i] : halfWidth(shape, s));
    const x = spec.length * s;
    const y = -spec.droop * spec.length * s * s;
    const a = twist * s;
    // 단면을 잎맥 축(+X)으로 비튼다. (0,-fold*w, ±w)를 그 각만큼 돌린 위치가 가장자리다.
    const dy = -spec.fold * w;
    const rot = (sign: number) => {
      const ey = dy * Math.cos(a) - sign * w * Math.sin(a);
      const ez = dy * Math.sin(a) + sign * w * Math.cos(a);
      return new THREE.Vector3(x, y + ey, ez);
    };
    rib.push(new THREE.Vector3(x, y, 0));
    left.push(rot(-1));
    right.push(rot(1));
  }

  for (let i = 0; i < segments; i++) {
    buf.quad(rib[i], right[i], right[i + 1], rib[i + 1]);
    buf.quad(rib[i], rib[i + 1], left[i + 1], left[i]);
  }

  const geo = buf.geo();
  if (spec.tint) {
    // 잎은 로컬 +X로 자라므로 x/length가 곧 기부→끝 파라미터다.
    // 배치(place) 전에 구우므로 회전·이동과 무관하게 같은 값이 나온다.
    const pos = geo.getAttribute('position');
    const col = new Float32Array(pos.count * 3);
    const base = new THREE.Color(spec.tint.base);
    const tip = new THREE.Color(spec.tint.tip);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const s = THREE.MathUtils.clamp(pos.getX(i) / spec.length, 0, 1);
      c.copy(base).lerp(tip, s);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

/* ------------------------------------------------------------------ *
 * 덩어리 — 수관/봉오리
 * ------------------------------------------------------------------ */

export type Lobe = { dir: THREE.Vector3; gain: number; sharp?: number };

/**
 * 방향에 대해 연속인 결정적 요철.
 * 정점 인덱스 해시를 쓰면 PolyhedronGeometry의 중복 정점이 서로 다르게 밀려 면이 갈라진다.
 * 방향만의 함수로 두면 중복 정점이 항상 같은 값을 받아 틈이 생기지 않는다.
 */
function waveNoise(n: THREE.Vector3, seed: number): number {
  const a = Math.sin(n.x * 3.1 + seed * 1.7) * Math.sin(n.y * 2.7 - seed * 0.9) * Math.sin(n.z * 3.4 + seed * 2.3);
  const b = Math.sin(n.x * 6.2 - seed * 2.1) * Math.sin(n.y * 5.3 + seed * 1.1) * Math.sin(n.z * 6.7 - seed * 0.4);
  return a * 0.7 + b * 0.3;
}

/**
 * 로브가 있는 덩어리. 구가 아니라 "몇 개의 authored 돌출 + 완만한 요철"이다.
 * 색은 정점마다 굽는다 — 위를 향한 면은 밝은 초록, 아래를 향한 면은 그늘 초록.
 * 이 명도 가족이 있어야 수관이 한 덩어리 실루엣으로 뭉개지지 않는다.
 */
export function lobedMass(opts: {
  radius: number;
  lobes: Lobe[];
  detail?: number;
  jitter?: number;
  seed?: number;
  scale?: [number, number, number];
  colors?: { lit: string; mid: string; shade: string };
}): THREE.BufferGeometry {
  const detail = opts.detail ?? 1;
  const jitter = opts.jitter ?? 0.07;
  const seed = opts.seed ?? 1;
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  const count = pos.count;

  const colorArr = opts.colors ? new Float32Array(count * 3) : null;
  const lit = opts.colors ? new THREE.Color(opts.colors.lit) : null;
  const mid = opts.colors ? new THREE.Color(opts.colors.mid) : null;
  const shade = opts.colors ? new THREE.Color(opts.colors.shade) : null;
  const c = new THREE.Color();

  const sx = opts.scale?.[0] ?? 1;
  const sy = opts.scale?.[1] ?? 1;
  const sz = opts.scale?.[2] ?? 1;

  for (let i = 0; i < count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();

    let bulge = 0;
    for (const lobe of opts.lobes) {
      const d = Math.max(0, n.dot(lobe.dir));
      bulge = Math.max(bulge, lobe.gain * Math.pow(d, lobe.sharp ?? 2));
    }
    const wave = waveNoise(n, seed);
    const r = opts.radius * (0.78 + bulge + jitter * wave);
    pos.setXYZ(i, n.x * r * sx, n.y * r * sy, n.z * r * sz);

    if (colorArr && lit && mid && shade) {
      // 위를 향할수록 밝은 면, 아래를 향할수록 그늘 면. 요철값을 조금 섞어
      // 같은 높이라도 덩어리별로 값이 갈리게 한다(= 잎 무리의 얼룩).
      const up = THREE.MathUtils.clamp(n.y * 0.5 + 0.5 + wave * 0.12, 0, 1);
      if (up > 0.55) c.copy(mid).lerp(lit, (up - 0.55) / 0.45);
      else c.copy(shade).lerp(mid, up / 0.55);
      colorArr[i * 3] = c.r;
      colorArr[i * 3 + 1] = c.g;
      colorArr[i * 3 + 2] = c.b;
    }
  }

  if (colorArr) geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  return geo;
}

/* ------------------------------------------------------------------ *
 * 꽃부리 컵
 * ------------------------------------------------------------------ */

/**
 * 각진 종 모양 꽃부리 — reference의 디기탈리스 낱꽃 단위.
 * 아래 고리(줄기 접합) → 중간 고리(능선) → 입구(뾰족한 판 + 오목한 골)의 3단 프로필이라
 * 정면에서는 다각형 꽃잎으로, 옆에서는 깊이가 있는 컵으로 읽힌다.
 */
export function bellBlossom(o: {
  r: number;
  depth: number;
  lobes?: number;
  /** 입구가 벌어진 정도. 봉오리에 가까울수록 작다. */
  flare?: number;
  /** 뾰족한 판이 위로 들리는 양. */
  rise?: number;
}): THREE.BufferGeometry {
  const lobes = o.lobes ?? 5;
  const flare = o.flare ?? 1;
  const rise = o.rise ?? 0.12;
  const n = lobes * 2;

  const ring = (radiusAt: (k: number) => number, yAt: (k: number) => number) => {
    const out: THREE.Vector3[] = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const r = radiusAt(k);
      out.push(new THREE.Vector3(Math.cos(a) * r, yAt(k), Math.sin(a) * r));
    }
    return out;
  };

  const base = ring(() => o.r * 0.22, () => 0);
  const mid = ring((k) => o.r * 0.62 * (k % 2 === 0 ? 1.06 : 0.88), () => o.depth * 0.45);
  const rim = ring(
    (k) => o.r * flare * (k % 2 === 0 ? 1 : 0.72),
    (k) => (k % 2 === 0 ? o.depth * (1 + rise) : o.depth * 0.8),
  );

  const buf = stripRings([base, mid, rim]);
  capRing(base, new THREE.Vector3(0, -o.depth * 0.06, 0), false, buf);
  return buf.geo();
}
