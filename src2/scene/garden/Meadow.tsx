'use client';

// 꽃밭 + 잔디 포기 — 개수가 많아 전부 instancedMesh로 그린다(성능 스킬 §7).
// 꽃 100송이를 낱개로 그리면 draw call이 100번 나간다. 여기선 꽃봉오리·줄기·풀이 각 1번.
// 색은 per-instance color로 팔레트 색을 심는다(베이스 흰색은 곱셈 항등원일 뿐).

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR, type ColorKey } from '../palette';
import { FLOWER_BEDS, GRASS_TUFTS } from './layout';
import { mulberry32, scatterDisc } from './rng';

const PETALS: ColorKey[] = ['petalPink', 'petalYellow', 'petalWhite', 'petalLav', 'rose'];

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _e = new THREE.Euler();

export default function Meadow() {
  const { blossoms, cores, stems, tufts } = useMemo(() => {
    // 모든 꽃밭의 꽃을 한 배열로 모은다.
    const flowers: { x: number; z: number; h: number; s: number; color: ColorKey }[] = [];
    for (const bed of FLOWER_BEDS) {
      const pts = scatterDisc(bed.r, bed.n, bed.seed);
      const rand = mulberry32(bed.seed * 3 + 1);
      for (const pt of pts) {
        flowers.push({
          x: bed.pos[0] + pt.x,
          z: bed.pos[1] + pt.z,
          h: 0.16 + rand() * 0.16, //  줄기 짧게 — 길면 막대사탕처럼 보인다
          s: 0.13 + rand() * 0.06,
          color: PETALS[(rand() * PETALS.length) | 0],
        });
      }
    }

    // 꽃송이 — 납작하게 벌어진 꽃부리(cup). 공 하나면 막대사탕이 된다.
    //   위가 넓고 아래가 좁은 낮은 원뿔대 = 벌어진 꽃. 5각이라 꽃잎 느낌이 난다.
    const blossomGeo = new THREE.CylinderGeometry(1, 0.32, 0.5, 5);
    const blossomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 });
    const blossoms = new THREE.InstancedMesh(blossomGeo, blossomMat, flowers.length);
    blossoms.castShadow = true;

    // 꽃 수술(중심) — 노란 점. 꽃부리 한가운데.
    const coreGeo = new THREE.SphereGeometry(0.4, 8, 6);
    const coreMat = new THREE.MeshStandardMaterial({ color: COLOR.petalYellow, roughness: 0.8, metalness: 0 });
    const cores = new THREE.InstancedMesh(coreGeo, coreMat, flowers.length);

    // 줄기 — 전부 같은 초록. 가늘게.
    const stemGeo = new THREE.CylinderGeometry(0.011, 0.016, 1, 5);
    const stemMat = new THREE.MeshStandardMaterial({ color: COLOR.leafDark, roughness: 0.95, metalness: 0 });
    const stems = new THREE.InstancedMesh(stemGeo, stemMat, flowers.length);

    flowers.forEach((f, i) => {
      // 줄기 — 바닥(y=0)에서 h까지. 원통 기본이 y중심이라 반높이에 놓고 y로 늘린다.
      _p.set(f.x, f.h / 2, f.z);
      _q.identity();
      _s.set(1, f.h, 1);
      _m.compose(_p, _q, _s);
      stems.setMatrixAt(i, _m);

      // 꽃송이 — 줄기 끝에 살짝 기울여 얹는다(정면을 향하지 않게).
      const tilt = 0.18;
      _e.set(Math.sin(i) * tilt, i * 1.3, Math.cos(i) * tilt);
      _q.setFromEuler(_e);
      _p.set(f.x, f.h + f.s * 0.22, f.z);
      _s.set(f.s * 1.35, f.s * 0.7, f.s * 1.35); //  넓고 납작하게
      _m.compose(_p, _q, _s);
      blossoms.setMatrixAt(i, _m);
      blossoms.setColorAt(i, _c.set(COLOR[f.color]));

      // 수술 — 꽃부리 중앙에 작게.
      _p.set(f.x, f.h + f.s * 0.34, f.z);
      _s.set(f.s * 0.5, f.s * 0.3, f.s * 0.5);
      _m.compose(_p, _q, _s);
      cores.setMatrixAt(i, _m);
    });
    blossoms.instanceMatrix.needsUpdate = true;
    if (blossoms.instanceColor) blossoms.instanceColor.needsUpdate = true;
    cores.instanceMatrix.needsUpdate = true;
    stems.instanceMatrix.needsUpdate = true;

    // 잔디 포기 — 낮고 넓은 초록 무더기. 잔디색에 가깝게·짧게 두어 "표면 결"로만 읽히게 한다.
    // (뾰족·짙게 두면 미니 전나무처럼 보여 노이즈가 된다.)
    const tuftPts = scatterDisc(GRASS_TUFTS.r, GRASS_TUFTS.n, GRASS_TUFTS.seed);
    const tuftGeo = new THREE.ConeGeometry(0.16, 0.22, 6);
    const tuftMat = new THREE.MeshStandardMaterial({ color: COLOR.grass, roughness: 0.96, metalness: 0 });
    const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftPts.length);
    tuftPts.forEach((pt, i) => {
      _p.set(pt.x, 0.09, pt.z);
      _e.set(0, pt.a, Math.sin(pt.a * 5) * 0.1);
      _q.setFromEuler(_e);
      _s.set(pt.s, pt.s * 0.8, pt.s);
      _m.compose(_p, _q, _s);
      tufts.setMatrixAt(i, _m);
    });
    tufts.instanceMatrix.needsUpdate = true;

    return { blossoms, cores, stems, tufts };
  }, []);

  return (
    <group>
      <primitive object={stems} />
      <primitive object={blossoms} />
      <primitive object={cores} />
      <primitive object={tufts} />
    </group>
  );
}
