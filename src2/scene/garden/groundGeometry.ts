// 지피 식생 지오메트리 — 바닥을 덮는 풀 포기 한 개.
// 삼각 블레이드(1장=삼각형) 여러 장을 부채꼴로 세운 저폴리 포기.
// 세로 명도 그라데이션(밑동 0.5 → 팁 1.0)을 vertexColor에 구워 두고,
// 실제 초록 색조는 InstancedMesh의 instanceColor로 포기마다 다르게 곱한다.
//   → 밑동이 짙고 끝이 밝은 풀 + 포기별 색 변주를 인스턴싱 한 번으로 얻는다.

import * as THREE from 'three';

const TAU = Math.PI * 2;

/** 풀 포기 하나. blades=블레이드 수, h=높이, w=밑동 폭. */
export function makeGrassTuftGeometry(blades = 5, h = 0.42, w = 0.085) {
  const pos: number[] = [];
  const col: number[] = [];

  for (let j = 0; j < blades; j++) {
    const yaw = (j / blades) * TAU + (j % 2) * 0.6; //  블레이드를 방사형으로 벌린다
    const dx = Math.cos(yaw);
    const dz = Math.sin(yaw);
    const px = -dz; //  yaw에 수직(밑동 폭 방향)
    const pz = dx;
    const hw = w * (0.85 + (j % 3) * 0.14);
    const bend = 0.16 + (j % 2) * 0.13; //  끝이 바깥으로 살짝 휜다
    const bh = h * (0.72 + (j % 3) * 0.16); //  블레이드마다 키 변주

    // 밑동 두 점 + 끝점(삼각형 1장)
    pos.push(px * hw, 0, pz * hw);
    pos.push(-px * hw, 0, -pz * hw);
    pos.push(dx * bend, bh, dz * bend);

    // 명도 ramp: 밑동 어둡게, 끝 밝게. (instanceColor가 실제 초록을 입힌다)
    col.push(0.48, 0.48, 0.48, 0.48, 0.48, 0.48, 1, 1, 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/** 지피식물 클럼프(클로버·낮은 잎무더기) — 납작한 저폴리 잎덩이. */
export function makeClumpGeometry() {
  const geo = new THREE.IcosahedronGeometry(0.24, 0);
  geo.scale(1, 0.42, 1); //  납작하게 눌러 바닥에 붙은 잎무더기로
  return geo;
}
