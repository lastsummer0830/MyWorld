"use client";

import { AppearGroup, HoverLift, SceneItem } from "../AnimatedWrapper";
import DogFrames from "../decorations/DogFrames";
import IconFrames from "../decorations/IconFrames";
import WallClock from "../decorations/WallClock";
import { COLOR, DELAY, ROOM, WALL_HALF, WIN } from "../constants";
import { POS, SIZE } from "../layout";
import { MAT } from "../materials";

// ── 창문 + 커튼 ──────────────────────────────
function WindowWithCurtains() {
  return (
    <group position={[WIN.x, WIN.y, 0]}>
      {/* 유리 */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[WIN.w, WIN.h]} />
        <meshStandardMaterial color="#E0F7FA" transparent opacity={0.1} metalness={0.9} />
      </mesh>

      {/* 십자 프레임 세로 */}
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[0.05, WIN.h, 0.06]} />
        <meshStandardMaterial color={COLOR.windowFrame} {...MAT.windowFrame} />
      </mesh>
      {/* 십자 프레임 가로 */}
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[WIN.w, 0.05, 0.06]} />
        <meshStandardMaterial color={COLOR.windowFrame} {...MAT.windowFrame} />
      </mesh>

      {/* 외곽 프레임 — 상/하/좌/우 */}
      {[
        { pos: [0,         WIN.h / 2,  0.01] as [number,number,number], size: [WIN.w + 0.2, 0.1,  0.15] as [number,number,number] },
        { pos: [0,        -WIN.h / 2,  0.01] as [number,number,number], size: [WIN.w + 0.2, 0.1,  0.15] as [number,number,number] },
        { pos: [ WIN.w/2,  0,          0.01] as [number,number,number], size: [0.1, WIN.h,         0.15] as [number,number,number] },
        { pos: [-WIN.w/2,  0,          0.01] as [number,number,number], size: [0.1, WIN.h,         0.15] as [number,number,number] },
      ].map(({ pos, size }, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={COLOR.windowFrame} {...MAT.windowFrame} />
        </mesh>
      ))}

      {/* 커튼봉 + 좌우 커튼 — 하나의 SceneItem으로 묶어서 함께 hover */}
      <SceneItem
        delay={DELAY.curtainL}
        liftHeight={0.06}
        hitbox={[WIN.w + 1.4, WIN.h + 0.8, 0.4]}
        hitboxPos={[0, 0, 0.12]}
      >
        {/* 커튼봉 */}
        <mesh position={[0, WIN.h / 2 + 0.20, 0.16]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.020, 0.020, WIN.w + 1.3, 16]} />
          <meshStandardMaterial color={COLOR.woodDark} {...MAT.woodDark} />
        </mesh>

        {/* 왼쪽 커튼 */}
        <group position={[-WIN.w / 2 - 0.28, 0, 0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.58, WIN.h + 0.4, 0.032]} />
            <meshStandardMaterial color={COLOR.curtain} {...MAT.curtain} />
          </mesh>
          {([-0.14, 0.04, 0.19] as number[]).map((x, i) => (
            <mesh key={i} position={[x, 0, 0.032 + i * 0.008]} castShadow>
              <boxGeometry args={[0.12, WIN.h + 0.4, 0.04]} />
              <meshStandardMaterial color={COLOR.curtainFold} {...MAT.curtain} />
            </mesh>
          ))}
        </group>

        {/* 오른쪽 커튼 */}
        <group position={[WIN.w / 2 + 0.28, 0, 0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.58, WIN.h + 0.4, 0.032]} />
            <meshStandardMaterial color={COLOR.curtain} {...MAT.curtain} />
          </mesh>
          {([0.14, -0.04, -0.19] as number[]).map((x, i) => (
            <mesh key={i} position={[x, 0, 0.032 + i * 0.008]} castShadow>
              <boxGeometry args={[0.12, WIN.h + 0.4, 0.04]} />
              <meshStandardMaterial color={COLOR.curtainFold} {...MAT.curtain} />
            </mesh>
          ))}
        </group>
      </SceneItem>
    </group>
  );
}

