'use client';

// 지피 식생 — 바닥을 빽빽하게 덮어 "잔디 평면"을 "정원"으로 만든다.
// (art direction: 물체를 평면에 얹지 말고 식생에 파묻어라. 무성함이 정원의 8할.)
//
// ★ 2026-07-22 리워크 — 왜 층을 나눴나
//   이전 버전은 포기 한 종류(곧고 뾰족한 삼각 블레이드)를 섬 전체에 균일하게 뿌렸다.
//   개수는 많은데 **전부 같은 모양·같은 키**라 잔디밭이 왁스머리처럼 균일하게 삐죽거렸다.
//   실제 잔디밭이 자연스러워 보이는 이유는 "밀도"가 아니라 **키와 형태의 층(layer)** 이다:
//     ① 뭉툭한 짧은 잔디 — 바닥 대부분. 이게 다수여야 부드럽게 읽힌다.
//     ② 뾰족한 포기 — 소수 악센트. 전부 뾰족하면 위 문제로 돌아간다.
//     ③ 긴 잔디 — **군락으로만.** 흩뿌리면 잡초, 뭉쳐 심어야 "덤불"이 된다.
//     ④ 잎무더기 관목 — 층과 층 사이 시선을 끊는 볼륨.
//   각 층은 InstancedMesh 하나(= draw call 4번)로 그린다.

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR } from '../palette';
import { ISLAND_R, islandRadius } from '../constants';
import { GARDEN } from './layout';
import {
  makeSoftTuftGeometry,
  makeSpikyTuftGeometry,
  makeTallGrassGeometry,
  makeLeafyMoundGeometry,
} from './groundGeometry';
import { mulberry32 } from './rng';

const SOFT_N = 4600; //  뭉툭한 기본 잔디 — 다수
const SPIKY_N = 900; //  뾰족 악센트 — 소수
const CLUMP_N = 300; //  잎무더기 관목 — 많으면 잔디밭이 브로콜리밭이 된다
const TAU = Math.PI * 2;

/**
 * 긴 잔디 군락의 자리. 흩뿌리지 않고 여기에만 뭉쳐 심는다.
 * 물가·섬 가장자리·집 뒤처럼 "손이 덜 가는 곳"에 두어야 설계된 정원으로 읽힌다.
 */
const TALL_PATCHES: { x: number; z: number; r: number; n: number; seed: number }[] = [
  { x: 12.6, z: -10.5, r: 2.6, n: 46, seed: 301 }, //  연못 뒤편 물가
  { x: 5.2, z: -12.0, r: 2.2, n: 34, seed: 302 }, //  연못 왼쪽 물가
  { x: -14.5, z: -4.0, r: 2.4, n: 38, seed: 303 }, //  집 옆 그늘
  { x: -13.0, z: 9.5, r: 2.8, n: 44, seed: 304 }, //  왼쪽 앞 가장자리
  { x: 14.0, z: 8.0, r: 2.3, n: 34, seed: 305 }, //  오른쪽 앞 가장자리
  { x: -2.0, z: -15.0, r: 2.5, n: 38, seed: 306 }, //  뒤쪽 가장자리
  { x: 15.5, z: 0.5, r: 2.0, n: 28, seed: 307 }, //  오른쪽 옆구리
];

// 식생을 심지 않는 구역(연못 물속·집 바닥·티테이블 발치).
const EXCLUDE: { x: number; z: number; r: number }[] = [
  { x: GARDEN.pond.pos[0], z: GARDEN.pond.pos[1], r: 6.4 },
  { x: GARDEN.house.pos[0], z: GARDEN.house.pos[1], r: 2.3 },
  { x: GARDEN.teaTable.pos[0], z: GARDEN.teaTable.pos[1], r: 1.1 },
];

const blocked = (x: number, z: number) =>
  EXCLUDE.some((e) => (x - e.x) ** 2 + (z - e.z) ** 2 < e.r * e.r);

type Pt = { x: number; z: number; a: number; s: number; c: number };

/**
 * 섬 안(가장자리 안쪽)에 식생 자리를 뿌린다.
 * ★ 반경은 반드시 **그 각도의 실제 섬 반경**(islandRadius) 기준으로 잡는다.
 *   예전엔 상수 ISLAND_R 기준으로 뿌리고 나서 islandRadius로 잘라냈는데, 섬은 각도마다
 *   반경이 다르고 최대 1.145배까지 불룩하다 → 불룩한 쪽에 식생이 하나도 없는
 *   **민 초록 띠**가 테두리처럼 남았다(실측 2026-07-22).
 */
function scatter(n: number, seed: number, coverage: number): Pt[] {
  const rand = mulberry32(seed);
  const out: Pt[] = [];
  let tries = 0;
  while (out.length < n && tries < n * 6) {
    tries++;
    const a = rand() * TAU;
    const rr = Math.sqrt(rand()) * islandRadius(a) * 0.965 * coverage;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    if (blocked(x, z)) continue;
    out.push({ x, z, a: rand() * TAU, s: 0.7 + rand() * 0.7, c: rand() });
  }
  return out;
}

