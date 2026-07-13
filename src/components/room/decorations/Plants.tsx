"use client";

/**
 * Plants.tsx — 플랜테리어 소품 3종
 *
 * 1. FloorMonstera  — 바닥 대형 몬스테라 화분 (방 앞쪽 빈 공간)
 * 2. HangingPlant   — 창가 행잉 플랜트 (마크라메 줄 + 늘어지는 덩굴)
 * 3. ShelfSucculent — 서랍장 위 작은 다육이 (무드등 옆)
 *
 * 위치는 layout.ts POS, 크기는 SIZE.plants에서 관리합니다.
 */

import { SceneItem } from "../AnimatedWrapper";
import { MAT } from "../materials";
import { COLOR, DELAY, ROOM } from "../constants";
import { POS, SIZE } from "../layout";

// ── 1. 바닥 대형 몬스테라 ────────────────────────────────
function FloorMonstera() {
  const { monsteraPotR, monsteraPotRBot, monsteraPotH, monsteraLeafR } = SIZE.plants;

  // 잎 배치 (각도, 기울기, 높이, 색, 크기 배율) — 절차 배치, 난수 없음
  const leaves: { angle: number; tilt: number; y: number; color: string; scale: number }[] = [
    { angle: 0.0,  tilt: 0.55, y: 0.62, color: COLOR.plant,      scale: 1.00 },
    { angle: 1.1,  tilt: 0.70, y: 0.50, color: COLOR.plantDeep,  scale: 0.90 },
    { angle: 2.3,  tilt: 0.60, y: 0.68, color: COLOR.plantLight, scale: 0.95 },
    { angle: 3.5,  tilt: 0.75, y: 0.46, color: COLOR.plant,      scale: 0.85 },
    { angle: 4.6,  tilt: 0.58, y: 0.72, color: COLOR.plantDeep,  scale: 1.05 },
    { angle: 5.6,  tilt: 0.68, y: 0.55, color: COLOR.plantLight, scale: 0.80 },
  ];

  return (
    <SceneItem
      delay={DELAY.plants}
      position={POS.floorPlant}
      liftHeight={0.05}
      hitbox={[0.7, 1.2, 0.7]}
      hitboxPos={[0, 0.6, 0]}
    >
      {/* 화분 — 라이트 테라코타 */}
      <mesh position={[0, monsteraPotH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[monsteraPotR, monsteraPotRBot, monsteraPotH, 16]} />
        <meshStandardMaterial color={COLOR.pot} {...MAT.pot} />
      </mesh>
      {/* 흙 */}
      <mesh position={[0, monsteraPotH - 0.015, 0]}>
        <cylinderGeometry args={[monsteraPotR * 0.9, monsteraPotR * 0.9, 0.02, 16]} />
        <meshStandardMaterial color="#6B4F35" roughness={1} />
      </mesh>
      {/* 줄기 + 잎 — 줄기는 바깥으로 기울고 끝에 넓은 잎 */}
      {leaves.map(({ angle, tilt, y, color, scale }, i) => {
        const dx = Math.cos(angle) * 0.16 * scale;
        const dz = Math.sin(angle) * 0.16 * scale;
        return (
          <group key={i} position={[0, monsteraPotH, 0]} rotation={[0, -angle, 0]}>
            {/* 줄기 */}
            <mesh position={[0.08 * scale, y / 2, 0]} rotation={[0, 0, -tilt * 0.45]} castShadow>
              <cylinderGeometry args={[0.012, 0.016, y, 6]} />
              <meshStandardMaterial color={COLOR.plantDeep} {...MAT.plant} />
            </mesh>
            {/* 잎 — 납작하게 눌린 구 */}
            <mesh
              position={[dx + 0.10, y, dz]}
              rotation={[0, 0, -tilt]}
              scale={[1.35 * scale, 0.22 * scale, 1.0 * scale]}
              castShadow
            >
              <sphereGeometry args={[monsteraLeafR, 12, 10]} />
              <meshStandardMaterial color={color} {...MAT.plant} />
            </mesh>
          </group>
        );
      })}
    </SceneItem>
  );
}

// ── 2. 창가 행잉 플랜트 ──────────────────────────────────
function HangingPlant() {
  const { hangRopeL, hangPotR, hangPotH, hangStrandN } = SIZE.plants;
  const [px, , pz] = POS.hangingPlant;
  const potY = ROOM.height - hangRopeL;   // 화분 높이 (천장에서 줄 길이만큼 아래)

  // 늘어지는 덩굴 — 화분 테두리를 따라 균등 배치
  const strands = Array.from({ length: hangStrandN }, (_, i) => {
    const angle = (i / hangStrandN) * Math.PI * 2 + 0.4;
    return { angle, drop: 0.28 + (i % 3) * 0.09 };   // 가닥마다 길이 변화
  });

  return (
    <SceneItem
      delay={DELAY.plants + 0.15}
      position={[px, potY, pz]}
      liftHeight={0.04}
      hitbox={[0.45, 0.6, 0.45]}
      hitboxPos={[0, -0.1, 0]}
    >
      {/* 마크라메 줄 — 화분에서 천장까지 */}
      <mesh position={[0, hangRopeL / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, hangRopeL, 6]} />
        <meshStandardMaterial color={COLOR.macrame} {...MAT.fabric} />
      </mesh>
      {/* 매듭 장식 */}
      <mesh position={[0, hangPotH + 0.05, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color={COLOR.macrame} {...MAT.fabric} />
      </mesh>
      {/* 화분 */}
      <mesh position={[0, hangPotH / 2, 0]} castShadow>
        <cylinderGeometry args={[hangPotR, hangPotR * 0.72, hangPotH, 12]} />
        <meshStandardMaterial color={COLOR.pot} {...MAT.pot} />
      </mesh>
      {/* 윗쪽 수풀 */}
      <mesh position={[0, hangPotH + 0.03, 0]} scale={[1, 0.6, 1]} castShadow>
        <sphereGeometry args={[hangPotR * 1.15, 12, 10]} />
        <meshStandardMaterial color={COLOR.plant} {...MAT.plant} />
      </mesh>
      {/* 늘어지는 덩굴 — 구슬 3개가 아래로 갈수록 작아짐 */}
      {strands.map(({ angle, drop }, i) => {
        const rx = Math.cos(angle) * hangPotR * 0.95;
        const rz = Math.sin(angle) * hangPotR * 0.95;
        const colors = [COLOR.plantLight, COLOR.plant, COLOR.plantDeep];
        return (
          <group key={i} position={[rx, hangPotH * 0.5, rz]}>
            {[0, 1, 2].map((j) => (
              <mesh
                key={j}
                position={[
                  Math.cos(angle) * 0.03 * (j + 1),
                  -drop * (j + 1) * 0.38,
                  Math.sin(angle) * 0.03 * (j + 1),
                ]}
                castShadow
              >
                <sphereGeometry args={[0.045 - j * 0.010, 8, 8]} />
                <meshStandardMaterial color={colors[(i + j) % 3]} {...MAT.plant} />
              </mesh>
            ))}
          </group>
        );
      })}
    </SceneItem>
  );
}

// ── 3. 서랍장 위 다육이 ──────────────────────────────────
function ShelfSucculent() {
  const { succPotR, succPotH, succLeafH } = SIZE.plants;

  // 로제트 모양 — 가운데 1개 + 둘레 5개 콘
  const petals = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2);

  return (
    <SceneItem
      delay={DELAY.plants + 0.3}
      position={POS.succulent}
      liftHeight={0.04}
      hitbox={[0.14, 0.2, 0.14]}
      hitboxPos={[0, 0.08, 0]}
    >
      {/* 미니 화분 — 더스티 핑크 포인트 */}
      <mesh position={[0, succPotH / 2, 0]} castShadow>
        <cylinderGeometry args={[succPotR, succPotR * 0.78, succPotH, 12]} />
        <meshStandardMaterial color={COLOR.bowlPink} {...MAT.pot} />
      </mesh>
      {/* 가운데 잎 */}
      <mesh position={[0, succPotH + succLeafH / 2, 0]} castShadow>
        <coneGeometry args={[0.022, succLeafH, 8]} />
        <meshStandardMaterial color={COLOR.plantLight} {...MAT.plant} />
      </mesh>
      {/* 둘레 잎 — 바깥으로 살짝 벌어짐 */}
      {petals.map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.028, succPotH + succLeafH * 0.38, Math.sin(angle) * 0.028]}
          rotation={[Math.sin(angle) * 0.45, 0, -Math.cos(angle) * 0.45]}
          castShadow
        >
          <coneGeometry args={[0.020, succLeafH * 0.85, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? COLOR.plant : COLOR.plantDeep} {...MAT.plant} />
        </mesh>
      ))}
    </SceneItem>
  );
}

// ── 묶음 export ──────────────────────────────────────────
export default function Plants() {
  return (
    <>
      <FloorMonstera />
      <HangingPlant />
      <ShelfSucculent />
    </>
  );
}
