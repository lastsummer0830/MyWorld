'use client';

// 반딧불이 — 밤의 주광원.
// ★ 밝은 색 + toneMapped=false 여야 Bloom이 이 점들을 "빛"으로 인식하고 번지게 한다.
//   emissive만 주면 그냥 노란 구슬로 보인다. 밤의 인상은 전적으로 이 조합에서 나온다.
// 낮에도 몇 마리는 희미하게 떠 있다가, 밤이 되면 또렷해진다.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID, TILE } from './constants';

const SPAN = GRID * TILE;
const COUNT = 22;

type Bug = { x: number; y: number; z: number; phase: number; speed: number; amp: number };

export default function Fireflies({ nightRef }: { nightRef: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FFE07A'),
        toneMapped: false,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );

  const bugs = useMemo<Bug[]>(() => {
    let s = 5150;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    return Array.from({ length: COUNT }, () => ({
      x: (rand() - 0.5) * SPAN * 1.15,
      y: 0.6 + rand() * 4.2,
      z: (rand() - 0.5) * SPAN * 1.15,
      phase: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 0.9,
      amp: 0.25 + rand() * 0.5,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const night = nightRef.current;

    // 낮에는 거의 안 보이고 밤에 살아난다.
    mat.opacity = 0.12 + night * 0.85;

    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const b = bugs[i];
      child.position.y = b.y + Math.sin(t * b.speed + b.phase) * b.amp;
      child.position.x = b.x + Math.cos(t * b.speed * 0.6 + b.phase) * 0.4;
      // 깜빡임 — 개체마다 위상이 달라야 살아 있는 것처럼 보인다.
      const flick = 0.65 + Math.sin(t * 2.2 + b.phase * 3) * 0.35;
      child.scale.setScalar(flick * (0.5 + night * 0.9));
    });
  });

  return (
    <group ref={group}>
      {bugs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} material={mat}>
          <sphereGeometry args={[0.09, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}
