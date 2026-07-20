'use client';

// 집 외관 — 정원 구석의 작은 동화풍 코티지(배경 오브젝트).
// "박스+삼각지붕"으로 보이지 않게: 석재 기초 · 하프팀버 골조 · 처마/용마루 · 박공 보드 +
// 다락창 · 굴뚝 갓 · 현관 차양 · 덧문 · 창가 화단으로 실루엣과 표면을 채운다.
// 안으로 들어가지 않으므로 외관만. 정면(+Z)에 문·창이 온다.

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { MAT } from '../materials';
import type { ColorKey } from '../palette';

const W = 3.4; //  벽 폭
const D = 2.8; //  벽 깊이
const WALL_H = 1.9; //  벽 높이 — 지붕을 크게 얹으려고 낮게(코티지 비율)
const ROOF_H = 1.5; //  지붕 높이
const PLINTH_H = 0.3; //  석재 기초 높이

const HW_ROOF = W / 2 + 0.32; //  지붕 반폭(좌우 처마 내밈)
const ROOF_D = D + 0.7; //  지붕 깊이(앞뒤 박공 내밈)
const WALL_TOP = PLINTH_H + WALL_H; //  벽 꼭대기(=지붕 밑면)
const APEX = WALL_TOP + ROOF_H; //  용마루 높이
const FRONT = D / 2; //  정면 벽 z
const GABLE_Z = ROOF_D / 2; //  앞 박공면 z

