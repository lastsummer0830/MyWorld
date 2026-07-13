"use client";

/**
 * DogFrames.tsx
 *
 * 왼쪽 벽에 걸리는 강아지 그림 액자 3개
 * 그림은 dogTextures.ts에서 canvas 2D로 절차 생성 (외부 이미지 없음)
 *
 * 벽 로컬 좌표 기준:
 * X: 벽에서 돌출 방향 (+X = 방 안쪽)
 * Y: 위아래
 * Z: 벽을 따라 좌우
 */

import { useMemo } from "react";
import * as THREE from "three";
import { HoverLift, AppearGroup } from "../AnimatedWrapper";
import { DELAY, WALL_HALF, ROOM } from "../constants";
import { POS, SIZE } from "../layout";
import { MAT } from "../materials";
import { DOG_FRAME_META, createDogTexture, DogFrameKey } from "./dogTextures";

export default function DogFrames() {
  const { frameD, matD, borderW, sizes, zOffsets, yOffsets } = SIZE.dogFrames;
  const wt = ROOM.wallThickness;
  const wallX = -WALL_HALF + wt + 0.005; // 벽 안쪽 면 X 위치

  // 강아지 그림 3장을 canvas로 한 번만 생성
  const textures = useMemo<Record<DogFrameKey, THREE.CanvasTexture>>(
    () => ({
      smiling:  createDogTexture("smiling"),
      sleeping: createDogTexture("sleeping"),
      peeking:  createDogTexture("peeking"),
    }),
    []
  );

  return (
    <group position={[wallX, POS.dogFrames[1], POS.dogFrames[2]]}>
      {DOG_FRAME_META.map(({ key, frameColor, matColor }, i) => {
        const [frameH, frameW] = sizes[i]; // [너비Y, 높이Z] → 벽에서 Y=높이, Z=너비
        const zOff = zOffsets[i];
        const yOff = yOffsets[i];
        const tex  = textures[key];

        return (
        <group key={key}>
          <AppearGroup
            delay={DELAY.dogFrames + i * 0.15}
            position={[0, yOff, zOff]}
          >
            <HoverLift liftHeight={0.04}>
              <group rotation={[0, Math.PI / 2, 0]}>

                {/* ── 액자 외곽 프레임 ── */}
                {/* 상단 */}
                <mesh position={[0, frameH / 2 + borderW / 2, 0]} castShadow>
                  <boxGeometry args={[frameW + borderW * 2, borderW, frameD]} />
                  <meshStandardMaterial color={frameColor} {...MAT.woodDark} />
                </mesh>
                {/* 하단 */}
                <mesh position={[0, -frameH / 2 - borderW / 2, 0]} castShadow>
                  <boxGeometry args={[frameW + borderW * 2, borderW, frameD]} />
                  <meshStandardMaterial color={frameColor} {...MAT.woodDark} />
                </mesh>
                {/* 왼쪽 */}
                <mesh position={[-frameW / 2 - borderW / 2, 0, 0]} castShadow>
                  <boxGeometry args={[borderW, frameH, frameD]} />
                  <meshStandardMaterial color={frameColor} {...MAT.woodDark} />
                </mesh>
                {/* 오른쪽 */}
                <mesh position={[frameW / 2 + borderW / 2, 0, 0]} castShadow>
                  <boxGeometry args={[borderW, frameH, frameD]} />
                  <meshStandardMaterial color={frameColor} {...MAT.woodDark} />
                </mesh>

                {/* ── 매트 (테두리 안쪽 배경) ── */}
                <mesh position={[0, 0, frameD / 2 - matD]}>
                  <planeGeometry args={[frameW, frameH]} />
                  <meshStandardMaterial color={matColor} roughness={0.95} />
                </mesh>

                {/* ── 강아지 그림 ── */}
                <mesh position={[0, 0, frameD / 2 - matD + 0.001]}>
                  <planeGeometry args={[frameW * 0.90, frameH * 0.90]} />
                  <meshStandardMaterial map={tex} roughness={0.9} />
                </mesh>

                {/* ── 유리 반사 (살짝 투명) ── */}
                <mesh position={[0, 0, frameD / 2 + 0.001]}>
                  <planeGeometry args={[frameW, frameH]} />
                  <meshStandardMaterial
                    transparent
                    opacity={0.06}
                    color="#FFFFFF"
                    roughness={0.05}
                    metalness={0.2}
                  />
                </mesh>

                {/* ── 걸이 (상단 중앙) ── */}
                <mesh position={[0, frameH / 2 + borderW + 0.02, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} />
                  <meshStandardMaterial color="#888" {...MAT.metalHandle} />
                </mesh>

              </group>
            </HoverLift>
          </AppearGroup>
        </group>
        );
      })}
    </group>
  );
}
