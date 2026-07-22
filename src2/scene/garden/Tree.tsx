'use client';

// 나무 2종 — 잎벚꽃(겹벚꽃)과 레몬트리.
//
// ★ 왜 이 두 종이 이렇게 생겼나 (추측이 아니라 확인한 사실)
//
// ① 잎벚꽃 — 늦게 피는 겹벚꽃(이치요·기쿠자쿠라·쇼게츠) 계열.
//    만개한 소메이요시노처럼 "가지 전체가 분홍 구름"이 아니다. **새잎이 꽃과 같이 또는 먼저 나와서
//    분홍 꽃송이를 절반쯤 가린다.** 새잎 색은 청동빛이 도는 초록.
//    → 그래서 수관을 초록 잎덩이로 먼저 짜고, 그 표면에 분홍 꽃송이를 얹는다. 분홍이 전부를 덮으면 안 된다.
//    (근거: japan-guide.com 벚꽃 품종 해설 — 늦게 피는 품종은 잎이 먼저 발달해 꽃을 가린다)
//
// ② 레몬트리 — 레퍼런스 사진 `루카리오/MyRoom/요소/b9a4b0f…jpg`.
//    잎이 벚나무보다 **짙고 광택 있는 상록**이고 수관이 낮고 둥글다(관목에 가깝다).
//    열매는 가지 끝 쪽에 **뭉쳐** 달리고, 잎보다 밝은 노랑이라 초록 사이에서 또렷하게 튄다.
//
// 잎덩이·꽃송이·열매는 전부 InstancedMesh 한 번으로 그린다.

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR } from '../palette';
import { makeTrunkGeometry, makeBlobGeometry, makeLemonGeometry, type Branch } from './treeGeometry';
import { mulberry32 } from './rng';

export type TreeSpecies = 'cherry' | 'lemon';

const TAU = Math.PI * 2;

/** 겹벚꽃 꽃송이 덩어리 색. */
const BLOSSOM_TINTS = [COLOR.blossom, COLOR.blossom, COLOR.blossomDeep, COLOR.petalPink];

/** 종별 형태 파라미터 — 두 나무가 "색만 다른 같은 나무"가 되지 않게 골격부터 다르게 잡는다. */
const SPEC = {
  cherry: {
    h: 4.2, //  키가 크고 위로 벌어지는 우산형
    r: 0.34,
    lean: 0.09, //  많이 기울이면 수관이 한쪽으로 쏠려 쓰러지는 나무로 보인다
    branchN: 5,
    branchRise: 0.62,
    branchLen: 1.9,
    blobPerBranch: 6, //  블롭을 잘게 많이 — 크고 적으면 수관이 바위덩이가 된다
    blobR: 0.92,
    canopySquash: 0.72, //  옆으로 퍼진 수관
    leaf: [COLOR.leafCherry, COLOR.leafCherryBronze, COLOR.leafCherry, COLOR.leaf] as string[],
  },
  lemon: {
    h: 2.5, //  낮고 둥근 관목형 — 감귤류는 키가 작다
    r: 0.24,
    lean: 0.08,
    branchN: 5,
    branchRise: 0.72,
    branchLen: 1.15,
    blobPerBranch: 5,
    blobR: 0.68,
    canopySquash: 0.9, //  거의 공에 가까운 조밀한 수관
    leaf: [COLOR.leafCitrus, COLOR.leafCitrusDeep, COLOR.leafCitrus, COLOR.leafDark] as string[],
  },
} as const;

