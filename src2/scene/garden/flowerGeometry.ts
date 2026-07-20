// 꽃 파트별 로우폴리 지오메트리 — 꽃잎·잎·수술.
// 레퍼런스(데스크탑 저폴리 꽃 이미지) 기준:
//   ① 꽃 1송이 = 원뿔 1개가 아니라 "꽃잎 여러 장"으로 만든다.
//   ② 각 파트는 flatShading으로 각진 면(facet)이 살아야 한다 — 저폴리 특유의 결.
//   ③ 꽃잎/잎은 "밑동이 짙고 끝이 밝은" 길이방향 그라데이션을 vertex color로 구워넣는다.
//      → InstancedMesh의 per-instance color(꽃 색)와 곱해져도 그라데이션이 유지된다.
//         최종색 = vertexColor(회색 0.55~1.0) × instanceColor(꽃 색). 회색이 1.0 미만이라 밑동만 어두워진다.
//
// 로컬 좌표 규약: 파트는 +Z 방향으로 자라고, 폭은 X, 살짝 오므린 볼륨은 +Y.

import * as THREE from 'three';

/** positions/indices + (z 기준 회색 그라데이션) color 속성을 가진 BufferGeometry를 만든다. */
function buildLeafLike(
  verts: number[][],
  faces: number[][],
  zMax: number,
  darkAtBase: number, //  밑동(z=0) 회색 — 낮을수록 짙다
  lightAtTip: number, //  끝(z=zMax) 회색
): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(verts.length * 3);
  const col = new Float32Array(verts.length * 3);
  for (let i = 0; i < verts.length; i++) {
    const [x, y, z] = verts[i];
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    const t = THREE.MathUtils.clamp(z / zMax, 0, 1);
    const gray = THREE.MathUtils.lerp(darkAtBase, lightAtTip, t);
    col[i * 3] = gray;
    col[i * 3 + 1] = gray;
    col[i * 3 + 2] = gray;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(faces.flat());
  g.computeVertexNormals();
  return g;
}

/**
 * 꽃잎 1장 — 밑동에서 뻗어 살짝 오므린(cup) 스페이드 형태. 가운데 잎맥(midrib)이 솟아 각이 산다.
 * 스파인(중앙선): S0(밑동)·S1(솟은 잎맥)·S2(끝). 좌우로 가장자리 점 2쌍.
 */
export function makePetalGeometry(): THREE.BufferGeometry {
  const V = [
    [0, 0, 0], //  0 S0 밑동
    [0, 0.09, 0.5], //  1 S1 솟은 잎맥
    [0, 0.04, 1.0], //  2 S2 끝
    [-0.34, 0.03, 0.3], //  3 EL1 (넓게 — 얼굴이 둥글게 보이도록)
    [-0.36, 0.05, 0.66], //  4 EL2
    [0.34, 0.03, 0.3], //  5 ER1
    [0.36, 0.05, 0.66], //  6 ER2
  ];
  const F = [
    [0, 3, 1],
    [3, 4, 1],
    [4, 2, 1], //  좌면
    [0, 1, 5],
    [5, 1, 6],
    [6, 1, 2], //  우면
  ];
  //  밑동을 너무 어둡게 하면 꽃잎 밑이 탁해진다 → 0.82로 살짝만 눌러 볼륨감만 준다.
  return buildLeafLike(V, F, 1.0, 0.82, 1.0);
}

/**
 * 밑동에 까는 넓은 잎 — 꽃잎보다 크고 길다. 잎맥이 뚜렷해 각이 살고, 끝이 살짝 처진다.
 * 레퍼런스의 "풍성함"은 대부분 이 넓은 잎에서 나온다(지금 코드엔 잎이 아예 없어 앙상함).
 */
export function makeLeafGeometry(): THREE.BufferGeometry {
  const V = [
    [0, 0, 0], //  0 S0
    [0, 0.1, 0.5], //  1 S1
    [0, 0.16, 1.0], //  2 S2
    [0, 0.08, 1.5], //  3 S3 끝(살짝 처짐)
    [-0.34, 0.04, 0.35], //  4 EL1
    [-0.4, 0.09, 0.85], //  5 EL2
    [-0.22, 0.1, 1.25], //  6 EL3
    [0.34, 0.04, 0.35], //  7 ER1
    [0.4, 0.09, 0.85], //  8 ER2
    [0.22, 0.1, 1.25], //  9 ER3
  ];
  const F = [
    [0, 4, 1],
    [4, 5, 1],
    [5, 2, 1],
    [5, 6, 2],
    [6, 3, 2], //  좌면
    [0, 1, 7],
    [7, 1, 8],
    [8, 1, 2],
    [8, 2, 9],
    [9, 2, 3], //  우면
  ];
  return buildLeafLike(V, F, 1.5, 0.5, 1.0);
}

