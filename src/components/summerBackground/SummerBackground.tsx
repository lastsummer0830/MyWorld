"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

import Rain from "./Rain";
import { LOW_END_DEVICE } from "@/components/room/Performance";
import Pond from "./Pond";
import Pedestal from "./Pedestal";
import House from "./House";
import LampPost from "./LampPost";
import BigTree from "./BigTree";
import FlowerField from "./FlowerField";
import Picnic from "./Picnic";
import Butterflies from "./Butterflies";
import Fireflies from "./Fireflies";
import { PhaseGroup } from "../room/AnimatedWrapper";
import { useDayNight, PRESETS } from "../canvas/DayNightContext";
import { useWeather } from "../canvas/WeatherContext";

// ── 좌표 기준 ──────────────────────────────────────────
// PEDESTAL_TOP(0.8) = 받침대 상단면 Y
// GLOBE_CENTER_Y    = 받침대 위에 구슬이 정확히 안착하는 구슬 중심 Y
const GLOBE_RADIUS   = 20;
const PEDESTAL_TOP   = 0.8;
const GLOBE_CENTER_Y = PEDESTAL_TOP; // 0.8 — 구슬이 받침대에 안착된 유리 정원(테라리움) 구조

// 꽃밭 군락 중심 좌표 (x, z, 반경) — 나무 제외 구역과 공유
const FLOWER_PATCHES: [number, number, number][] = [
  [ -1.0,  4.2, 1.6 ], // 피크닉 근처 (옛 눈사람 자리)
  [  6.0,  5.5, 1.8 ], // 북동쪽 잔디
  [ -8.0, -4.5, 1.5 ], // 연못 서쪽
  [  3.0, -6.0, 1.5 ], // 연못 동쪽
  [ -4.5,  8.0, 1.6 ], // 북쪽 숲 입구
];

