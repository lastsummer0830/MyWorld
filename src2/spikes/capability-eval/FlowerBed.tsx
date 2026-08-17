'use client';

// AJP-004 — 화단 mesh.
// 같은 변주는 geometry를 공유하고 배치만 다르다. 배치는 BED_LAYOUT의 authored 상수뿐이며
// 난수 scatter가 없다 — 같은 URL은 항상 같은 화면을 만든다.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BED_LAYOUT, PLANT_BUILDERS, PlantKey } from './flowerBedGeometry';
import { STAGE } from './palette';

/** 화단 흙 자리. 개체들이 하나의 매스로 묶여 보이도록 바닥에 authored 윤곽을 깐다. */
const SOIL_OUTLINE: [number, number][] = [
  [-2.55, -0.35],
  [-2.0, -1.15],
  [-0.6, -1.5],
  [1.1, -1.45],
  [2.35, -0.95],
  [2.65, 0.15],
  [2.1, 1.25],
  [0.5, 1.65],
  [-1.2, 1.55],
  [-2.3, 0.85],
];

function soilGeometry(outline: [number, number][]): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    outline.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'catmullrom',
    0.4,
  );
  const pts = curve.getSpacedPoints(56);
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].z);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].z);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(Math.PI / 2);
  geo.scale(1, 1, -1);
  return geo;
}

export default function FlowerBed({
  position,
  night,
}: {
  position: [number, number, number];
  night: boolean;
}) {
  // 실제 쓰이는 변주만 굽는다. 같은 key는 하나의 geometry를 공유한다.
  const geos = useMemo(() => {
    const map = new Map<PlantKey, THREE.BufferGeometry>();
    for (const entry of BED_LAYOUT) {
      if (!map.has(entry.key)) map.set(entry.key, PLANT_BUILDERS[entry.key]());
    }
    return map;
  }, []);

  const soil = useMemo(() => soilGeometry(SOIL_OUTLINE), []);

  const plantMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.82,
        metalness: 0,
        // 잎과 꽃잎은 한 겹 면이라 뒤에서도 보여야 한다.
        side: THREE.DoubleSide,
      }),
    [],
  );
  useEffect(
    () => () => {
      geos.forEach((g) => g.dispose());
      soil.dispose();
      plantMat.dispose();
    },
    [geos, soil, plantMat],
  );

  return (
    <group position={position}>
      <mesh geometry={soil} position={[0, 0.012, 0]} receiveShadow>
        <meshStandardMaterial color={night ? STAGE.soilNight : STAGE.soilDay} roughness={1} metalness={0} />
      </mesh>
      {BED_LAYOUT.map((entry) => (
        <mesh
          key={`${entry.key}:${entry.x}:${entry.z}`}
          geometry={geos.get(entry.key)}
          material={plantMat}
          position={[entry.x, 0, entry.z]}
          rotation={[0, entry.rotY, 0]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}
