"use client";

import { SceneItem } from "../AnimatedWrapper";
import { COLOR, DELAY } from "../constants";
import { POS, SIZE } from "../layout";

function Bowl({
  position, rimColor, innerColor, waterColor, isWater = false,
}: {
  position: [number, number, number];
  rimColor: string; innerColor: string; waterColor?: string; isWater?: boolean;
}) {
  const { foodW, foodH, waterW, waterH } = SIZE.dogBowl;
  const RW = isWater ? waterW : foodW;
  const RH = isWater ? waterH : foodH;
  const thickness = 0.015;

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[RW / 2, (RW / 2) * 0.85, RH, 16]} />
        <meshStandardMaterial color={rimColor} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, thickness, 0]}>
        <cylinderGeometry args={[RW / 2 - thickness, (RW / 2) * 0.85 - thickness, RH - thickness, 16]} />
        <meshStandardMaterial color={innerColor} roughness={0.8} />
      </mesh>
      {isWater && waterColor && (
        <mesh position={[0, RH * 0.42, 0]}>
          <cylinderGeometry args={[RW / 2 - thickness - 0.005, RW / 2 - thickness - 0.005, 0.004, 16]} />
          <meshStandardMaterial color={waterColor} transparent opacity={0.7} roughness={0} metalness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// 그릇 옆에 놓인 뼈다귀 장난감 (원기둥 몸통 + 양끝 혹 4개)
function Bone({ position, rotationY }: {
  position: [number, number, number];
  rotationY: number;
}) {
  const { boneL, boneR, boneEndR } = SIZE.dogBowl;
  const half = boneL / 2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 몸통 */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[boneR, boneR, boneL, 10]} />
        <meshStandardMaterial color={COLOR.bone} roughness={0.85} />
      </mesh>
      {/* 양끝 혹 — 좌우 2개씩 */}
      {([-half, half] as number[]).map((x, i) =>
        ([-0.018, 0.018] as number[]).map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.004, z]} castShadow>
            <sphereGeometry args={[boneEndR, 10, 10]} />
            <meshStandardMaterial color={COLOR.bone} roughness={0.85} />
          </mesh>
        ))
      )}
    </group>
  );
}

export default function DogBowls() {
  const { matW, matH, matD, spacing } = SIZE.dogBowl;
  const [posX, posY, posZ] = POS.dogBowls;

  return (
    <SceneItem
      delay={DELAY.fridge + 0.2}
      position={[posX, posY + 0.02, posZ]}
      liftHeight={0.05}
      hitbox={[matW + 0.25, matH + 0.1, matD + 0.04]}
      hitboxPos={[0, 0.06, 0]}
    >
      {/* 그릇 매트 */}
      <mesh receiveShadow>
        <boxGeometry args={[matW, matH, matD]} />
        <meshStandardMaterial color={COLOR.rug} roughness={1} />
      </mesh>
      {/* 밥그릇 — 더스티 핑크 */}
      <Bowl
        position={[-spacing, matH, 0]}
        rimColor={COLOR.bowlPink}
        innerColor={COLOR.dogBrown}
        isWater={false}
      />
      {/* 물그릇 — 스카이 블루 */}
      <Bowl
        position={[spacing, matH, 0]}
        rimColor={COLOR.bowlBlue}
        innerColor="#EAF4F8"
        waterColor="#A8D8E8"
        isWater={true}
      />
      {/* 뼈다귀 장난감 — 매트 옆 바닥 */}
      <Bone position={[matW / 2 + 0.10, matH + 0.012, 0.04]} rotationY={0.6} />
    </SceneItem>
  );
}
