'use client';

// 꽃밭 — 종(種)이 뚜렷한 꽃 네 가지를 정원 전역의 식재 구역에 심는다.
// 레퍼런스(조아진 제공 저폴리 꽃): 데이지 · 앵초(primrose) · 알리움 · 폭스글러브(digitalis).
//   ▸ "꽃 1종을 색만 바꿔 뿌리면 대충 티가 난다"(조아진) → 종마다 형태 자체를 다르게.
//   ▸ 개수가 많아 파트별로 InstancedMesh 한 번씩(성능 스킬 §7). 색은 per-instance color.
//   ▸ 잎·꽃잎은 지오메트리에 구운 길이방향 그라데이션(밑동 짙고 끝 밝은)과 곱해진다.
// 초록 볼륨(관목·긴잔디)은 GroundCover가 같은 식재 구역에 깐다 — 여기선 "꽃"만 담당한다.
//
// ★★ 2026-07-27 개편 — 꽃밭 6개(FLOWER_BEDS)를 버렸다.
//   가장자리에 원형 화단 6개를 두는 방식이라 꽃이 늘 바깥 링에만 남았다("꽃이 왜 양쪽에만
//   있냐" 2026-07-22 지적). 이제 화단이라는 단위 자체를 쓰지 않고, `layout.samplePlanting`이
//   내주는 **섬 − 잔디 = 식재 구역** 전역에 심는다. 종은 `speciesAt`이 위치로 정하므로
//   가까운 꽃끼리 자연히 무리(드리프트)를 이룬다.

import { useMemo } from 'react';
import * as THREE from 'three';
import { COLOR } from '../palette';
import { samplePlanting, speciesAt, type FlowerSpecies } from './layout';
import {
  makeBellGeometry,
  makeBladeLeafGeometry,
  makeCenterGeometry,
  makeLeafGeometry,
  makePetalGeometry,
  makePomGeometry,
  makeStrapPetalGeometry,
} from './flowerGeometry';
import { mulberry32 } from './rng';

const TAU = Math.PI * 2;
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

// 빌드 중에만 쓰는 재사용 임시객체(할당 최소화).
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qy = new THREE.Quaternion();
const _qp = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _c2 = new THREE.Color();
const WHITE = new THREE.Color('#ffffff');

// 파트 하나의 월드 배치(+ 색). 종별 함수가 이 버킷에 밀어 넣고, 마지막에 InstancedMesh로 굽는다.
type Inst = { m: THREE.Matrix4; c: THREE.Color };
type Bucket = Inst[];

/** 종별 함수가 공유하는 버킷 묶음. 각 버킷 = InstancedMesh 하나. */
type Buckets = {
  spade: Bucket; // 앵초 꽃잎
  strap: Bucket; // 데이지 꽃잎
  bell: Bucket; // 폭스글러브 벨
  pom: Bucket; // 알리움 공
  center: Bucket; // 데이지 원반 + 앵초 수술
  broad: Bucket; // 넓은 밑동잎
  blade: Bucket; // 가는 밑동잎
  stem: Bucket; // 줄기
};

const pushInst = (b: Bucket, m: THREE.Matrix4, c: THREE.Color) =>
  b.push({ m: m.clone(), c: c.clone() });

/** 방사형 파트 1장을 위치/방위(az)/젖힘(pitch)/크기로 버킷에 넣는다.
 *  파트는 로컬 +Z로 자라고, pitch가 클수록 끝이 위로 선다(pitch<0이면 아래로 처진다). */
function emitRadial(
  b: Bucket,
  x: number,
  y: number,
  z: number,
  az: number,
  pitch: number,
  scale: number,
  color: THREE.Color,
) {
  _qp.setFromAxisAngle(AXIS_X, -pitch);
  _qy.setFromAxisAngle(AXIS_Y, az);
  _q.copy(_qy).multiply(_qp);
  _p.set(x, y, z);
  _s.setScalar(scale);
  pushInst(b, _m.compose(_p, _q, _s), color);
}

