"use client";

import * as THREE from "three";
import { PROJECTS_DATA } from "@/components/room/portfolioData";

/*
 * ════════════════════════════════════════════════════════════════
 *  전시물 배치 — 전자동 (PROJECTS_DATA 만 수정하면 끝)
 * ════════════════════════════════════════════════════════════════
 *
 *  ★ 프로젝트를 추가/삭제하려면 portfolioData.ts 의 PROJECTS_DATA 만
 *    고치면 됩니다. 아래 위치·벽·통로 길이는 전부 자동 계산됩니다.
 *      - 전시 위치(EXHIBIT_ZS) : 개수에 맞춰 통로 중앙 기준 균등 배치
 *      - 전시 벽(SIDES)        : 좌·우 자동 교대 (L, R, L, R …)
 *      - 통로 길이(GD)         : 개수에 맞춰 자동으로 늘어남
 *      - 강조 조명             : 위 배열을 그대로 따라감
 *
 *  ※ 조정이 필요할 때만 아래 두 값을 만지세요:
 *      - SPACING    : 전시물 사이 간격 (클수록 듬성듬성)
 *      - END_MARGIN : 양 끝 전시물과 입/출구 벽 사이 여유
 *  ※ 특정 작품만 반대 벽에 걸고 싶다면 SIDES 생성 규칙(맨 아래)만 손보면 됩니다.
 *
 *  좌표계: 입구(-Z, 시작점) → +Z 진행 → 출구(+Z).
 *          "left" = 왼쪽 벽(-X), "right" = 오른쪽 벽(+X). (플레이어 +Z 기준)
 * ════════════════════════════════════════════════════════════════
 */

// ── 조정용 설정값 ──────────────────────────────────────────────
const SPACING    = 13;  // 전시물 간격 (권장 12~14)
const END_MARGIN = 10;  // 양 끝 전시물 ↔ 입/출구 벽 여유

// ── 자동 계산 (아래는 건드릴 필요 없음) ────────────────────────
const N = PROJECTS_DATA.length;

export const GW = 16;   // 갤러리 너비 (X, 고정)
export const GH = 6;    // 갤러리 높이 (Y, 고정)

// 통로 길이: 전시물을 다 담을 만큼 자동 확보 (최소 50)
export const GD = Math.max(50, (Math.max(N - 1, 0) * SPACING) + END_MARGIN * 2);

// i번째 전시물 Z 위치: 중앙(0) 기준 균등 배치
export const EXHIBIT_ZS: number[] = Array.from(
  { length: N },
  (_, i) => (i - (N - 1) / 2) * SPACING
);

// i번째 전시물 벽: 좌우 자동 교대 (0→left, 1→right, 2→left …)
export const SIDES: ("left" | "right")[] = Array.from(
  { length: N },
  (_, i) => (i % 2 === 0 ? "left" : "right")
);

// ── 문 치수 ───────────────────────────────────────────────────
const DW = 2.4;   // 문 전체 너비
const DH = 3.5;   // 문 높이
const FT = 0.07;  // 프레임 두께

