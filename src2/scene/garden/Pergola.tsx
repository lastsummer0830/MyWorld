'use client';

// 퍼걸러 — 정원의 중심 구조물.
// 흰 주철 기둥 4개 + 격자 지붕 + 장미덩굴 + 아래 매달린 그네벤치.
// 치수는 상단 const로 (매직넘버 금지). 모든 색·재질은 COLOR/MAT 경유.

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { MAT } from '../materials';
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

/** 장미덩굴 — 지붕 보와 뒤쪽 두 기둥을 타고 오르는 잎·꽃 덩어리. */
function Roses() {
  const blobs = useMemo(() => {
    const rand = mulberry32(2025);
    const items: { p: [number, number, number]; s: number; rose: boolean }[] = [];
    // 지붕 가장자리를 따라
    const edge = HALF + 0.05;
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2;
      const onX = rand() > 0.5;
      const t = (rand() - 0.5) * 2 * edge;
      const base: [number, number, number] = onX
        ? [t, POST_H + BEAM * (0.9 + rand() * 0.9), Math.sign(Math.cos(a)) * edge]
        : [Math.sign(Math.sin(a)) * edge, POST_H + BEAM * (0.9 + rand() * 0.9), t];
      items.push({ p: base, s: 0.22 + rand() * 0.22, rose: rand() > 0.62 });
    }
    // 뒤쪽 기둥(-x,-z)을 타고 오르는 덩굴
    for (let i = 0; i < 12; i++) {
      const h = 0.4 + rand() * (POST_H - 0.5);
      const jitter = () => (rand() - 0.5) * 0.28;
      items.push({
        p: [-HALF + jitter(), h, -HALF + jitter()],
        s: 0.18 + rand() * 0.18,
        rose: rand() > 0.66,
      });
    }
    return items;
  }, []);

  return (
    <>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} material={b.rose ? MAT('matte', 'rose') : MAT('foliage', 'leaf')} castShadow>
          <icosahedronGeometry args={[b.s, b.rose ? 0 : 1]} />
        </mesh>
      ))}
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
