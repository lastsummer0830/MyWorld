"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneItem } from "../AnimatedWrapper";
import { MAT } from "../materials";
import { COLOR, DELAY } from "../constants";
import { POS, SIZE, ROT } from "../layout";

// 바닥에 엎드려 일광욕 중인 골든 크림 강아지 (+Z 방향을 바라봄)
function SunDog() {
  const { BW, BH, BD, HW, HH, HD, legW, legH, legL, tailL } = SIZE.sunDog;

  const tailRef = useRef<THREE.Group>(null!);

  // 꼬리 좌우로 살랑살랑 흔들기
  useFrame(({ clock }) => {
    if (!tailRef.current) return;
    tailRef.current.rotation.y = Math.sin(clock.elapsedTime * 3.2) * 0.38;
  });

  const headCY = BH * 0.62 + HH / 2;   // 머리 중심 (몸통 위에 살짝 걸침)
  const headCZ = BD / 2 + HD * 0.30;   // 머리를 몸통 앞으로 내밀기
  const hf     = HD / 2;

  return (
    <group>
      {/* 몸통 — 엎드려서 앞뒤로 긴 형태 */}
      <mesh position={[0, BH / 2, 0]} castShadow>
        <boxGeometry args={[BW, BH, BD]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      {/* 등 브라운 패치 */}
      <mesh position={[0, BH - 0.005, -BD * 0.08]}>
        <boxGeometry args={[BW * 0.70, 0.028, BD * 0.60]} />
        <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
      </mesh>
      {/* 앞다리 — 앞으로 쭉 뻗음 */}
      <mesh position={[-BW * 0.26, legH / 2, BD / 2 + legL / 2 - 0.03]} castShadow>
        <boxGeometry args={[legW, legH, legL]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      <mesh position={[ BW * 0.26, legH / 2, BD / 2 + legL / 2 - 0.03]} castShadow>
        <boxGeometry args={[legW, legH, legL]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      {/* 머리 */}
      <group position={[0, headCY, headCZ]}>
        <mesh castShadow>
          <boxGeometry args={[HW, HH, HD]} />
          <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
        </mesh>
        {/* 처진 귀 — 양옆으로 늘어짐 */}
        <mesh position={[-HW / 2 - 0.026, HH * 0.10, -HD * 0.05]} rotation={[0, 0, 0.20]}>
          <boxGeometry args={[0.045, 0.17, 0.10]} />
          <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
        </mesh>
        <mesh position={[ HW / 2 + 0.026, HH * 0.10, -HD * 0.05]} rotation={[0, 0, -0.20]}>
          <boxGeometry args={[0.045, 0.17, 0.10]} />
          <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
        </mesh>
        {/* muzzle */}
        <mesh position={[0, -HH * 0.12, hf + 0.02]}>
          <boxGeometry args={[HW * 0.50, HH * 0.36, 0.04]} />
          <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
        </mesh>
        {/* 눈 — 햇볕에 나른하게 감김 */}
        <mesh position={[-HW * 0.24, HH * 0.10, hf + 0.02]}>
          <boxGeometry args={[0.075, 0.016, 0.02]} />
          <meshStandardMaterial color={COLOR.dogEye} {...MAT.dogEye} />
        </mesh>
        <mesh position={[ HW * 0.24, HH * 0.10, hf + 0.02]}>
          <boxGeometry args={[0.075, 0.016, 0.02]} />
          <meshStandardMaterial color={COLOR.dogEye} {...MAT.dogEye} />
        </mesh>
        {/* 코 — 둥글넓적 */}
        <mesh position={[0, -HH * 0.10, hf + 0.042]}>
          <boxGeometry args={[0.055, 0.038, 0.012]} />
          <meshStandardMaterial color={COLOR.dogNose} {...MAT.dogNose} />
        </mesh>
      </group>
      {/* 꼬리 — 몸통 뒤에서 살랑살랑 (그룹 원점 = 꼬리 뿌리) */}
      <group ref={tailRef} position={[0, BH * 0.55, -BD / 2]}>
        <mesh position={[0, 0.03, -tailL / 2]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.055, 0.055, tailL]} />
          <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
        </mesh>
        {/* 꼬리 끝 크림 털 */}
        <mesh position={[0, 0.065, -tailL + 0.02]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.07]} />
          <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
        </mesh>
      </group>
    </group>
  );
}

export default function SunbathingDog() {
  const [posX, , posZ] = POS.sunDog;

  return (
    <SceneItem
      delay={DELAY.bed + 0.3}
      position={[posX, 0, posZ]}
      liftHeight={0.06}
      hitbox={[0.5, 0.5, 0.7]}
      hitboxPos={[0, 0.25, 0]}
    >
      <group rotation={ROT.sunDog}>
        <SunDog />
      </group>
    </SceneItem>
  );
}