/** 바닥에서 높이 h까지 서는 줄기. thick=밑동 굵기 배율. */
function emitStem(b: Bucket, x: number, z: number, h: number, thick: number, color: THREE.Color) {
  _p.set(x, h / 2, z);
  _q.identity();
  _s.set(thick, h, thick);
  pushInst(b, _m.compose(_p, _q, _s), color);
}

// ── 종별 심기 ────────────────────────────────────────────────
type Rand = () => number;

/** 데이지 — 흰 스트랩 꽃잎 링 + 노란 원반, 곧게 선 줄기, 가는 밑동잎. */
function plantDaisy(B: Buckets, x: number, z: number, rand: Rand) {
  const h = 0.34 + rand() * 0.22;
  const headR = 0.24 + rand() * 0.12;
  const headY = h + 0.02;
  const yaw0 = rand() * TAU;

  emitStem(B.stem, x, z, h, 0.8, _c.set(COLOR.leafDark));

  const nP = 11 + ((rand() * 3) | 0);
  _c.set(COLOR.petalWhite);
  for (let j = 0; j < nP; j++) {
    const az = yaw0 + (j / nP) * TAU;
    const pitch = 0.14 + Math.sin(j * 1.7) * 0.05; //  거의 눕는 활짝 핀 얼굴
    emitRadial(B.strap, x, headY, z, az, pitch, headR, _c);
  }
  // 도톰한 노란 원반 중심
  _p.set(x, headY + headR * 0.04, z);
  _q.identity();
  _s.set(headR * 0.42, headR * 0.5, headR * 0.42);
  pushInst(B.center, _m.compose(_p, _q, _s), _c2.set(COLOR.pollen));

  // 가는 밑동잎 2~3장(곧게 선다)
  const nL = 2 + ((rand() * 2) | 0);
  for (let k = 0; k < nL; k++) {
    const az = yaw0 * 1.3 + (k / nL) * TAU + 0.5;
    emitRadial(B.blade, x, 0.02, z, az, 0.9 + rand() * 0.25, 0.42 + rand() * 0.16, _c2.set(k % 2 ? COLOR.leafDark : COLOR.leafDeep));
  }
}

/** 앵초 — 작은 노란 꽃 여러 송이가 낮은 돔으로 뭉치고, 뾰족 잎 로제트가 받친다. */
function plantPrimrose(B: Buckets, x: number, z: number, rand: Rand) {
  // 밑동 잎 로제트(넓은 잎, 눕힘)
  const nLeaf = 5 + ((rand() * 3) | 0);
  for (let k = 0; k < nLeaf; k++) {
    emitRadial(B.broad, x, 0.03, z, rand() * TAU, 0.18 + rand() * 0.12, 0.48 + rand() * 0.2, _c2.set(k % 2 ? COLOR.leafDeep : COLOR.leafDark));
  }
  // 대부분 노랑, 가끔 코랄/분홍 앵초
  const baseCol = rand() < 0.82 ? COLOR.petalYellow : rand() < 0.5 ? COLOR.petalCoral : COLOR.petalPink;
  const nFlower = 5 + ((rand() * 4) | 0);
  for (let f = 0; f < nFlower; f++) {
    const fa = rand() * TAU;
    const fr = rand() * 0.15; //  돔 반경(수평)
    const fx = x + Math.cos(fa) * fr;
    const fz = z + Math.sin(fa) * fr;
    //  잔디(~0.45)에 묻히지 않게 꽃을 높이 올리고, 중심일수록 높게 쌓아 도톰한 돔으로.
    const fy = 0.34 + rand() * 0.16 - fr * 0.7;
    const fR = 0.15 + rand() * 0.06; //  꽃을 키워 노란 얼굴이 또렷하게
    const yaw0 = rand() * TAU;
    _c.set(baseCol);
    for (let j = 0; j < 5; j++) {
      const az = yaw0 + (j / 5) * TAU;
      emitRadial(B.spade, fx, fy, fz, az, 0.32 + Math.sin(j) * 0.06, fR, _c);
    }
    _p.set(fx, fy + fR * 0.05, fz);
    _q.identity();
    _s.set(fR * 0.42, fR * 0.36, fR * 0.42);
    pushInst(B.center, _m.compose(_p, _q, _s), _c2.set(COLOR.pollen));
    emitStem(B.stem, fx, fz, fy, 0.55, _c2.set(COLOR.leafDark));
  }
}

