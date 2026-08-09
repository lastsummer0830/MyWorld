'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const SEGMENTS = 72;
const GRASS_H = 0.7;
const SOIL_H = 1.8;
const ROCK_H = 6.4;

const ANCHORS: [number, number][] = [
  [25, 0], [22, 6], [18, 9], [16, 16], [9, 20], [3, 19],
  [-3, 22], [-10, 19], [-13, 15], [-20, 14], [-24, 8], [-22, 2],
  [-26, -4], [-21, -10], [-15, -11], [-12, -17], [-4, -21], [3, -19],
  [9, -22], [15, -18], [17, -12], [23, -9], [21, -4],
];

function outline() {
  const curve = new THREE.CatmullRomCurve3(
    ANCHORS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'catmullrom',
    0.36,
  );
  return curve.getSpacedPoints(SEGMENTS - 1);
}

function shapeFrom(points: THREE.Vector3[]) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].z);
  shape.closePath();
  return shape;
}

function slab(points: THREE.Vector3[], depth: number, bevel = 0) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(points), {
    depth: Math.max(0.01, depth - bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  return geo;
}

function rockBase(points: THREE.Vector3[]) {
  const rings = 7;
  const pos: number[] = [];
  const idx: number[] = [];

  for (let k = 0; k < rings; k++) {
    const p = k / (rings - 1);
    const shrink = 1 - p * 0.22;
    const shiftX = -1.15 * p;
    const shiftZ = 0.65 * p;
    const steppedDepth = p + 0.035 * Math.sin(p * Math.PI * 6);
    const y = -(GRASS_H + SOIL_H) - ROCK_H * steppedDepth;
    for (let i = 0; i < points.length; i++) {
      const a = (i / points.length) * Math.PI * 2;
      const cliff = 0.035 * Math.sin(a * 5 + k * 1.7) + 0.02 * Math.sin(a * 11 - k);
      const broken = 1 + p * cliff - p * p * (0.018 + 0.018 * Math.sin(a * 3 - 0.8));
      pos.push(points[i].x * shrink * broken + shiftX, y, points[i].z * shrink * broken + shiftZ);
    }
  }

  for (let k = 0; k < rings - 1; k++) {
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const a = k * points.length + i;
      const b = k * points.length + j;
      const c = (k + 1) * points.length + i;
      const d = (k + 1) * points.length + j;
      idx.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export default function ResetIsland() {
  const points = useMemo(() => outline(), []);
  const grass = useMemo(() => slab(points, GRASS_H, 0.24), [points]);
  const soil = useMemo(() => slab(points, SOIL_H), [points]);
  const rock = useMemo(() => rockBase(points), [points]);

  return (
    <group>
      <mesh geometry={grass} position={[0, -0.24, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#8FAE58" roughness={0.96} />
      </mesh>
      <mesh geometry={soil} position={[0, -GRASS_H, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#8A5E3E" roughness={1} />
      </mesh>
      <mesh geometry={rock}>
        <meshStandardMaterial color="#62584F" roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
