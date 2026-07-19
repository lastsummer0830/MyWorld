'use client';

// 강아지 — 정원의 주인공. 블루멀 셸티 · 오드아이 (조아진의 실제 반려견).
// 크림색 몸에 회청색(merle) 무늬, 뾰족한 주둥이, 앞으로 접힌 귀, 풍성한 꼬리.
// 순수 프리미티브 조합. 몸은 +x를 향하고, 배치 회전은 layout에서 준다.
// 고개를 살짝 들어 나비를 올려다본다.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAT } from '../materials';

const cream = () => MAT('matte', 'dogCream');
const slate = () => MAT('matte', 'dogSlate');
const brown = () => MAT('matte', 'dogBrown');
const ink = () => MAT('glossy', 'dogInk');

export default function Dog() {
  const root = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);

  // 가만히 서서 숨 쉬고 꼬리를 흔든다 — 멈춰 있으면 인형처럼 보인다.
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) {
      root.current.position.y = Math.sin(t * 2.1) * 0.015; //  숨결
      root.current.rotation.z = Math.sin(t * 2.1) * 0.01;
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * 6) * 0.5; //  꼬리 살랑
  });

  return (
    <group ref={root}>
      {/* ── 다리 4개 ── */}
      {([
        [0.28, 0.13],
        [0.28, -0.13],
        [-0.22, 0.13],
        [-0.22, -0.13],
      ] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.17, z]} material={cream()} castShadow>
          <capsuleGeometry args={[0.05, 0.24, 3, 8]} />
        </mesh>
      ))}
      {/* 발 */}
      {([
        [0.28, 0.13],
        [0.28, -0.13],
        [-0.22, 0.13],
        [-0.22, -0.13],
      ] as [number, number][]).map(([x, z], i) => (
        <mesh key={`f${i}`} position={[x, 0.04, z + 0.02]} material={brown()} castShadow>
          <sphereGeometry args={[0.055, 10, 8]} />
        </mesh>
      ))}

      {/* ── 몸통 ── */}
      <mesh position={[0.03, 0.36, 0]} rotation={[0, 0, Math.PI / 2]} material={cream()} castShadow receiveShadow>
        <capsuleGeometry args={[0.16, 0.4, 5, 12]} />
      </mesh>
      {/* 등의 merle 무늬 — 살짝 눌러 얹은 회청색 */}
      <mesh position={[0.0, 0.5, 0]} scale={[1.1, 0.5, 0.9]} material={slate()} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
      </mesh>
      {/* 가슴 갈기(러프) — 셸티의 상징. 앞가슴에 풍성하게 */}
      <mesh position={[0.32, 0.34, 0]} scale={[0.8, 1, 1.05]} material={cream()} castShadow>
        <sphereGeometry args={[0.18, 16, 14]} />
      </mesh>

      {/* ── 머리 ── (살짝 위로 든 각도) */}
      <group position={[0.44, 0.56, 0]} rotation={[0, 0, 0.32]}>
        {/* 두개골 */}
        <mesh material={cream()} castShadow>
          <sphereGeometry args={[0.15, 18, 16]} />
        </mesh>
        {/* 정수리 merle 패치 */}
        <mesh position={[-0.02, 0.08, 0]} scale={[0.9, 0.7, 1.02]} material={slate()} castShadow>
          <sphereGeometry args={[0.13, 14, 12]} />
        </mesh>
        {/* 주둥이 */}
        <mesh position={[0.16, -0.03, 0]} rotation={[0, 0, -Math.PI / 2]} material={cream()} castShadow>
          <coneGeometry args={[0.075, 0.22, 12]} />
        </mesh>
        {/* 주둥이 위 브라운 */}
        <mesh position={[0.14, 0.0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.7]} material={brown()} castShadow>
          <coneGeometry args={[0.055, 0.16, 10]} />
        </mesh>
        {/* 코 */}
        <mesh position={[0.27, -0.02, 0]} material={ink()} castShadow>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>

        {/* 귀 2개 — 앞으로 접힌 삼각. 위쪽은 slate, 끝만 살짝 접힘 */}
        {[0.09, -0.09].map((z, i) => (
          <group key={i} position={[-0.04, 0.13, z]} rotation={[i === 0 ? 0.35 : -0.35, 0, 0.15]}>
            <mesh material={slate()} castShadow>
              <coneGeometry args={[0.055, 0.13, 4]} />
            </mesh>
            <mesh position={[0.01, 0.07, 0]} rotation={[0, 0, 0.5]} material={cream()} castShadow>
              <coneGeometry args={[0.03, 0.05, 4]} />
            </mesh>
          </group>
        ))}

        {/* 오드아이 — 한쪽 파랑, 한쪽 갈색(호박) */}
        <mesh position={[0.11, 0.03, 0.07]} material={MAT('glossy', 'eyeBlue')}>
          <sphereGeometry args={[0.028, 10, 8]} />
        </mesh>
        <mesh position={[0.11, 0.03, -0.07]} material={MAT('glossy', 'dogBrown')}>
          <sphereGeometry args={[0.028, 10, 8]} />
        </mesh>
        {/* 눈동자 */}
        <mesh position={[0.13, 0.03, 0.07]} material={ink()}>
          <sphereGeometry args={[0.013, 8, 6]} />
        </mesh>
        <mesh position={[0.13, 0.03, -0.07]} material={ink()}>
          <sphereGeometry args={[0.013, 8, 6]} />
        </mesh>
      </group>

      {/* ── 꼬리 ── 풍성하게 위로 말린 플룸 (살랑살랑) */}
      <group ref={tail} position={[-0.34, 0.4, 0]} rotation={[0, 0, 0.9]}>
        <mesh material={cream()} castShadow>
          <capsuleGeometry args={[0.07, 0.16, 4, 10]} />
        </mesh>
        <mesh position={[0.02, 0.16, 0]} scale={[1, 1.2, 1]} material={cream()} castShadow>
          <sphereGeometry args={[0.09, 12, 10]} />
        </mesh>
        <mesh position={[0.0, 0.06, 0]} scale={[0.7, 1, 0.8]} material={slate()} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
      </group>
    </group>
  );
}