/** 삼각 프리즘(맞배지붕) 지오메트리. 지붕·현관 차양에 재사용. 용마루는 +Z로 뻗는다. */
function pitchGeo(hw: number, h: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(0, h);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** 창 하나 — 흰 틀 + 켜진 유리 + 창살 + 덧문 + 창가 화단. */
function Win() {
  const bloom: [number, ColorKey][] = [
    [-0.2, 'petalPink'],
    [0, 'petalYellow'],
    [0.2, 'petalLav'],
  ];
  return (
    <group>
      {/* 흰 틀 */}
      <RoundedBox args={[0.64, 0.64, 0.08]} radius={0.03} smoothness={2} material={MAT('glossy', 'metalWhite')} castShadow />
      {/* 켜진 유리 (밤에 은은히 발광) */}
      <mesh position={[0, 0, 0.04]} material={MAT('glow', 'lamp', { dayGlow: 0.12, nightGlow: 1.1 })}>
        <planeGeometry args={[0.5, 0.5]} />
      </mesh>
      {/* 창살 십자 */}
      <mesh position={[0, 0, 0.05]} material={MAT('glossy', 'metalWhite')}>
        <boxGeometry args={[0.52, 0.03, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.05]} material={MAT('glossy', 'metalWhite')}>
        <boxGeometry args={[0.03, 0.52, 0.02]} />
      </mesh>
      {/* 덧문 2짝 */}
      {[-1, 1].map((sx) => (
        <RoundedBox key={sx} args={[0.14, 0.66, 0.05]} radius={0.02} smoothness={2} position={[sx * 0.4, 0, 0]} material={MAT('matte', 'woodDark')} castShadow />
      ))}
      {/* 창가 화단 — 나무 상자 + 작은 꽃 + 잎 */}
      <group position={[0, -0.42, 0.06]}>
        <RoundedBox args={[0.72, 0.16, 0.16]} radius={0.03} smoothness={2} material={MAT('matte', 'wood')} castShadow />
        {bloom.map(([x, col], i) => (
          <mesh key={i} position={[x, 0.13, 0.02]} material={MAT('matte', col)}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
        ))}
        <mesh position={[0.34, 0.11, 0]} material={MAT('foliage', 'leaf')}>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
        <mesh position={[-0.34, 0.11, 0]} material={MAT('foliage', 'leaf')}>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

export default function House() {
  const geo = useMemo(
    () => ({
      roof: pitchGeo(HW_ROOF, ROOF_H, ROOF_D),
      portico: pitchGeo(0.72, 0.42, 0.8),
    }),
    [],
  );

  // 박공 보드(바지보드) — 앞 지붕 경사 두 변을 따라 두르는 나무 테두리.
  const bargeL = Math.hypot(HW_ROOF, ROOF_H); //  경사 길이
  const bargeA = Math.atan2(ROOF_H, HW_ROOF); //  경사각

  return (
    <group>
      {/* ── 석재 기초 ── 물체가 잔디 위에 앉도록 밑을 받친다 */}
      <RoundedBox args={[W + 0.28, PLINTH_H, D + 0.28]} radius={0.05} smoothness={2} position={[0, PLINTH_H / 2, 0]} material={MAT('rock', 'rock')} receiveShadow castShadow />

      {/* ── 벽 몸통 ── */}
      <RoundedBox args={[W, WALL_H, D]} radius={0.05} smoothness={2} position={[0, PLINTH_H + WALL_H / 2, 0]} material={MAT('matte', 'mint')} castShadow receiveShadow />

      {/* ── 하프팀버 골조 ── 네 모서리 기둥 + 처마 밑 상인방 + 정면 허리 띠 */}
      {([
        [W / 2, D / 2],
        [W / 2, -D / 2],
        [-W / 2, D / 2],
        [-W / 2, -D / 2],
      ] as [number, number][]).map(([x, z], i) => (
        <RoundedBox key={i} args={[0.14, WALL_H + 0.02, 0.14]} radius={0.03} smoothness={2} position={[x, PLINTH_H + WALL_H / 2, z]} material={MAT('matte', 'woodDark')} castShadow />
      ))}
      {/* 처마 밑 상인방(정면+양옆) */}
      <RoundedBox args={[W + 0.05, 0.14, 0.12]} radius={0.03} smoothness={2} position={[0, WALL_TOP - 0.08, FRONT]} material={MAT('matte', 'woodDark')} castShadow />
      {[-1, 1].map((sx) => (
        <RoundedBox key={sx} args={[0.12, 0.14, D]} radius={0.03} smoothness={2} position={[sx * W / 2, WALL_TOP - 0.08, 0]} material={MAT('matte', 'woodDark')} castShadow />
      ))}
      {/* 정면 허리 띠 */}
      <RoundedBox args={[W, 0.11, 0.1]} radius={0.02} smoothness={2} position={[0, PLINTH_H + WALL_H * 0.52, FRONT + 0.01]} material={MAT('matte', 'woodDark')} castShadow />

      {/* ── 지붕 ── */}
      <mesh geometry={geo.roof} position={[0, WALL_TOP, 0]} material={MAT('matte', 'roof')} castShadow receiveShadow />
      {/* 처마 fascia(좌우 끝) */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * HW_ROOF, WALL_TOP + 0.02, 0]} material={MAT('matte', 'woodDark')} castShadow>
          <boxGeometry args={[0.1, 0.2, ROOF_D]} />
        </mesh>
      ))}
      {/* 용마루 */}
      <mesh position={[0, APEX - 0.02, 0]} material={MAT('matte', 'woodDark')} castShadow>
        <boxGeometry args={[0.16, 0.14, ROOF_D]} />
      </mesh>
      {/* 앞 박공 바지보드 */}
      {[1, -1].map((sx) => (
        <mesh
          key={sx}
          position={[sx * -HW_ROOF / 2, WALL_TOP + ROOF_H / 2, GABLE_Z + 0.03]}
          rotation={[0, 0, sx * bargeA]}
          material={MAT('matte', 'woodDark')}
          castShadow
        >
          <boxGeometry args={[bargeL, 0.14, 0.1]} />
        </mesh>
      ))}

      {/* ── 다락 원형창(앞 박공) ── */}
      <group position={[0, WALL_TOP + ROOF_H * 0.5, GABLE_Z + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={MAT('glossy', 'metalWhite')} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 16]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} material={MAT('glow', 'lamp', { dayGlow: 0.12, nightGlow: 1.0 })}>
          <cylinderGeometry args={[0.17, 0.17, 0.02, 16]} />
        </mesh>
      </group>

      {/* ── 굴뚝 ── 좌측 뒤 경사에, 갓 + 연통 2개 */}
      <group position={[-W * 0.3, 0, -D * 0.12]}>
        <RoundedBox args={[0.44, 1.4, 0.44]} radius={0.05} smoothness={2} position={[0, WALL_TOP + 0.5, 0]} material={MAT('rock', 'rock')} castShadow />
        <RoundedBox args={[0.58, 0.14, 0.58]} radius={0.03} smoothness={2} position={[0, WALL_TOP + 1.22, 0]} material={MAT('matte', 'woodDark')} castShadow />
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, WALL_TOP + 1.36, 0]} material={MAT('matte', 'woodDark')} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.16, 10]} />
          </mesh>
        ))}
      </group>

      {/* ── 현관 차양 ── 두 기둥 + 작은 맞배지붕 */}
      <group position={[0, 0, FRONT]}>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, PLINTH_H + 0.72, 0.52]} material={MAT('matte', 'woodDark')} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 1.44, 10]} />
          </mesh>
        ))}
        <mesh geometry={geo.portico} position={[0, PLINTH_H + 1.44, 0.52]} material={MAT('matte', 'roof')} castShadow />
      </group>

      {/* ── 문 ── 슬래브 + 패널 2 + 손잡이 + 디딤돌 */}
      <group position={[0, 0, FRONT]}>
        <RoundedBox args={[0.74, 1.3, 0.1]} radius={0.04} smoothness={2} position={[0, PLINTH_H + 0.65, 0.02]} material={MAT('matte', 'wood')} castShadow />
        {[0.32, -0.28].map((y, i) => (
          <mesh key={i} position={[0, PLINTH_H + 0.65 + y, 0.08]} material={MAT('matte', 'woodDark')}>
            <boxGeometry args={[0.42, 0.4, 0.02]} />
          </mesh>
        ))}
        <mesh position={[0.24, PLINTH_H + 0.62, 0.1]} material={MAT('glossy', 'metalWhite')}>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
        <RoundedBox args={[0.96, 0.14, 0.34]} radius={0.04} smoothness={2} position={[0, PLINTH_H - 0.03, 0.28]} material={MAT('rock', 'rock')} receiveShadow castShadow />
      </group>

      {/* ── 창 2개(문 양옆) ── */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 1.02, PLINTH_H + 1.16, FRONT + 0.02]}>
          <Win />
        </group>
      ))}
    </group>
  );
}
