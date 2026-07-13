"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDayNight } from "../canvas/DayNightContext";
import { LOW_END_DEVICE } from "@/components/room/Performance";

const BUTTERFLY_COUNT = LOW_END_DEVICE ? 4 : 7;
const WING_COLORS = ["#FFB74D", "#F48FB1", "#FFF176", "#B39DDB", "#FFFFFF"] as const;

interface ButterflyData {
  cx: number; cz: number;   // 비행 궤도 중심
  orbitR:  number;          // 궤도 반경
  baseY:   number;          // 기본 고도
  speed:   number;          // 궤도 속도
  flapHz:  number;          // 날갯짓 속도
  phase:   number;          // 위상 오프셋
  color:   string;
}

// 낮에 정원을 맴도는 나비 — plane 2장 날갯짓 + sin 곡선 비행
// 밤(mode === "night")에는 스케일 lerp로 서서히 사라짐
export default function Butterflies() {
  const { mode } = useDayNight();
  const rootRef  = useRef<THREE.Group>(null!);
  const visRef   = useRef(0); // 0(숨김) ↔ 1(표시) 부드러운 전환

  const groupRefs = useRef<(THREE.Group | null)[]>(Array(BUTTERFLY_COUNT).fill(null));
  const leftRefs  = useRef<(THREE.Group | null)[]>(Array(BUTTERFLY_COUNT).fill(null));
  const rightRefs = useRef<(THREE.Group | null)[]>(Array(BUTTERFLY_COUNT).fill(null));

  const butterflies = useMemo<ButterflyData[]>(() => (
    Array.from({ length: BUTTERFLY_COUNT }, (_, i) => {
      const a = (i / BUTTERFLY_COUNT) * Math.PI * 2 + Math.random() * 0.8;
      const d = 3.0 + Math.random() * 8.0;
      return {
        cx:     Math.cos(a) * d,
        cz:     Math.sin(a) * d,
        orbitR: 1.4 + Math.random() * 1.8,
        baseY:  1.2 + Math.random() * 1.4,
        speed:  0.35 + Math.random() * 0.30,
        flapHz: 9 + Math.random() * 4,
        phase:  Math.random() * Math.PI * 2,
        color:  WING_COLORS[i % WING_COLORS.length],
      };
    })
  ), []);

  useFrame(({ clock }, delta) => {
    if (!rootRef.current) return;
    const t    = clock.elapsedTime;
    const lerp = 1 - Math.pow(0.001, delta);

    // 밤에는 서서히 사라짐
    const target = mode === "night" ? 0 : 1;
    visRef.current += (target - visRef.current) * lerp;
    const vis = visRef.current;
    rootRef.current.visible = vis > 0.01;
    if (!rootRef.current.visible) return;

    for (let i = 0; i < BUTTERFLY_COUNT; i++) {
      const b = butterflies[i];
      const g = groupRefs.current[i];
      if (!g) continue;

      // sin 곡선 비행 — 원 궤도 + 상하 물결
      const oa = t * b.speed + b.phase;
      g.position.set(
        b.cx + Math.cos(oa) * b.orbitR,
        b.baseY + Math.sin(t * 1.7 + b.phase) * 0.30,
        b.cz + Math.sin(oa) * b.orbitR,
      );
      // 진행 방향으로 몸 회전 (원 궤도 접선)
      g.rotation.y = -oa;
      g.scale.setScalar(vis);

      // 날갯짓 (좌우 대칭)
      const flap = Math.sin(t * b.flapHz + b.phase) * 0.9;
      const lw = leftRefs.current[i];
      const rw = rightRefs.current[i];
      if (lw) lw.rotation.z =  flap;
      if (rw) rw.rotation.z = -flap;
    }
  });

  return (
    <group ref={rootRef} name="butterflies">
      {butterflies.map((b, i) => (
        <group key={i} ref={(el) => { groupRefs.current[i] = el; }}>
          {/* 몸통 */}
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.16, 5]} />
            <meshBasicMaterial color="#4A3728" />
          </mesh>
          {/* 왼쪽 날개 (힌지 그룹 회전으로 날갯짓) */}
          <group ref={(el) => { leftRefs.current[i] = el; }}>
            <mesh position={[-0.13, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.26, 0.20]} />
              <meshBasicMaterial color={b.color} side={THREE.DoubleSide} transparent opacity={0.92} />
            </mesh>
          </group>
          {/* 오른쪽 날개 */}
          <group ref={(el) => { rightRefs.current[i] = el; }}>
            <mesh position={[0.13, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.26, 0.20]} />
              <meshBasicMaterial color={b.color} side={THREE.DoubleSide} transparent opacity={0.92} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
