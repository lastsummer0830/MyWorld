'use client';

// 무대 "바깥" 세계 — 정원 섬이 허공에 덩그러니 뜬 게 아니라 넓은 하늘 한복판에 있게 만든다.
// 구성: 멀리 떠다니는 작은 섬들 + 구름. (섬의 밑동은 Island.tsx가 가진다.)
//
// ★★ 직교(ortho) 카메라에는 원근이 없다 — 멀리 둬도 작아지지 않는다.
//   원근 카메라라면 100m 밖 섬은 알아서 작게 보이지만, 직교에서는 100m 밖이든 10m 밖이든 같은 크기로 그려진다.
//   그래서 "멀리 밀고 크게 만든다"는 통하지 않는다(그렇게 짰다가 배경 섬이 거대한 회색 원뿔로 화면을 덮었다).
//   → 원경은 **실제로 작게 만들고**(주인공 섬의 1/6~1/15), **안개로 흐려서** 멀어 보이게 한다.
//
// 원경은 그림자를 만들지도 받지도 않는다 — 비용만 들고 보이지 않는다.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLAND_R } from './constants';
import { COLOR, moodColor } from './palette';
import { MAT } from './materials';

/** 섬의 지름 — 바깥 세계의 거리는 전부 이 값의 배수로 잡는다. */
const D = ISLAND_R * 2;

/** 결정적 난수 — Math.random을 쓰면 리렌더마다 섬이 순간이동한다. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 흙 위에 잔디 뚜껑을 덮은 작은 부유섬. 주인공 섬의 축소판이라 같은 문법으로 읽힌다. */
function Islet({ pos, r, h }: { pos: [number, number, number]; r: number; h: number }) {
  return (
    <group position={pos}>
      <mesh material={MAT('foliage', 'grassEdge')}>
        <cylinderGeometry args={[r, r * 0.92, 0.35, 7]} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.15, 0]} rotation={[Math.PI, 0, 0]} material={MAT('rock', 'rock')}>
        <coneGeometry args={[r * 0.92, h, 6, 1]} />
      </mesh>
      <mesh position={[r * 0.25, 0.85, 0]} material={MAT('foliage', 'grass')}>
        <coneGeometry args={[r * 0.42, 1.4, 6]} />
      </mesh>
    </group>
  );
}

/** 구름 한 덩이 — 구 몇 개를 뭉쳐 로우폴리 뭉게구름으로. 천천히 흐른다. */
function Cloud({
  pos,
  scale,
  drift,
  material,
}: {
  pos: [number, number, number];
  scale: number;
  drift: number;
  material: THREE.Material;
}) {
  const group = useRef<THREE.Group>(null);
  const startX = pos[0];

  useFrame((state) => {
    // 좌우로 아주 느리게 흐른다. 완전히 멈춰 있으면 배경이 죽은 그림처럼 보인다.
    if (group.current) {
      group.current.position.x = startX + Math.sin(state.clock.elapsedTime * drift) * 6;
    }
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
        <mesh key={i} position={[x, y, z]} material={material}>
          <sphereGeometry args={[r, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Surroundings({ nightRef }: { nightRef: React.RefObject<number> }) {
  // 구름 전부가 이 재질 하나를 공유한다 — 그래야 낮/밤 색이 한 번에 바뀐다.
  // (MAT 캐시를 쓰지 않는 이유: 이 재질은 매 프레임 색이 바뀌는 특수 재질이다.)
  const cloudMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLOR.metalWhite, roughness: 1, metalness: 0 }),
    [],
  );

  useFrame(() => {
    moodColor(cloudMat.color, 'cloud', nightRef.current);
  });

  const islets = useMemo(() => {
    const rand = seeded(20260714);
    return Array.from({ length: 10 }, () => {
      const a = rand() * Math.PI * 2;
      const dist = D * 2.0 + rand() * D * 2.6;
      // ★ 반지름 1.5~4m. 주인공 섬(22m)의 1/6~1/15밖에 안 된다 — 이렇게 작게 만들어야 "멀리 있는 것"으로 읽힌다.
      const r = 1.5 + rand() * 2.5;
      return {
        // 아래로 깔아 둔다. 주인공 섬보다 낮은 데 떠 있어야 "이 섬이 제일 높다"는 인상이 생긴다.
        pos: [Math.cos(a) * dist, -26 - rand() * 44, Math.sin(a) * dist] as [number, number, number],
        r,
        h: r * (2 + rand() * 1.6),
      };
    });
  }, []);

  const clouds = useMemo(() => {
    const rand = seeded(9911);
    return Array.from({ length: 18 }, () => {
      const a = rand() * Math.PI * 2;
      const dist = D * 1.6 + rand() * D * 3.0;
      return {
        pos: [Math.cos(a) * dist, -38 + rand() * 68, Math.sin(a) * dist] as [number, number, number],
        scale: 2.5 + rand() * 5,
        drift: 0.03 + rand() * 0.05,
      };
    });
  }, []);

  return (
    <group>
      {islets.map((isle, i) => (
        <Islet key={`i${i}`} {...isle} />
      ))}
      {clouds.map((c, i) => (
        <Cloud key={`c${i}`} {...c} material={cloudMat} />
      ))}
    </group>
  );
}
