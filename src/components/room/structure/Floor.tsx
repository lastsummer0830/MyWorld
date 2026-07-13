"use client";

import { Text } from "@react-three/drei";
import { POS, SIZE } from "../layout";
import AnimatedWrapper from "../AnimatedWrapper";
import { MAT } from "../materials";
import { COLOR, DELAY, ROOM } from "../constants";

export default function Floor() {
  const { w, h, d, fontSize } = SIZE.rug;

  return (
    <>
      {/* 바닥 */}
      <AnimatedWrapper delay={DELAY.floor} liftHeight={0.06} hover={false}>
        <mesh position={[0, -ROOM.floorThickness / 2, 0]} receiveShadow>
          <boxGeometry args={[ROOM.size, ROOM.floorThickness, ROOM.size]} />
          <meshStandardMaterial color={COLOR.floor} roughness={0.9} />
        </mesh>
      </AnimatedWrapper>

      {/* 러그 */}
      <AnimatedWrapper delay={DELAY.rug} position={POS.rug} liftHeight={0.06}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={COLOR.rug} roughness={1} />
        </mesh>
        <Text
          position={[0, h / 2 + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={fontSize}
          color="white"
          depthOffset={-1}
        >
          WELCOME
        </Text>
      </AnimatedWrapper>
    </>
  );
}
