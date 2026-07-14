'use client';

// 정원 섬 — 이 씬의 주인공.
// 구성: 잔디 뚜껑(위 모서리를 굴린 Extrude) + 흙 단면 + 아래로 뾰족한 바위 밑동.
//
// ★ 세 층이 모두 constants.ts의 islandRadius(각도) 하나를 읽는다.
//   각 층이 제 나름의 윤곽을 만들면 가장자리가 미세하게 어긋나 틈이 보인다.
//
// ★ 왜 정사각형이 아닌가: 네모 판은 "떠 있는 블록"으로 읽히지 "섬"으로 읽히지 않는다.
//   불규칙한 원형 + 아래로 좁아지는 밑동이라야 뜯어낸 땅덩이가 된다.

import { useMemo } from 'react';
import * as THREE from 'three';
import {
  BASE_H,
  GRASS_BEVEL,
  GRASS_H,
  ISLAND_SEG,
  SLAB_H,
  islandRadius,
} from './constants';
import { MAT } from './materials';

const PI2 = Math.PI * 2;

/** 섬의 윤곽 — Extrude가 밀어낼 단면. */
function islandShape() {
  const s = new THREE.Shape();
  for (let i = 0; i <= ISLAND_SEG; i++) {
    const a = (i / ISLAND_SEG) * PI2;
    const r = islandRadius(a);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/**
 * Extrude는 XY 평면에 만들어져 +Z로 밀린다. X축으로 +90° 돌리면
 *   shape의 (x, y) → 월드 (x, 0, y)  ← 각도가 그대로 보존된다(밑동과 윤곽을 맞추기 위해 중요)
 *   밀어낸 깊이(+Z) → 월드 -Y        ← 아래로 자란다
 * 회전은 감김 방향을 뒤집지 않으므로 법선은 그대로 바깥을 향한다.
 */
function slab(depth: number, bevel = 0) {
  const geo = new THREE.ExtrudeGeometry(islandShape(), {
    depth: depth - bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * 바위 밑동 — 섬의 윤곽에서 시작해 아래로 좁아지며 한 점으로 모인다.
 *
 * 링을 여러 단으로 쌓고 각 단의 반경에 굴곡을 준다. 굴곡은 맨 위(p=0)에서 0이어야 한다 —
 * 안 그러면 흙 단면과 밑동의 가장자리가 어긋나 그 틈으로 하늘이 비친다.
 */
function baseGeometry() {
  const RINGS = 7; //  단 수. 많으면 매끈해져 바위 느낌이 죽는다.
  const TOP_Y = -(GRASS_H + SLAB_H);

  const pos: number[] = [];
  const idx: number[] = [];

  for (let k = 0; k < RINGS; k++) {
    const p = k / RINGS; //  0(섬 바닥) → 1에 가까울수록 아래
    const shrink = Math.pow(1 - p, 0.72); //  아래로 갈수록 좁아진다
    const y = TOP_Y - BASE_H * Math.pow(p, 1.25); //  아래로 갈수록 단 간격이 벌어져 뾰족해진다
    const bump = Math.min(1, p * 3); //  맨 위에서는 굴곡 0 → 흙 단면과 정확히 이어진다

    for (let i = 0; i < ISLAND_SEG; i++) {
      const a = (i / ISLAND_SEG) * PI2;
      const wobble = 1 + bump * (0.085 * Math.sin(a * 4 + p * 7) + 0.05 * Math.sin(a * 6 - p * 11));
      const r = islandRadius(a) * shrink * wobble;
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
    }
  }

  // 맨 아래 꼭짓점.
  const apex = pos.length / 3;
  pos.push(0, TOP_Y - BASE_H, 0);

  for (let k = 0; k < RINGS - 1; k++) {
    for (let i = 0; i < ISLAND_SEG; i++) {
      const j = (i + 1) % ISLAND_SEG;
      const a = k * ISLAND_SEG + i;
      const b = k * ISLAND_SEG + j;
      const c = (k + 1) * ISLAND_SEG + i;
      const d = (k + 1) * ISLAND_SEG + j;
      idx.push(a, b, c, b, d, c); //  바깥을 향하는 감김 방향
    }
  }

  // 마지막 링 → 꼭짓점으로 부채꼴.
  const last = (RINGS - 1) * ISLAND_SEG;
  for (let i = 0; i < ISLAND_SEG; i++) {
    const j = (i + 1) % ISLAND_SEG;
    idx.push(last + i, last + j, apex);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export default function Island() {
  const grassGeo = useMemo(() => slab(GRASS_H, GRASS_BEVEL), []);
  const soilGeo = useMemo(() => slab(SLAB_H), []);
  const baseGeo = useMemo(() => baseGeometry(), []);

  return (
    <group>
      {/* 잔디 — 윗면이 y=0. 모든 오브젝트는 이 면 위에 놓인다.
          bevel 때문에 잔디가 흙보다 아주 조금 넓다 → 처마처럼 살짝 덮여 가장자리가 부드러워진다. */}
      <mesh
        geometry={grassGeo}
        position={[0, -GRASS_BEVEL, 0]}
        // 밤에 잔디가 아주 옅게 자체 발광한다 — 섬이 어둠에 완전히 먹히지 않게 붙잡아 주는 장치.
        // 세게 주면 잔디만 형광색으로 떠서 "밤"이 아니라 "초록 조명"이 된다.
        material={MAT('foliage', 'grass', { nightGlow: 0.07 })}
        receiveShadow
        castShadow
      />

      {/* 흙 단면 — 층이 보여야 "도려내 온 땅"이 된다. */}
      <mesh
        geometry={soilGeo}
        position={[0, -GRASS_H, 0]}
        material={MAT('matte', 'soil')}
        receiveShadow
        castShadow
      />

      {/* 바위 밑동 — 그림자는 받지도 만들지도 않는다. 어차피 섬 아래라 보이지 않고 비용만 든다. */}
      <mesh geometry={baseGeo} material={MAT('rock', 'rock')} />
    </group>
  );
}
