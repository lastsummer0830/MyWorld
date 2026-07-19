'use client';

// 퍼걸러 — 정원의 중심 구조물.
// 흰 주철 기둥 4개 + 격자 지붕 + 장미덩굴 + 아래 매달린 그네벤치.
// 치수는 상단 const로 (매직넘버 금지). 모든 색·재질은 COLOR/MAT 경유.

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { COLOR, type ColorKey } from '../palette';
import { MAT } from '../materials';
import { makeCenterGeometry, makeLeafGeometry, makePetalGeometry } from './flowerGeometry';
import { mulberry32 } from './rng';

const POST_H = 2.7; //  기둥 높이
const POST_R = 0.075; //  기둥 반지름
const HALF = 2.05; //  기둥이 놓이는 반너비 (한 변 4.1m)
const BEAM = 0.14; //  지붕 보 두께
const SLATS = 6; //  격자 살 개수(한 방향)

const white = () => MAT('glossy', 'metalWhite'); //  흰 주철 — 살짝 광택
const rope = () => MAT('matte', 'woodDark');

/** 지붕 격자 살 한 방향. */
function Lattice({ along }: { along: 'x' | 'z' }) {
  const y = POST_H + BEAM * 1.2;
  const slats = [];
  for (let i = 0; i < SLATS; i++) {
    const t = (i / (SLATS - 1) - 0.5) * 2 * HALF;
    const pos: [number, number, number] = along === 'x' ? [0, y, t] : [t, y, 0];
    const size: [number, number, number] =
      along === 'x' ? [HALF * 2 + 0.5, BEAM * 0.7, BEAM * 0.7] : [BEAM * 0.7, BEAM * 0.7, HALF * 2 + 0.5];
    slats.push(
      <RoundedBox key={i} args={size} radius={BEAM * 0.3} smoothness={2} position={pos} material={white()} castShadow />,
    );
  }
  return <>{slats}</>;
}

// 장미 한 송이의 꽃잎 배치 — 바깥은 벌어지고 안쪽은 오므린 여러 겹(layered) 컵.
//   pitch가 클수록 꽃잎이 서서 오므라든다 = 장미 특유의 겹꽃. (활짝 벌어진 프림로즈는 pitch가 작다)
const ROSE_RINGS = [
  { count: 6, pitch: 0.8, scale: 1.0, yaw: 0 },
  { count: 5, pitch: 1.15, scale: 0.66, yaw: 0.55 },
  { count: 3, pitch: 1.5, scale: 0.4, yaw: 1.1 },
];
const ROSE_PETALS = ROSE_RINGS.reduce((n, r) => n + r.count, 0); //  겹당 합
const ROSE_COLORS: ColorKey[] = ['rose', 'petalPink', 'petalCoral'];
const LEAF_COLORS: ColorKey[] = ['leaf', 'leafDeep', 'leafDark'];
const LEAVES_PER_CLUMP = 5;

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qy = new THREE.Quaternion();
const _qp = new THREE.Quaternion();
const _sc = new THREE.Vector3();
const _col = new THREE.Color();
const _AX = new THREE.Vector3(1, 0, 0);
const _AY = new THREE.Vector3(0, 1, 0);
const _2PI = Math.PI * 2;

/** 장미덩굴 — 지붕 보와 뒤쪽 두 기둥을 타고 오르는 겹꽃 장미 + 각진 잎 덤불. */
function Roses() {
  const parts = useMemo(() => {
    const rand = mulberry32(2025);
    const roses: { p: [number, number, number]; s: number; color: ColorKey }[] = [];
    const clumps: { p: [number, number, number]; s: number }[] = [];
    const push = (p: [number, number, number], s: number) => {
      if (rand() > 0.6) roses.push({ p, s, color: ROSE_COLORS[(rand() * ROSE_COLORS.length) | 0] });
      else clumps.push({ p, s });
    };
    // 지붕 가장자리를 따라 — 촘촘히 얹어 덩굴이 풍성하게 보이도록.
    const edge = HALF + 0.05;
    for (let i = 0; i < 40; i++) {
      const a = rand() * Math.PI * 2;
      const onX = rand() > 0.5;
      const t = (rand() - 0.5) * 2 * edge;
      push(
        onX
          ? [t, POST_H + BEAM * (0.9 + rand() * 1.0), Math.sign(Math.cos(a)) * edge]
          : [Math.sign(Math.sin(a)) * edge, POST_H + BEAM * (0.9 + rand() * 1.0), t],
        0.17 + rand() * 0.13,
      );
    }
    // 뒤쪽 기둥(-x,-z)을 타고 오르는 덩굴
    for (let i = 0; i < 20; i++) {
      const h = 0.4 + rand() * (POST_H - 0.5);
      const jitter = () => (rand() - 0.5) * 0.32;
      push([-HALF + jitter(), h, -HALF + jitter()], 0.14 + rand() * 0.11);
    }

    // ── 잎 덤불(instanced) ──
    const leafMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, flatShading: true,
    });
    const leaves = new THREE.InstancedMesh(makeLeafGeometry(), leafMat, clumps.length * LEAVES_PER_CLUMP);
    leaves.castShadow = true;
    let li = 0;
    clumps.forEach((c, ci) => {
      for (let k = 0; k < LEAVES_PER_CLUMP; k++) {
        const az = ci * 1.7 + (k / LEAVES_PER_CLUMP) * _2PI;
        const pitch = -0.3 + Math.sin(ci + k) * 0.5; //  사방으로 뻗되 아래로도 처지게(덩굴 느낌)
        _qp.setFromAxisAngle(_AX, -pitch);
        _qy.setFromAxisAngle(_AY, az);
        _q.copy(_qy).multiply(_qp);
        _p.set(...c.p);
        _sc.setScalar(c.s * (0.9 + (k % 2) * 0.4));
        leaves.setMatrixAt(li, _m.compose(_p, _q, _sc));
        leaves.setColorAt(li, _col.set(COLOR[LEAF_COLORS[k % LEAF_COLORS.length]]));
        li++;
      }
    });
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;

    // ── 장미 꽃잎(instanced) + 중심 ──
    const petalMat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, flatShading: true,
    });
    const petals = new THREE.InstancedMesh(makePetalGeometry(), petalMat, roses.length * ROSE_PETALS);
    petals.castShadow = true;
    const centerMat = new THREE.MeshStandardMaterial({ color: COLOR.pollen, roughness: 0.7, flatShading: true });
    const centers = new THREE.InstancedMesh(makeCenterGeometry(), centerMat, roses.length);
    let pi = 0;
    roses.forEach((r, ri) => {
      _col.set(COLOR[r.color]);
      for (const ring of ROSE_RINGS) {
        for (let j = 0; j < ring.count; j++) {
          const az = ring.yaw + ri + (j / ring.count) * _2PI;
          _qp.setFromAxisAngle(_AX, -ring.pitch);
          _qy.setFromAxisAngle(_AY, az);
          _q.copy(_qy).multiply(_qp);
          _p.set(...r.p);
          _sc.setScalar(r.s * ring.scale);
          petals.setMatrixAt(pi, _m.compose(_p, _q, _sc));
          petals.setColorAt(pi, _col);
          pi++;
        }
      }
      _p.set(r.p[0], r.p[1] + r.s * 0.1, r.p[2]);
      _q.identity();
      _sc.setScalar(r.s * 0.4);
      centers.setMatrixAt(ri, _m.compose(_p, _q, _sc));
    });
    petals.instanceMatrix.needsUpdate = true;
    if (petals.instanceColor) petals.instanceColor.needsUpdate = true;
    centers.instanceMatrix.needsUpdate = true;

    return { leaves, petals, centers };
  }, []);

  return (
    <>
      <primitive object={parts.leaves} />
      <primitive object={parts.petals} />
      <primitive object={parts.centers} />
    </>
  );
}

