"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LERP_APPEAR = 0.08;
const LERP_HOVER  = 0.12;
const DONE_THRESH = 0.0005;

// ── PhaseGroup (인트로 재구성 연출 — 스프링 팝인) ─────────────
export function PhaseGroup({ children, delay = 0 }: {
  children: React.ReactNode;
  delay?:   number;
}) {
  const ref      = useRef<THREE.Group>(null!);
  const [active, setActive] = useState(false);
  const scale    = useRef(0.85);
  const velocity = useRef(0);
  const done     = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useFrame((_, delta) => {
    if (!ref.current || done.current) return;
    if (!active) { ref.current.scale.setScalar(0); return; }

    // 스프링 물리 (stiffness=280, damping=19 → damping ratio≈0.57 → 약 10% 오버슈트)
    const force = (1 - scale.current) * 280 - velocity.current * 19;
    velocity.current += force * delta;
    scale.current    += velocity.current * delta;
    ref.current.scale.setScalar(Math.max(0, scale.current));

    if (Math.abs(scale.current - 1) < 0.002 && Math.abs(velocity.current) < 0.002) {
      ref.current.scale.setScalar(1);
      done.current = true;
    }
  });

  return <group ref={ref}>{children}</group>;
}

// ── AppearGroup ──────────────────────────────────────────────
interface AppearGroupProps {
  children:   React.ReactNode;
  delay?:     number;
  position?:  [number, number, number];
  rotation?:  [number, number, number];
}

export function AppearGroup({ children, delay = 0, position, rotation }: AppearGroupProps) {
  const ref      = useRef<THREE.Group>(null!);
  const [active, setActive] = useState(false);
  const [done,   setDone]   = useState(false);
  const scaleVec = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useFrame(() => {
    if (done || !ref.current) return;
    const target = active ? 1 : 0;
    scaleVec.setScalar(target);
    ref.current.scale.lerp(scaleVec, LERP_APPEAR);
    if (Math.abs(ref.current.scale.x - target) < DONE_THRESH) {
      ref.current.scale.setScalar(target);
      if (active) setDone(true);
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {children}
    </group>
  );
}

// ── HoverLift ────────────────────────────────────────────────
interface HoverLiftProps {
  children:    React.ReactNode;
  liftHeight?: number;
  onClick?:    () => void;
  rotation?:   [number, number, number];
  disabled?:   boolean;
  hitbox?:     [number, number, number];
  hitboxPos?:  [number, number, number];
}

export function HoverLift({
  children,
  liftHeight = 0.07,
  onClick,
  rotation,
  disabled   = false,
  hitbox,
  hitboxPos  = [0, 0, 0],
}: HoverLiftProps) {
  const ref      = useRef<THREE.Group>(null!);
  const hovered  = useRef(false);
  const curScale = useRef(1);

  useFrame(() => {
    if (!ref.current) return;
    const target = (!disabled && hovered.current) ? 1.12 : 1.0;
    const diff   = target - curScale.current;
    if (Math.abs(diff) < 0.0005) {
      curScale.current = target;
    } else {
      curScale.current += diff * 0.15;
    }
    ref.current.scale.setScalar(curScale.current);
  });

  const handleOver = (e: any) => {
    if (disabled) return;
    e.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = onClick ? "pointer" : "default";
  };

  const handleOut = () => {
    hovered.current = false;
    document.body.style.cursor = "default";
  };

  return (
    <group ref={ref} rotation={rotation}>
      {hitbox ? (
        <>
          <mesh
            position={hitboxPos}
            onPointerOver={handleOver}
            onPointerOut={handleOut}
            onClick={onClick}
          >
            <boxGeometry args={hitbox} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {children}
        </>
      ) : (
        <group
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={onClick}
        >
          {children}
        </group>
      )}
    </group>
  );
}

// ── SceneItem ────────────────────────────────────────────────
interface SceneItemProps {
  children:    React.ReactNode;
  delay?:      number;
  liftHeight?: number;
  position?:   [number, number, number];
  rotation?:   [number, number, number];
  onClick?:    () => void;
  hover?:      boolean;
  hitbox?:     [number, number, number];
  hitboxPos?:  [number, number, number];
}

export function SceneItem({
  children,
  delay      = 0,
  liftHeight = 0.07,
  position,
  rotation,
  onClick,
  hover      = true,
  hitbox,
  hitboxPos,
}: SceneItemProps) {
  return (
    <AppearGroup delay={delay} position={position} rotation={rotation}>
      {hover ? (
        <HoverLift liftHeight={liftHeight} onClick={onClick} hitbox={hitbox} hitboxPos={hitboxPos}>
          {children}
        </HoverLift>
      ) : (
        children
      )}
    </AppearGroup>
  );
}

// ── AnimatedWrapper (하위 호환) ──────────────────────────────
interface AnimatedWrapperProps {
  children:     React.ReactNode;
  delay?:       number;
  scaleFactor?: number;
  liftHeight?:  number;
  position?:    [number, number, number];
  rotation?:    [number, number, number];
  onClick?:     () => void;
  hover?:       boolean;
  hitbox?:      [number, number, number];
  hitboxPos?:   [number, number, number];
}

export default function AnimatedWrapper({
  children,
  delay      = 0,
  liftHeight = 0.07,
  position,
  rotation,
  onClick,
  hover      = true,
  hitbox,
  hitboxPos,
}: AnimatedWrapperProps) {
  return (
    <SceneItem
      delay={delay}
      liftHeight={liftHeight}
      position={position}
      rotation={rotation}
      onClick={onClick}
      hover={hover}
      hitbox={hitbox}
      hitboxPos={hitboxPos}
    >
      {children}
    </SceneItem>
  );
}