// ── 뒷벽 ─────────────────────────────────────
function BackWall() {
  const wt = ROOM.wallThickness;
  const ht = ROOM.height;
  const z  = -WALL_HALF + wt / 2;

  return (
    <group position={[0, 0, z]}>
      {/* 벽 — hover 없음 */}
      <AppearGroup delay={DELAY.wallBack}>
        <group>
          {/* 창문 왼쪽 벽 */}
          <mesh position={[WIN.x - WIN.w / 2 - (WALL_HALF + WIN.x - WIN.w / 2) / 2, ht / 2, 0]} receiveShadow>
            <boxGeometry args={[WALL_HALF + WIN.x - WIN.w / 2, ht, wt]} />
            <meshStandardMaterial color={COLOR.wall} {...MAT.wall} />
          </mesh>
          {/* 창문 오른쪽 벽 */}
          <mesh position={[(WALL_HALF - WIN.x - WIN.w / 2) / 2 + WIN.x + WIN.w / 2, ht / 2, 0]} receiveShadow>
            <boxGeometry args={[WALL_HALF - WIN.x - WIN.w / 2, ht, wt]} />
            <meshStandardMaterial color={COLOR.wall} {...MAT.wall} />
          </mesh>
          {/* 창문 아래 벽 */}
          <mesh position={[WIN.x, (WIN.y - WIN.h / 2) / 2, 0]} receiveShadow>
            <boxGeometry args={[WIN.w, WIN.y - WIN.h / 2, wt]} />
            <meshStandardMaterial color={COLOR.wall} {...MAT.wall} />
          </mesh>
          {/* 창문 위 벽 */}
          <mesh position={[WIN.x, WIN.y + WIN.h / 2 + (ht - WIN.y - WIN.h / 2) / 2, 0]} receiveShadow>
            <boxGeometry args={[WIN.w, ht - WIN.y - WIN.h / 2, wt]} />
            <meshStandardMaterial color={COLOR.wall} {...MAT.wall} />
          </mesh>
        </group>
      </AppearGroup>

      <WindowWithCurtains />
      <WallClock position={[-1.6, 3.8, wt / 2 + 0.025]} />
    </group>
  );
}

// ── 왼쪽 벽 ──────────────────────────────────
function LeftWall() {
  const wt = ROOM.wallThickness;
  const ht = ROOM.height;
  const x  = -WALL_HALF + wt / 2;

  return (
    <group>
      {/* 벽 — hover 없음 */}
      <AppearGroup delay={DELAY.wallLeft}>
        <mesh position={[x, ht / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wt, ht, ROOM.size]} />
          <meshStandardMaterial color={COLOR.wall} {...MAT.wall} />
        </mesh>
      </AppearGroup>

      {/* 강아지 액자 */}
      <DogFrames />

      {/* 선반 세트 */}
      <group position={[-WALL_HALF + wt, 0, POS.shelfGroup]}>

        {/* 위 선반 */}
        <AppearGroup delay={DELAY.shelfUpper} position={[0, POS.shelfUpperY, 0]}>
          <group position={[SIZE.shelf.xOff, 0, 0]}>
            <HoverLift liftHeight={0.04}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[SIZE.shelf.w, SIZE.shelf.h, SIZE.shelf.d]} />
                <meshStandardMaterial color={COLOR.woodMid} {...MAT.woodMid} />
              </mesh>
            </HoverLift>
          </group>
          <IconFrames />
        </AppearGroup>

        {/* 아래 선반 */}
        <AppearGroup delay={DELAY.shelfLower} position={[0, POS.shelfLowerY, 0]}>
          <group position={[0.215, 0, 0]}>
            <HoverLift liftHeight={0.04}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.43, 0.05, 1.65]} />
                <meshStandardMaterial color={COLOR.woodMid} {...MAT.woodMid} />
              </mesh>
            </HoverLift>
          </group>
          {/* 화분 */}
          <group position={[SIZE.shelf.xOff, 0, SIZE.shelfProps.potZ]}>
            <HoverLift liftHeight={0.05}>
              <mesh position={[0, SIZE.shelfProps.potH / 2, 0]} castShadow>
                <cylinderGeometry args={[SIZE.shelfProps.potR, SIZE.shelfProps.potRBot, SIZE.shelfProps.potH, 16]} />
                <meshStandardMaterial color={COLOR.pot} {...MAT.pot} />
              </mesh>
              <mesh position={[0, SIZE.shelfProps.potH + SIZE.shelfProps.plantR, 0]} castShadow>
                <sphereGeometry args={[SIZE.shelfProps.plantR, 16, 16]} />
                <meshStandardMaterial color={COLOR.plant} {...MAT.plant} />
              </mesh>
            </HoverLift>
          </group>
          {/* 책 빨강 */}
          <group position={[SIZE.shelf.xOff, SIZE.shelfProps.bookY, SIZE.shelfProps.bookRedZ]}>
            <HoverLift liftHeight={0.05}>
              <mesh rotation={[0, 0.1, 0]} castShadow>
                <boxGeometry args={[SIZE.shelfProps.bookW, SIZE.shelfProps.bookH, 0.112]} />
                <meshStandardMaterial color={COLOR.bookRed} {...MAT.book} />
              </mesh>
            </HoverLift>
          </group>
          {/* 책 파랑 */}
          <group position={[SIZE.shelf.xOff, SIZE.shelfProps.bookY, SIZE.shelfProps.bookBlueZ]}>
            <HoverLift liftHeight={0.05}>
              <mesh rotation={[0, -0.05, 0]} castShadow>
                <boxGeometry args={[SIZE.shelfProps.bookW, SIZE.shelfProps.bookH, 0.120]} />
                <meshStandardMaterial color={COLOR.bookBlue} {...MAT.book} />
              </mesh>
            </HoverLift>
          </group>
        </AppearGroup>

      </group>
    </group>
  );
}

export default function Walls() {
  return (
    <>
      <BackWall />
      <LeftWall />
    </>
  );
}