/** 알리움/램슨 — 줄기 끝 흰 별꽃 공 + 넓은 밑동잎. */
function plantAllium(B: Buckets, x: number, z: number, rand: Rand) {
  const h = 0.58 + rand() * 0.32; //  공이 잔디 위로 확실히 올라오게
  const nLeaf = 2 + ((rand() * 2) | 0);
  for (let k = 0; k < nLeaf; k++) {
    emitRadial(B.broad, x, 0.03, z, rand() * TAU, 0.2 + rand() * 0.15, 0.55 + rand() * 0.2, _c2.set(k % 2 ? COLOR.leafDeep : COLOR.leafDark));
  }
  emitStem(B.stem, x, z, h, 0.7, _c2.set(COLOR.leafDark));

  const pomR = 0.18 + rand() * 0.06;
  _p.set(x, h + pomR * 0.7, z);
  _q.setFromAxisAngle(AXIS_Y, rand() * TAU);
  _s.setScalar(pomR);
  //  순백은 밝은 잔디에 묻힌다 → 라벤더·연분홍 비중을 높여 또렷하게(레퍼런스도 흰~연보라 섞임).
  const r = rand();
  pushInst(B.pom, _m.compose(_p, _q, _s), _c2.set(r < 0.5 ? COLOR.petalWhite : r < 0.8 ? COLOR.petalLav : COLOR.petalPink));
}

/** 폭스글러브 — 곧은 스파이크에 벨 꽃이 아래로 처지며 달린다(밑 짙고 위 밝은 그라데이션). */
function plantFoxglove(B: Buckets, x: number, z: number, rand: Rand) {
  const h = 0.85 + rand() * 0.5;
  const nLeaf = 3 + ((rand() * 3) | 0);
  for (let k = 0; k < nLeaf; k++) {
    emitRadial(B.broad, x, 0.03, z, rand() * TAU, 0.16 + rand() * 0.12, 0.6 + rand() * 0.25, _c2.set(k % 2 ? COLOR.leafDeep : COLOR.leafDark));
  }
  emitStem(B.stem, x, z, h, 1.1, _c2.set(COLOR.leafDark));

  // 종 색: 보라/코랄/분홍/흰 중 하나. 스파이크 밑은 짙게, 위는 밝게.
  const palette = [COLOR.petalLav, COLOR.petalCoral, COLOR.petalPink, COLOR.petalWhite];
  const base = new THREE.Color(palette[(rand() * palette.length) | 0]);
  const darkBottom = base.clone().multiplyScalar(0.68);
  const lightTop = base.clone().lerp(WHITE, 0.22);

  const nBell = 9 + ((rand() * 5) | 0);
  for (let b = 0; b < nBell; b++) {
    const t = b / (nBell - 1);
    const by = h * (0.34 + 0.63 * t); //  스파이크 하부~정상
    const az = rand() * TAU; //  나선 배치
    const bx = x + Math.cos(az) * 0.02;
    const bz = z + Math.sin(az) * 0.02;
    const bScale = 0.28 - 0.13 * t; //  위로 갈수록 작다(봉오리)
    _c.copy(darkBottom).lerp(lightTop, t);
    emitRadial(B.bell, bx, by, bz, az, -0.35 - 0.15 * t, bScale, _c); //  pitch<0 = 입이 아래로 처짐
  }
}

