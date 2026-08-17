'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const TOP_SEGMENTS = 72;
const SIDE_SEGMENTS = 30;
const GRASS_H = 0.38;

const ANCHORS: [number, number][] = [
  [25, 0], [22, 6], [18, 9], [16, 16], [9, 20], [3, 19],
  [-3, 22], [-10, 19], [-13, 15], [-20, 14], [-24, 8], [-22, 2],
  [-26, -4], [-21, -10], [-15, -11], [-12, -17], [-4, -21], [3, -19],
  [9, -22], [15, -18], [17, -12], [23, -9], [21, -4],
];

type Ring = THREE.Vector3[];

function outline(segments: number) {
  const curve = new THREE.CatmullRomCurve3(
    ANCHORS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'catmullrom',
    0.36,
  );
  return curve.getSpacedPoints(segments - 1);
}

function shapeFrom(points: THREE.Vector3[]) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].z);
  shape.closePath();
  return shape;
}

function grassCap(points: THREE.Vector3[]) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(points), {
    depth: GRASS_H,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.18,
    bevelSegments: 1,
    curveSegments: 1,
  });
  geo.rotateX(Math.PI / 2);
  return geo;
}

function radialPoint(base: THREE.Vector3, inset: number, y: number, shiftX = 0, shiftZ = 0) {
  const length = Math.hypot(base.x, base.z) || 1;
  return new THREE.Vector3(
    base.x + (base.x / length) * inset + shiftX,
    y,
    base.z + (base.z / length) * inset + shiftZ,
  );
}

function soilRings(points: THREE.Vector3[]): [Ring, Ring] {
  const top = points.map((point, i) => {
    const a = (i / points.length) * Math.PI * 2;
    const inset = -0.08 - 0.14 * (0.5 + 0.5 * Math.sin(a * 3 - 0.6));
    return radialPoint(point, inset, -GRASS_H - 0.02);
  });

  const bottom = points.map((point, i) => {
    const a = (i / points.length) * Math.PI * 2;
    const broadRecess = 0.5 + 0.5 * Math.sin(a * 4 + 0.45);
    const inset = -0.38 - 0.46 * broadRecess;
    const y = -1.48 - 0.38 * (0.5 + 0.5 * Math.sin(a * 3 - 1.15));
    return radialPoint(point, inset, y, -0.08 * broadRecess, 0.05 * broadRecess);
  });

  return [top, bottom];
}

function ringGeometry(rings: Ring[], colorAt?: (ring: number, index: number) => THREE.Color) {
  const positions: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const width = rings[0].length;

  for (let ring = 0; ring < rings.length; ring++) {
    for (let i = 0; i < width; i++) {
      const point = rings[ring][i];
      positions.push(point.x, point.y, point.z);
      if (colorAt) {
        const color = colorAt(ring, i);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let i = 0; i < width; i++) {
      const next = (i + 1) % width;
      const a = ring * width + i;
      const b = ring * width + next;
      const c = (ring + 1) * width + i;
      const d = (ring + 1) * width + next;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (colors.length) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function rockRings(points: THREE.Vector3[], soilBottom: Ring) {
  const depths = [0, -2.75, -4.05, -5.2, -6.75, -8.3];
  const profiles = [0, -0.12, -0.62, -0.28, -1.35, -3.15];

  return depths.map((depth, ring) => {
    if (ring === 0) return soilBottom.map((point) => point.clone());

    const p = ring / (depths.length - 1);
    return points.map((point, i) => {
      const a = (i / points.length) * Math.PI * 2;
      const broadPlane = 0.42 * Math.sin(a * 3 + 0.75) + 0.2 * Math.sin(a * 5 - 1.1);
      // Narrow, deep recesses split the broad rock mass into a handful of readable cliff faces.
      const joint = Math.pow(Math.max(0, Math.cos(a * 5 - 0.35)), 8);
      // The middle ring pushes back out to form occasional shelves instead of a uniform cone.
      const ledge = ring === 3 ? 0.34 * Math.max(0, Math.sin(a * 4 + 0.25)) : 0;
      const inset = profiles[ring] + broadPlane * (0.45 + p) - joint * (0.35 + p * 1.85) + ledge;
      const y = depth - 0.25 * Math.sin(a * 3 + ring * 0.85) - 0.1 * Math.sin(a * 5 - ring);
      return radialPoint(point, inset, y, -1.05 * p, 0.62 * p);
    });
  });
}

function rockTone(ring: number, index: number) {
  const a = (index / SIDE_SEGMENTS) * Math.PI * 2;
  const joint = Math.pow(Math.max(0, Math.cos(a * 5 - 0.35)), 8);
  const plane = 0.96 + 0.1 * Math.sin(a * 3 + 0.7) - 0.24 * joint - ring * 0.014;
  return new THREE.Color(plane, plane * 0.97, plane * 0.92);
}

export default function ResetIsland() {
  const topPoints = useMemo(() => outline(TOP_SEGMENTS), []);
  const sidePoints = useMemo(() => outline(SIDE_SEGMENTS), []);
  const grass = useMemo(() => grassCap(topPoints), [topPoints]);
  const [soilTop, soilBottom] = useMemo(() => soilRings(sidePoints), [sidePoints]);
  const soil = useMemo(() => ringGeometry([soilTop, soilBottom]), [soilBottom, soilTop]);
  const rock = useMemo(
    () => ringGeometry(rockRings(sidePoints, soilBottom), rockTone),
    [sidePoints, soilBottom],
  );

  useEffect(
    () => () => {
      grass.dispose();
      soil.dispose();
      rock.dispose();
    },
    [grass, soil, rock],
  );

  return (
    <group>
      <mesh geometry={grass} position={[0, -0.12, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#8FAE58" emissive="#10200D" emissiveIntensity={0.08} roughness={0.96} />
      </mesh>
      <mesh geometry={soil} receiveShadow castShadow>
        <meshStandardMaterial color="#936746" emissive="#24140E" emissiveIntensity={0.16} roughness={1} />
      </mesh>
      <mesh geometry={rock} receiveShadow castShadow>
        <meshStandardMaterial
          color="#898076"
          emissive="#17191A"
          emissiveIntensity={0.3}
          roughness={0.98}
          flatShading
          vertexColors
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
