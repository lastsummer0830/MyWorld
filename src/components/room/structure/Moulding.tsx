"use client";

import { useRef } from "react";
import { Text } from "@react-three/drei";
import { AppearGroup, HoverLift } from "../AnimatedWrapper";
import { COLOR, DELAY, ROOM, WALL_HALF } from "../constants";
import { SIGN } from "../layout";
import { MAT } from "../materials";

export const SIGNS_DATA = [
  {
    id:      "about",
    label:   "ABOUT",
    icon:    "👤",
    color:   "#8B5E3C",
    onClick: () => { (window as any).__openPortfolioModal?.("about"); },
  },
  {
    id:      "projects",
    label:   "PROJECTS",
    icon:    "💻",
    color:   "#4A6A8A",
    onClick: () => { (window as any).__enterMuseum?.(); },
  },
  {
    id:      "skills",
    label:   "SKILLS",
    icon:    "⚡",
    color:   "#5A7A4A",
    onClick: () => { (window as any).__openPortfolioModal?.("skills"); },
  },
  {
    id:      "contact",
    label:   "CONTACT",
    icon:    "✉️",
    color:   "#7A4A6A",
    onClick: () => { (window as any).__openPortfolioModal?.("contact"); },
  },
] as const;

function SignBoard({ label, icon, color, onClick, delay, isFirst = true }: {
  label: string; icon: string; color: string;
  onClick: () => void; delay: number; isFirst?: boolean;
}) {
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const handlePointerDown = (e: any) => { pointerDown.current = { x: e.clientX, y: e.clientY }; };
  const handleClick = (e: any) => {
    if (!pointerDown.current) return;
    const dx = e.clientX - pointerDown.current.x;
    const dy = e.clientY - pointerDown.current.y;
    pointerDown.current = null;
    if (Math.sqrt(dx * dx + dy * dy) > 4) return;
    e.stopPropagation();
    onClick();
  };

  const W = SIGN.w, H = SIGN.h, D = SIGN.d;
  const ROD_Y   = H / 2 + SIGN.rodOffset;
  const CHAIN_C = "#888888";
  const chainXs = [-W * SIGN.chainXRatio, W * SIGN.chainXRatio];
  const chainLinks = [
    { y: ROD_Y - SIGN.chainStep },
    { y: ROD_Y - SIGN.chainStep * 2 },
    { y: ROD_Y - SIGN.chainStep * 3 },
  ];

  return (
    <AppearGroup delay={delay}>
      <HoverLift liftHeight={0.03}>
        <group
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          onPointerOver={() => { document.body.style.cursor = "pointer"; }}
          onPointerOut={()  => { document.body.style.cursor = "default"; }}
        >
          {/* 걸이봉 — 맨 위 표지판만 */}
          {isFirst && (
            <>
              <mesh position={[0, ROD_Y, 0]} castShadow>
                <boxGeometry args={[W + 0.10, 0.06, 0.06]} />
                <meshStandardMaterial color="#6B4C2E" {...MAT.woodDark} />
              </mesh>
              {[-(W + 0.10) / 2, (W + 0.10) / 2].map((bx, i) => (
                <mesh key={i} position={[bx, ROD_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 0.08, 12]} />
                  <meshStandardMaterial color="#5A3C1E" {...MAT.woodDark} />
                </mesh>
              ))}
            </>
          )}
          {/* 사슬 — isFirst: 봉↔표지판, 아닐때: 위 표지판 하단↔이 표지판 상단 */}
          {chainXs.map((cx, ci) => {
            const links = isFirst
              ? chainLinks  // 봉 아래 ~ 표지판 위
              : [{ y: H / 2 + 0.06 }, { y: H / 2 + 0.12 }, { y: H / 2 + 0.18 }];  // 표지판 위로 올라가는 사슬
            return links.map(({ y }, li) => (
              <mesh key={`${ci}-${li}`} position={[cx, y, 0]} rotation={li % 2 === 0 ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.022, 0.007, 8, 12]} />
                <meshStandardMaterial color={CHAIN_C} {...MAT.metalHandle} />
              </mesh>
            ));
          })}
          {/* 표지판 본체 */}
          <mesh castShadow>
            <boxGeometry args={[W, H, D]} />
            <meshStandardMaterial color={color} {...MAT.woodMid} />
          </mesh>
          <mesh position={[0, 0, D / 2 + 0.001]}>
            <boxGeometry args={[W - 0.04, H - 0.04, 0.002]} />
            <meshStandardMaterial color="#F5EFE6" {...MAT.paper} />
          </mesh>
          <Text
            position={[0, 0, D / 2 + 0.01]}
            fontSize={0.13}
            color="#ff00ea"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
          >
            {label}
          </Text>
        </group>
      </HoverLift>
    </AppearGroup>
  );
}

export default function Moulding() {
  const { height, wallThickness: wt } = ROOM;

  return (
    <>
      {/* 뒷벽 몰딩 */}
      <mesh position={[0.05, height - 0.08, -WALL_HALF + wt / 2 + 0.004]}>
        <boxGeometry args={[ROOM.size + 0.08, 0.20, wt + 0.05]} />
        <meshStandardMaterial color={COLOR.moulding} {...MAT.moulding} />
      </mesh>

      {/* 왼쪽 벽 몰딩 */}
      <mesh position={[-WALL_HALF + wt / 2 + 0.003, height - 0.08, 0.05]}>
        <boxGeometry args={[wt + 0.05, 0.20, ROOM.size + 0.08]} />
        <meshStandardMaterial color={COLOR.moulding} {...MAT.moulding} />

        {SIGNS_DATA.map((sign, i) => (
          <group
            key={sign.id}
            position={[
              (wt + 0.05) / 2 - 0.03,
              -0.20 / 2 - SIGN.h / 2 - 0.015 - i * SIGN.gap,
              3.827,
            ]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <SignBoard
              label={sign.label}
              icon={sign.icon}
              color={sign.color}
              onClick={sign.onClick}
              delay={DELAY.clock + 0.3 + i * 0.15}
              isFirst={i === 0}
            />
          </group>
        ))}
      </mesh>
    </>
  );
}