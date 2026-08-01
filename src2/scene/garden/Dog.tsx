'use client';

// 강아지 — 정원의 주인공. 조아진의 실제 반려견(블루멀 셸티 · 오드아이)을 사진 보고 만든다.
//
// ★★ 2026-08-01 두 번째 전면 재작성.
//   1차 재작성은 색만 고쳤고 몸은 여전히 구·캡슐·콘을 겹친 것이었다 — 그래서 풍선으로 보였다.
//   지금은 몸·갈기·머리·꼬리·다리가 각각 **단면을 이어 만든 연속 표면 하나**다.
//   무늬는 얹은 덩어리가 아니라 그 표면에 칠한 **정점 색**이고, 털은 표면의 **결과 자락**이다.
//   왜 그렇게 해야 하는지는 dogGeometry.ts 머리말에 적어 뒀다(실패 기록 포함).
//
// 이 파일이 하는 일은 두 가지뿐이다:
//   ① 부품을 관절 group에 매달아 조립하고, ② dogBrain이 내주는 자세를 그 관절에 꽂는다.
//   생김새(치수·무늬)는 전부 dogGeometry.ts에 있다.
//
// 몸은 +x를 향한다. 월드 배치·회전은 이 컴포넌트가 직접 한다(두뇌가 좌표를 갖고 있으므로).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAT } from '../materials';
import { DogBrain } from './dogBrain';
import { JOINT, buildBody, buildEar, buildHead, buildLeg, buildRuff, buildTail } from './dogGeometry';

/** 털 재질 — 부품 전부가 이 하나를 공유한다. 색은 지오메트리에 구워 둔 정점 색이 정한다. */
const coat = () => MAT('fur', 'dogWhite', { vertexColors: true });

/**
 * 강아지가 지금 서 있는 곳(가슴 높이). 검수 모드(`?inspect=dog`)의 카메라가 이걸 따라간다.
 * ★ React state로 올리지 않는 이유는 나비와 같다 — 매 프레임 바뀌는 값을 state에 넣으면
 *   강아지가 한 발 뗄 때마다 씬 전체가 리렌더된다.
 */
export const DOG_POS = new THREE.Vector3();

