"use client";

import { OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import type * as THREE from "three";

import { DogSkillOffScaffold } from "./DogSkillOffScaffold";
import {
  CAMERA_TARGET,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  cameraFor,
  parseFlat,
  parseView,
  type ViewName,
} from "./views";

function FixedCamera({ view }: { view: ViewName }) {
  const ref = useRef<THREE.OrthographicCamera>(null);
  const state = cameraFor(view);

  useLayoutEffect(() => {
    const camera = ref.current;
    if (!camera) return;
    camera.position.set(...state.position);
    camera.up.set(0, 1, 0);
    camera.zoom = state.zoom;
    camera.lookAt(CAMERA_TARGET[0], CAMERA_TARGET[1], CAMERA_TARGET[2]);
    camera.updateProjectionMatrix();
  }, [state.position, state.zoom]);

  return <OrthographicCamera ref={ref} makeDefault near={0.1} far={40} />;
}

/**
 * Ground reference. In shaded mode a plain neutral plane catches the key light
 * shadow. In both modes a thin cross of bars marks y = 0 so the four paw
 * contacts stay readable in the zero-elevation views, where the plane itself
 * collapses to a line.
 */
function Ground({ flat }: { flat: boolean }) {
  const line = flat ? "#2e3237" : "#7d838a";

  return (
    <group>
      {!flat && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.0015, 0]}
          receiveShadow
        >
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#989ea5" roughness={1} metalness={0} />
        </mesh>
      )}
      <mesh position={[0.15, 0, 0]}>
        <boxGeometry args={[3.4, 0.004, 0.004]} />
        <meshBasicMaterial color={line} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.004, 0.004, 1.6]} />
        <meshBasicMaterial color={line} />
      </mesh>
    </group>
  );
}

/** Neutral, fixed, world-space rig. No mood, no rim, no colour temperature. */
function NeutralLights() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight
        position={[3.2, 5.2, 4.0]}
        intensity={1.55}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={1.6}
        shadow-camera-bottom={-1.6}
        shadow-camera-near={0.1}
        shadow-camera-far={16}
        shadow-bias={-0.0008}
      />
      <directionalLight position={[-4.0, 2.4, -3.2]} intensity={0.34} />
    </>
  );
}

export function SkillOffStage() {
  const params = useSearchParams();
  const view = parseView(params.get("view"));
  const flat = parseFlat(params.get("flat"));

  const background = flat ? "#edeef0" : "#aeb3b9";

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "24px",
        background: "#1b1d20",
        color: "#e7e9ec",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          flex: "none",
          background,
          overflow: "hidden",
        }}
      >
        <Canvas
          shadows={!flat}
          dpr={1}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
        >
          <color attach="background" args={[background]} />
          <FixedCamera view={view} />
          {!flat && <NeutralLights />}
          <Ground flat={flat} />
          <DogSkillOffScaffold flat={flat} />
        </Canvas>

        <div
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            fontSize: 12,
            lineHeight: 1.5,
            letterSpacing: "0.02em",
            color: flat ? "#5c6167" : "#3c4147",
            pointerEvents: "none",
          }}
        >
          <div>Skill-OFF · stage-1</div>
          <div>
            view={view} · flat={flat ? "1" : "0"}
          </div>
        </div>
      </div>
    </main>
  );
}

export default SkillOffStage;
