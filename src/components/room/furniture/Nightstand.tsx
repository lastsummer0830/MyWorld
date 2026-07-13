"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneItem } from "../AnimatedWrapper";
import { COLOR, DELAY } from "../constants";
import { POS, SIZE, ROT } from "../layout";
import { MAT } from "../materials";
import { useDayNight } from "@/components/canvas/DayNightContext";

function StandLight() {
  const { mode }    = useDayNight();
  const lightRef    = useRef<THREE.PointLight>(null!);
  const shadeRef    = useRef<THREE.Mesh>(null!);
  const curI        = useRef(0);
  const curEmissive = useRef(0);

  const { poleH, armH, shadeR, shadeH, baseR, baseH, poleR } = SIZE.standLight;

  useFrame((_, delta) => {
    const isNight = mode === "night";
    const t = 1 - Math.pow(0.001, delta * 3);
    curI.current        += ((isNight ? 1.8 : 0)    - curI.current)        * t;
    curEmissive.current += ((isNight ? 0.6 : 0.05) - curEmissive.current) * t;
    if (lightRef.current) lightRef.current.intensity = curI.current;
    if (shadeRef.current)
      (shadeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = curEmissive.current;
  });

  return (
    <group>
      {/* 받침대 */}
      <mesh position={[0, baseH / 2, 0]}>
        <cylinderGeometry args={[baseR, baseR * 1.14, baseH, 16]} />
        <meshStandardMaterial color="#5A4030" {...MAT.woodDark} />
      </mesh>
      {/* 기둥 */}
      <mesh position={[0, poleH / 2 + baseH, 0]}>
        <cylinderGeometry args={[poleR, poleR, poleH, 8]} />
        <meshStandardMaterial color="#8A7060" {...MAT.metalHandle} />
      </mesh>
      {/* 갓 */}
      <mesh ref={shadeRef} position={[0, poleH + baseH + armH, 0]}>
        <coneGeometry args={[shadeR, shadeH, 16, 1, true]} />
        <meshStandardMaterial
          color="#E8D8A0"
          emissive="#FFD080"
          emissiveIntensity={0.05}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 갓 윗면 */}
      <mesh position={[0, poleH + baseH + armH + shadeH / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
        <meshStandardMaterial color="#8A7060" {...MAT.metalHandle} />
      </mesh>
      {/* 조명 */}
      <pointLight
        ref={lightRef}
        position={[0, poleH + baseH + armH, 0]}
        intensity={0}
        distance={4.5}
        color="#FFD080"
        decay={2}
      />
    </group>
  );
}

function NightstandBody() {
  const { w, h, d } = SIZE.nightstand;

  return (
    <group>
      {/* 본체 */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={COLOR.drawerBody} {...MAT.drawer} />
      </mesh>
      {/* 상판 */}
      <mesh position={[0, h + 0.008, 0]} castShadow>
        <boxGeometry args={[w + 0.025, 0.024, d + 0.025]} />
        <meshStandardMaterial color={COLOR.woodMid} {...MAT.woodMid} />
      </mesh>
      {/* 서랍 2개 */}
      {[h * 0.32, h * 0.68].map((y, i) => (
        <group key={i}>
          <mesh position={[w / 2 + 0.001, y, 0]}>
            <boxGeometry args={[0.004, 0.016, d * 0.85]} />
            <meshStandardMaterial color={COLOR.curtainFold} {...MAT.fabric} />
          </mesh>
          <mesh position={[w / 2 + 0.02, y, 0]} castShadow>
            <boxGeometry args={[0.032, 0.020, 0.006]} />
            <meshStandardMaterial color={COLOR.drawerHandle} {...MAT.metalHandle} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Nightstand() {
  const { h, standOffsetX, standOffsetY, standOffsetZ } = SIZE.nightstand;

  return (
    <SceneItem
      delay={DELAY.bed + 0.2}
      position={POS.nightstand}
      liftHeight={0.05}
      hitbox={[SIZE.nightstand.w + 0.05, h + 0.05, SIZE.nightstand.d + 0.05]}
      hitboxPos={[0, h / 2, 0]}
      rotation={ROT.nightstand}
    >
      <group>
        <NightstandBody />
        <group position={[standOffsetX, h + standOffsetY, standOffsetZ]}>
          <StandLight />
        </group>
      </group>
    </SceneItem>
  );
}
