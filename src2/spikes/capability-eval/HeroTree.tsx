'use client';

// AJP-004 — hero tree mesh.
// 수관이 잎 한 장 단위라 조각이 700개를 넘는다. mesh를 그대로 나누면 draw call이 터진다.
// 목질(줄기·뿌리·가지)과 잎을 각각 하나의 vertex-color geometry로 구워 mesh 2개로 그린다.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { buildHeroTree } from './heroTreeGeometry';

export default function HeroTree({ position }: { position: [number, number, number] }) {
  const geo = useMemo(() => buildHeroTree(), []);

  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
    [],
  );
  // 수관은 잎 한 장 한 장(한 겹 면)이라 뒷면도 그려야 한다.
  // FrontSide로 두면 뒤로 향한 잎이 사라져 수관에 구멍이 뚫린다.
  const foliageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.86,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useEffect(
    () => () => {
      geo.wood.dispose();
      geo.foliage.dispose();
      woodMat.dispose();
      foliageMat.dispose();
    },
    [geo, woodMat, foliageMat],
  );

  return (
    <group position={position}>
      <mesh geometry={geo.wood} material={woodMat} castShadow receiveShadow />
      <mesh geometry={geo.foliage} material={foliageMat} castShadow receiveShadow />
    </group>
  );
}
