'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

function organicShape(points: [number, number][]) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'catmullrom',
    0.38,
  );
  const sampled = curve.getSpacedPoints(47);
  const shape = new THREE.Shape();
  shape.moveTo(sampled[0].x, sampled[0].z);
  for (let i = 1; i < sampled.length; i++) shape.lineTo(sampled[i].x, sampled[i].z);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function GroundShape({ points, color, y = 0.035 }: { points: [number, number][]; color: string; y?: number }) {
  const geo = useMemo(() => organicShape(points), [points]);
  return (
    <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PergolaMass() {
  return (
    <group position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[6.2, 6.6, 0.32, 10]} />
        <meshStandardMaterial color="#C8B779" roughness={1} />
      </mesh>
      {[-4.1, 4.1].flatMap((x) => [-2.8, 2.8].map((z) => (
        <mesh key={`${x}:${z}`} position={[x, 2.85, z]} castShadow>
          <boxGeometry args={[0.38, 5.7, 0.38]} />
          <meshStandardMaterial color="#F1EBDD" roughness={0.78} />
        </mesh>
      )))}
      {[-2.8, 2.8].map((z) => (
        <mesh key={z} position={[0, 5.62, z]} castShadow>
          <boxGeometry args={[8.8, 0.42, 0.42]} />
          <meshStandardMaterial color="#F1EBDD" roughness={0.78} />
        </mesh>
      ))}
      {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((x) => (
        <mesh key={x} position={[x, 5.78, 0]} castShadow>
          <boxGeometry args={[0.28, 0.28, 6.7]} />
          <meshStandardMaterial color="#E7DDCA" roughness={0.82} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0.35]} castShadow>
        <cylinderGeometry args={[2.15, 2.05, 0.34, 12]} />
        <meshStandardMaterial color="#B98D68" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0.35]} castShadow>
        <cylinderGeometry args={[0.45, 0.62, 0.95, 10]} />
        <meshStandardMaterial color="#8E6346" roughness={0.92} />
      </mesh>
      {[-2.8, 2.8].map((x) => (
        <mesh key={x} position={[x, 0.72, 0.35]} castShadow>
          <boxGeometry args={[1.5, 0.28, 1.05]} />
          <meshStandardMaterial color="#A97A55" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function HouseMass() {
  const roof = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-3.1, 0);
    shape.lineTo(0, 2.35);
    shape.lineTo(3.1, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false });
    geo.translate(0, 0, -2.5);
    return geo;
  }, []);

  return (
    <group position={[-15, 0, -4.5]} rotation={[0, 0.22, 0]}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.2, 3.6, 5]} />
        <meshStandardMaterial color="#D9D2BE" roughness={0.95} />
      </mesh>
      <mesh geometry={roof} position={[0, 3.6, 0]} castShadow>
        <meshStandardMaterial color="#A86F5B" roughness={0.92} />
      </mesh>
    </group>
  );
}

function BridgeMass() {
  return (
    <group position={[18, 0.34, 0]} rotation={[0, -0.35, 0]}>
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.28, 2.15]} />
          <meshStandardMaterial color="#B88458" roughness={0.92} />
        </mesh>
      ))}
      {[-1.18, 1.18].map((z) => (
        <mesh key={z} position={[0, 0.72, z]} castShadow>
          <boxGeometry args={[9.4, 0.18, 0.18]} />
          <meshStandardMaterial color="#8E6346" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function ResetComposition() {
  const clearing = useMemo<[number, number][]>(() => [
    [-9, -5], [-5, -10], [3, -10], [8, -5], [8, 3], [4, 8], [-3, 9], [-9, 4],
  ], []);
  const pondBank = useMemo<[number, number][]>(() => [
    [13, -4], [18, -5], [24, -2], [25, 3], [21, 7], [15, 6], [11, 2], [11, -1],
  ], []);
  const pond = useMemo<[number, number][]>(() => [
    [15, -2], [19, -3], [22, -1], [22, 3], [19, 5], [14, 4], [13, 1], [13, -1],
  ], []);

  return (
    <group>
      <GroundShape points={clearing} color="#B8BD78" y={0.045} />
      <GroundShape points={pondBank} color="#9D9560" y={0.055} />
      <GroundShape points={pond} color="#4F9EB0" y={0.075} />
      <PergolaMass />
      <HouseMass />
      <BridgeMass />
    </group>
  );
}
