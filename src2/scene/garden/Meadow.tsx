'use client';

// 꽃밭 + 잔디 포기 — 개수가 많아 전부 instancedMesh로 그린다(성능 스킬 §7).
// 꽃 1송이를 낱개로 그리면 draw call이 100번 나간다. 여기선 파트별로 묶어 각 1번:
//   꽃잎(전체 꽃×5) · 수술 · 줄기 · 밑동잎(전체 꽃×3) · 잔디포기.
// 색은 per-instance color로 심는다. 꽃잎/잎은 지오메트리에 구워둔 길이방향 그라데이션과 곱해진다.

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR, type ColorKey } from '../palette';
import { FLOWER_BEDS, GRASS_TUFTS } from './layout';
import { makeCenterGeometry, makeLeafGeometry, makePetalGeometry } from './flowerGeometry';
import { mulberry32, scatterDisc } from './rng';

const PETAL_COLORS: ColorKey[] = ['petalPink', 'petalYellow', 'petalWhite', 'petalLav', 'petalCoral', 'rose'];
const PETALS_PER_FLOWER = 5;
const LEAVES_PER_FLOWER = 3;

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qYaw = new THREE.Quaternion();
const _qPitch = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _e = new THREE.Euler();
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;

export default function Meadow() {
  const parts = useMemo(() => {
    // 모든 꽃밭의 꽃을 한 배열로 모은다.
    type Flower = { x: number; z: number; stemH: number; headR: number; yaw: number; color: ColorKey };
    const flowers: Flower[] = [];
    for (const bed of FLOWER_BEDS) {
      const pts = scatterDisc(bed.r, bed.n, bed.seed);
      const rand = mulberry32(bed.seed * 3 + 1);
      for (const pt of pts) {
        flowers.push({
          x: bed.pos[0] + pt.x,
          z: bed.pos[1] + pt.z,
          stemH: 0.12 + rand() * 0.16, //  줄기 짧게 — 길면 막대사탕
          headR: 0.24 + rand() * 0.16, //  꽃 머리 크기(꽃잎 길이 배율) — 잎보다 도드라지게
          yaw: rand() * TAU,
          color: PETAL_COLORS[(rand() * PETAL_COLORS.length) | 0],
        });
      }
    }
    const N = flowers.length;

    // ── 재질 ───────────────────────────────────────────────
    // flatShading = 각진 면이 살아 저폴리 결이 난다. vertexColors = 구워둔 그라데이션.
    const petalMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const centerMat = new THREE.MeshStandardMaterial({
      color: COLOR.pollen,
      roughness: 0.7,
      metalness: 0,
      flatShading: true,
    });
    const stemMat = new THREE.MeshStandardMaterial({ color: COLOR.leafDark, roughness: 0.95, metalness: 0 });

    // ── 인스턴스 메시 ──────────────────────────────────────
    const petals = new THREE.InstancedMesh(makePetalGeometry(), petalMat, N * PETALS_PER_FLOWER);
    petals.castShadow = true;
    const leaves = new THREE.InstancedMesh(makeLeafGeometry(), leafMat, N * LEAVES_PER_FLOWER);
    leaves.receiveShadow = true;
    const centers = new THREE.InstancedMesh(makeCenterGeometry(), centerMat, N);
    const stemGeo = new THREE.CylinderGeometry(0.012, 0.018, 1, 5);
    const stems = new THREE.InstancedMesh(stemGeo, stemMat, N);

    flowers.forEach((f, i) => {
      const headY = f.stemH + f.headR * 0.12;

      // 줄기 — 바닥에서 stemH까지(원통 기본이 y중심이라 반높이에 놓고 늘린다).
      _p.set(f.x, f.stemH / 2, f.z);
      _q.identity();
      _s.set(1, f.stemH, 1);
      stems.setMatrixAt(i, _m.compose(_p, _q, _s));

      // 꽃잎 5장 — 머리 중심에서 방사형으로, 각자 위로 살짝 젖혀(pitch) 벌어진 꽃부리.
      _c.set(COLOR[f.color]);
      for (let j = 0; j < PETALS_PER_FLOWER; j++) {
        const az = f.yaw + (j / PETALS_PER_FLOWER) * TAU;
        //  pitch가 작을수록 꽃잎이 눕는다 = 활짝 열린 꽃. 0.34rad(~20°)면 얼굴이 보이는 프림로즈꼴.
        const pitch = 0.34 + Math.sin(i * 2.3 + j) * 0.1;
        _qPitch.setFromAxisAngle(AXIS_X, -pitch); //  +Z 앞으로 뻗은 꽃잎 끝을 위로 든다
        _qYaw.setFromAxisAngle(AXIS_Y, az);
        _q.copy(_qYaw).multiply(_qPitch); //  로컬 pitch → 월드 yaw 순
        _p.set(f.x, headY, f.z);
        _s.setScalar(f.headR);
        const idx = i * PETALS_PER_FLOWER + j;
        petals.setMatrixAt(idx, _m.compose(_p, _q, _s));
        petals.setColorAt(idx, _c);
      }

      // 수술 — 꽃부리 중앙에 낮은 돔.
      _p.set(f.x, headY + f.headR * 0.06, f.z);
      _q.identity();
      _s.set(f.headR * 0.5, f.headR * 0.42, f.headR * 0.5);
      centers.setMatrixAt(i, _m.compose(_p, _q, _s));

      // 밑동 잎 3장 — 줄기 밑을 둘러 넓게 눕힌다(살짝 위로 든 끝). 꽃보다 커서 풍성해진다.
      for (let k = 0; k < LEAVES_PER_FLOWER; k++) {
        const az = f.yaw * 1.7 + (k / LEAVES_PER_FLOWER) * TAU + 0.4;
        const pitch = 0.22 + Math.sin(i + k * 2) * 0.08; //  거의 눕되 끝만 살짝 든다
        _qPitch.setFromAxisAngle(AXIS_X, -pitch);
        _qYaw.setFromAxisAngle(AXIS_Y, az);
        _q.copy(_qYaw).multiply(_qPitch);
        _p.set(f.x, 0.03, f.z);
        const ls = f.headR * (1.15 + (k % 2) * 0.25); //  잎 크기 변주
        _s.setScalar(ls);
        const idx = i * LEAVES_PER_FLOWER + k;
        leaves.setMatrixAt(idx, _m.compose(_p, _q, _s));
        //  잎 색 변주 — 짙은 잎/보통 잎 섞어 단조로움 제거.
        leaves.setColorAt(idx, _c.set(k % 2 === 0 ? COLOR.leafDeep : COLOR.leafDark));
      }
    });
    petals.instanceMatrix.needsUpdate = true;
    if (petals.instanceColor) petals.instanceColor.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    centers.instanceMatrix.needsUpdate = true;
    stems.instanceMatrix.needsUpdate = true;

    // 잔디 포기 — 낮고 넓은 초록 무더기(표면 결). 뾰족·짙으면 미니 전나무 노이즈가 된다.
    const tuftPts = scatterDisc(GRASS_TUFTS.r, GRASS_TUFTS.n, GRASS_TUFTS.seed);
    const tuftGeo = new THREE.ConeGeometry(0.16, 0.22, 6);
    const tuftMat = new THREE.MeshStandardMaterial({ color: COLOR.grass, roughness: 0.96, metalness: 0 });
    const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftPts.length);
    tuftPts.forEach((pt, i) => {
      _p.set(pt.x, 0.09, pt.z);
      _e.set(0, pt.a, Math.sin(pt.a * 5) * 0.1);
      _q.setFromEuler(_e);
      _s.set(pt.s, pt.s * 0.8, pt.s);
      tufts.setMatrixAt(i, _m.compose(_p, _q, _s));
    });
    tufts.instanceMatrix.needsUpdate = true;

    return { petals, leaves, centers, stems, tufts };
  }, []);

  return (
    <group>
      <primitive object={parts.stems} />
      <primitive object={parts.leaves} />
      <primitive object={parts.petals} />
      <primitive object={parts.centers} />
      <primitive object={parts.tufts} />
    </group>
  );
}
