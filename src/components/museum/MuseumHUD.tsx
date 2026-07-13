"use client";

import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useAchievements } from "@/components/achievements/AchievementContext";
import { FONT_EN_SEMI, FONT_EN_LIGHT, pickFont } from "./fonts";

// museum 카메라(fov=60)의 children으로 배치 → 화면 고정 HUD
// 카메라 앞 z=-1 평면 기준: 절반높이 ≈ 0.577, 절반너비 ≈ 1.01 (aspect 1.75)
const HUD_Z   = -1;
const BOX_W   = 0.66;
const BOX_H   = 0.175;
const START_X = 0.62;   // 우측
const START_Y = 0.40;   // 상단
const GAP_Y   = 0.20;

export default function MuseumHUD() {
  const { toasts } = useAchievements();

  return (
    <group position={[0, 0, HUD_Z]}>
      {toasts.map(({ key, def }, i) => {
        const y = START_Y - i * GAP_Y;
        return (
          <group key={key} position={[START_X, y, 0]} renderOrder={9999}>
            {/* 금테 (배경보다 살짝 큼) */}
            <mesh position={[0, 0, -0.001]} renderOrder={9998}>
              <planeGeometry args={[BOX_W + 0.012, BOX_H + 0.012]} />
              <meshBasicMaterial color="#dcb45a" transparent opacity={0.85} depthTest={false} depthWrite={false} />
            </mesh>
            {/* 배경 */}
            <mesh renderOrder={9999}>
              <planeGeometry args={[BOX_W, BOX_H]} />
              <meshBasicMaterial color="#1a1610" transparent opacity={0.96} depthTest={false} depthWrite={false} />
            </mesh>
            {/* 왼쪽 금색 액센트 바 */}
            <mesh position={[-BOX_W / 2 + 0.012, 0, 0.001]} renderOrder={10000}>
              <planeGeometry args={[0.018, BOX_H - 0.02]} />
              <meshBasicMaterial color="#E8C870" depthTest={false} depthWrite={false} />
            </mesh>

            {/* "ACHIEVEMENT UNLOCKED" */}
            <Text
              font={FONT_EN_SEMI}
              position={[-BOX_W / 2 + 0.05, BOX_H / 2 - 0.038, 0.002]}
              fontSize={0.025}
              color="#E8C870"
              anchorX="left"
              anchorY="middle"
              letterSpacing={0.12}
              renderOrder={10000}
              material-depthTest={false}
            >
              ACHIEVEMENT UNLOCKED
            </Text>

            {/* 업적 제목 */}
            <Text
              font={pickFont(def.title, "semi")}
              position={[-BOX_W / 2 + 0.05, 0.004, 0.002]}
              fontSize={0.044}
              color="#FFF4E0"
              anchorX="left"
              anchorY="middle"
              renderOrder={10000}
              material-depthTest={false}
            >
              {def.title}
            </Text>

            {/* 설명 */}
            <Text
              font={pickFont(def.desc, "light")}
              position={[-BOX_W / 2 + 0.05, -BOX_H / 2 + 0.04, 0.002]}
              fontSize={0.026}
              color="#C8BEA8"
              anchorX="left"
              anchorY="middle"
              maxWidth={BOX_W - 0.08}
              renderOrder={10000}
              material-depthTest={false}
            >
              {def.desc}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
