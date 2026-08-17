"use client";

import type { CSSProperties } from "react";
import { Canvas } from "@react-three/fiber";

import { DogSkillOnScaffold } from "./DogSkillOnScaffold";
import {
  DOG_EVAL_VIEWS,
  STAGE_SIZE,
  STAGE_TARGET,
  STAGE_ZOOM,
  VIEW_CAMERAS,
  type DogEvalView,
} from "./views";

type DogSkillOnStageProps = {
  view: DogEvalView;
  flat: boolean;
};

const SHADED_BACKGROUND = "#6f747a";
const FLAT_BACKGROUND = "#ffffff";

/**
 * Fixed orthographic capture stage. No animation, no orbit controls and no
 * scene decoration: only the scaffold, a neutral ground and a state label.
 */
export function DogSkillOnStage({ view, flat }: DogSkillOnStageProps) {
  const position = VIEW_CAMERAS[view];
  const labelColor = flat ? "#1b1e22" : "#f2f4f6";
  const labelStateColor = flat ? "#5b636b" : "#c9ced4";

  return (
    <div style={styles.page}>
      <div style={styles.stage}>
        <Canvas
          // Remount per state so the fixed camera is reapplied without controls.
          key={`${view}-${flat ? 1 : 0}`}
          orthographic
          shadows={!flat}
          dpr={2}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          camera={{ position, zoom: STAGE_ZOOM, near: 0.1, far: 60 }}
          onCreated={({ camera }) => {
            camera.up.set(0, 1, 0);
            camera.lookAt(...STAGE_TARGET);
          }}
        >
          <color
            attach="background"
            args={[flat ? FLAT_BACKGROUND : SHADED_BACKGROUND]}
          />

          {!flat && (
            <>
              <hemisphereLight args={["#ffffff", "#8b9097", 0.55]} />
              <directionalLight
                castShadow
                position={[6, 10, 7]}
                intensity={1.6}
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0005}
              >
                <orthographicCamera
                  attach="shadow-camera"
                  args={[-8, 8, 8, -8, 0.5, 40]}
                />
              </directionalLight>
              <directionalLight position={[-7, 4, -6]} intensity={0.35} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#d9dbde" roughness={1} />
              </mesh>
            </>
          )}

          <DogSkillOnScaffold flat={flat} />
        </Canvas>

        <div style={styles.label}>
          <strong style={{ ...styles.labelTitle, color: labelColor }}>
            Skill-ON · stage-1
          </strong>
          <span style={{ ...styles.labelState, color: labelStateColor }}>
            view={view} · flat={flat ? 1 : 0}
          </span>
        </div>
      </div>

      {/* State switches live outside the capture box so they never pollute a render. */}
      <nav style={styles.nav}>
        {DOG_EVAL_VIEWS.map((candidate) => (
          <a
            key={candidate}
            href={`/capability-eval/dog-skill-on?view=${candidate}&flat=${flat ? 1 : 0}`}
            style={styles.link}
          >
            {candidate}
          </a>
        ))}
        <a
          href={`/capability-eval/dog-skill-on?view=${view}&flat=${flat ? 0 : 1}`}
          style={styles.link}
        >
          flat={flat ? 0 : 1}
        </a>
      </nav>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "#1b1e22",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  },
  stage: {
    position: "relative",
    width: STAGE_SIZE.width,
    height: STAGE_SIZE.height,
    overflow: "hidden",
  },
  label: {
    position: "absolute",
    top: 10,
    left: 12,
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.35,
    pointerEvents: "none",
  },
  labelTitle: { fontSize: 12 },
  labelState: { fontSize: 11 },
  nav: { display: "flex", gap: 10, fontSize: 11 },
  link: { color: "#9aa3ad", textDecoration: "none" },
} satisfies Record<string, CSSProperties>;
