'use client';

// 집 외관 — 배경 오브젝트. 정원 구석에 놓이는 작은 코티지.
// 민트크림 벽 + 테라코타 지붕 + 창·문·굴뚝. 안으로 들어가지 않으므로 외관만.

import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { MAT } from '../materials';

const W = 3.2; //  폭
const D = 2.6; //  깊이
const WALL_H = 2.2; //  벽 높이
const ROOF_H = 1.3; //  지붕 높이

/** 삼각 프리즘 지붕 — Shape을 밀어 만든다. */
function roofGeo() {
  const s = new THREE.Shape();
  const hw = W / 2 + 0.25;
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(0, ROOF_H);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: D + 0.5, bevelEnabled: false });
  geo.translate(0, 0, -(D + 0.5) / 2);
  return geo;
}

export default function House() {
  return (
    <group>
      {/* 벽 몸통 */}
      <RoundedBox args={[W, WALL_H, D]} radius={0.06} smoothness={2} position={[0, WALL_H / 2, 0]} material={MAT('matte', 'mint')} castShadow receiveShadow />

      {/* 지붕 */}
      <mesh geometry={roofGeo()} position={[0, WALL_H, 0]} material={MAT('matte', 'roof')} castShadow />

      {/* 굴뚝 */}
      <RoundedBox args={[0.4, 0.9, 0.4]} radius={0.05} smoothness={2} position={[W * 0.28, WALL_H + 0.7, -D * 0.15]} material={MAT('matte', 'roof')} castShadow />

      {/* 문 */}
      <RoundedBox args={[0.7, 1.35, 0.08]} radius={0.04} smoothness={2} position={[0, 0.68, D / 2 + 0.01]} material={MAT('matte', 'wood')} castShadow />
      <mesh position={[0.22, 0.68, D / 2 + 0.06]} material={MAT('glossy', 'metalWhite')}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>

      {/* 창문 2개 — 켜진 유리 + 흰 틀 */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.95, 1.35, D / 2 + 0.02]}>
          <RoundedBox args={[0.62, 0.62, 0.06]} radius={0.03} smoothness={2} material={MAT('glossy', 'metalWhite')} castShadow />
          <mesh position={[0, 0, 0.04]} material={MAT('glow', 'lamp', { dayGlow: 0.15, nightGlow: 1.1 })}>
            <planeGeometry args={[0.48, 0.48]} />
          </mesh>
          {/* 창살 십자 */}
          <mesh position={[0, 0, 0.05]} material={MAT('glossy', 'metalWhite')}>
            <boxGeometry args={[0.5, 0.03, 0.02]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} material={MAT('glossy', 'metalWhite')}>
            <boxGeometry args={[0.03, 0.5, 0.02]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
