'use client';

// 지피 식생 — 섬에서 **잔디밭을 뺀 나머지**를 채우는 초록 볼륨(관목·긴잔디·낮은 포기).
// 꽃은 Meadow가 같은 식재 구역 위에 얹는다. 여기선 "초록"만 담당한다.
//
// ★★ 2026-07-27 전면 개편 — 왜 갈아엎었나
//   이전 버전은 **섬 전체에 포기 5,800개를 균일 스캐터**했다. 포기 모양을 3종으로 늘리고
//   군락을 넣어도 골격이 "전면 도배"라 화면에선 여전히 "바닥에 잔디를 복붙한" 것으로 보였다
//   (2026-07-22 지적). 모양을 고쳐도 구조가 그대로면 지적은 그대로 남는다.
//
//   → 구조를 뒤집었다. 이제 배치의 근거는 전부 `layout.ts`의 **lawnDist(x,z)** 하나다:
//     · 잔디 안(d<0)에는 거의 심지 않는다 — 잔디는 매끈한 면으로 남아야 "열린 곳"이 된다.
//     · 잔디 밖(d>0)은 전부 식재. 잔디에서 멀수록(d↑) **키가 커진다** — 이 층이 깊이를 만든다.
//     · 밀도에 잡음을 줘 빽빽한 데와 성긴 데를 만든다(균일하면 수풀 도배일 뿐).
//
//   2026-07-22에 만든 포기 3종·잎무더기 지오메트리는 **그대로 재사용**한다. 문제는 부품이
//   아니라 배치였다. 층마다 InstancedMesh 하나(= draw call 4번).

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR } from '../palette';
import { islandRadius } from '../constants';
import { samplePlanting, lawnDist, plantGrow, type PlantPt } from './layout';
import {
  makeSoftTuftGeometry,
  makeSpikyTuftGeometry,
  makeTallGrassGeometry,
  makeLeafyMoundGeometry,
} from './groundGeometry';
import { mulberry32 } from './rng';

const TAU = Math.PI * 2;

/** 식재 자리 추첨 횟수. 필터를 통과하는 건 이 중 25~30%다(layout.samplePlanting 참고). */
const PLANT_TRIES = 12000;

/** 잔디밭 가장자리에 두르는 낮은 포기 개수 — 잔디와 식재의 경계를 스미게 하는 용도. */
const LAWN_EDGE_TUFTS = 500;

/**
 * 잔디밭 **안쪽 가장자리**에만 낮은 포기를 성기게 놓는다.
 * ★ 잔디 한복판에는 놓지 않는다. 넓은 잔디는 비어 있는 게 아니라 **열려 있는** 것이고,
 *   거기에 포기를 뿌리는 순간 예전의 "전면 도배"로 되돌아간다.
 */