/** 꽃 수술(중심) — 낮은 각진 돔. 꽃부리 한가운데 노란 포인트. */
export function makeCenterGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(0.5, 7, 4);
  g.scale(1, 0.5, 1); //  납작한 돔
  return g;
}

// ── 종(種)별 파트 ─────────────────────────────────────────────
// 위 makePetal/Leaf/Center는 "앵초(primrose)"의 부품. 아래는 다른 종의 부품이다.
// 꽃 1종을 색만 바꿔 뿌리면 대충 티가 난다(조아진 지적) → 종마다 실루엣 자체를 다르게.

/**
 * 임의 지오메트리에 z 기준 회색 그라데이션(밑동 짙고 끝 밝은)을 구워 넣는다.
 * ConeGeometry 같은 완제 지오메트리에도 buildLeafLike와 같은 결을 주기 위한 헬퍼.
 */
function bakeZGradient(
  g: THREE.BufferGeometry,
  zMin: number,
  zMax: number,
  darkAtMin: number,
  lightAtMax: number,
): THREE.BufferGeometry {
  const pos = g.getAttribute('position');
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getZ(i) - zMin) / (zMax - zMin), 0, 1);
    const gray = THREE.MathUtils.lerp(darkAtMin, lightAtMax, t);
    col[i * 3] = gray;
    col[i * 3 + 1] = gray;
    col[i * 3 + 2] = gray;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** 데이지 꽃잎 — 가늘고 긴 스트랩. 가운데 얕은 키(keel)가 솟아 각이 살고, 끝이 둥글게 모인다. */
export function makeStrapPetalGeometry(): THREE.BufferGeometry {
  const V = [
    [0, 0, 0],
    [0, 0.03, 0.55], //  솟은 키
    [0, 0.015, 1.0], //  끝
    [-0.12, 0.01, 0.3],
    [-0.095, 0.02, 0.74],
    [0.12, 0.01, 0.3],
    [0.095, 0.02, 0.74],
  ];
  const F = [
    [0, 3, 1],
    [3, 4, 1],
    [4, 2, 1],
    [0, 1, 5],
    [5, 1, 6],
    [6, 1, 2],
  ];
  //  데이지 꽃잎은 거의 순백 — 밑동만 아주 살짝 눌러 볼륨감만.
  return buildLeafLike(V, F, 1.0, 0.9, 1.0);
}

/** 가늘고 곧은 잎(블레이드) — 데이지·알리움 밑동의 풀잎. 넓은 잎보다 좁고 곧게 선다. */
export function makeBladeLeafGeometry(): THREE.BufferGeometry {
  const V = [
    [0, 0, 0],
    [0, 0.05, 0.5],
    [0, 0.03, 1.0],
    [-0.08, 0.02, 0.42],
    [-0.05, 0.04, 0.82],
    [0.08, 0.02, 0.42],
    [0.05, 0.04, 0.82],
  ];
  const F = [
    [0, 3, 1],
    [3, 4, 1],
    [4, 2, 1],
    [0, 1, 5],
    [5, 1, 6],
    [6, 1, 2],
  ];
  return buildLeafLike(V, F, 1.0, 0.46, 1.0);
}

/**
 * 폭스글러브(디기탈리스) 벨 꽃 한 송이 — 목(throat)에서 입(mouth)으로 벌어진 저폴리 트럼펫.
 * 다른 파트와 로컬 규약을 맞춘다: 목이 원점, 입이 +Z로 열린다(목 짙고 입 밝게).
 * openEnded라 벨 안쪽이 보인다 → 재질은 DoubleSide.
 */
export function makeBellGeometry(): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(0.5, 1.0, 6, 1, true);
  g.translate(0, -0.5, 0); //  꼭지(목)를 원점으로
  g.rotateX(-Math.PI / 2); //  입이 +Z로 열리도록
  return bakeZGradient(g, 0, 1.0, 0.5, 1.0);
}

/** 알리움/램슨 꽃차례 — 작은 별꽃이 뭉친 공. 저폴리 페싯 구(球)로 단순화한다. */
export function makePomGeometry(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(0.5, 0);
  g.scale(1, 0.92, 1); //  살짝만 눌러 자연스러운 공
  return g;
}
