'use client';

// 지피 식생 — 바닥을 빽빽하게 덮어 "잔디 평면"을 "정원"으로 만든다.
// (art direction: 물체를 평면에 얹지 말고 식생에 파묻어라. 무성함이 정원의 8할.)
//   ① 풀 포기 수천 개 — 색조·크기·회전 변주로 자연스러운 잔디밭
//   ② 지피식물 클럼프 수백 개 — 풀 사이를 메우는 낮은 잎무더기
// 개수가 많아 각 층을 InstancedMesh 한 번으로 그린다.

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR } from '../palette';
import { ISLAND_R, islandRadius } from '../constants';
import { GARDEN } from './layout';
import { makeGrassTuftGeometry, makeClumpGeometry } from './groundGeometry';
import { mulberry32 } from './rng';

const GRASS_N = 5200;
const CLUMP_N = 640;
const TAU = Math.PI * 2;

// 식생을 심지 않는 구역(연못 물속·집 바닥·티테이블 발치).
const EXCLUDE: { x: number; z: number; r: number }[] = [
  { x: GARDEN.pond.pos[0], z: GARDEN.pond.pos[1], r: 6.4 },
  { x: GARDEN.house.pos[0], z: GARDEN.house.pos[1], r: 2.3 },
  { x: GARDEN.teaTable.pos[0], z: GARDEN.teaTable.pos[1], r: 1.1 },
];

const blocked = (x: number, z: number) =>
  EXCLUDE.some((e) => (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r);

/** 섬 안(가장자리 안쪽)에 식생 자리를 뿌린다. */
function scatter(n: number, seed: number, coverage: number) {
  const rand = mulberry32(seed);
  const out: { x: number; z: number; a: number; s: number; c: number }[] = [];
  let tries = 0;
  while (out.length < n && tries < n * 6) {
    tries++;
    const a = rand() * TAU;
    const rr = Math.sqrt(rand()) * ISLAND_R * coverage;
    if (rr > islandRadius(a) * 0.96) continue; //  가장자리 밖으로 삐지지 않게
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    if (blocked(x, z)) continue;
    out.push({ x, z, a: rand() * TAU, s: 0.7 + rand() * 0.7, c: rand() });
  }
  return out;
}

export default function GroundCover() {
  const parts = useMemo(() => {
    const dummy = new THREE.Object3D();
    const _c = new THREE.Color();

    // ── 풀 포기 ──────────────────────────────────────────────
    const grassMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    // 포기별 초록 색조(밑동 명도와 곱해진다). 노란 초록~짙은 초록까지 섞어 얼룩덜룩한 잔디.
    const grassTints = [COLOR.grass, COLOR.grass, COLOR.grassEdge, COLOR.leaf, '#B9CE7E'];
    const gPts = scatter(GRASS_N, 4242, 0.98);
    const grass = new THREE.InstancedMesh(makeGrassTuftGeometry(), grassMat, gPts.length);
    gPts.forEach((p, i) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set((p.c - 0.5) * 0.3, p.a, (p.c - 0.5) * 0.3); //  살짝 눕는 변주
      const gs = p.s * 1.15; //  포기를 조금 크게 — 맨 바닥 틈을 메운다
      dummy.scale.set(gs, gs * (0.85 + p.c * 0.5), gs);
      dummy.updateMatrix();
      grass.setMatrixAt(i, dummy.matrix);
      _c.set(grassTints[(p.c * grassTints.length) | 0]);
      _c.offsetHSL(0, 0, (p.s - 1) * 0.04); //  포기마다 아주 옅은 명암 변주
      grass.setColorAt(i, _c);
    });
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;

    // ── 지피식물 클럼프 ──────────────────────────────────────
    const clumpMat = new THREE.MeshStandardMaterial({
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
    });
    const clumpTints = [COLOR.leaf, COLOR.leafDark, COLOR.grassEdge, COLOR.leafDeep];
    const cPts = scatter(CLUMP_N, 909, 0.95);
    const clumps = new THREE.InstancedMesh(makeClumpGeometry(), clumpMat, cPts.length);
    cPts.forEach((p, i) => {
      dummy.position.set(p.x, 0.05, p.z);
      dummy.rotation.set(0, p.a, 0);
      dummy.scale.set(p.s * 1.15, p.s * (0.95 + p.c * 0.7), p.s * 1.15); //  덜 납작하게 = 잎무더기 느낌
      dummy.updateMatrix();
      clumps.setMatrixAt(i, dummy.matrix);
      clumps.setColorAt(i, _c.set(clumpTints[(p.c * clumpTints.length) | 0]));
    });
    clumps.instanceMatrix.needsUpdate = true;
    if (clumps.instanceColor) clumps.instanceColor.needsUpdate = true;
    clumps.receiveShadow = true;

    return { grass, clumps };
  }, []);

  return (
    <group>
      <primitive object={parts.clumps} />
      <primitive object={parts.grass} />
    </group>
  );
}
