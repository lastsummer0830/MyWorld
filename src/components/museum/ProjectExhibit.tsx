"use client";

import { Component, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { FONT_EN_LIGHT, FONT_EN_SEMI, pickFont } from "./fonts";

const REACH_DIST = 11; // 이 거리 안에서 조준 클릭 시 상세 열림

interface Project {
  title:    string;
  period:   string;
  status:   "completed" | "inprogress";
  images:   string[];
  summary:  string;
  features: string[];
  skills:   string[];
  link?:    string;
  github?:  string;
}

interface Props {
  project:  Project;
  index:    number;
  position: [number, number, number];
  side:     "left" | "right";
}

// ── 텍스처 로드 실패 대비 에러 바운더리 ───────────────────────
class TextureBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() {
    if (this.state.err) {
      return (
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.5, 2.1]} />
          <meshStandardMaterial color="#ddd8d0" />
        </mesh>
      );
    }
    return this.props.children;
  }
}

function ProjectImage({ src }: { src: string }) {
  const texture = useTexture(src);
  return (
    <mesh position={[0, 0, 0.05]}>
      <planeGeometry args={[3.5, 2.1]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// ── 전시물 본체 ────────────────────────────────────────────────
export default function ProjectExhibit({ project, index, position, side }: Props) {
  const rotY   = side === "left" ? Math.PI / 2 : -Math.PI / 2;
  const imgSrc = project.images[0];

  const statusColor = project.status === "completed" ? "#5aab78" : "#d4a444";
  const statusLabel = project.status === "completed" ? "✓ COMPLETED" : "⟳ IN PROGRESS";

  const { camera } = useThree();
  const hitRef     = useRef<THREE.Mesh>(null!);
  const raycaster  = useRef(new THREE.Raycaster());
  const center     = useRef(new THREE.Vector2(0, 0));

  // 화면 중앙(크로스헤어) 조준 클릭 → 상세 패널 열기
  useEffect(() => {
    const onMouseDown = () => {
      if (!document.pointerLockElement) return;
      if (!hitRef.current) return;
      raycaster.current.setFromCamera(center.current, camera);
      const hits = raycaster.current.intersectObject(hitRef.current, false);
      if (hits.length > 0 && hits[0].distance < REACH_DIST) {
        document.exitPointerLock();
        (window as any).__openProjectDetail?.(index);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [camera, index]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>

      {/* 클릭 감지용 투명 히트박스 (액자 앞면) */}
      <mesh ref={hitRef} position={[0, 0, 0.2]}>
        <boxGeometry args={[4.0, 2.6, 0.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>


      {/* 외곽 프레임 */}
      <mesh castShadow>
        <boxGeometry args={[4.0, 2.6, 0.07]} />
        <meshStandardMaterial color="#28231e" roughness={0.75} metalness={0.08} />
      </mesh>

      {/* 내부 매트 */}
      <mesh position={[0, 0, 0.038]}>
        <boxGeometry args={[3.7, 2.3, 0.006]} />
        <meshStandardMaterial color="#f5f3ef" roughness={0.95} />
      </mesh>

      {/* 스크린샷 이미지 */}
      {imgSrc ? (
        <TextureBoundary>
          <ProjectImage src={imgSrc} />
        </TextureBoundary>
      ) : (
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.5, 2.1]} />
          <meshStandardMaterial color="#ddd8d0" />
        </mesh>
      )}

      {/* ── 하단 정보 ── */}
      {/* 프로젝트명 */}
      <Text
        font={pickFont(project.title, "semi")}
        position={[0, -1.55, 0]}
        fontSize={0.22}
        color="#1a1814"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.8}
        lineHeight={1.3}
      >
        {project.title}
      </Text>

      {/* 기간 + 상태 */}
      <Text
        font={FONT_EN_LIGHT}
        position={[-0.7, -1.88, 0]}
        fontSize={0.13}
        color="#888070"
        anchorX="center"
        anchorY="middle"
      >
        {project.period}
      </Text>

      <Text
        font={FONT_EN_LIGHT}
        position={[0.8, -1.88, 0]}
        fontSize={0.12}
        color={statusColor}
        anchorX="center"
        anchorY="middle"
      >
        {statusLabel}
      </Text>

      {/* 기술 스택 */}
      <Text
        font={FONT_EN_LIGHT}
        position={[0, -2.18, 0]}
        fontSize={0.115}
        color="#506898"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.2}
      >
        {project.skills.join("  ·  ")}
      </Text>

      {/* 구분선 */}
      <mesh position={[0, -1.37, 0.01]}>
        <planeGeometry args={[3.6, 0.008]} />
        <meshBasicMaterial color="#c8c4bc" />
      </mesh>

    </group>
  );
}
