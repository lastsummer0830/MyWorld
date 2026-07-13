"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PhaseGroup } from "../room/AnimatedWrapper";

// ── 집 ────────────────────────────────────────────────────
// 겨울 버전과 동일 구조 — 지붕 위 눈 레이어와 굴뚝 연기만 제거한 여름 별장
export interface HouseProps {
  position:   [number, number, number];
  rotationY:  number;
  wallColor:  string;
  roofColor:  string;
  scale?:     number;
  baseDelay?: number;
}

export default function House({
  position, rotationY, wallColor, roofColor, scale = 1, baseDelay = 0,
}: HouseProps) {
  const W  = 1.6  * scale;
  const D  = 1.4  * scale;
  const BH = 1.0  * scale;
  const RH = 0.65 * scale;
  const CS = 0.13 * scale;

  const roofGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, 0);
    shape.lineTo( W / 2, 0);
    shape.lineTo(0, RH);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
    geo.computeVertexNormals();
    return geo;
  }, [W, D, RH]);

  const chX = W * 0.22;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>

      {/* ── Phase 1: 몸체 ── */}
      <PhaseGroup delay={baseDelay}>
        <mesh position={[0, BH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, BH, D]} />
          <meshStandardMaterial color={wallColor} roughness={0.88} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 2: 지붕 ── */}
      <PhaseGroup delay={baseDelay + 0.2}>
        <mesh position={[0, BH, -D / 2]} geometry={roofGeo} castShadow>
          <meshStandardMaterial color={roofColor} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 3: 굴뚝 ── */}
      <PhaseGroup delay={baseDelay + 0.35}>
        <mesh position={[chX, BH + RH * 0.60, 0]} castShadow>
          <boxGeometry args={[CS, CS * 2.8, CS]} />
          <meshStandardMaterial color="#8A6248" roughness={1} />
        </mesh>
        <mesh position={[chX, BH + RH * 0.59 + CS * 1.3, 0]}>
          <boxGeometry args={[CS * 1.5, CS * 0.15, CS * 1.5]} />
          <meshStandardMaterial color="#5C4030" roughness={1} />
        </mesh>
      </PhaseGroup>

      {/* ── Phase 4: 창문 + 문 ── */}
      <PhaseGroup delay={baseDelay + 0.48}>
        <mesh position={[-W * 0.24, BH * 0.62, D / 2 + 0.002]}>
          <planeGeometry args={[0.21 * scale, 0.19 * scale]} />
          <meshStandardMaterial color="#FFE088" emissive="#FFAA22" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[ W * 0.24, BH * 0.62, D / 2 + 0.002]}>
          <planeGeometry args={[0.21 * scale, 0.19 * scale]} />
          <meshStandardMaterial color="#FFE088" emissive="#FFAA22" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[0, BH * 0.24, D / 2 + 0.002]}>
          <planeGeometry args={[0.24 * scale, 0.44 * scale]} />
          <meshStandardMaterial color="#6B4226" roughness={0.9} />
        </mesh>
      </PhaseGroup>

    </group>
  );
}
