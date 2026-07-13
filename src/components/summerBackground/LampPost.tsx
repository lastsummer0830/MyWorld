"use client";

import React, { forwardRef } from "react";
import * as THREE from "three";
import { PhaseGroup } from "../room/AnimatedWrapper";

// lightRef를 외부(SummerBackground)에서 받아서
// 단일 useFrame으로 통합 관리
// 겨울 버전과 동일 구조 — 지붕 위 눈 레이어만 제거하고 다크 그린 정원등 톤으로
const LampPost = forwardRef<THREE.PointLight, {
  position:  [number, number, number];
  baseDelay?: number;
}>(function LampPost({ position, baseDelay = 0 }, lightRef) {
  const dark = "#22362C"; // 딥 가든 그린
  const dm = { color: dark, roughness: 0.65 as number, metalness: 0.55 as number };

  return (
    <group position={position}>

      {/* ── Phase 1: 받침대 ── */}
      <PhaseGroup delay={baseDelay}>
        <mesh position={[0, 0.065, 0]} castShadow>
          <boxGeometry args={[0.32, 0.13, 0.32]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        <mesh position={[0, 0.155, 0]}>
          <boxGeometry args={[0.24, 0.07, 0.24]} />
          <meshStandardMaterial {...dm} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 2: 기둥 ── */}
      <PhaseGroup delay={baseDelay + 0.2}>
        <mesh position={[0, 1.10, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.088, 1.80, 8]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        {[0.36, 0.70, 1.14].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[0.064, 0.064, 0.046, 8]} />
            <meshStandardMaterial {...dm} />
          </mesh>
        ))}
      </PhaseGroup>

      {/* ── Phase 3: 등 머리 ── */}
      <PhaseGroup delay={baseDelay + 0.38}>
        <mesh position={[0, 2.015, 0]}>
          <cylinderGeometry args={[0.060, 0.038, 0.16, 8]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        <mesh position={[0, 2.100, 0]}>
          <boxGeometry args={[0.29, 0.040, 0.29]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        {([ [-1,-1],[1,-1],[1,1],[-1,1] ] as [number,number][]).map(([sx, sz], i) => (
          <mesh key={i} position={[sx * 0.118, 2.245, sz * 0.118]}>
            <boxGeometry args={[0.026, 0.29, 0.026]} />
            <meshStandardMaterial {...dm} />
          </mesh>
        ))}
        <mesh position={[0, 2.245, 0]}>
          <boxGeometry args={[0.262, 0.018, 0.018]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        <mesh position={[0, 2.245, 0]}>
          <boxGeometry args={[0.018, 0.018, 0.262]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        {[
          { pos: [0,       2.245,  0.120] as [number,number,number], ry: 0 },
          { pos: [0,       2.245, -0.120] as [number,number,number], ry: Math.PI },
          { pos: [ 0.120,  2.245,  0   ] as [number,number,number], ry:  Math.PI / 2 },
          { pos: [-0.120,  2.245,  0   ] as [number,number,number], ry: -Math.PI / 2 },
        ].map((p, i) => (
          <mesh key={i} position={p.pos} rotation={[0, p.ry, 0]}>
            <planeGeometry args={[0.224, 0.27]} />
            <meshStandardMaterial
              color="#FFFBE8"
              emissive="#FFBB44"
              emissiveIntensity={1.8}
              transparent
              opacity={0.48}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
        <mesh position={[0, 2.390, 0]}>
          <boxGeometry args={[0.29, 0.040, 0.29]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        <mesh position={[0, 2.510, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.200, 0.24, 4]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        <mesh position={[0, 2.642, 0]}>
          <sphereGeometry args={[0.040, 7, 7]} />
          <meshStandardMaterial {...dm} />
        </mesh>
        <mesh position={[0, 2.698, 0]}>
          <coneGeometry args={[0.022, 0.092, 6]} />
          <meshStandardMaterial {...dm} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 4: 불빛 ── */}
      <PhaseGroup delay={baseDelay + 0.55}>
        <pointLight
          ref={lightRef}
          position={[0, 2.24, 0]}
          color="#FFD97A"
          distance={10}
          decay={2}
        />
      </PhaseGroup>

    </group>
  );
});

export default LampPost;
