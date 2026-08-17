// AJP-004 dog capability eval — STAGE 1 지오메트리 빌더.
//
// pass 1은 코끝~꼬리를 **단일 loft 껍데기 하나**로 이었고, 그 결과 종(種)이 사라졌다.
// (쥐/개미핥기/사슴/라마 실루엣, 튜브 목, 달걀 앞가슴.)
// 그래서 이 빌더는 "몸 전체를 잇는 중심선"을 만들 수 없게 설계돼 있다:
//
//   · 한 번의 호출은 **짧은 축 하나짜리 덩어리 하나**만 만든다(늑골, 위팔, 볼, 꼬리 밑동 …).
//   · 덩어리끼리 잇는 봉합/보간 기능이 없다. 해부는 **겹침으로만** 성립한다.
//   · 그래서 골격을 이해하지 못하면 애초에 형태가 서지 않는다.
//
// 좌표 규약(기존 표본과 동일):
//   강아지는 +x를 보고, 강아지의 왼쪽이 −z, 바닥은 y = 0.
//
// 단면 프레임: 축 d = normalize(to − from) 은 x–y 평면에만 있다.
//   u = d를 +90° 돌린 평면 내 수직축  → `up` / `down` 이 향하는 방향.
//   측면축은 항상 월드 z            → `side`.
// 축이 수평(+x)이면 u = +y라서 up/down이 그대로 위/아래다.
// 축이 아래로 향하면 u는 앞쪽으로 눕는다 — 다리·꼬리·펜츠 단면은 이 규약을 전제로 쓴다.

import * as THREE from 'three';

export type Section = {
  /** 축 위 위치(0 = from, 1 = to) */
  t: number;
  /** 측면(z) 반폭 */
  side: number;
  /** 평면 내 수직축 +u 반폭 */
  up: number;
  /** 평면 내 수직축 −u 반폭 */
  down: number;
  /**
   * 단면 모서리 지수. 2 = 타원, 3~4 = 살짝 각진 몸통 단면, 5~8 = 발바닥처럼 평평한 면.
   * 저폴리에서 "원통 티"를 없애는 손잡이다.
   */
  round?: number;
};

export type MassSpec = {
  /** 축 시작점 [x, y] */
  from: readonly [number, number];
  /** 축 끝점 [x, y] */
  to: readonly [number, number];
  /** 측면 중심(강아지 왼쪽이 음수) */
  z?: number;
  /** t 오름차순 단면. 최소 2개. */
  sections: readonly Section[];
  /** 링 분할. 기본 12(저폴리 유지) */
  radial?: number;
  /** 이 y 아래로 내려간 정점을 끌어올린다. 발바닥 접지면을 정확히 y = 0으로 만드는 데 쓴다. */
  clampY?: number;
};

const DEFAULT_RADIAL = 12;

/** 부호를 지키는 초타원 좌표. n이 커질수록 단면이 사각형에 가까워진다. */
function superEllipse(c: number, n: number): number {
  return Math.sign(c) * Math.abs(c) ** (2 / n);
}

/**
 * 덩어리 하나를 non-indexed BufferGeometry로 굽는다.
 * 정점을 공유하지 않으므로 `computeVertexNormals()`가 곧 flat shading이고,
 * 무채색 한 재질에서도 면이 갈라져 형태가 읽힌다(STAGE 1의 판정 조건).
 */
export function massGeometry(spec: MassSpec): THREE.BufferGeometry {
  const radial = spec.radial ?? DEFAULT_RADIAL;
  const z0 = spec.z ?? 0;
  const [ax, ay] = spec.from;
  const [bx, by] = spec.to;

  const len = Math.hypot(bx - ax, by - ay) || 1e-6;
  const dx = (bx - ax) / len;
  const dy = (by - ay) / len;
  // 평면 내 수직축(+90° 회전). (d, u, +z)는 오른손 좌표계다.
  const ux = -dy;
  const uy = dx;

  const clamp = spec.clampY;
  const place = (cx: number, cy: number, perp: number, lat: number) => {
    const y = cy + uy * perp;
    return new THREE.Vector3(cx + ux * perp, clamp === undefined ? y : Math.max(y, clamp), z0 + lat);
  };

  const rings = spec.sections.map((sec) => {
    const n = sec.round ?? 3;
    const cx = ax + dx * sec.t * len;
    const cy = ay + dy * sec.t * len;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k < radial; k += 1) {
      const th = (k / radial) * Math.PI * 2;
      // k = 0 → +z, k = radial/4 → +u, k = 3·radial/4 → −u.
      // radial이 4의 배수면 최저점 정점이 정확히 −u 위에 놓여 접지 판정이 흔들리지 않는다.
      const lat = sec.side * superEllipse(Math.cos(th), n);
      const s = superEllipse(Math.sin(th), n);
      pts.push(place(cx, cy, (s >= 0 ? sec.up : sec.down) * s, lat));
    }
    return { pts, center: place(cx, cy, 0, 0) };
  });

  const pos: number[] = [];
  const push = (v: THREE.Vector3) => pos.push(v.x, v.y, v.z);
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    push(a);
    push(b);
    push(c);
  };

  for (let i = 0; i < rings.length - 1; i += 1) {
    const lo = rings[i].pts;
    const hi = rings[i + 1].pts;
    for (let k = 0; k < radial; k += 1) {
      const k2 = (k + 1) % radial;
      // 바깥을 향하는 감김. (a, d, c) / (a, c, b)
      tri(lo[k], hi[k], hi[k2]);
      tri(lo[k], hi[k2], lo[k2]);
    }
  }

  // 양 끝 마개. 단면을 0으로 줄여 뾰족하게 만드는 대신 마개를 덮는다 —
  // 발끝·주둥이 끝이 원뿔로 수렴하면 그것만으로 종이 무너진다.
  const first = rings[0];
  const last = rings[rings.length - 1];
  for (let k = 0; k < radial; k += 1) {
    const k2 = (k + 1) % radial;
    tri(first.center, first.pts[k], first.pts[k2]);
    tri(last.center, last.pts[k2], last.pts[k]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * 관절 덩어리. 팔꿈치·손목·무릎·비절처럼 "꺾이는 자리"에 실제 부피를 남긴다.
 * 이게 없으면 위팔–아래팔이 같은 굵기로 이어져 막대기 다리가 된다.
 */
export function jointSpec(
  x: number,
  y: number,
  z: number,
  r: number,
  opts: { lat?: number; lift?: number } = {},
): MassSpec {
  const lat = opts.lat ?? 0.86;
  const lift = opts.lift ?? 1;
  return {
    from: [x - r * 0.9, y],
    to: [x + r * 0.9, y],
    z,
    sections: [
      { t: 0, side: r * lat * 0.42, up: r * 0.42 * lift, down: r * 0.42, round: 2.6 },
      { t: 0.35, side: r * lat, up: r * 0.95 * lift, down: r * 0.95, round: 2.8 },
      { t: 0.68, side: r * lat, up: r * 0.95 * lift, down: r * 0.9, round: 2.8 },
      { t: 1, side: r * lat * 0.42, up: r * 0.42 * lift, down: r * 0.4, round: 2.6 },
    ],
  };
}