function sampleLawnEdge(n: number, seed: number): PlantPt[] {
  const rand = mulberry32(seed);
  const out: PlantPt[] = [];
  let tries = 0;
  while (out.length < n && tries < n * 12) {
    tries++;
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * islandRadius(a) * 0.985;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const d = lawnDist(x, z);
    if (d > 0 || d < -1.2) continue; //  잔디 안, 그것도 가장자리 1.2m 띠 안에서만
    // 경계에 가까울수록 촘촘 — 안쪽으로 갈수록 확률적으로 사라진다
    if (rand() > Math.exp(d * 1.8)) continue;
    out.push({ x, z, d, layer: 'front', a: rand() * TAU, s: 0.62 + rand() * 0.45, c: rand() });
  }
  return out;
}

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

    /** 포기 층 하나를 굽는다. tints = 개체별 초록 색조. */
    const buildTufts = (
      geo: THREE.BufferGeometry,
      list: PlantPt[],
      tints: string[],
      scale: number,
      lean: number,
      /** 잔디에서 가장 먼 곳에서 키가 몇 배가 되는지(포화값 기준) */
      dGain: number,
    ) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((p, i) => {
        dummy.position.set(p.x, 0, p.z);
        // x·z축 기울기 = 바람에 눕는 변주. 길수록 더 눕는다.
        dummy.rotation.set((p.c - 0.5) * lean, p.a, (0.5 - p.s) * lean);
        const grow = 1 + plantGrow(p.d) * dGain;
        const s = p.s * scale;
        dummy.scale.set(s, s * (0.8 + p.c * 0.6) * grow, s);
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
    const soft = buildTufts(
      makeSoftTuftGeometry(),
      [...sampleLawnEdge(LAWN_EDGE_TUFTS, 771), ...front],
      lowTints,
      1.2,
      0.34,
      0.3,
    );

    // ── ② 뾰족 악센트 — 잔디 가 식재에만 소수 ──────────────────
    // 전부 뾰족하면 왁스머리가 된다. front의 3할만.
    const spiky = buildTufts(
      makeSpikyTuftGeometry(),
      front.filter((p) => p.c > 0.7),
      ['#C6DE8C', COLOR.grass, '#B0CC74'],
      1.05,
      0.26,
      0.35,
    );

    // ── ③ 긴 잔디 — 중간·뒷줄 ─────────────────────────────────
    // 낮은 포기보다 한 톤만 짙게. 뒤로 물러나되 어두운 덩어리가 되면 안 된다.
    const tall = buildTufts(
      makeTallGrassGeometry(),
      [...midGrass, ...backGrass],
      [COLOR.grass, COLOR.grassEdge, '#A8C273', '#BCD681'],
      // ★ 지오메트리 자체가 h=1.15m다. 여기에 스케일·키변주·grow가 모두 곱해지므로
      //   배율을 1.0 근처에 두면 4m짜리 갈대가 선다(1차 렌더 실측). 0.75가 상한선.
      0.75,
      0.5,
      0.2,
    );

    // ── ④ 관목 — 잔디에서 멀수록 키큰 덩이 ─────────────────────
    // ★ 잎무더기 하나를 크게 키우면 "초록 돌멩이"가 된다(2026-07-22 실측).
    //   2~3개를 조금씩 어긋나게 쌓아야 부피 있는 관목으로 읽힌다. 같은 InstancedMesh라 공짜다.
    // ★ 색은 leafDeep(#4E7A42)까지 가면 검은 브로콜리가 된다 — leaf~grassEdge 사이에 둔다.
    const shrubTints = [COLOR.leaf, COLOR.grassEdge, '#A2C06B', '#89AF63'];
    const shrubs = [...midShrub, ...backShrub];
    const blobs: { p: PlantPt; k: number; n: number }[] = [];
    for (const p of shrubs) {
      const n = p.layer === 'back' ? 2 + ((p.c * 2.99) | 0) : 1 + ((p.c * 1.99) | 0);
      for (let k = 0; k < n; k++) blobs.push({ p, k, n });
    }

    const clumps = new THREE.InstancedMesh(makeLeafyMoundGeometry(), mat, blobs.length);
    blobs.forEach(({ p, k, n }, i) => {
      // 잔디에서 멀수록 크게. front 쪽 관목은 낮게 깔려 잔디와 이어져야 한다.
      const grow = 1.6 + plantGrow(p.d) * 1.8;
      const base = p.s * grow;
      const t = k / n; //  위로 갈수록 작아지며 살짝 어긋난다
      const wob = Math.sin((p.a + k * 2.4) * 3.1);
      dummy.position.set(
        p.x + wob * base * 0.16,
        0.02 + t * base * 0.5,
        p.z + Math.cos((p.a + k * 1.7) * 2.6) * base * 0.16,
      );
      dummy.rotation.set(0, p.a + k * 1.1, 0);
      const s = base * (1 - t * 0.3);
      dummy.scale.set(s, s * (0.85 + p.c * 0.6), s);
      dummy.updateMatrix();
      clumps.setMatrixAt(i, dummy.matrix);
      _c.set(shrubTints[(((p.c + k * 0.23) % 1) * shrubTints.length) | 0]);
      _c.offsetHSL(0, 0, t * 0.03); //  위쪽 덩이를 아주 살짝 밝게(빛 받는 면)
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
