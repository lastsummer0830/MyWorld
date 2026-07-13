"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useAchievements } from "@/components/achievements/AchievementContext";
import { FONT_KR } from "./fonts";

const GRAVITY      = 14;
const FLOOR_Y      = 0.05;   // 조각이 떨어져 멈추는 로컬 바닥
const REACH_DIST   = 14;     // 이 거리 안에서만 클릭 인식
const POT_COLOR    = "#c9d4dc";
const POT_COLOR2   = "#b3c0ca";

// 도자기 5조각 정의 (로컬 좌표 — 받침대 위에 쌓여 화병 모양)
interface Piece {
  geo:   "cyl" | "sphere";
  args:  number[];
  y:     number;
  color: string;
}

const BASE_Y = 1.0; // 받침대 상단 높이

const PIECES: Piece[] = [
  { geo: "cyl",    args: [0.16, 0.22, 0.18, 12], y: BASE_Y + 0.09, color: POT_COLOR2 }, // 밑동
  { geo: "sphere", args: [0.30, 14, 10],         y: BASE_Y + 0.38, color: POT_COLOR  }, // 하부 몸통
  { geo: "cyl",    args: [0.26, 0.30, 0.26, 14], y: BASE_Y + 0.64, color: POT_COLOR  }, // 상부 몸통
  { geo: "cyl",    args: [0.13, 0.20, 0.20, 12], y: BASE_Y + 0.86, color: POT_COLOR2 }, // 목
  { geo: "cyl",    args: [0.18, 0.15, 0.10, 14], y: BASE_Y + 1.00, color: POT_COLOR  }, // 입구
];

interface PieceState {
  vel:    THREE.Vector3;
  angVel: THREE.Vector3;
  rested: boolean;
}

export default function Pottery({ position }: { position: [number, number, number] }) {
  const { camera } = useThree();
  const { unlock } = useAchievements();

  const [broken, setBroken] = useState(false);
  const pieceRefs = useRef<(THREE.Mesh | null)[]>([]);
  const hitRef    = useRef<THREE.Mesh>(null!);
  const raycaster = useRef(new THREE.Raycaster());

  // 각 조각의 물리 상태 (파괴 시 초기화)
  const states = useRef<PieceState[]>(
    PIECES.map(() => ({ vel: new THREE.Vector3(), angVel: new THREE.Vector3(), rested: false }))
  );

  const center = useMemo(() => new THREE.Vector2(0, 0), []);

  // 클릭(파괴) 감지 — 화면 중앙 기준 raycast
  useEffect(() => {
    const onMouseDown = () => {
      if (broken) return;
      if (!document.pointerLockElement) return;
      if (!hitRef.current) return;

      raycaster.current.setFromCamera(center, camera);
      const hits = raycaster.current.intersectObject(hitRef.current, false);
      if (hits.length > 0 && hits[0].distance < REACH_DIST) {
        triggerBreak();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broken, camera]);

  const triggerBreak = () => {
    // 각 조각에 바깥+위쪽 초기 속도 부여
    states.current.forEach((st, i) => {
      const angle = (i / PIECES.length) * Math.PI * 2 + Math.random() * 0.8;
      const outward = 1.6 + Math.random() * 1.4;
      st.vel.set(
        Math.cos(angle) * outward,
        2.8 + Math.random() * 2.2,
        Math.sin(angle) * outward
      );
      st.angVel.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
      st.rested = false;
    });
    setBroken(true);
    unlock("do_not_touch");
  };

  // 파괴 물리 시뮬레이션 + Vandal 트리거
  useFrame((_, rawDelta) => {
    if (!broken) return;
    const delta = Math.min(rawDelta, 0.033); // 프레임 튐 방지

    // Vandal — 깨진 조각이 흩어진 영역을 카메라가 지나가면
    const dx = camera.position.x - position[0];
    const dz = camera.position.z - position[2];
    if (Math.sqrt(dx * dx + dz * dz) < 1.8) unlock("vandal");

    states.current.forEach((st, i) => {
      if (st.rested) return;
      const mesh = pieceRefs.current[i];
      if (!mesh) return;

      st.vel.y -= GRAVITY * delta;
      mesh.position.addScaledVector(st.vel, delta);
      mesh.rotation.x += st.angVel.x * delta;
      mesh.rotation.y += st.angVel.y * delta;
      mesh.rotation.z += st.angVel.z * delta;

      // 바닥 충돌 → 약하게 튕긴 뒤 정지
      if (mesh.position.y < FLOOR_Y) {
        mesh.position.y = FLOOR_Y;
        if (Math.abs(st.vel.y) < 1.2) {
          st.rested = true;
          st.vel.set(0, 0, 0);
          st.angVel.set(0, 0, 0);
        } else {
          st.vel.y *= -0.35;
          st.vel.x *= 0.6;
          st.vel.z *= 0.6;
          st.angVel.multiplyScalar(0.6);
        }
      }
    });
  });

  return (
    <group position={position}>
      {/* ── 받침대 ── */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.40, 1.0, 20]} />
        <meshStandardMaterial color="#e8e5e0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.04, 20]} />
        <meshStandardMaterial color="#d4d0c8" roughness={0.5} />
      </mesh>

      {/* ── "만지지 마시오" 표지판 ── */}
      <group position={[0, 0.55, 0.42]} rotation={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.22, 0.02]} />
          <meshStandardMaterial color="#8a1818" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.46, 0.18, 0.005]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
        </mesh>
        <Text
          font={FONT_KR}
          position={[0, 0, 0.018]}
          fontSize={0.07}
          color="#8a1818"
          anchorX="center"
          anchorY="middle"
        >
          만지지 마시오
        </Text>
      </group>

      {/* ── 도자기 조각 5개 ── */}
      {PIECES.map((p, i) => (
        <mesh
          key={i}
          ref={el => { pieceRefs.current[i] = el; }}
          position={[0, p.y, 0]}
          castShadow
        >
          {p.geo === "cyl" ? (
            <cylinderGeometry args={p.args as [number, number, number, number]} />
          ) : (
            <sphereGeometry args={p.args as [number, number, number]} />
          )}
          <meshStandardMaterial color={p.color} roughness={0.35} metalness={0.05} />
        </mesh>
      ))}

      {/* ── 클릭 감지용 투명 히트박스 (파괴 전만) ── */}
      {!broken && (
        <mesh ref={hitRef} position={[0, BASE_Y + 0.5, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 1.2, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
