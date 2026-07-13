"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import AnimatedWrapper from "../AnimatedWrapper";
import { MAT } from "../materials";
import { COLOR, DELAY } from "../constants";
import { SIZE } from "../layout";

interface WallClockProps {
  position: [number, number, number];
}

const HOUR_STEP = (Math.PI * 2) / 12;
const MIN_STEP  = (Math.PI * 2) / 60;

export default function WallClock({ position }: WallClockProps) {
  const hourRef    = useRef<THREE.Group>(null!);
  const minuteRef  = useRef<THREE.Group>(null!);
  const secondRef  = useRef<THREE.Group>(null!);
  const lastSecond = useRef(-1);

  const { radius: R, faceZ: FACE_Z } = SIZE.clock;

  useFrame(() => {
    const now = new Date();
    const s   = now.getSeconds();
    if (s === lastSecond.current) return;
    lastSecond.current = s;
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    if (hourRef.current)   hourRef.current.rotation.z   = -((h + m / 60) * HOUR_STEP);
    if (minuteRef.current) minuteRef.current.rotation.z = -(m * MIN_STEP);
    if (secondRef.current) secondRef.current.rotation.z = -(s * MIN_STEP);
  });

  return (
    <AnimatedWrapper delay={DELAY.clock} position={position} liftHeight={0.05}>
      <group>
        {/* 뒤판 */}
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[R + 0.07, 64]} />
          <meshStandardMaterial color="#4A2C0E" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* 앞 테두리 링 */}
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[R, R + 0.07, 64]} />
          <meshStandardMaterial color="#5D3A1A" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* 다이얼 */}
        <mesh position={[0, 0, FACE_Z]}>
          <circleGeometry args={[R, 64]} />
          <meshStandardMaterial color="#FAFAF8" roughness={0.9} />
        </mesh>
        {/* 눈금 12개 */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle   = Math.PI / 2 - i * HOUR_STEP;
          const isMajor = i % 3 === 0;
          const len     = isMajor ? 0.06 : 0.035;
          const w       = isMajor ? 0.020 : 0.012;
          const dist    = R - len / 2 - 0.01;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * dist, Math.sin(angle) * dist, FACE_Z + 0.003]}
              rotation={[0, 0, angle - Math.PI / 2]}
            >
              <boxGeometry args={[w, len, 0.005]} />
              <meshStandardMaterial color="#1A1A1A" {...MAT.darkBody} />
            </mesh>
          );
        })}
        {/* 시침 */}
        <group ref={hourRef} position={[0, 0, FACE_Z + 0.008]}>
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[0.048, 0.20, 0.010]} />
            <meshStandardMaterial color={COLOR.darkBody} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.048, 0.06, 0.010]} />
            <meshStandardMaterial color={COLOR.darkBody} roughness={0.5} />
          </mesh>
        </group>
        {/* 분침 */}
        <group ref={minuteRef} position={[0, 0, FACE_Z + 0.013]}>
          <mesh position={[0, 0.145, 0]}>
            <boxGeometry args={[0.028, 0.31, 0.008]} />
            <meshStandardMaterial color={COLOR.darkDeep} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.028, 0.07, 0.008]} />
            <meshStandardMaterial color={COLOR.darkDeep} roughness={0.5} />
          </mesh>
        </group>
        {/* 초침 */}
        <group ref={secondRef} position={[0, 0, FACE_Z + 0.018]}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.012, 0.32, 0.006]} />
            <meshStandardMaterial color="#CC2200" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.065, 0]}>
            <boxGeometry args={[0.012, 0.09, 0.006]} />
            <meshStandardMaterial color="#CC2200" roughness={0.4} />
          </mesh>
        </group>
        {/* 중심 핀 */}
        <mesh position={[0, 0, FACE_Z + 0.022]}>
          <circleGeometry args={[0.024, 24]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </AnimatedWrapper>
  );
}
