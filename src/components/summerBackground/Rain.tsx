"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RainProps {
  isStorm:      boolean;
  spawnRadius?: number; // 수평 스폰 반지름 (원통 범위)
  spawnY?:      number; // 스폰 최대 높이
  count?:       number;
}

// 빗줄기 기울기 — 살짝 사선으로 떨어지는 여름 소나기
const TILT_Z  = 0.10;
const DRIFT_X = 1.2; // 기울기에 맞춘 수평 이동 속도

export default function Rain({
  isStorm,
  spawnRadius = 30,
  spawnY      = 40,
  count       = 700,
}: RainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // 원형 균등 분포 XZ
  const randomXZ = (r: number) => {
    const a    = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * r;
    return { x: Math.cos(a) * dist, z: Math.sin(a) * dist };
  };

  const rainData = useMemo(() => {
    return Array.from({ length: count }, () => {
      const { x, z } = randomXZ(spawnRadius);
      return {
        x,
        y:     Math.random() * spawnY,
        z,
        speed: 9.0 + Math.random() * 5.0, // 눈보다 훨씬 빠른 수직 낙하
        len:   0.9 + Math.random() * 0.5, // 빗줄기 길이 편차
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, spawnY, spawnRadius]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!isStorm || !meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const r = rainData[i];
      r.y -= r.speed * delta;
      r.x -= DRIFT_X * delta; // 기울어진 낙하

      if (r.y < 0) {
        r.y = spawnY;
        const { x, z } = randomXZ(spawnRadius);
        r.x = x;
        r.z = z;
      }

      dummy.position.set(r.x, r.y, r.z);
      dummy.rotation.set(0, 0, TILT_Z);
      dummy.scale.set(0.022, 0.45 * r.len, 0.022); // 가늘고 긴 빗줄기
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // clear일 때는 렌더하지 않음 — 맑은 여름날엔 파티클 없이 나비가 활동
  if (!isStorm) return null;

  return (
    // renderOrder=2 — 스텐실 마스크(1) 이후에 렌더링
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} renderOrder={2}>
      <cylinderGeometry args={[1, 1, 1, 3]} />
      <meshBasicMaterial
        color="#AFD4EC"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