const PLANTERS: Record<FlowerSpecies, (B: Buckets, x: number, z: number, r: Rand) => void> = {
  daisy: plantDaisy,
  primrose: plantPrimrose,
  allium: plantAllium,
  foxglove: plantFoxglove,
};

/** 꽃 자리 추첨 횟수. 통과율 25~30%라 실제로는 600송이 안팎이 심긴다. */
const FLOWER_TRIES = 4200;

/**
 * 층별로 꽃을 얼마나 남길지.
 * ★ 잔디 가(front)는 꽃이 촘촘해야 코티지 가든이 된다. 안쪽(back)은 관목이 주인공이라
 *   꽃을 3할만 남긴다 — 다만 **0할은 안 된다.** 뒷줄이 관목뿐이면 검은 초록 벽이 되고
 *   색이 위까지 올라오지 않는다(접시꽃·델피늄이 뒷줄에 서는 이유).
 */
const KEEP: Record<'back' | 'mid' | 'front', number> = { back: 0.3, mid: 0.7, front: 1 };

export default function Meadow() {
  const parts = useMemo(() => {
    const B: Buckets = { spade: [], strap: [], bell: [], pom: [], center: [], broad: [], blade: [], stem: [] };

    const rand = mulberry32(9137);
    for (const pt of samplePlanting(FLOWER_TRIES, 20260727)) {
      if (rand() > KEEP[pt.layer]) continue;
      // 키는 잔디에서 먼 정도로 — 잔디 가엔 낮은 종(데이지·앵초), 안쪽엔 키큰 종(폭스글러브·알리움).
      const tall = pt.layer === 'back' || (pt.layer === 'mid' && pt.c > 0.45);
      PLANTERS[speciesAt(pt.x, pt.z, tall, rand())](B, pt.x, pt.z, rand);
    }

    // ── 재질 ──────────────────────────────────────────────────
    // flatShading = 각진 면이 살아 저폴리 결이 난다. vertexColors = 구워둔 그라데이션.
    const petalMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, flatShading: true });
    const leafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, flatShading: true });
    const centerMat = new THREE.MeshStandardMaterial({ color: COLOR.pollen, roughness: 0.7, metalness: 0, flatShading: true });
    const pomMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, metalness: 0, flatShading: true });
    const stemMat = new THREE.MeshStandardMaterial({ color: COLOR.leafDark, roughness: 0.95, metalness: 0 });

    // ── 버킷 → InstancedMesh ─────────────────────────────────
    const build = (geo: THREE.BufferGeometry, mat: THREE.Material, bucket: Bucket, cast = false, receive = false) => {
      const mesh = new THREE.InstancedMesh(geo, mat, bucket.length);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      for (let i = 0; i < bucket.length; i++) {
        mesh.setMatrixAt(i, bucket[i].m);
        mesh.setColorAt(i, bucket[i].c);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      return mesh;
    };

    const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 1, 5);
    return {
      stems: build(stemGeo, stemMat, B.stem),
      broad: build(makeLeafGeometry(), leafMat, B.broad, false, true),
      blade: build(makeBladeLeafGeometry(), leafMat, B.blade),
      spade: build(makePetalGeometry(), petalMat, B.spade, true),
      strap: build(makeStrapPetalGeometry(), petalMat, B.strap, true),
      bell: build(makeBellGeometry(), petalMat, B.bell, true),
      pom: build(makePomGeometry(), pomMat, B.pom, true),
      center: build(makeCenterGeometry(), centerMat, B.center),
    };
  }, []);

  return (
    <group>
      <primitive object={parts.stems} />
      <primitive object={parts.broad} />
      <primitive object={parts.blade} />
      <primitive object={parts.spade} />
      <primitive object={parts.strap} />
      <primitive object={parts.bell} />
      <primitive object={parts.pom} />
      <primitive object={parts.center} />
    </group>
  );
}