export default function Tree({
  species,
  seed,
  scale = 1,
}: {
  species: TreeSpecies;
  seed: number;
  scale?: number;
}) {
  const built = useMemo(() => {
    const s = SPEC[species];
    const rand = mulberry32(seed);
    const dummy = new THREE.Object3D();
    const _c = new THREE.Color();

    // ── 줄기 + 가지 ──────────────────────────────────────────
    const branches: Branch[] = [];
    for (let i = 0; i < s.branchN; i++) {
      branches.push({
        at: 0.42 + (i / s.branchN) * 0.5,
        yaw: (i / s.branchN) * TAU + rand() * 0.9,
        rise: s.branchRise * (0.8 + rand() * 0.4),
        len: s.branchLen * (0.75 + rand() * 0.5),
      });
    }
    const { geo: trunkGeo, tips } = makeTrunkGeometry({
      h: s.h,
      r: s.r,
      lean: s.lean,
      leanYaw: rand() * TAU,
      branches,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: COLOR.bark,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    });

    // ── 수관(잎덩이) ─────────────────────────────────────────
    // 가지 끝마다 크기가 다른 블롭을 몇 개씩 겹친다. 하나만 얹으면 막대사탕이 된다.
    //
    // ★ 벚나무의 분홍은 "초록 덩이에 붙인 분홍 구슬"이 아니다.
    //   그렇게 만들었더니 화면엔 나무에 **분홍 자갈을 박아 놓은 꼴**로 나왔다(실측 2026-07-22).
    //   실제 잎벚꽃은 **꽃송이 덩어리와 잎 덩어리가 나란히 섞여** 수관을 이룬다.
    //   그래서 수관 블롭 자체에 종류(잎/꽃)를 부여하고, 꽃 덩이는 바깥쪽·위쪽에 더 많이 둔다.
    //
    type Blob = { p: THREE.Vector3; r: number; c: number; bloom: boolean };
    const blobs: Blob[] = [];
    const bloomRatio = species === 'cherry' ? 0.45 : 0;
    tips.forEach((tip, bi) => {
      for (let k = 0; k < s.blobPerBranch; k++) {
        const bloom = rand() < bloomRatio;
        // 꽃 덩이는 잎 덩이보다 조금 작게 — 같은 크기면 초록/분홍이 큰 판때기로 갈려 촌스럽다
        const rr = s.blobR * (0.62 + rand() * 0.55) * (bloom ? 0.82 : 1);
        blobs.push({
          p: new THREE.Vector3(
            tip.x + (rand() - 0.5) * s.blobR * 1.5,
            tip.y + (rand() - 0.35) * s.blobR * 0.9,
            tip.z + (rand() - 0.5) * s.blobR * 1.5,
          ),
          r: rr,
          c: rand(),
          bloom,
        });
      }
      // 가지 끝 자체에도 하나 — 가지가 잎 밖으로 삐져나오는 걸 막는다
      blobs.push({ p: tip.clone(), r: s.blobR * 0.8, c: bi / tips.length, bloom: false });
    });
    // 수관 한가운데를 채우는 큰 덩이 — 위에서 봤을 때 뚫린 구멍을 없앤다. 여긴 항상 잎(속은 초록이다).
    blobs.push({ p: new THREE.Vector3(0, s.h * 1.02, 0), r: s.blobR * 1.25, c: 0.5, bloom: false });

    const leafMat = new THREE.MeshStandardMaterial({
      roughness: 0.88,
      metalness: 0,
      flatShading: true,
    });
    const leaves = new THREE.InstancedMesh(makeBlobGeometry(1), leafMat, blobs.length);
    blobs.forEach((b, i) => {
      dummy.position.copy(b.p);
      dummy.rotation.set(b.c * TAU, b.c * TAU * 1.7, b.c * 0.6);
      dummy.scale.set(b.r, b.r * s.canopySquash, b.r);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
      const tints = b.bloom ? BLOSSOM_TINTS : s.leaf;
      _c.set(tints[(b.c * tints.length) | 0]);
      _c.offsetHSL(0, 0, (b.c - 0.5) * 0.05);
      leaves.setColorAt(i, _c);
    });
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.castShadow = true;

    // ── 종별 장식(꽃송이 / 열매) ─────────────────────────────
    // 둘 다 "수관 블롭의 표면"에 붙인다. 공중에 띄우면 붕 뜨고, 속에 넣으면 안 보인다.
    const onSurface = (b: Blob, r: number) => {
      const th = rand() * TAU;
      const ph = Math.acos(1 - rand() * 1.25); //  윗면·옆면 위주(아래쪽엔 덜 달린다)
      const n = new THREE.Vector3(
        Math.sin(ph) * Math.cos(th),
        Math.cos(ph),
        Math.sin(ph) * Math.sin(th),
      );
      return new THREE.Vector3(
        b.p.x + n.x * b.r * 0.92,
        b.p.y + n.y * b.r * s.canopySquash * 0.92,
        b.p.z + n.z * b.r * 0.92,
      // 잎 표면 위로 살짝만 띄운다. 0이면 파묻혀 안 보이고, 너무 띄우면 잎에 붙은 게 아니라
      // 표면에 얹힌 별개의 돌덩이로 보인다. 0.5 근처가 "잎 사이로 얼굴을 내민" 정도다.
      ).addScaledVector(n, r * 0.5);
    };

    let deco: THREE.InstancedMesh;
    if (species === 'cherry') {
      // 수관의 분홍은 위(블롭 자체)에서 이미 만들었다. 여기선 **꽃 덩이 가장자리에 얹는 잔 송이**만 —
      // 덩어리 실루엣이 매끈하면 "분홍 스펀지"가 되므로 가장자리를 부수는 용도다.
      const spots: { p: THREE.Vector3; r: number; c: number }[] = [];
      blobs.forEach((b) => {
        if (!b.bloom) return;
        const n = 5 + ((rand() * 4) | 0);
        for (let i = 0; i < n; i++) {
          const r = b.r * (0.2 + rand() * 0.14);
          spots.push({ p: onSurface(b, r), r, c: rand() });
        }
      });
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.82,
        metalness: 0,
        flatShading: true,
      });
      // detail 0(면 20개)은 각이 너무 세서 꽃송이가 아니라 각진 돌로 읽혔다 → detail 1로 둥글린다.
      deco = new THREE.InstancedMesh(makeBlobGeometry(1), mat, spots.length);
      spots.forEach((sp, i) => {
        dummy.position.copy(sp.p);
        dummy.rotation.set(sp.c * TAU, sp.c * 4.1, 0);
        dummy.scale.set(sp.r, sp.r * 0.78, sp.r);
        dummy.updateMatrix();
        deco.setMatrixAt(i, dummy.matrix);
        deco.setColorAt(i, _c.set(BLOSSOM_TINTS[(sp.c * BLOSSOM_TINTS.length) | 0]));
      });
    } else {
      // 레몬 열매 — 가지 끝 블롭에 몰아서 단다(레퍼런스처럼 뭉쳐 달려야 과실수로 읽힌다).
      const spots: { p: THREE.Vector3; r: number; c: number }[] = [];
      // ★ 열매는 잎보다 확실히 커야 보인다. 처음엔 r 0.13으로 넣었더니 짙은 잎에 완전히 파묻혔다.
      blobs.forEach((b, bi) => {
        if (bi % 3 === 2) return; //  전부에 달면 크리스마스트리가 된다
        const n = 2 + ((rand() * 2) | 0);
        for (let i = 0; i < n; i++) {
          // 0.19까지 키웠더니 수관 위가 통째로 노란 덩어리가 됐다. 열매는 잎덩이의 1/6 정도가 적당.
          const r = 0.135 + rand() * 0.05;
          spots.push({ p: onSurface(b, r), r, c: rand() });
        }
      });
      // ★ 열매만 flatShading을 끈다.
      //   면마다 각지게 두면 열매 하나가 밝은 면·그늘진 면으로 쪼개지는데, 그늘 면은 푸른 환경광
      //   (ambient #CBD2E8)을 받아 노랑이 **올리브 회색**으로 죽는다. 크기가 작아 눈에는 그 평균만
      //   보이므로 결국 칙칙한 베이지가 된다(실측 07-22). 매끄럽게 셰이딩하면 햇빛 쪽이 확실히 노랗다.
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.5, //  감귤 껍질은 잎보다 매끈해 하이라이트가 있다
        metalness: 0,
        flatShading: false,
      });
      deco = new THREE.InstancedMesh(makeLemonGeometry(), mat, spots.length);
      spots.forEach((sp, i) => {
        dummy.position.copy(sp.p);
        dummy.rotation.set((sp.c - 0.5) * 0.7, sp.c * TAU, (sp.c - 0.5) * 0.5);
        dummy.scale.setScalar(sp.r);
        dummy.updateMatrix();
        deco.setMatrixAt(i, dummy.matrix);
        _c.set(COLOR.lemon).offsetHSL(0, 0, (sp.c - 0.5) * 0.06);
        deco.setColorAt(i, _c);
      });
    }
    deco.instanceMatrix.needsUpdate = true;
    if (deco.instanceColor) deco.instanceColor.needsUpdate = true;

    return { trunkGeo, trunkMat, leaves, deco };
  }, [species, seed]);

  return (
    <group scale={scale}>
      <mesh geometry={built.trunkGeo} material={built.trunkMat} castShadow receiveShadow />
      <primitive object={built.leaves} />
      <primitive object={built.deco} />
    </group>
  );
}
