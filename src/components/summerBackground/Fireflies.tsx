"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDayNight } from "../canvas/DayNightContext";
import { LOW_END_DEVICE } from "@/components/room/Performance";

const FIREFLY_COUNT = LOW_END_DEVICE ? 12 : 24;

interface FireflyData {
  x: number; y: number; z: number; // 기준 위치
  driftR:  number;                 // 부유 반경
  driftHz: number;                 // 부유 속도
  blinkHz: number;                 // 깜빡임 속도
  phase:   number;                 // 위상 오프셋
}

// 밤에만 나타나는 반딧불이 — 깜빡임 + 느린 부유 (instancedMesh 1 draw call)
// 낮(mode === "day")에는 스케일 lerp로 서서히 사라짐
export default function Fireflies() {
  const { mode } = useDayNight();
  const meshRef  = useRef<THREE.InstancedMesh>(null!);
  const visRef   = useRef(0); // 0(숨김) ↔ 1(표시) 부드러운 전환

  const fireflies = useMemo<FireflyData[]>(() => (
    Array.from({ length: FIREFLY_COUNT }, (_, i) => {
      const a = (i / FIREFLY_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const d = 3.0 + Math.random() * 11.0;
      return {
        x:       Math.cos(a) * d,
        y:       0.6 + Math.random() * 2.4,
        z:       Math.sin(a) * d,
        driftR:  0.3 + Math.random() * 0.5,
        driftHz: 0.25 + Math.random() * 0.35,
        blinkHz: 0.8 + Math.random() * 1.4,
        phase:   Math.random() * Math.PI * 2,
      };
    })
  ), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;
    const t    = clock.elapsedTime;
    const lerp = 1 - Math.pow(0.001, delta);

    // 밤에만 표시 — 낮에는 서서히 사라짐
    const target = mode === "night" ? 1 : 0;
    visRef.current += (target - visRef.current) * lerp;
    const vis = visRef.current;
    meshRef.current.visible = vis > 0.005;
    if (!meshRef.current.visible) return;

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const f = fireflies[i];
      const dt = t * f.driftHz + f.phase;

      // 느린 부유 — 완만한 3축 사인 곡선
      dummy.position.set(
        f.x + Math.sin(dt) * f.driftR,
        f.y + Math.sin(dt * 1.3 + 1.0) * f.driftR * 0.6,
        f.z + Math.cos(dt * 0.8) * f.driftR,
      );

      // 깜빡임 — sin을 제곱해 확 켜졌다 스르르 꺼지는 느낌
      const raw   = Math.sin(t * f.blinkHz * Math.PI + f.phase) * 0.5 + 0.5;
      const blink = 0.25 + raw * raw * 0.75;
      dummy.scale.setScalar(0.05 * blink * vis);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FIREFLY_COUNT]}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial color="#D9FF7E" transparent opacity={0.95} depthWrite={false} />
    </instancedMesh>
  );
}
