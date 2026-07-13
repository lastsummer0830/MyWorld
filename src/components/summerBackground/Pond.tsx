"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PhaseGroup } from "../room/AnimatedWrapper";

// 물가 돌 배치 (각도, 반경 비율, 스케일)
const STONES = [
  { a: 0.4,  rr: 1.02, s: 0.30, color: "#8D8D85" },
  { a: 1.3,  rr: 0.98, s: 0.22, color: "#9C9C92" },
  { a: 2.2,  rr: 1.05, s: 0.34, color: "#7E7E76" },
  { a: 3.1,  rr: 1.00, s: 0.20, color: "#96968C" },
  { a: 4.0,  rr: 1.04, s: 0.28, color: "#88887E" },
  { a: 4.9,  rr: 0.97, s: 0.24, color: "#A0A096" },
  { a: 5.7,  rr: 1.03, s: 0.31, color: "#8A8A80" },
];

// 수련잎 (반경 비율 x/z, 스케일, 위상)
const LILIES = [
  { x: -0.30, z:  0.15, s: 0.34, phase: 0.0, hasFlower: true  },
  { x:  0.25, z: -0.28, s: 0.28, phase: 1.7, hasFlower: false },
  { x:  0.05, z:  0.40, s: 0.24, phase: 3.4, hasFlower: false },
  { x: -0.42, z: -0.30, s: 0.30, phase: 5.1, hasFlower: true  },
];

export default function Pond({
  position,
  radius = 3.0,
  baseDelay = 0,
}: {
  position: [number, number, number];
  radius?: number;
  baseDelay?: number;
}) {
  const waterRef = useRef<THREE.Mesh>(null!);
  const hi1Ref   = useRef<THREE.Mesh>(null!);
  const hi2Ref   = useRef<THREE.Mesh>(null!);
  const lilyRefs = useRef<(THREE.Group | null)[]>(Array(LILIES.length).fill(null));

  const lilyBaseY = useMemo(() => LILIES.map(() => 0.035), []);

  // 물 표면 일렁임 — 하이라이트 드리프트 + 수련잎 미세 부유 (단일 useFrame)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (waterRef.current) {
      // 수면이 아주 살짝 숨쉬듯 스케일 변화
      const s = 1 + Math.sin(t * 0.8) * 0.004;
      waterRef.current.scale.set(s, s, 1);
    }
    if (hi1Ref.current) {
      hi1Ref.current.position.x = radius * ( 0.12 + Math.sin(t * 0.45) * 0.10);
      hi1Ref.current.position.z = radius * (-0.10 + Math.cos(t * 0.38) * 0.08);
    }
    if (hi2Ref.current) {
      hi2Ref.current.position.x = radius * (-0.22 + Math.cos(t * 0.52) * 0.08);
      hi2Ref.current.position.z = radius * ( 0.18 + Math.sin(t * 0.41) * 0.09);
    }
    for (let i = 0; i < LILIES.length; i++) {
      const g = lilyRefs.current[i];
      if (g) g.position.y = lilyBaseY[i] + Math.sin(t * 0.9 + LILIES[i].phase) * 0.008;
    }
  });

  return (
    <group position={position}>
      {/* ── Phase 1: 모래 테두리 ── */}
      <PhaseGroup delay={baseDelay}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
          <ringGeometry args={[radius * 0.88, radius, 24]} />
          <meshStandardMaterial color="#C9B98A" roughness={1} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 2: 물 표면 (반투명 블루그린) ── */}
      <PhaseGroup delay={baseDelay + 0.18}>
        <mesh ref={waterRef} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <circleGeometry args={[radius * 0.88, 24]} />
          <meshStandardMaterial
            color="#3FA8BF"
            roughness={0.12}
            metalness={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* 일렁이는 수면 하이라이트 */}
        <mesh ref={hi1Ref} rotation-x={-Math.PI / 2} position={[radius * 0.12, 0.028, -radius * 0.1]}>
          <circleGeometry args={[radius * 0.20, 10]} />
          <meshBasicMaterial color="#BFEFF8" transparent opacity={0.30} depthWrite={false} />
        </mesh>
        <mesh ref={hi2Ref} rotation-x={-Math.PI / 2} position={[-radius * 0.22, 0.026, radius * 0.18]}>
          <circleGeometry args={[radius * 0.14, 10]} />
          <meshBasicMaterial color="#DFF8FF" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 3: 수련잎 + 물가 돌 ── */}
      <PhaseGroup delay={baseDelay + 0.32}>
        {LILIES.map((l, i) => (
          <group
            key={i}
            position={[l.x * radius, 0.035, l.z * radius]}
            ref={(el) => { lilyRefs.current[i] = el; }}
          >
            {/* 잎 */}
            <mesh rotation-x={-Math.PI / 2}>
              <circleGeometry args={[l.s, 8]} />
              <meshStandardMaterial color="#3E8E4E" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            {/* 수련꽃 */}
            {l.hasFlower && (
              <>
                <mesh position={[0, 0.05, 0]}>
                  <coneGeometry args={[l.s * 0.35, 0.12, 6]} />
                  <meshStandardMaterial color="#F8BBD0" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.11, 0]}>
                  <sphereGeometry args={[l.s * 0.12, 6, 5]} />
                  <meshStandardMaterial color="#FFE28A" emissive="#FFC24D" emissiveIntensity={0.6} />
                </mesh>
              </>
            )}
          </group>
        ))}

        {STONES.map((st, i) => (
          <mesh
            key={i}
            position={[Math.cos(st.a) * radius * st.rr, st.s * 0.35, Math.sin(st.a) * radius * st.rr]}
            scale={[st.s, st.s * 0.65, st.s]}
            castShadow
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={st.color} roughness={0.95} />
          </mesh>
        ))}
      </PhaseGroup>
    </group>
  );
}
