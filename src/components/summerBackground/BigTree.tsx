"use client";

import { PhaseGroup } from "../room/AnimatedWrapper";

// 캐노피 잎 덩이 배치 (x, y, z, 반경, 색)
const CANOPY = [
  { x:  0.0, y: 4.6, z:  0.0, r: 2.30, color: "#3E7C3A" }, // 중심 대형
  { x:  1.6, y: 4.0, z:  0.8, r: 1.55, color: "#549E46" },
  { x: -1.5, y: 4.2, z:  0.9, r: 1.45, color: "#4C9040" },
  { x:  0.6, y: 4.1, z: -1.6, r: 1.50, color: "#549E46" },
  { x: -0.9, y: 3.8, z: -1.2, r: 1.30, color: "#66B152" },
  { x:  0.2, y: 5.9, z:  0.2, r: 1.40, color: "#66B152" }, // 꼭대기 밝은 톤
];

interface Props {
  position: [number, number, number];
  baseDelay?: number;
}

// 정원의 상징이 되는 큰 나무 — 풍성한 캐노피 + 가지에 매달린 그네
export default function BigTree({ position, baseDelay = 0 }: Props) {
  return (
    <group position={position}>
      {/* ── Phase 1: 기둥 + 뿌리 ── */}
      <PhaseGroup delay={baseDelay}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.62, 3.0, 8]} />
          <meshStandardMaterial color="#5B4028" roughness={0.95} />
        </mesh>
        {/* 밑동 뿌리 (낮은 원뿔) */}
        <mesh position={[0, 0.18, 0]}>
          <coneGeometry args={[0.95, 0.5, 7]} />
          <meshStandardMaterial color="#4E3620" roughness={1} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 2: 그네용 가지 ── */}
      <PhaseGroup delay={baseDelay + 0.2}>
        <mesh position={[1.35, 3.35, 0]} rotation={[0, 0, -1.35]} castShadow>
          <cylinderGeometry args={[0.10, 0.16, 2.6, 6]} />
          <meshStandardMaterial color="#5B4028" roughness={0.95} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 3: 캐노피 (잎 덩이들) ── */}
      {CANOPY.map((c, i) => (
        <PhaseGroup key={i} delay={baseDelay + 0.36 + i * 0.07}>
          <mesh position={[c.x, c.y, c.z]} castShadow>
            <dodecahedronGeometry args={[c.r, 0]} />
            <meshStandardMaterial color={c.color} roughness={0.9} />
          </mesh>
        </PhaseGroup>
      ))}

      {/* ── Phase 4: 그네 (로프 + 나무 좌판) ── */}
      <PhaseGroup delay={baseDelay + 0.85}>
        <mesh position={[1.75, 2.25, -0.22]}>
          <cylinderGeometry args={[0.020, 0.020, 1.9, 5]} />
          <meshStandardMaterial color="#C9A876" roughness={1} />
        </mesh>
        <mesh position={[1.75, 2.25, 0.22]}>
          <cylinderGeometry args={[0.020, 0.020, 1.9, 5]} />
          <meshStandardMaterial color="#C9A876" roughness={1} />
        </mesh>
        <mesh position={[1.75, 1.30, 0]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.62]} />
          <meshStandardMaterial color="#A9743F" roughness={0.85} />
        </mesh>
      </PhaseGroup>
    </group>
  );
}
