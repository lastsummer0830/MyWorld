"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScene } from "@/components/canvas/SceneContext";
import { useAchievements } from "@/components/achievements/AchievementContext";
import { GD } from "./GalleryRoom";

const SPEED          = 5;
const PLAYER_HEIGHT  = 1.7;
const BOUNDS_X       = 7;
// 통로 길이(GD)에 맞춰 자동 — 갤러리가 늘어나도 경계/시작점이 따라감
const BOUNDS_Z       = GD / 2 - 0.5;  // 벽 충돌 한계
const EXIT_TRIGGER_Z = GD / 2 - 1.0;  // 이 Z를 넘으면 나가기 트리거
const SENSITIVITY    = 0.0018;

// 박물관 시작 위치 / 방향 (입구 = -GD/2, 거기서 3 안쪽)
const MUSEUM_START_POS = new THREE.Vector3(0, PLAYER_HEIGHT, -(GD / 2) + 3);
const MUSEUM_START_ROT = new THREE.Euler(0, Math.PI, 0, "YXZ"); // 갤러리 안쪽(+Z) 방향

export default function FirstPersonControls({ onExit }: { onExit: () => void }) {
  const { mode, museumCamRef } = useScene();
  const { unlock } = useAchievements();
  const enabled = mode === "museum";

  const keys          = useRef({ w: false, a: false, s: false, d: false });
  const isLocked      = useRef(false);
  const euler         = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const exitTriggered = useRef(false);
  const movedOnce     = useRef(false);

  // 업적 추적용
  const dizzyAccum  = useRef(0);      // 누적 좌우 회전량 (signed)
  const visitedL    = useRef(false);  // 왼쪽 끝 방문
  const visitedR    = useRef(false);  // 오른쪽 끝 방문
  const usedForward = useRef(false);  // W(전진) 사용 여부
  const lastInput   = useRef(0);      // 마지막 입력 시각 (patience)

  // museum 모드 진입 시 카메라 + 추적 상태 초기화
  useEffect(() => {
    if (mode === "museum" && museumCamRef.current) {
      museumCamRef.current.position.copy(MUSEUM_START_POS);
      euler.current.copy(MUSEUM_START_ROT);
      museumCamRef.current.quaternion.setFromEuler(euler.current);
      exitTriggered.current = false;
      movedOnce.current     = false;
      dizzyAccum.current    = 0;
      visitedL.current      = false;
      visitedR.current      = false;
      usedForward.current   = false;
      lastInput.current     = performance.now();
    }
    if (mode !== "museum") {
      keys.current = { w: false, a: false, s: false, d: false };
      isLocked.current = false;
    }
  }, [mode, museumCamRef]);

  // 이벤트 리스너
  useEffect(() => {
    if (!enabled) return;

    const onLockChange = () => {
      isLocked.current = !!document.pointerLockElement;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current || !museumCamRef.current) return;
      const dy = -e.movementX * SENSITIVITY; // 좌우 회전 변화량
      euler.current.y += dy;
      euler.current.x -= e.movementY * SENSITIVITY;
      euler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.current.x));
      museumCamRef.current.quaternion.setFromEuler(euler.current);

      lastInput.current = performance.now();

      // Look Up — 천장을 올려다봄
      if (euler.current.x > 1.2) unlock("look_up");

      // Dizzy — 한 방향으로 한 바퀴(2π) 누적 회전
      dizzyAccum.current += dy;
      if (Math.abs(dizzyAccum.current) >= Math.PI * 2) unlock("dizzy");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp")    { keys.current.w = true; usedForward.current = true; }
      if (e.code === "KeyA" || e.code === "ArrowLeft")  keys.current.a = true;
      if (e.code === "KeyS" || e.code === "ArrowDown")  keys.current.s = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.d = true;
      if (e.code === "KeyE") onExit();
      lastInput.current = performance.now();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp")    keys.current.w = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft")  keys.current.a = false;
      if (e.code === "KeyS" || e.code === "ArrowDown")  keys.current.s = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.d = false;
    };

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove",          onMouseMove);
    window.addEventListener("keydown",              onKeyDown);
    window.addEventListener("keyup",                onKeyUp);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove",          onMouseMove);
      window.removeEventListener("keydown",              onKeyDown);
      window.removeEventListener("keyup",                onKeyUp);
    };
  }, [enabled, onExit, museumCamRef, unlock]);

  // WASD 이동 — museumCamRef 직접 이동
  useFrame((_, delta) => {
    const cam = museumCamRef.current;
    if (!enabled || !isLocked.current || !cam) return;

    const speed   = SPEED * delta;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const moving = keys.current.w || keys.current.s || keys.current.a || keys.current.d;
    if (keys.current.w) cam.position.addScaledVector(forward,  speed);
    if (keys.current.s) cam.position.addScaledVector(forward, -speed);
    if (keys.current.a) cam.position.addScaledVector(right,   -speed);
    if (keys.current.d) cam.position.addScaledVector(right,    speed);

    // First Step — 첫 이동
    if (moving && !movedOnce.current) {
      movedOnce.current = true;
      unlock("first_step");
    }

    cam.position.x = Math.max(-BOUNDS_X, Math.min(BOUNDS_X, cam.position.x));
    cam.position.y = PLAYER_HEIGHT;

    // Explorer — 좌우 양쪽 끝 모두 방문
    if (cam.position.x < -5.5) visitedL.current = true;
    if (cam.position.x >  5.5) visitedR.current = true;
    if (visitedL.current && visitedR.current) unlock("explorer");

    // Patience — 20초간 입력 없음
    if (performance.now() - lastInput.current > 20000) unlock("patience");

    const z = cam.position.z;
    if (!exitTriggered.current && (z < -EXIT_TRIGGER_Z || z > EXIT_TRIGGER_Z)) {
      exitTriggered.current = true;
      unlock("way_out"); // 문으로 직접 나가기
      if (!usedForward.current) unlock("moonwalk"); // 전진 없이 빠져나감
      // 토스트를 볼 수 있도록 잠깐 머문 뒤 퇴장
      setTimeout(() => onExit(), 2000);
    } else {
      // 문 앞 또는 일반 구간 — 경계 클램프 (퇴장 대기 중에도 문 앞에 머묾)
      cam.position.z = Math.max(-BOUNDS_Z, Math.min(BOUNDS_Z, z));
    }
  });

  return null;
}