/** 그네벤치 — 앞쪽 보에서 밧줄 두 가닥으로 매달린다. */
function SwingBench() {
  const seatY = 0.92;
  const seatW = 2.2;
  const seatD = 0.62;
  const ropeTopY = POST_H;
  const ropeX = seatW / 2 - 0.12;
  const ropeLen = ropeTopY - seatY;
  const ropeMidY = (ropeTopY + seatY) / 2;
  const seatZ = HALF - 0.55; //  퍼걸러 앞쪽에 살짝 당겨 앉힌다

  return (
    <group position={[0, 0, seatZ]}>
      {/* 밧줄 2가닥 */}
      {[-ropeX, ropeX].map((x, i) => (
        <mesh key={i} position={[x, ropeMidY, 0]} material={rope()} castShadow>
          <cylinderGeometry args={[0.022, 0.022, ropeLen, 8]} />
        </mesh>
      ))}
      {/* 좌판 */}
      <RoundedBox args={[seatW, 0.12, seatD]} radius={0.05} smoothness={3} position={[0, seatY, 0]} material={MAT('matte', 'wood')} castShadow receiveShadow />
      {/* 등받이 */}
      <RoundedBox args={[seatW, 0.5, 0.1]} radius={0.05} smoothness={3} position={[0, seatY + 0.28, -seatD / 2 + 0.06]} material={MAT('matte', 'wood')} castShadow />
      {/* 쿠션 */}
      <RoundedBox args={[seatW - 0.3, 0.12, seatD - 0.16]} radius={0.06} smoothness={3} position={[0, seatY + 0.11, 0.02]} material={MAT('fabric', 'fabric')} castShadow />
    </group>
  );
}

export default function Pergola() {
  const posts: [number, number][] = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [-HALF, HALF],
    [HALF, HALF],
  ];

  return (
    <group>
      {/* 기둥 4개 + 발밑 굽 */}
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, POST_H / 2, 0]} material={white()} castShadow>
            <cylinderGeometry args={[POST_R, POST_R * 1.15, POST_H, 12]} />
          </mesh>
          <mesh position={[0, 0.06, 0]} material={white()} castShadow receiveShadow>
            <cylinderGeometry args={[POST_R * 2.1, POST_R * 2.4, 0.12, 12]} />
          </mesh>
          {/* 기둥 머리 장식 */}
          <mesh position={[0, POST_H + 0.02, 0]} material={white()} castShadow>
            <sphereGeometry args={[POST_R * 1.6, 12, 10]} />
          </mesh>
        </group>
      ))}

      {/* 둘레 보 4개 */}
      {[-HALF, HALF].map((z, i) => (
        <RoundedBox key={`bx${i}`} args={[HALF * 2 + 0.4, BEAM, BEAM]} radius={BEAM * 0.35} smoothness={2} position={[0, POST_H + BEAM * 0.4, z]} material={white()} castShadow />
      ))}
      {[-HALF, HALF].map((x, i) => (
        <RoundedBox key={`bz${i}`} args={[BEAM, BEAM, HALF * 2 + 0.4]} radius={BEAM * 0.35} smoothness={2} position={[x, POST_H + BEAM * 0.4, 0]} material={white()} castShadow />
      ))}

      <Lattice along="x" />
      <Lattice along="z" />
      <Roses />
      <SwingBench />
    </group>
  );
}