// ── 갤러리 문 ─────────────────────────────────────────────────
function GalleryDoor({ posZ, facingIn }: { posZ: number; facingIn: boolean }) {
  // facingIn=true → 안쪽(+Z 방향)을 향하는 면이 정면
  const rotY = facingIn ? 0 : Math.PI;
  const frameColor  = "#c8c4bc";
  const panelColor  = "#f2f0eb";
  const handleColor = "#b0a89e";

  return (
    <group position={[0, 0, posZ]} rotation={[0, rotY, 0]}>
      {/* ── 프레임 4면 ── */}
      {/* 상단 */}
      <mesh position={[0, DH + FT / 2, 0.02]}>
        <boxGeometry args={[DW + FT * 2, FT, 0.07]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* 좌측 */}
      <mesh position={[-(DW / 2 + FT / 2), DH / 2, 0.02]}>
        <boxGeometry args={[FT, DH, 0.07]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* 우측 */}
      <mesh position={[DW / 2 + FT / 2, DH / 2, 0.02]}>
        <boxGeometry args={[FT, DH, 0.07]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* 하단 (바닥선) */}
      <mesh position={[0, FT / 4, 0.02]}>
        <boxGeometry args={[DW + FT * 2, FT / 2, 0.07]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>

      {/* ── 문 패널 (좌/우) ── */}
      <mesh position={[-DW / 4, DH / 2, 0.016]}>
        <boxGeometry args={[DW / 2 - 0.02, DH - 0.04, 0.045]} />
        <meshStandardMaterial color={panelColor} roughness={0.82} />
      </mesh>
      <mesh position={[DW / 4, DH / 2, 0.016]}>
        <boxGeometry args={[DW / 2 - 0.02, DH - 0.04, 0.045]} />
        <meshStandardMaterial color={panelColor} roughness={0.82} />
      </mesh>

      {/* ── 문 패널 내부 몰딩 (좌) ── */}
      <mesh position={[-DW / 4, DH / 2, 0.042]}>
        <boxGeometry args={[DW / 2 - 0.16, DH - 0.32, 0.01]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>
      {/* 우 */}
      <mesh position={[DW / 4, DH / 2, 0.042]}>
        <boxGeometry args={[DW / 2 - 0.16, DH - 0.32, 0.01]} />
        <meshStandardMaterial color={frameColor} roughness={0.8} />
      </mesh>

      {/* ── 손잡이 (좌/우) ── */}
      {([-0.18, 0.18] as number[]).map((x, i) => (
        <group key={i} position={[x, DH / 2, 0.06]}>
          {/* 손잡이 봉 */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.10, 10]} />
            <meshStandardMaterial color={handleColor} metalness={0.55} roughness={0.3} />
          </mesh>
          {/* 받침 플레이트 */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[0.06, 0.20, 0.012]} />
            <meshStandardMaterial color={handleColor} metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* ── 상단 채광창 ── */}
      <mesh position={[0, DH + 0.38, 0.016]}>
        <planeGeometry args={[DW - 0.1, 0.60]} />
        <meshStandardMaterial
          color="#d8eaf8"
          transparent
          opacity={0.55}
          roughness={0.08}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* 채광창 프레임 */}
      <mesh position={[0, DH + 0.38, 0.018]}>
        <boxGeometry args={[DW + FT * 2, 0.64, 0.04]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* 채광창 중간 기둥 */}
      <mesh position={[0, DH + 0.38, 0.03]}>
        <boxGeometry args={[FT * 0.6, 0.60, 0.05]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, DH + 0.38, 0.016]}>
        <planeGeometry args={[DW - 0.1, 0.60]} />
        <meshStandardMaterial
          color="#d8eaf8"
          transparent
          opacity={0.55}
          roughness={0.08}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── 갤러리 룸 ─────────────────────────────────────────────────
export default function GalleryRoom() {
  return (
    <group>
      {/* ── 바닥 ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[GW, GD]} />
        <meshStandardMaterial color="#eeece8" roughness={0.35} metalness={0.04} />
      </mesh>

      {/* ── 천장 ── */}
      <mesh position={[0, GH, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[GW, GD]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* ── 왼쪽 벽 ── */}
      <mesh position={[-GW / 2, GH / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[GD, GH]} />
        <meshStandardMaterial color="#f7f5f1" roughness={0.88} />
      </mesh>

      {/* ── 오른쪽 벽 ── */}
      <mesh position={[GW / 2, GH / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[GD, GH]} />
        <meshStandardMaterial color="#f7f5f1" roughness={0.88} />
      </mesh>

      {/* ── 입구 벽 (z=-GD/2, 안쪽(+Z)이 정면) ── */}
      <mesh position={[0, GH / 2, -GD / 2]}>
        <planeGeometry args={[GW, GH]} />
        <meshStandardMaterial color="#f5f3ef" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* ── 출구 벽 (z=+GD/2, 안쪽(-Z)이 정면) ── */}
      <mesh position={[0, GH / 2, GD / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[GW, GH]} />
        <meshStandardMaterial color="#f5f3ef" roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* ── 걸레받이 ── */}
      <mesh position={[-GW / 2 + 0.05, 0.12, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[GD, 0.22]} />
        <meshStandardMaterial color="#dedad4" roughness={0.7} />
      </mesh>
      <mesh position={[GW / 2 - 0.05, 0.12, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[GD, 0.22]} />
        <meshStandardMaterial color="#dedad4" roughness={0.7} />
      </mesh>

      {/* ── 문 ── */}
      <GalleryDoor posZ={-GD / 2 + 0.01} facingIn />
      <GalleryDoor posZ={GD / 2 - 0.01}  facingIn={false} />

      {/* ── 베이스 조명 (밝기 보강) ── */}
      <ambientLight intensity={1.75} color="#fff8f0" />
      <directionalLight position={[0, GH - 0.5, 0]} intensity={1.05} color="#fff6ec" />

      {/* ── 전시물 강조 — 전시물 있는 벽쪽만 1개씩 (6→3) ── */}
      {EXHIBIT_ZS.map((z, i) => {
        const x = SIDES[i] === "left" ? -GW / 2 + 2 : GW / 2 - 2;
        return (
          <pointLight
            key={i}
            position={[x, GH - 0.4, z]}
            intensity={26}
            distance={12}
            color="#fff5e8"
            castShadow={false}
          />
        );
      })}

      {/* ── 천장 다운라이트 (발광면 — 실제 광원 아님, 비용 0) ── */}
      {([-20, -12, -4, 4, 12, 20] as number[]).map((z, i) => (
        <mesh key={i} position={[0, GH - 0.03, z]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.55, 20]} />
          <meshBasicMaterial color="#fff6ea" />
        </mesh>
      ))}
    </group>
  );
}