export default function SummerBackground() {
  const { mode }    = useDayNight();
  const { isStorm } = useWeather();
  const sunRef    = useRef<THREE.DirectionalLight>(null!);
  const ambRef    = useRef<THREE.AmbientLight>(null!);
  const ambColorRef = useRef(new THREE.Color());
  const sunColorRef = useRef(new THREE.Color());

  // 나무 instancedMesh refs — 기둥 + 잎 2덩이 (3 draw call)
  const treeTrunkRef   = useRef<THREE.InstancedMesh>(null!);
  const treeLeafLowRef = useRef<THREE.InstancedMesh>(null!);
  const treeLeafTopRef = useRef<THREE.InstancedMesh>(null!);

  // 가로등 불빛 refs — 6개를 단일 useFrame에서 통합 처리
  const LAMP_COUNT = 6;
  const lampRefs = useRef<(THREE.PointLight | null)[]>(Array(LAMP_COUNT).fill(null));

  useFrame(({ clock }, delta) => {
    const isNight = mode === "night";
    const t = 1 - Math.pow(0.001, delta);

    if (ambRef.current) {
      const targetAmbI = isStorm ? 0.25 : (isNight ? 0.4 : 0.65);
      ambRef.current.intensity += (targetAmbI - ambRef.current.intensity) * t;
      ambColorRef.current.set(PRESETS[mode].ambientColor);
      ambRef.current.color.lerp(ambColorRef.current, t);
    }
    if (sunRef.current) {
      const targetSunI = isStorm ? 0.15 : (isNight ? 0.7 : 2.6);
      sunRef.current.intensity += (targetSunI - sunRef.current.intensity) * t;
      sunColorRef.current.set(PRESETS[mode].dirColor);
      sunRef.current.color.lerp(sunColorRef.current, t);
    }

    // 가로등 6개 — 단일 루프로 통합 처리
    const et   = clock.elapsedTime;
    const base = isNight ? 4.5 : 0.5;
    const flicker = Math.sin(et * 13) * 0.14 + Math.sin(et * 7.7) * 0.07;
    for (let i = 0; i < LAMP_COUNT; i++) {
      const l = lampRefs.current[i];
      if (l) l.intensity = base + flicker;
    }
  });

  // 집 색상 팔레트 — 밝은 크림 벽 + 테라코타 지붕 (여름 별장 느낌)
  const HOUSE_PALETTE = [
    { wall: "#F2E3C8", roof: "#C4552E" }, // 크림 + 테라코타
    { wall: "#F7EAD4", roof: "#B0492A" }, // 아이보리 + 벽돌 레드
    { wall: "#EFD9B8", roof: "#CE6238" }, // 라이트 샌드 + 라이트 테라코타
  ];

  // 집 위치 고정 → 나머지 공간에 나무를 채움
  const { houses, trees } = useMemo(() => {
    // 고정 집 위치 (연못[-3.5,-7]·피크닉[4,0]·꽃밭 회피, 120° 균등 배치)
    const houseList = [
      { position: [ 11,  0,  5 ] as [number, number, number], wallColor: HOUSE_PALETTE[0].wall, roofColor: HOUSE_PALETTE[0].roof, scale: 0.92 },
      { position: [-11,  0,  5 ] as [number, number, number], wallColor: HOUSE_PALETTE[1].wall, roofColor: HOUSE_PALETTE[1].roof, scale: 0.85 },
      { position: [  1,  0, -12] as [number, number, number], wallColor: HOUSE_PALETTE[2].wall, roofColor: HOUSE_PALETTE[2].roof, scale: 0.90 },
    ].map(h => ({
      ...h,
      rotationY: Math.atan2(-h.position[0], -h.position[2]),
    }));

    // 나무 제외 구역: 연못 + 큰 나무 + 피크닉 + 각 집 위치 + 가로등 + 꽃밭
    const excludeZones: [number, number, number][] = [
      [-3.5, -7.0, 4.5],   // 연못
      [-8.5, -10.5, 4.5],  // 큰 나무 (정원의 상징목)
      [ 4.0,  0.1, 3.0],   // 피크닉 매트 + 파라솔
      ...houseList.map(h => [h.position[0], h.position[2], 4.0] as [number, number, number]),
      [  8.2,  3.2, 1.8 ], // 가로등 1
      [ -8.0,  2.8, 1.8 ], // 가로등 2
      [  1.5, -9.2, 1.8 ], // 가로등 3
      [ -5.5, -3.2, 1.8 ], // 가로등 4
      [  6.5, -2.0, 1.8 ], // 가로등 5
      [  2.2,  6.0, 1.8 ], // 가로등 6
      ...FLOWER_PATCHES.map(([x, z, r]) => [x, z, r + 0.8] as [number, number, number]),
    ];

    // 나무 생성
    const treeList: { pos: [number, number, number]; scale: number; rotY: number }[] = [];
    for (let i = 0; i < 100; i++) {
      const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.4;
      const dist  = 7.5 + Math.random() * 10.0;
      const x     = Math.cos(angle) * dist;
      const z     = Math.sin(angle) * dist;

      const scale = 0.5 + Math.random() * 0.35;

      // 제외 구역(연못·집 등) 체크
      const blocked = excludeZones.some(([cx, cz, minDist]) => {
        const dx = x - cx, dz = z - cz;
        return Math.sqrt(dx * dx + dz * dz) < minDist;
      });
      if (blocked) continue;

      // 이미 배치된 나무와 너무 가까우면 건너뜀 (나무 반경 × 스케일 기반)
      const tooClose = treeList.some(t => {
        const dx = x - t.pos[0], dz = z - t.pos[2];
        return Math.sqrt(dx * dx + dz * dz) < (scale + t.scale) * 1.4;
      });
      if (tooClose) continue;

      treeList.push({
        pos: [x, 0, z] as [number, number, number],
        scale,
        rotY: Math.random() * Math.PI * 2, // 잎 덩이 방향에 변화를 주는 랜덤 회전
      });
    }

    return { houses: houseList, trees: treeList };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 나무 인스턴스 행렬 설정 (마운트 후 1회)
  useEffect(() => {
    if (!treeTrunkRef.current || !treeLeafLowRef.current || !treeLeafTopRef.current) return;
    const dummy = new THREE.Object3D();
    trees.forEach(({ pos, scale: s, rotY }, i) => {
      // 기둥
      dummy.rotation.set(0, rotY, 0);
      dummy.position.set(pos[0], pos[1] + 0.7 * s, pos[2]);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      treeTrunkRef.current.setMatrixAt(i, dummy.matrix);

      // 아래 잎 덩이 (크고 진한 그린)
      dummy.position.set(pos[0], pos[1] + 2.1 * s, pos[2]);
      dummy.updateMatrix();
      treeLeafLowRef.current.setMatrixAt(i, dummy.matrix);

      // 위 잎 덩이 (작고 밝은 그린 — 살짝 옆으로 틀어 자연스러운 실루엣)
      dummy.position.set(
        pos[0] + Math.cos(rotY) * 0.45 * s,
        pos[1] + 3.0 * s,
        pos[2] + Math.sin(rotY) * 0.45 * s,
      );
      dummy.scale.setScalar(s * 0.7);
      dummy.updateMatrix();
      treeLeafTopRef.current.setMatrixAt(i, dummy.matrix);
    });
    treeTrunkRef.current.instanceMatrix.needsUpdate   = true;
    treeLeafLowRef.current.instanceMatrix.needsUpdate = true;
    treeLeafTopRef.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group name="summer-globe-root">
      <ambientLight ref={ambRef} />
      <directionalLight
        ref={sunRef}
        position={[20, 35, 20]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      {/* ── Phase 1 (0.3s): 유리 정원 외형 ── */}
      <PhaseGroup delay={0.3}>
        <Pedestal radius={GLOBE_RADIUS} />

        <mesh position={[0, GLOBE_CENTER_Y, 0]}>
          <sphereGeometry args={[GLOBE_RADIUS, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#241505" roughness={1} side={2} />
        </mesh>

        <mesh renderOrder={1} position={[0, GLOBE_CENTER_Y, 0]}>
          <sphereGeometry args={[GLOBE_RADIUS - 0.3, 32, 32]} />
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            stencilWrite={true}
            stencilFunc={THREE.AlwaysStencilFunc}
            stencilZPass={THREE.ReplaceStencilOp}
            stencilRef={1}
          />
        </mesh>

        <mesh position={[0, GLOBE_CENTER_Y, 0]}>
          <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
          <MeshTransmissionMaterial
            backside
            samples={1}
            resolution={256}
            thickness={0.15}
            roughness={0.04}
            transmission={1}
            ior={1.08}
            distortion={0.03}
            color="#ecf7e6"
          />
        </mesh>
      </PhaseGroup>

      {/* 구슬 내부 콘텐츠 */}
      <group position={[0, PEDESTAL_TOP + 0.01, 0]}>
        {/* ── Phase 2 (0.6s): 잔디 지면 ── */}
        <PhaseGroup delay={0.6}>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <circleGeometry args={[GLOBE_RADIUS - 0.2, 48]} />
            <meshStandardMaterial color="#6FAE4E" roughness={1} />
          </mesh>
        </PhaseGroup>

        {/* ── Phase 3 (0.9s): 여름 활엽수 (instancedMesh — 3 draw call) ── */}
        <PhaseGroup delay={0.9}>
          <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, trees.length]} castShadow>
            <cylinderGeometry args={[0.14, 0.22, 1.4, 6]} />
            <meshStandardMaterial color="#5B4028" />
          </instancedMesh>
          <instancedMesh ref={treeLeafLowRef} args={[undefined, undefined, trees.length]} castShadow>
            <dodecahedronGeometry args={[1.35, 0]} />
            <meshStandardMaterial color="#3E7C3A" roughness={0.9} />
          </instancedMesh>
          <instancedMesh ref={treeLeafTopRef} args={[undefined, undefined, trees.length]}>
            <dodecahedronGeometry args={[1.05, 0]} />
            <meshStandardMaterial color="#5CA84C" roughness={0.9} />
          </instancedMesh>
        </PhaseGroup>

        {/* ── Phase 4 (1.3s): 피크닉 + 연못 ── */}
        <Picnic position={[4.0, 0.01, 0.1]} baseDelay={1.3} />
        <Pond position={[-3.5, 0, -7.0]} radius={3.2} baseDelay={1.3} />

        {/* ── Phase 5 (1.6s): 큰 나무 + 꽃밭 ── */}
        <BigTree position={[-8.5, 0, -10.5]} baseDelay={1.6} />
        <FlowerField patches={FLOWER_PATCHES} baseDelay={1.6} />

        {/* ── Phase 6 (1.9s~): 집들 (순차 등장) ── */}
        {houses.map((h, i) => (
          <House key={i} {...h} baseDelay={1.9 + i * 0.15} />
        ))}

        {/* ── Phase 6.5 (2.1s~): 가로등 ── */}
        {([
          [  8.2, 0,  3.2 ],  // 집1 [11,0,5] 앞쪽
          [ -8.0, 0,  2.8 ],  // 집2 [-11,0,5] 앞쪽
          [  1.5, 0, -9.2 ],  // 집3 [1,0,-12] 앞쪽
          [ -5.5, 0, -3.2 ],  // 연못 서쪽
          [  6.5, 0, -2.0 ],  // 피크닉 너머 동쪽
          [  2.2, 0,  6.0 ],  // 북쪽 숲 입구
        ] as [number, number, number][]).map((pos, i) => (
          <LampPost
            key={i}
            position={pos}
            baseDelay={2.1 + i * 0.10}
            ref={(el) => { lampRefs.current[i] = el; }}
          />
        ))}

        {/* ── Phase 7 (2.2s): 생명체 + 날씨 파티클 ── */}
        <PhaseGroup delay={2.2}>
          {/* 낮 — 나비 / 밤 — 반딧불이 (각자 내부에서 페이드 처리) */}
          <Butterflies />
          <Fireflies />
          {/* 여름 소나기 — storm 모드에서만 렌더 */}
          <Rain
            isStorm={isStorm}
            spawnRadius={GLOBE_RADIUS * 0.85}
            spawnY={GLOBE_RADIUS * 1.8}
            count={LOW_END_DEVICE ? 350 : 700}
          />
        </PhaseGroup>
      </group>
      {mode === "night" && (
        <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade />
      )}
      {/* 맑은 여름 하늘톤 / storm 시 비 오는 회청색 */}
      <fog attach="fog" args={[isStorm ? "#7E97A8" : "#CDEAF8", isStorm ? 6 : 20, isStorm ? 38 : 80]} />
    </group>
  );
}
