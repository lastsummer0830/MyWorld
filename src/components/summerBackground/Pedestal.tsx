"use client";

import React from "react";

interface PedestalProps {
  radius?: number;
}

export default function Pedestal({ radius = 10 }: PedestalProps) {
  return (
    <group name="pedestal-root">
      {/* 메인 목재 받침대 — 밝은 여름 우드톤 */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius + 0.3, radius + 1.0, 0.8, 32]} />
        <meshStandardMaterial color="#8B5E34" roughness={1} />
      </mesh>

      {/* 상단 금속 장식 테두리 */}
      <mesh position={[0, 0.82, 0]}>
        <torusGeometry args={[radius + 0.15, 0.12, 16, 64]} />
        <meshStandardMaterial color="#E6C78A" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