/** 한 점 주변에 뭉쳐 뿌린다(군락). 중심이 빽빽하고 가장자리로 갈수록 성기다. */
function cluster(p: (typeof TALL_PATCHES)[number]): Pt[] {
  const rand = mulberry32(p.seed);
  const out: Pt[] = [];
  for (let i = 0; i < p.n; i++) {
    const a = rand() * TAU;
    const rr = p.r * rand() ** 1.5; //  ^1.5 = 중심 쪽으로 몰림
    const x = p.x + Math.cos(a) * rr;
    const z = p.z + Math.sin(a) * rr;
    const ang = Math.atan2(z, x);
    if (Math.hypot(x, z) > islandRadius(ang) * 0.97) continue;
    if (blocked(x, z)) continue;
    // 군락 가장자리로 갈수록 작아져야 덤불이 땅에 녹아든다
    const edge = 1 - (rr / p.r) * 0.45;
    out.push({ x, z, a: rand() * TAU, s: (0.72 + rand() * 0.5) * edge, c: rand() });
  }
  return out;
}

export default function GroundCover() {
  const parts = useMemo(() => {
    const dummy = new THREE.Object3D();
    const _c = new THREE.Color();

    // 잔디 3층이 재질을 공유한다 — 같은 빛을 받아야 한 밭으로 보인다.
    // ⚠ flatShading은 반드시 꺼 둔다 — groundGeometry의 "법선 위로 눕히기"가 무효화된다(그 파일 ★★ 주석).
    const grassMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    /** 포기 층 하나를 만든다. tints = 포기별 초록 색조(밑동 명도와 곱해진다). */
    const buildTufts = (
      geo: THREE.BufferGeometry,
      pts: Pt[],
      tints: string[],
      scale: number,
      lean: number,
    ) => {
      const mesh = new THREE.InstancedMesh(geo, grassMat, pts.length);
      pts.forEach((p, i) => {
        dummy.position.set(p.x, 0, p.z);
        // x·z축 기울기 = 포기가 바람에 눕는 변주. 길수록 더 눕는다.
        dummy.rotation.set((p.c - 0.5) * lean, p.a, (0.5 - p.s) * lean);
        const s = p.s * scale;
        dummy.scale.set(s, s * (0.8 + p.c * 0.6), s); //  키만 따로 흔들어 길이 편차를 키운다
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        _c.set(tints[(p.c * tints.length) | 0]);
        _c.offsetHSL(0, 0, (p.s - 1) * 0.045); //  포기마다 아주 옅은 명암 변주
        mesh.setColorAt(i, _c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      return mesh;
    };

    // ── ① 뭉툭한 기본 잔디 ────────────────────────────────────
    // ★ 색조는 바닥(COLOR.grass)보다 **밝은 쪽**으로 잡는다.
    //   서 있는 블레이드는 햇빛을 얕게 받아 이미 어둡게 찍히므로, 팔레트에서까지 짙은 색을
    //   섞으면 잔디가 바닥보다 어두워져 "잔디밭"이 아니라 "얼룩"이 된다.
    const soft = buildTufts(
      makeSoftTuftGeometry(),
      scatter(SOFT_N, 4242, 1.0),
      ['#C6DE8C', COLOR.grass, '#BCD681', COLOR.grass, '#B0CC74'],
      1.15,
      0.34,
    );

    // ── ② 뾰족 악센트 ────────────────────────────────────────
    const spiky = buildTufts(
      makeSpikyTuftGeometry(),
      scatter(SPIKY_N, 8181, 1.0),
      ['#C6DE8C', COLOR.grass, '#B0CC74'],
      1.0,
      0.26,
    );

    // ── ③ 긴 잔디 군락 ───────────────────────────────────────
    // 기본 잔디보다 한 톤만 짙게 — 뒤로 물러나되 어두운 덩어리가 되면 안 된다.
    const tallPts = TALL_PATCHES.flatMap(cluster);
    const tall = buildTufts(
      makeTallGrassGeometry(),
      tallPts,
      [COLOR.grass, COLOR.grassEdge, '#A8C273', '#BCD681'],
      1.0,
      0.5,
    );

    // ── ④ 잎무더기 관목 ──────────────────────────────────────
    const clumpMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: false, //  위와 같은 이유
    });
    // 관목은 잔디보다 짙어야 볼륨이 생기지만 leafDeep(#4E7A42)까지 가면 검은 브로콜리가 된다.
    const clumpTints = [COLOR.leaf, COLOR.grassEdge, COLOR.leaf, '#A2C06B'];
    const cPts = scatter(CLUMP_N, 909, 0.97);
    const clumps = new THREE.InstancedMesh(makeLeafyMoundGeometry(), clumpMat, cPts.length);
    cPts.forEach((p, i) => {
      dummy.position.set(p.x, 0.02, p.z);
      dummy.rotation.set(0, p.a, 0);
      dummy.scale.set(p.s * 1.2, p.s * (0.85 + p.c * 0.6), p.s * 1.2);
      dummy.updateMatrix();
      clumps.setMatrixAt(i, dummy.matrix);
      clumps.setColorAt(i, _c.set(clumpTints[(p.c * clumpTints.length) | 0]));
    });
    clumps.instanceMatrix.needsUpdate = true;
    if (clumps.instanceColor) clumps.instanceColor.needsUpdate = true;
    clumps.receiveShadow = true;

    return { soft, spiky, tall, clumps };
  }, []);

  return (
    <group>
      <primitive object={parts.clumps} />
      <primitive object={parts.soft} />
      <primitive object={parts.spiky} />
      <primitive object={parts.tall} />
    </group>
  );
}
