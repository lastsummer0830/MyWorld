// 나무 지오메트리 — 줄기·가지(테이퍼 튜브)와 잎덩이(저폴리 블롭).
//
// 외부 모델을 쓰지 않으므로 줄기도 절차 생성한다. 실린더를 그냥 세우면 "전봇대에 브로콜리"가 되므로,
// 줄기는 **밑동이 굵고 위로 갈수록 가늘어지며 살짝 휘는 튜브**로 만들고 가지를 뻗게 한다.
//
// 잎은 정20면체를 눌러 만든 블롭 여러 개를 겹쳐 수관(canopy)을 만든다.
// 블롭 하나짜리 구는 "막대사탕"이 되고, 3~7개를 크기 다르게 겹쳐야 나무 실루엣이 된다.

import * as THREE from 'three';

const hash = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 테이퍼 튜브(줄기·가지) 한 마디를 삼각형 배열에 밀어 넣는다. */
function pushLimb(
  pos: number[],
  col: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  r0: number,
  r1: number,
  sides: number,
  shadeA: number,
  shadeB: number,
) {
  const dir = new THREE.Vector3().subVectors(b, a).normalize();
  // 튜브 단면의 두 축 — 진행방향과 수직인 아무 축이나 하나 잡고 외적으로 나머지를 만든다
  const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(up, dir).normalize();
  const v = new THREE.Vector3().crossVectors(dir, u).normalize();

  const ringA: THREE.Vector3[] = [];
  const ringB: THREE.Vector3[] = [];
  for (let i = 0; i < sides; i++) {
    const t = (i / sides) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    ringA.push(
      new THREE.Vector3().copy(a).addScaledVector(u, c * r0).addScaledVector(v, s * r0),
    );
    ringB.push(
      new THREE.Vector3().copy(b).addScaledVector(u, c * r1).addScaledVector(v, s * r1),
    );
  }

  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    const p = [ringA[i], ringA[j], ringB[j], ringB[i]];
    // 사각형 = 삼각형 2장
    pos.push(p[0].x, p[0].y, p[0].z, p[1].x, p[1].y, p[1].z, p[2].x, p[2].y, p[2].z);
    col.push(shadeA, shadeA, shadeA, shadeA, shadeA, shadeA, shadeB, shadeB, shadeB);
    pos.push(p[0].x, p[0].y, p[0].z, p[2].x, p[2].y, p[2].z, p[3].x, p[3].y, p[3].z);
    col.push(shadeA, shadeA, shadeA, shadeB, shadeB, shadeB, shadeB, shadeB, shadeB);
  }
}

export type Branch = {
  /** 가지가 줄기의 어느 높이에서 갈라지는가 (0~1) */
  at: number;
  /** 가지가 뻗는 방향(수평 각도, rad) */
  yaw: number;
  /** 수평에서 얼마나 들리는가 (0=수평, 1=수직) */
  rise: number;
  /** 가지 길이 */
  len: number;
  /** 가지 끝(잎덩이가 붙는 자리)을 돌려받기 위한 표시 */
  tip?: THREE.Vector3;
};

export type TrunkSpec = {
  /** 줄기 높이 */
  h: number;
  /** 밑동 반지름 */
  r: number;
  /** 줄기가 휘는 정도 */
  lean?: number;
  /** 휘는 방향 */
  leanYaw?: number;
  branches: Branch[];
  /** 단면 각 수 — 6이면 저폴리 각이 살아난다 */
  sides?: number;
};

/**
 * 줄기 + 가지를 한 덩이 지오메트리로 만들고, 가지 끝 좌표(잎덩이를 붙일 자리)를 함께 돌려준다.
 * 명암은 vertexColor로 구워 넣는다(밑동 어둡게 → 위로 밝게). 나무마다 재질을 새로 만들지 않기 위해서다.
 */
