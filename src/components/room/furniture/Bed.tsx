"use client";

import AnimatedWrapper from "../AnimatedWrapper";
import { MAT } from "../materials";
import { COLOR, DELAY } from "../constants";
import { POS, SIZE } from "../layout";

// 침대 위에 앉아 있는 골든 크림 강아지
function BedDog() {
  const { LW, LH, LD, BW, BH, BD, HW, HH, HD } = SIZE.bedDog;

  const lowerTop = LH;
  const bodyTop  = lowerTop + BH;
  const headCY   = bodyTop + HH / 2;
  const hf       = HD / 2;

  return (
    <group>
      {/* 하체 */}
      <mesh position={[0, LH / 2, 0]} castShadow>
        <boxGeometry args={[LW, LH, LD]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      {/* 앞발 */}
      <mesh position={[-LW * 0.17, LH * 0.5, LD / 2 + 0.025]} castShadow>
        <boxGeometry args={[0.11, LH * 0.85, 0.05]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      <mesh position={[ LW * 0.17, LH * 0.5, LD / 2 + 0.025]} castShadow>
        <boxGeometry args={[0.11, LH * 0.85, 0.05]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      {/* 몸통 */}
      <mesh position={[0, lowerTop + BH / 2, 0]} castShadow>
        <boxGeometry args={[BW, BH, BD]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
      {/* 등 브라운 패치 */}
      <mesh position={[0, lowerTop + BH - 0.005, -BD * 0.10]}>
        <boxGeometry args={[BW * 0.72, 0.03, BD * 0.62]} />
        <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
      </mesh>
      {/* 머리 */}
      <group position={[0, headCY, BD * 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[HW, HH, HD]} />
          <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
        </mesh>
        {/* 처진 귀 — 머리 양옆에 매달려 아래로 늘어짐 */}
        <mesh position={[-HW / 2 - 0.03, HH * 0.12, -HD * 0.05]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[0.05, 0.20, 0.11]} />
          <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
        </mesh>
        <mesh position={[ HW / 2 + 0.03, HH * 0.12, -HD * 0.05]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.05, 0.20, 0.11]} />
          <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
        </mesh>
        {/* muzzle */}
        <mesh position={[0, -HH * 0.08, hf + 0.02]}>
          <boxGeometry args={[HW * 0.48, HH * 0.38, 0.04]} />
          <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
        </mesh>
        {/* 눈 */}
        <mesh position={[-HW * 0.24, HH * 0.10, hf + 0.02]}>
          <boxGeometry args={[0.09, 0.035, 0.03]} />
          <meshStandardMaterial color={COLOR.dogEye} {...MAT.dogEye} />
        </mesh>
        <mesh position={[ HW * 0.24, HH * 0.10, hf + 0.02]}>
          <boxGeometry args={[0.09, 0.035, 0.03]} />
          <meshStandardMaterial color={COLOR.dogEye} {...MAT.dogEye} />
        </mesh>
        {/* 코 — 강아지 특유의 둥글넓적한 코 */}
        <mesh position={[0, -HH * 0.06, hf + 0.04 + 0.007]}>
          <boxGeometry args={[0.062, 0.045, 0.014]} />
          <meshStandardMaterial color={COLOR.dogNose} {...MAT.dogNose} />
        </mesh>
        {/* 혀 — 살짝 내밀고 헥헥 */}
        <mesh position={[0, -HH * 0.24, hf + 0.035]}>
          <boxGeometry args={[0.045, 0.06, 0.012]} />
          <meshStandardMaterial color={COLOR.dogTongue} {...MAT.dogFur} />
        </mesh>
      </group>
      {/* 꼬리 */}
      <mesh position={[LW / 2 + 0.04, LH * 0.6, 0]}>
        <boxGeometry args={[0.08, 0.08, LD * 0.8]} />
        <meshStandardMaterial color={COLOR.dogBrown} {...MAT.dogFur} />
      </mesh>
      <mesh position={[LW / 2 + 0.04, LH * 0.6, LD * 0.4 + 0.04]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.14]} />
        <meshStandardMaterial color={COLOR.dogCream} {...MAT.dogFur} />
      </mesh>
    </group>
  );
}

export default function Bed() {
  const { frameW, frameH, frameD, mattH,
          pillowW, pillowH, pillowD,
          blanketH, blanketRatioD,
          dogOffsetX, dogOffsetZ } = SIZE.bed;

  return (
    <AnimatedWrapper
      delay={DELAY.bed}
      position={POS.bed}
      liftHeight={0.06}
      hitbox={[frameW + 0.1, 0.7, frameD + 0.1]}
      hitboxPos={[0, 0.35, 0]}
    >
      <group>
        {/* 프레임 */}
        <mesh position={[0, frameH / 2, 0]} receiveShadow>
          <boxGeometry args={[frameW, frameH, frameD]} />
          <meshStandardMaterial color={COLOR.bedFrame} roughness={0.75} metalness={0} />
        </mesh>
        {/* 매트리스 */}
        <mesh position={[0, frameH + mattH / 2, 0]} castShadow>
          <boxGeometry args={[frameW - 0.18, mattH, frameD - 0.18]} />
          <meshStandardMaterial color={COLOR.mattress} roughness={1.0} />
        </mesh>
        {/* 베개 */}
        <mesh position={[0, frameH + mattH + 0.07, -frameD / 2 + 0.6]} castShadow>
          <boxGeometry args={[pillowW, pillowH, pillowD]} />
          <meshStandardMaterial color={COLOR.pillow} roughness={1.0} />
        </mesh>
        {/* 이불 */}
        <mesh position={[0, frameH + mattH + 0.04, 0.35]} castShadow>
          <boxGeometry args={[frameW - 0.08, blanketH, frameD * blanketRatioD]} />
          <meshStandardMaterial color={COLOR.blanket} roughness={1.0} />
        </mesh>
        {/* 강아지 */}
        <group position={[dogOffsetX, frameH + mattH, dogOffsetZ]} rotation={[0, -0.5, 0]}>
          <BedDog />
        </group>
      </group>
    </AnimatedWrapper>
  );
}