export default function Dog() {
  const brain = useMemo(() => new DogBrain(), []);

  // 지오메트리는 한 번만 만든다. 좌우 다리는 같은 지오메트리를 공유한다(대칭이라 뒤집을 필요가 없다).
  const geo = useMemo(
    () => ({
      body: buildBody(),
      ruff: buildRuff(),
      head: buildHead(),
      ear: buildEar(),
      tail: buildTail(),
      legF: buildLeg(false),
      legR: buildLeg(true),
    }),
    [],
  );

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  // ★ 배열에 담아 legs[i]로 넘기면 lint가 "렌더 중 ref 접근"으로 잡는다(배열 인덱싱도 접근이다).
  //   네 개를 따로 두고, 프레임 루프 안에서만 배열로 묶는다.
  const legFL = useRef<THREE.Group>(null);
  const legFR = useRef<THREE.Group>(null);
  const legBL = useRef<THREE.Group>(null);
  const legBR = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    // 탭 전환 후 되돌아오면 dt가 몇 초로 튄다 — 그대로 쓰면 강아지가 순간이동한다.
    const d = Math.min(dt, 0.05);
    const p = brain.update(d, nightRefValue ?? 0);

    if (root.current) {
      root.current.position.set(p.x, 0, p.z);
      root.current.rotation.y = p.yaw;
    }
    DOG_POS.set(p.x, 0.78, p.z); //  0.78 = 등 높이. 발밑을 겨누면 검수 화면에서 머리가 잘린다.
    if (body.current) {
      // 엎드림 = 몸을 낮추고 앞으로 살짝 눕힌다. 배 뒤집기 = x축으로 굴린다.
      body.current.position.y = -p.lie * 0.19;
      body.current.rotation.z = -p.lie * 0.06;
      body.current.rotation.x = p.bellyUp * Math.PI * 0.92;
      // 걸을 때 몸통이 좌우로 살짝 흔들린다(속도에 비례).
      body.current.rotation.y = Math.sin(p.gait) * 0.05 * Math.min(1, p.speed);
    }
    if (head.current) {
      head.current.rotation.z = -p.headPitch; //  +z 회전이 코를 아래로 내린다
      head.current.rotation.y = p.headYaw;
    }
    if (tail.current) {
      const t = state.clock.elapsedTime;
      tail.current.rotation.y = Math.sin(t * (5 + p.tailWag * 7)) * (0.15 + p.tailWag * 0.7);
      // 꼬리는 이미 위로 휘어 있게 만들었다. +z 회전이 그걸 뒤로 눕힌다 — 잘 때 몸에 붙인다.
      tail.current.rotation.z = p.lie * 1.0 - Math.min(1, p.speed / 1.6) * 0.22;
    }
    // 다리 — 대각선 두 쌍이 엇갈려 나간다(트로트 보행).
    const swing = Math.min(1, p.speed / 1.6) * 0.55;
    [legFL, legFR, legBL, legBR].forEach((ref, i) => {
      if (!ref.current) return;
      const diagonal = i === 0 || i === 3 ? 0 : Math.PI;
      // 엎드리면 다리를 접어 몸 아래로 넣는다.
      ref.current.rotation.z = Math.sin(p.gait + diagonal) * swing + p.lie * 1.15;
      ref.current.position.y = (i < 2 ? JOINT.legFront[1] : JOINT.legRear[1]) - p.lie * 0.16;
    });
  });

  const leg = (
    rear: boolean,
    side: 1 | -1,
    ref: React.RefObject<THREE.Group | null>,
  ) => {
    const j = rear ? JOINT.legRear : JOINT.legFront;
    return (
      <group ref={ref} position={[j[0], j[1], j[2] * side]}>
        <mesh geometry={rear ? geo.legR : geo.legF} material={coat()} castShadow receiveShadow />
      </group>
    );
  };

  return (
    // 개요 화면에서도 강아지가 읽혀야 하므로 실제 셸티보다 조금 크게 둔다.
    <group ref={root} scale={1.35}>
      <group ref={body}>
        {leg(false, 1, legFL)}
        {leg(false, -1, legFR)}
        {leg(true, 1, legBL)}
        {leg(true, -1, legBR)}

        {/* 몸통 — 꼬리부터 목까지 이어진 표면 하나. 등판 무늬도 이 표면에 칠해져 있다. */}
        <mesh geometry={geo.body} material={coat()} castShadow receiveShadow />

        {/* 머리 — 목 위 관절에서 돌아간다. 이음매는 갈기가 통째로 덮으므로 보이지 않는다. */}
        <group ref={head} position={JOINT.head}>
          <mesh geometry={geo.head} material={coat()} castShadow receiveShadow />

          {/* 귀 — 좌우로 살짝 벌어져 서고, 윗절반은 지오메트리에서 이미 앞으로 꺾여 있다. */}
          {[1, -1].map((s) => (
            <group
              key={s}
              position={[JOINT.ear[0], JOINT.ear[1], JOINT.ear[2] * s]}
              rotation={[0.15 * s, 0, -0.20]}
            >
              <mesh geometry={geo.ear} material={coat()} castShadow />
            </group>
          ))}

          {/* 코 */}
          <mesh position={JOINT.nose} scale={[1.1, 0.85, 1]} material={MAT('glossy', 'dogInk')} castShadow>
            <sphereGeometry args={[0.027, 10, 8]} />
          </mesh>

          {/*
            ── 오드아이 ── (2026-08-01 조아진 지정)
            왼쪽 = 파란 눈, 오른쪽 = 검은 눈인데 아래쪽만 바다빛이 돈다.
            ★ 모델이 +x를 보고 +y가 위이므로 강아지의 **왼쪽은 −z**다(left = up × forward).
              사진(두 번째 장)에서 얼굴이 향한 쪽을 기준으로 세어 보면 파란 눈이 강아지의 왼쪽이다.
          */}
          <mesh
            position={[JOINT.eye[0], JOINT.eye[1], -JOINT.eye[2]]}
            material={MAT('glossy', 'eyeBlue')}
          >
            <sphereGeometry args={[0.026, 10, 8]} />
          </mesh>
          <mesh position={JOINT.eye} material={MAT('glossy', 'dogInk')}>
            <sphereGeometry args={[0.026, 10, 8]} />
          </mesh>
          {/* 오른쪽 눈 아래에만 도는 바다빛 */}
          <mesh
            position={[JOINT.eye[0] + 0.006, JOINT.eye[1] - 0.008, JOINT.eye[2]]}
            scale={[0.5, 0.5, 1]}
            material={MAT('glossy', 'eyeBlue')}
          >
            <sphereGeometry args={[0.023, 10, 8]} />
          </mesh>
          {/* 동공 — 양쪽 다 까맣다 */}
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[JOINT.eye[0] + 0.012, JOINT.eye[1] + 0.001, JOINT.eye[2] * s]}
              material={MAT('glossy', 'dogInk')}
            >
              <sphereGeometry args={[0.011, 8, 6]} />
            </mesh>
          ))}
        </group>

        {/* 갈기 — 몸에 붙어 있다(머리와 같이 돌면 목도리가 돌아간다). 머리-목 이음매를 덮는 역할도 한다. */}
        <mesh geometry={geo.ruff} material={coat()} castShadow receiveShadow />

        {/* 꼬리 */}
        <group ref={tail} position={JOINT.tail}>
          <mesh geometry={geo.tail} material={coat()} castShadow />
        </group>
      </group>
    </group>
  );
}

/**
 * 밤 값 — IsoStage의 Mood가 매 프레임 갱신한다.
 * ★ props로 내리지 않는 이유: Garden → Dog까지 nightRef를 뚫으면 중간 컴포넌트가 전부
 *   자기와 상관없는 값을 들고 있어야 한다. 프레임 루프끼리 주고받는 값이라 모듈 변수가 맞다
 *   (butterflySwarm과 같은 이유).
 */
let nightRefValue: number | null = null;
export const setDogNight = (v: number) => {
  nightRefValue = v;
};
