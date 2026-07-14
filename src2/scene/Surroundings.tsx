'use client';

// 무대 "바깥" 세계 — 정원 섬이 허공에 덩그러니 뜬 게 아니라 넓은 하늘 한복판에 있게 만든다.
// 구성: 판 아래 바위 밑동 + 떠다니는 작은 섬들 + 구름.
// 원경은 그림자를 만들지도 받지도 않는다 — 비용만 들고 보이지 않는다.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRASS_H, GRID, SLAB_H, TILE } from './constants';
import { moodColor } from './palette';

const SPAN = GRID * TILE;

/** 결정적 난수 — Math.random을 쓰면 리렌더마다 섬이 순간이동한다. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 정원 판을 받치는 바위 밑동. 이게 있어야 "땅을 도려낸 섬"으로 읽힌다. */
function IslandBase() {
  // 밑동이 길면 화면 아래 절반을 잡아먹어 정작 정원이 작아 보인다. 짧고 뭉툭하게.
  const H = SPAN * 0.32;

  return (
    <group position={[0, -(GRASS_H + SLAB_H), 0]}>
      {/* 원뿔을 뒤집어 아래로 뾰족하게 — 도려낸 땅덩이의 밑동. */}
      <mesh rotation={[Math.PI, 0, 0]} position={[0, -H / 2, 0]}>
        <coneGeometry args={[SPAN * 0.66, H, 7, 1]} />
        <meshStandardMaterial color="#A98F76" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[SPAN * 0.14, -H * 0.45, -SPAN * 0.1]} rotation={[0.3, 0.6, 0.2]}>
        <coneGeometry args={[SPAN * 0.16, H * 0.5, 5, 1]} />
        <meshStandardMaterial color="#9A8069" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/** 흙 위에 잔디 뚜껑을 덮은 작은 부유섬. */
function Islet({ pos, r, h }: { pos: [number, number, number]; r: number; h: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[r, r * 0.92, 0.35, 7]} />
        <meshStandardMaterial color="#A6CC85" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.15, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[r * 0.92, h, 6, 1]} />
        <meshStandardMaterial color="#A98F76" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[r * 0.25, 0.85, 0]}>
        <coneGeometry args={[r * 0.42, 1.4, 6]} />
        <meshStandardMaterial color="#8CBB72" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/** 구름 한 덩이 — 구 몇 개를 뭉쳐 로우폴리 뭉게구름으로. 천천히 흐른다. */
function Cloud({
  pos,
  scale,
  drift,
  colorRef,
}: {
  pos: [number, number, number];
  scale: number;
  drift: number;
  colorRef: React.RefObject<THREE.Color>;
}) {
  const group = useRef<THREE.Group>(null);
  const startX = pos[0];

  // 덩이 전부가 같은 재질을 공유해야 낮/밤 색이 한 번에 바뀐다.
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, metalness: 0 }),
    [],
  );

  useFrame((state) => {
    if (group.current) {
      // 좌우로 아주 느리게 흐른다. 완전히 멈춰 있으면 배경이 죽은 그림처럼 보인다.
      group.current.position.x = startX + Math.sin(state.clock.elapsedTime * drift) * 6;
    }
    if (colorRef.current) mat.color.copy(colorRef.current);
  });

  const blobs: [number, number, number, number][] = [
    [0, 0, 0, 1],
    [0.9, -0.12, 0.2, 0.72],
    [-0.85, -0.1, -0.15, 0.66],
    [0.25, 0.42, -0.3, 0.6],
  ];

  return (
    <group ref={group} position={pos} scale={scale}>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={mat}>
          <sphereGeometry args={[r, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Surroundings({ nightRef }: { nightRef: React.RefObject<number> }) {
  const cloudColor = useRef(new THREE.Color('#FFFFFF'));

  useFrame(() => {
    moodColor(cloudColor.current, 'cloud', nightRef.current);
  });

  // ★ 바깥은 배경이다. 판 가까이 두면 주인공의 시선을 뺏는다 — 멀리 밀고, 대신 크게 만든다.
  //   기본 배율에서는 거의 안 보이다가, 축소하면 그제야 드러나는 정도가 목표.
  const islets = useMemo(() => {
    const rand = seeded(20260714);
    return Array.from({ length: 8 }, () => {
      const a = rand() * Math.PI * 2;
      const dist = SPAN * 1.9 + rand() * SPAN * 2.4;
      const r = 3 + rand() * 5;
      return {
        pos: [Math.cos(a) * dist, -10 - rand() * 26, Math.sin(a) * dist] as [number, number, number],
        r,
        h: r * (1.6 + rand()),
      };
    });
  }, []);

  const clouds = useMemo(() => {
    const rand = seeded(9911);
    return Array.from({ length: 16 }, () => {
      const a = rand() * Math.PI * 2;
      const dist = SPAN * 1.7 + rand() * SPAN * 3.0;
      return {
        pos: [Math.cos(a) * dist, -22 + rand() * 52, Math.sin(a) * dist] as [number, number, number],
        scale: 3 + rand() * 6,
        drift: 0.03 + rand() * 0.05,
      };
    });
  }, []);

  return (
    <group>
      <IslandBase />
      {islets.map((isle, i) => (
        <Islet key={`i${i}`} {...isle} />
      ))}
      {clouds.map((c, i) => (
        <Cloud key={`c${i}`} {...c} colorRef={cloudColor} />
      ))}
    </group>
  );
}
