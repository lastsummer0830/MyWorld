"use client";

import * as THREE from "three";
import { PhaseGroup } from "../room/AnimatedWrapper";

interface PicnicProps {
  position:   [number, number, number];
  baseDelay?: number;
}

// 피크닉 매트 + 파라솔 + 바구니 — 옛 모닥불 자리의 여름 소품
export default function Picnic({ position, baseDelay = 0 }: PicnicProps) {
  return (
    <group position={position} rotation={[0, -0.5, 0]}>

      {/* ── Phase 1: 매트 (레드 + 화이트 스트라이프) ── */}
      <PhaseGroup delay={baseDelay}>
        <mesh position={[0, 0.012, 0]} receiveShadow>
          <boxGeometry args={[1.9, 0.024, 1.5]} />
          <meshStandardMaterial color="#E85D5D" roughness={0.9} />
        </mesh>
        {[-0.55, 0, 0.55].map((x, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.026, 0]}>
            <planeGeometry args={[0.22, 1.5]} />
            <meshStandardMaterial color="#FFF4E8" roughness={0.9} />
          </mesh>
        ))}
      </PhaseGroup>

      {/* ── Phase 2: 파라솔 ── */}
      <PhaseGroup delay={baseDelay + 0.2}>
        {/* 기둥 — 살짝 기울여 그늘 연출 */}
        <group position={[-0.75, 0, -0.55]} rotation={[0.10, 0, -0.12]}>
          <mesh position={[0, 1.05, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 2.1, 6]} />
            <meshStandardMaterial color="#B08954" roughness={0.8} />
          </mesh>
          {/* 캐노피 (코랄 톤) */}
          <mesh position={[0, 2.10, 0]} castShadow>
            <coneGeometry args={[1.15, 0.52, 8]} />
            <meshStandardMaterial color="#FF8A65" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          {/* 캐노피 꼭지 */}
          <mesh position={[0, 2.42, 0]}>
            <sphereGeometry args={[0.055, 6, 5]} />
            <meshStandardMaterial color="#B08954" roughness={0.8} />
          </mesh>
        </group>
      </PhaseGroup>

      {/* ── Phase 3: 바구니 + 간식 ── */}
      <PhaseGroup delay={baseDelay + 0.38}>
        {/* 바구니 */}
        <mesh position={[0.55, 0.11, -0.35]} castShadow>
          <cylinderGeometry args={[0.19, 0.15, 0.20, 8]} />
          <meshStandardMaterial color="#A9743F" roughness={0.95} />
        </mesh>
        {/* 바구니 손잡이 */}
        <mesh position={[0.55, 0.23, -0.35]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.14, 0.018, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#8A5A2B" roughness={0.9} />
        </mesh>
        {/* 접시 + 과일 */}
        <mesh position={[-0.25, 0.035, 0.30]}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 12]} />
          <meshStandardMaterial color="#FFFDF5" roughness={0.4} />
        </mesh>
        <mesh position={[-0.30, 0.10, 0.27]}>
          <sphereGeometry args={[0.055, 7, 6]} />
          <meshStandardMaterial color="#E53935" roughness={0.5} />
        </mesh>
        <mesh position={[-0.19, 0.095, 0.34]}>
          <sphereGeometry args={[0.048, 7, 6]} />
          <meshStandardMaterial color="#FFA726" roughness={0.5} />
        </mesh>
      </PhaseGroup>

    </group>
  );
}
