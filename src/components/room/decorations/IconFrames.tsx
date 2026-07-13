"use client";

import * as THREE from "three";
import { MAT } from "../materials";

import { useRef } from "react";
import { HoverLift } from "../AnimatedWrapper";
import { COLOR } from "../constants";
import { SIZE } from "../layout";
import { ICON_META, getIconTexture } from "./iconTextures";

export default function IconFrames() {
  const { size, gap, lean, half } = SIZE.icon;
  const px = 0.08 + Math.sin(lean) * half;
  const py = 0.12 + Math.cos(lean) * half;

  return (
    <>
      {ICON_META.map(({ key, bg, url }, i) => {
        const tex = getIconTexture(key);
        return (
          <IconFrame
            key={key}
            tex={tex}
            bg={bg}
            url={url}
            size={size}
            lean={lean}
            position={[px, py, (i - 1) * gap]}
          />
        );
      })}
    </>
  );
}

function IconFrame({
  tex, bg, url, size, lean, position,
}: {
  tex: THREE.Texture;
  bg: string;
  url: string;
  size: number;
  lean: number;
  position: [number, number, number];
}) {
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: any) => {
    pointerDown.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: any) => {
    if (!pointerDown.current) return;
    const dx = e.clientX - pointerDown.current.x;
    const dy = e.clientY - pointerDown.current.y;
    pointerDown.current = null;
    // 4px 이상 움직였으면 드래그로 판단 — 클릭 무시
    if (Math.sqrt(dx * dx + dy * dy) > 4) return;
    e.stopPropagation();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <group
      position={position}
      rotation={[0, Math.PI / 2, 0]}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onPointerOver={() => { if (url) document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      <HoverLift liftHeight={0.05}>
        <group rotation={[-lean, 0, 0]}>
          {/* 액자 */}
          <mesh castShadow>
            <boxGeometry args={[size, size, 0.022]} />
            <meshStandardMaterial color={COLOR.woodDark} {...MAT.woodDark} />
          </mesh>
          {/* 배경 */}
          <mesh position={[0, 0, 0.012]}>
            <boxGeometry args={[size * 0.87, size * 0.87, 0.006]} />
            <meshStandardMaterial color={bg} />
          </mesh>
          {/* 아이콘 */}
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[size * 0.83, size * 0.83]} />
            <meshStandardMaterial map={tex} transparent />
          </mesh>
        </group>
      </HoverLift>
    </group>
  );
}
