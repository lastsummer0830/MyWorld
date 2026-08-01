'use client';

// 지피 식생 — 섬에서 **잔디밭을 뺀 나머지**를 채우는 초록 볼륨(관목·긴잔디·낮은 포기).
// 꽃은 Meadow가 같은 식재 구역 위에 얹는다. 여기선 "초록"만 담당한다.
//
// ★★ 2026-07-27 전면 개편 — 왜 갈아엎었나
//   이전 버전은 **섬 전체에 포기 5,800개를 균일 스캐터**했다. 포기 모양을 3종으로 늘리고
//   군락을 넣어도 골격이 "전면 도배"라 화면에선 여전히 "바닥에 잔디를 복붙한" 것으로 보였다
//   (2026-07-22 지적). 모양을 고쳐도 구조가 그대로면 지적은 그대로 남는다.
//
//   → 그때는 "잔디 밖 = 전부 식재"로 뒤집었는데, 이번엔 그게 문제가 됐다(아래).
//
// ★★ 2026-08-01 재개편 — "잔디 밖 전부 식재"도 틀렸다
//   섬 둘레가 통째로 초록 벽이 되고 그 벽이 제일 키가 커서 정원이 좁아 보였다
//   ("빈 공간을 잡초로 메꾼 수준" — 조아진). 이제 배치의 근거는 `layout.ts`의 **bedAt(x,z)** 다:
//     · **화단으로 지정한 자리에만 심는다.** 나머지는 전부 열린 잔디 — 그게 넓어 보이는 이유다.
//     · 키는 화단 성격(tone)이 정하고, **섬 가장자리로 갈수록 낮아진다**(예전엔 반대였다).
//     · 관목의 부피는 잎무더기를 **쌓아서** 만든다. 덩어리 하나를 키우면 잎이 바나나잎이 된다.
//
//   포기 3종·잎무더기 지오메트리는 그대로 재사용한다. 층마다 InstancedMesh 하나(= draw call 4번).

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR } from '../palette';
import { samplePlanting, type PlantPt } from './layout';
import {
  makeSoftTuftGeometry,
  makeSpikyTuftGeometry,
  makeTallGrassGeometry,
  makeLeafyMoundGeometry,
} from './groundGeometry';

/**
 * 식재 자리 추첨 횟수.
 * ★ 2026-08-01: 화단 구조로 바뀌면서 통과율이 15% 안팎으로 떨어졌다(예전엔 섬 전체가 식재라 30%).
 *   화단 안은 촘촘해야 화단으로 보이므로 추첨 수를 올려 **좁은 곳에 밀도를 몰아준다.**
 *   전체 개체 수는 예전과 비슷하되, 흩어져 있던 것이 화단 안으로 모인다.
 */
const PLANT_TRIES = 20000;

/** 관목 덩어리 하나의 높이(m). 이 단위로 쌓아 관목의 부피를 만든다. */
const MOUND_STEP = 0.3;