export function makeTrunkGeometry(spec: TrunkSpec) {
  const { h, r, lean = 0.12, leanYaw = 0.7, branches, sides = 6 } = spec;
  const pos: number[] = [];
  const col: number[] = [];

  const lx = Math.cos(leanYaw) * lean;
  const lz = Math.sin(leanYaw) * lean;
  /** 줄기 중심선 — 높이 t(0~1)에서의 좌표. t^2로 휘어 밑동은 곧고 위가 기운다. */
  const spine = (t: number) => new THREE.Vector3(lx * h * t * t, h * t, lz * h * t * t);
  /** 높이 t에서의 줄기 반지름 — 밑동이 확 퍼지는 뿌리목(root flare)을 만든다. */
  const radius = (t: number) => r * (0.35 + 0.65 * (1 - t) ** 1.6) * (t < 0.08 ? 1.5 - t * 6 : 1);

  const SEG = 5;
  for (let i = 0; i < SEG; i++) {
    const t0 = i / SEG;
    const t1 = (i + 1) / SEG;
    pushLimb(
      pos,
      col,
      spine(t0),
      spine(t1),
      radius(t0),
      radius(t1),
      sides,
      // ★ 명암 램프를 0.6대에서 시작하면 줄기가 거의 검은 갈색이 된다 — 파스텔 씬에 구멍이 뚫린 것처럼
      //   보인다(팔레트 §"검정은 쓰지 않는다"). 0.78부터 시작해야 따뜻한 회갈색으로 읽힌다.
      0.78 + t0 * 0.2,
      0.78 + t1 * 0.2,
    );
  }

  const tips: THREE.Vector3[] = [];
  branches.forEach((b, i) => {
    const from = spine(b.at);
    const dir = new THREE.Vector3(
      Math.cos(b.yaw) * (1 - b.rise),
      b.rise,
      Math.sin(b.yaw) * (1 - b.rise),
    ).normalize();
    // 가지도 두 마디로 꺾어 뻗는다 — 직선 막대기면 옷걸이처럼 보인다
    const mid = new THREE.Vector3().copy(from).addScaledVector(dir, b.len * 0.55);
    mid.y += b.len * 0.1;
    const dir2 = new THREE.Vector3()
      .copy(dir)
      .lerp(new THREE.Vector3(0, 1, 0), 0.35 + hash(i, 3) * 0.25)
      .normalize();
    const tip = new THREE.Vector3().copy(mid).addScaledVector(dir2, b.len * 0.5);

    const br = radius(b.at) * 0.62;
    pushLimb(pos, col, from, mid, br, br * 0.62, sides, 0.86, 0.92);
    pushLimb(pos, col, mid, tip, br * 0.62, br * 0.3, sides, 0.92, 1);
    tips.push(tip);
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return { geo, tips };
}

/**
 * 잎덩이 블롭 — 정20면체를 찌그러뜨린 저폴리 덩어리.
 * 정구(detail 2 이상)로 만들면 매끈해져서 "플라스틱 공"이 된다. detail 0~1의 각진 면이 이 화풍의 언어다.
 */
export function makeBlobGeometry(detail = 1) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  // 꼭짓점을 조금씩 밀어 완벽한 구를 깬다 — 자연물에 대칭이 남아 있으면 CG 티가 난다
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // 흔들림을 세게 주면 잎덩이가 아니라 **바위**가 된다. 0.2 안쪽으로 유지할 것(실측 2026-07-22).
    const n = 0.9 + hash(Math.round(v.x * 97 + v.y * 57 + v.z * 31), 5) * 0.2;
    v.multiplyScalar(n);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * 레몬 열매 — 구를 늘이고 양 끝에 젖꼭지(nipple)를 세운다.
 * 레퍼런스 사진(요소/b9a4b0f)의 레몬은 완전한 타원이 아니라 끝이 뾰족하게 튀어나온 형태다.
 * 이 돌기가 없으면 그냥 노란 구슬 = 방울토마토로 읽힌다.
 */
export function makeLemonGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.y *= 1.25; //  세로로 늘려 레몬 비율
    const tip = Math.max(0, Math.abs(v.y) - 0.95); //  양 끝만 골라
    v.y += Math.sign(v.y) * tip * 0.8; //  끝을 살짝 뽑는다 (세게 뽑으면 아몬드가 된다)
    p.setXYZ(i, v.x, v.y, v.z);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
