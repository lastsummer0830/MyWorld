'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 밤 초점 조명 (blockout).
// 낮/밤 값은 IsoStage의 Mood가 굴리는 nightRef 하나만 읽는다 — 여기서 별도의 낮/밤 상태를 만들지 않는다.
// 전환은 smoothstep으로 눌러 준다. 선형으로 두면 해가 지기도 전에 전구가 켜진다.
const litAmount = (night: number) => THREE.MathUtils.smoothstep(night, 0.18, 0.92);

/** 상부 보 아래 매다는 알전구의 x 위치 — 서까래 간격(1.2m)과 같은 리듬. */
const BULB_X = [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6];
/** 카메라에서 상부 보에 가려지지 않도록 지붕 아래 중앙에 노출하는 한 줄. */
const BULB_BEAM_Z = [0];

/**
 * 알전구의 밤 자체발광.
 * ★ Bloom 임계값이 0.9라서 이보다 낮으면 그냥 노란 구슬로, 훨씬 높이면 전구가 뭉개진다.
 *   전역 임계값을 내려서 밝기를 만들지 말 것 — 하늘과 잔디까지 번진다.
 */
const BULB_GLOW = 2.8;

/**
 * 퍼걸러 아래로 떨어지는 따뜻한 빛.
 * 두 광원을 낮은 세기로 나눠 테이블과 지면에만 부드러운 spill을 만든다.
 * house까지 번지거나 흰 구조물 전체가 Bloom 임계값을 넘지 않아야 한다.
 */
const SPILL_I = 35;

/** 연못·다리 실루엣만 겨우 살리는 차가운 보조광. 퍼걸러(≈22m)에는 0.15도 닿지 않는다. */
const FILL_I = 30;

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

function PergolaMass({ nightRef }: { nightRef: React.RefObject<number> }) {
  // 전구 유리알과 매다는 줄. 재질을 mesh마다 만들면 14개가 각각 셰이더를 컴파일한다.
  const bulbMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // 낮에는 발광 없이 이 색만 보인다 — 꺼진 전구는 중성에 가까운 유백색이다.
        color: '#E7DFCD',
        emissive: new THREE.Color('#FFC98A'),
        emissiveIntensity: 0,
        roughness: 0.4,
        metalness: 0,
        toneMapped: false,
      }),
    [],
  );
  const wireMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6E6455', roughness: 0.9, metalness: 0 }),
    [],
  );
  useEffect(
    () => () => {
      bulbMat.dispose();
      wireMat.dispose();
    },
    [bulbMat, wireMat],
  );

  const spillL = useRef<THREE.PointLight>(null);
  const spillR = useRef<THREE.PointLight>(null);

  // 매 프레임 값은 state가 아니라 ref로 흘린다 — 낮/밤 전환마다 리렌더하면 안 된다.
  useFrame(() => {
    const lit = litAmount(nightRef.current);
    // Three.js material은 React state가 아닌 mutable render resource다.
    // eslint-disable-next-line react-hooks/immutability
    bulbMat.emissiveIntensity = lit * BULB_GLOW;
    if (spillL.current) spillL.current.intensity = lit * SPILL_I;
    if (spillR.current) spillR.current.intensity = lit * SPILL_I;
  });

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

      {/*
        알전구 — 기존 상부 보(y 5.62, z ±2.8) 바로 아래에 같은 간격으로 매단다.
        크게 만들면 Bloom이 덩어리로 번져 구조가 사라진다. 반지름은 0.13m로 묶어 둔다.
      */}
      {BULB_BEAM_Z.flatMap((z) =>
        BULB_X.map((x) => (
          <group key={`bulb:${x}:${z}`} position={[x, 0, z]}>
            <mesh position={[0, 5.05, 0]} material={wireMat}>
              <cylinderGeometry args={[0.025, 0.025, 0.55, 6]} />
            </mesh>
            <mesh position={[0, 4.7, 0]} material={bulbMat}>
              <sphereGeometry args={[0.18, 10, 8]} />
            </mesh>
          </group>
        )),
      )}

      {/*
        발광체만으로는 티테이블과 기둥이 검게 남는다 — 전구가 있는 높이에서 실제로 빛이 떨어져야
        "켜진 퍼걸러"로 읽힌다. 그림자는 켜지 않는다(포인트라이트 그림자는 큐브맵 6면이라 비싸다).
      */}
      <pointLight ref={spillL} position={[-2.2, 3.5, 0]} color="#FFC085" intensity={0} distance={16} decay={2} />
      <pointLight ref={spillR} position={[2.2, 3.5, 0]} color="#FFC085" intensity={0} distance={16} decay={2} />
    </group>
  );
}

/**
 * 연못·다리 쪽 차가운 보조광 — 밤에 우측 2차 초점이 통째로 검게 잠기는 것만 막는다.
 * 퍼걸러의 따뜻한 1차 초점보다 항상 약해야 하므로 거리도 세기도 여기서 묶어 둔다.
 */
function PondFill({ nightRef }: { nightRef: React.RefObject<number> }) {
  const fill = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (fill.current) fill.current.intensity = litAmount(nightRef.current) * FILL_I;
  });

  return <pointLight ref={fill} position={[19, 13, 5]} color="#A9C0E8" intensity={0} distance={44} decay={2} />;
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

export default function ResetComposition({ nightRef }: { nightRef: React.RefObject<number> }) {
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
      <PergolaMass nightRef={nightRef} />
      <HouseMass />
      <BridgeMass />
      <PondFill nightRef={nightRef} />
    </group>
  );
}