export default function GroundCover() {
  const parts = useMemo(() => {
    const dummy = new THREE.Object3D();
    const _c = new THREE.Color();

    // 초록 층이 재질을 공유한다 — 같은 빛을 받아야 한 정원으로 보인다.
    // ⚠ flatShading은 반드시 꺼 둔다 — groundGeometry의 "법선 위로 눕히기"가 무효화되고(그 파일 ★★ 주석),
    //   작은 오브젝트는 그늘 면이 푸른 환경광을 받아 칙칙해진다(2026-07-22 실측).
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    const pts = samplePlanting(PLANT_TRIES, 4242);

    // ── 층 나누기 ─────────────────────────────────────────────
    // back(잔디에서 멂) = 키큰 관목, front(잔디 가) = 낮은 포기.
    const back = pts.filter((p) => p.layer === 'back');
    const mid = pts.filter((p) => p.layer === 'mid');
    const front = pts.filter((p) => p.layer === 'front');

    // mid는 긴잔디와 관목을 섞는다 — 한 층이 한 종류면 그 층만 다시 도배처럼 보인다.
    // ★ 긴잔디는 **악센트**다. 1차 렌더에서 이 비중이 mid 55%/back 30%였더니 바깥 띠가
    //   통째로 갈대밭이 되어 관목·꽃이 전부 묻혔다. 관목이 뒷줄의 주인공이어야 한다.
    const midGrass = mid.filter((p) => p.c < 0.35);
    const midShrub = mid.filter((p) => p.c >= 0.35);
    const backGrass = back.filter((p) => p.c < 0.18);
    const backShrub = back.filter((p) => p.c >= 0.18);

    /**
     * 포기 층 하나를 굽는다. tints = 개체별 초록 색조.
     * 키는 layout이 내준 p.h(그 자리에 허용되는 높이 m)를 따른다 —
     * 화단 성격·화단 안쪽 정도·섬 가장자리 감쇠가 이미 다 반영된 값이다.
     */
    const buildTufts = (
      geo: THREE.BufferGeometry,
      list: PlantPt[],
      tints: string[],
      /** 이 지오메트리의 기준 높이(m). p.h를 이 값으로 나눠 배율을 얻는다. */
      geoH: number,
      /** 이 층이 p.h를 얼마나 채우는가(0~1). 낮은 포기는 화단 키를 다 쓰지 않는다. */
      fill: number,
      lean: number,
    ) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((p, i) => {
        dummy.position.set(p.x, 0, p.z);
        // x·z축 기울기 = 바람에 눕는 변주.
        dummy.rotation.set((p.c - 0.5) * lean, p.a, (0.5 - p.s) * lean);
        // 세로는 허용 키에 맞추고, 가로는 개체 변주만 — 세로로 늘어난 포기가 가늘어 보이지 않게.
        const sy = Math.max(0.35, (p.h * fill) / geoH) * (0.85 + p.c * 0.3);
        const sxz = p.s * (0.9 + 0.25 * Math.min(sy, 1.6));
        dummy.scale.set(sxz, sy, sxz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        _c.set(tints[(p.c * tints.length) | 0]);
        _c.offsetHSL(0, 0, (p.s - 1) * 0.045); //  개체마다 아주 옅은 명암 변주
        mesh.setColorAt(i, _c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // ── ① 잔디 가장자리 포기 + 잔디 가 낮은 식재 ────────────────
    // ★ 색조는 바닥(COLOR.grass)보다 **밝은 쪽**으로 잡는다. 서 있는 블레이드는 햇빛을 얕게
    //   받아 이미 어둡게 찍히므로, 팔레트에서까지 짙은 색을 섞으면 잔디보다 어두워져
    //   "잔디밭"이 아니라 "얼룩"이 된다(2026-07-22 실측).
    const lowTints = ['#C6DE8C', COLOR.grass, '#BCD681', COLOR.grass, '#B0CC74'];
    const soft = buildTufts(makeSoftTuftGeometry(), front, lowTints, 0.34, 0.85, 0.34);

    // ── ② 뾰족 악센트 — 낮은 화단에만 소수 ─────────────────────
    // 전부 뾰족하면 왁스머리가 된다. front의 3할만.
    const spiky = buildTufts(
      makeSpikyTuftGeometry(),
      front.filter((p) => p.c > 0.7),
      ['#C6DE8C', COLOR.grass, '#B0CC74'],
      0.46,
      0.95,
      0.26,
    );

    // ── ③ 긴 잔디 — 중간·뒷줄 ─────────────────────────────────
    // 낮은 포기보다 한 톤만 짙게. 뒤로 물러나되 어두운 덩어리가 되면 안 된다.
    // 지오메트리 자체가 h=1.15m다 — p.h를 이 값으로 나눠 배율을 얻으므로 4m 갈대가 설 일이 없다.
    const tall = buildTufts(
      makeTallGrassGeometry(),
      [...midGrass, ...backGrass],
      [COLOR.grass, COLOR.grassEdge, '#A8C273', '#BCD681'],
      1.15,
      0.9,
      0.5,
    );

    // ── ④ 관목 — 잔디에서 멀수록 키큰 덩이 ─────────────────────
    // ★ 잎무더기 하나를 크게 키우면 "초록 돌멩이"가 된다(2026-07-22 실측).
    //   2~3개를 조금씩 어긋나게 쌓아야 부피 있는 관목으로 읽힌다. 같은 InstancedMesh라 공짜다.
    // ★ 색은 leafDeep(#4E7A42)까지 가면 검은 브로콜리가 된다 — leaf~grassEdge 사이에 둔다.
    /**
     * ★★ 관목의 부피는 **덩어리를 쌓아서** 만든다 — 덩어리 하나를 키우지 않는다 (2026-08-01).
     *
     * 예전엔 잎무더기 하나에 최대 3.7배 스케일을 걸었다. 잎 길이가 덩어리 반경에 비례했으므로
     * 잎 한 장이 1m가 됐고, 그게 "바나나잎"으로 보였다. 실제 관목은 커져도 잎 크기는 그대로다.
     * → 덩어리 지오메트리를 **잎 12cm 고정**으로 굽고, 인스턴스 배율은 1 근처로 묶는다.
     *   키가 큰 자리일수록 덩어리 **개수**를 늘려 황금각으로 쌓는다.
     */
    const shrubTints = [COLOR.leaf, COLOR.grassEdge, '#A2C06B', '#89AF63'];
    const shrubs = [...midShrub, ...backShrub];
    const blobs: { p: PlantPt; k: number; n: number }[] = [];
    for (const p of shrubs) {
      // 키 1m당 덩어리 7개꼴. 낮은 화단은 1~2개로 낮게 깔린다.
      const n = Math.max(1, Math.min(13, Math.round((p.h / MOUND_STEP) * 2.2)));
      for (let k = 0; k < n; k++) blobs.push({ p, k, n });
    }

    // 잎 12cm 고정. 덩어리 반경 34cm.
    const clumps = new THREE.InstancedMesh(makeLeafyMoundGeometry(20, 0.34, 0.62, 0.12), mat, blobs.length);
    const GOLDEN = 2.3999632; //  황금각 — 겹치지 않게 고르게 퍼지는 배치
    blobs.forEach(({ p, k, n }, i) => {
      const t = n === 1 ? 0 : k / (n - 1); //  0 = 밑동, 1 = 꼭대기
      // 위로 갈수록 좁아지는 돔 — 아래가 넓어야 관목이 땅에 앉아 보인다.
      const rad = (0.3 + 0.5 * (p.h / 1.55)) * p.s;
      const rr = rad * Math.sqrt(Math.max(0, 1 - t * 0.88)) * (0.3 + 0.7 * ((k * 0.618) % 1));
      const ang = p.a + k * GOLDEN;
      dummy.position.set(
        p.x + Math.cos(ang) * rr,
        0.04 + p.h * t * 0.74,
        p.z + Math.sin(ang) * rr,
      );
      dummy.rotation.set(0, ang, 0);
      // ★ 배율은 0.8~1.15만. 여기를 키우면 잎이 다시 커진다.
      const s = 0.82 + 0.33 * (1 - t);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      clumps.setMatrixAt(i, dummy.matrix);
      _c.set(shrubTints[(((p.c + k * 0.23) % 1) * shrubTints.length) | 0]);
      _c.offsetHSL(0, 0, t * 0.05); //  위쪽 덩이를 살짝 밝게(빛 받는 면)
      clumps.setColorAt(i, _c);
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
