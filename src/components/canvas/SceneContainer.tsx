"use client";

import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import SummerBackground from "@/components/summerBackground/SummerBackground";
import Room from "@/components/room/Room";
import FirstPersonControls from "@/components/museum/FirstPersonControls";
import { PhaseGroup } from "@/components/room/AnimatedWrapper";
import { CAMERA, ORBIT } from "@/components/room/layout";
import { CANVAS_PERF } from "@/components/room/Performance";
import { useScene } from "@/components/canvas/SceneContext";

// ── 좌표 상수 ─────────────────────────────────────────────────
const CAMERA_START   = new THREE.Vector3(...CAMERA.start);
const CAMERA_TARGET  = new THREE.Vector3(...CAMERA.target);
const LOOK_AT        = new THREE.Vector3(...CAMERA.lookAt);
const MONITOR_POS    = new THREE.Vector3(...CAMERA.monitorPos);
const MONITOR_LOOKAT = new THREE.Vector3(...CAMERA.monitorLookAt);

// ── 그림자 맵 정적화 ───────────────────────────────────────────
// 등장 애니메이션 완료 후 그림자 자동 갱신 중단 (빛 위치·오브젝트 모두 고정)
// → 그림자 품질 그대로, 매 프레임 재계산 비용만 제거
function ShadowFreezer({ ready }: { ready: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      gl.shadowMap.autoUpdate  = false;
      gl.shadowMap.needsUpdate = true; // 마지막으로 한 번 굽기
    }, 2500); // 인트로 완료 + 방 등장 스프링 안정화 여유
    return () => clearTimeout(t);
  }, [ready, gl]);
  return null;
}

// ── 카메라 관리자 ──────────────────────────────────────────────
function CameraManager({ isFinished, setIsFinished }: {
  isFinished:    boolean;
  setIsFinished: (v: boolean) => void;
}) {
  const { mode, onMonitorReached, onRoomReturned } = useScene();

  const monitorTriggered = useRef(false);
  const roomTriggered    = useRef(false);

  useEffect(() => {
    if (mode === "zooming-in")  monitorTriggered.current = false;
    if (mode === "zooming-out") roomTriggered.current    = false;
  }, [mode]);

  useFrame(({ camera: cam }) => {
    // 1. 인트로
    if (!isFinished) {
      cam.position.lerp(CAMERA_TARGET, 0.04);
      cam.lookAt(LOOK_AT);
      if (cam.position.distanceTo(CAMERA_TARGET) < 0.5) {
        cam.position.copy(CAMERA_TARGET);
        setIsFinished(true);
      }
      return;
    }

    // 2. museum 모드: 메인 카메라를 모니터 정면에 완전 고정
    if (mode === "museum") {
      cam.position.copy(MONITOR_POS);
      cam.lookAt(MONITOR_LOOKAT);
      return;
    }

    // 3. 모니터 줌인
    if (mode === "zooming-in" && !monitorTriggered.current) {
      cam.position.lerp(MONITOR_POS, 0.055);
      cam.lookAt(MONITOR_LOOKAT);
      if (cam.position.distanceTo(MONITOR_POS) < 0.15) {
        // 정확한 위치·방향으로 스냅 후 트리거
        cam.position.copy(MONITOR_POS);
        cam.lookAt(MONITOR_LOOKAT);
        monitorTriggered.current = true;
        onMonitorReached();
      }
    }

    // 4. 방으로 복귀
    if (mode === "zooming-out" && !roomTriggered.current) {
      cam.position.lerp(CAMERA_TARGET, 0.04);
      cam.lookAt(LOOK_AT);
      if (cam.position.distanceTo(CAMERA_TARGET) < 0.5) {
        roomTriggered.current = true;
        cam.position.copy(CAMERA_TARGET);
        onRoomReturned();
      }
    }
  });

  return (
    <PerspectiveCamera
      makeDefault
      position={CAMERA_START.toArray() as [number, number, number]}
      fov={CAMERA.fov}
      far={200}
    />
  );
}

// ── 메인 ─────────────────────────────────────────────────────
export default function SceneContainer() {
  const [introFinished, setIntroFinished] = useState(false);
  const { mode, exitMuseum } = useScene();

  const mouseButtons = useMemo(() => ({
    LEFT:   THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT:  THREE.MOUSE.PAN,
  }), []);

  const orbitOn = introFinished && mode === "room";

  return (
    <Canvas
      shadows="soft"
      {...CANVAS_PERF}
      onCreated={({ gl }) => {
        gl.toneMapping         = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.outputColorSpace    = THREE.SRGBColorSpace;
      }}
    >
      <CameraManager isFinished={introFinished} setIsFinished={setIntroFinished} />
      <ShadowFreezer ready={introFinished} />

      {/* ── 방 씬 — 항상 렌더 ── */}
      <Suspense fallback={null}>
        <SummerBackground />
        <PhaseGroup delay={3.2}>
          <group position={[0, 0.90, 0]} scale={0.55}>
            <Room />
          </group>
        </PhaseGroup>
      </Suspense>

      {/* ── 박물관 1인칭 컨트롤 (museum 모드에서만 활성) ── */}
      <FirstPersonControls onExit={exitMuseum} />

      {/* ── OrbitControls (room 모드 + 인트로 완료 시) ── */}
      <OrbitControls
        makeDefault
        enabled={orbitOn}
        target={CAMERA.lookAt}

        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}

        minDistance={ORBIT.minDistance}
        maxDistance={ORBIT.maxDistance}

        zoomSpeed={1.2}
        enableDamping
        dampingFactor={0.05}
        enablePan
        mouseButtons={mouseButtons}
        onChange={(e: any) => {
          const ctrl = e?.target;
          if (!ctrl?.target) return;
          const t = ctrl.target as THREE.Vector3;
          t.x = Math.max(ORBIT.panMin[0], Math.min(ORBIT.panMax[0], t.x));
          t.y = Math.max(ORBIT.panMin[1], Math.min(ORBIT.panMax[1], t.y));
          t.z = Math.max(ORBIT.panMin[2], Math.min(ORBIT.panMax[2], t.z));
        }}
      />
    </Canvas>
  );
}
