'use client';

// 아이소메트릭 무대 (단계 0 스캐폴드).
// 카메라: 직교 투영(원근 왜곡 없음) + 부각 30° 고정 + 수평 360° 자유 회전 + 휠 확대.
//   ★ 아이소메트릭 룩을 만드는 건 직교 투영이지 카메라 잠금이 아니다. 그래서 돌려도 미니어처 느낌이 유지된다.
// 인터랙션: 호버 시 떠오름, 클릭 시 그 오브젝트 속으로 파고드는 카메라.
// 지금 놓인 회색 박스는 가구가 아니라 검사용 말뚝이다 — 단계 2에서 실제 배치로 대체된다.

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
  CAM_POLAR,
  CAM_POS,
  GRASS_H,
  GRID,
  SLAB_H,
  SUN_POS,
  TILE,
  ZOOM_FOCUS,
  ZOOM_MAX,
  ZOOM_MIN,
  fitZoom,
} from './constants';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import Surroundings from './Surroundings';
import Sky from './Sky';
import Fireflies from './Fireflies';
import { moodColor, moodNumber } from './palette';
import Hud from '../ui/Hud';

const SPAN = GRID * TILE;
const ORIGIN = new THREE.Vector3(0, 0, 0);

type Probe = { tile: [number, number]; size: [number, number, number] };

// 24m 정원의 스케일 감을 보려고 세운 말뚝들. 실제 크기를 흉내 낸다.
// 퍼걸러(4×4×3m) / 티테이블(1.6m) / 연못 자리(7×5m) — 단계 2에서 진짜 배치로 대체된다.
const PROBES: Probe[] = [
  { tile: [-9, -6], size: [4, 3, 4] },
  { tile: [3, 4], size: [1.6, 0.9, 1.6] },
  { tile: [8, -8], size: [7, 0.3, 5] },
];

/**
 * 마우스 조작. 수평은 360° 자유, 부각만 30°로 잠근다 — 아이소메트릭 문법은 이 각에서 나온다.
 * 확대 한계는 지금 화면의 기본 배율에서 잡아야 한다. 고정 해상도로 계산하면 큰 모니터에서 축소가 안 먹는다.
 */
function Controls() {
  const size = useThree((s) => s.size);
  const base = fitZoom(size.width, size.height);

  return (
    <OrbitControls
      makeDefault
      minPolarAngle={CAM_POLAR}
      maxPolarAngle={CAM_POLAR}
      enablePan={false}
      enableZoom
      zoomSpeed={0.9}
      minZoom={base * ZOOM_MIN}
      maxZoom={base * ZOOM_MAX}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
    />
  );
}

/**
 * 카메라 연출 — 클릭한 대상으로 시점이 빨려 들어가고, 배경을 클릭하면 되돌아온다.
 * OrbitControls의 target과 zoom을 함께 몰아야 "들어가는" 느낌이 난다. zoom만 올리면 그냥 확대다.
 */
function CameraRig({ focus }: { focus: THREE.Vector3 | null }) {
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const base = fitZoom(size.width, size.height);

  // 애니메이션이 도는 동안에만 zoom을 제어한다. 계속 붙잡고 있으면 사용자의 휠 조작과 싸운다.
  const animating = useRef(false);

  useEffect(() => {
    camera.zoom = base;
    camera.updateProjectionMatrix();
    // 화면 크기가 바뀐 것뿐이면 애니메이션은 걸지 않는다.
  }, [base, camera]);

  useEffect(() => {
    animating.current = true;
  }, [focus]);

  useFrame((_, dt) => {
    if (!controls || !animating.current) return;

    // 프레임률과 무관한 감쇠. 고정 계수로 lerp하면 저사양 기기에서 카메라가 튄다.
    const k = 1 - Math.pow(0.004, dt);
    const goalTarget = focus ?? ORIGIN;
    const goalZoom = focus ? base * ZOOM_FOCUS : base;

    controls.target.lerp(goalTarget, k);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, goalZoom, k);
    camera.updateProjectionMatrix();
    controls.update();

    if (controls.target.distanceTo(goalTarget) < 0.02 && Math.abs(camera.zoom - goalZoom) < 0.4) {
      animating.current = false;
    }
  });

  return null;
}

/** 검사용 박스 하나. 호버하면 살짝 떠오르고 밝아진다. */
function ProbeBlock({
  probe,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  probe: Probe;
  hovered: boolean;
  selected: boolean;
  onHover: (v: boolean) => void;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [x, z] = probe.tile;
  const baseY = probe.size[1] / 2;

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const k = 1 - Math.pow(0.003, dt);
    const goalY = baseY + (hovered || selected ? 0.35 : 0);
    mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, goalY, k);
  });

  const color = selected ? '#E4D9A8' : hovered ? '#CFC7BB' : '#B7B0A6';

  return (
    <mesh
      ref={ref}
      position={[x * TILE, baseY, z * TILE]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={probe.size} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/**
 * 낮/밤 분위기 — 하늘·빛·안개를 한꺼번에 몰아준다.
 * night는 0(낮)↔1(밤) 사이를 lerp로 오간다. "확 전환"되되 뚝 끊기지는 않게.
 */
function Mood({ target, nightRef }: { target: number; nightRef: React.RefObject<number> }) {
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const tmp = useRef(new THREE.Color());

  useFrame((_, dt) => {
    // 프레임률과 무관한 감쇠. 고정 계수로 lerp하면 저사양 기기에서 전환 속도가 달라진다.
    const k = 1 - Math.pow(0.02, dt);
    // 하늘·구름도 같은 값을 읽어야 하므로 state가 아니라 ref로 흘린다(매 프레임 리렌더 방지).
    nightRef.current = THREE.MathUtils.lerp(nightRef.current, target, k);
    const t = nightRef.current;

    if (scene.fog) moodColor((scene.fog as THREE.Fog).color, 'fog', t);

    if (sun.current) {
      moodColor(tmp.current, 'sun', t);
      sun.current.color.copy(tmp.current);
      sun.current.intensity = moodNumber('sunIntensity', t);
    }
    if (amb.current) {
      moodColor(tmp.current, 'ambient', t);
      amb.current.color.copy(tmp.current);
      amb.current.intensity = moodNumber('ambientIntensity', t);
    }
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.62} />
      <directionalLight
        ref={sun}
        position={SUN_POS}
        intensity={1.35}
        castShadow
        // 판이 24m로 넓어져 1024로는 그림자가 뭉갠다. 2048은 이 씬에서 감당 가능한 선.
        shadow-mapSize={[2048, 2048]}
        // 그림자 프러스텀 기본값(±5)은 바닥판보다 좁아 그림자가 잘린다. 판 전체를 덮게 넓힌다.
        shadow-camera-left={-SPAN}
        shadow-camera-right={SPAN}
        shadow-camera-top={SPAN}
        shadow-camera-bottom={-SPAN}
        shadow-camera-near={0.1}
        shadow-camera-far={80}
      />
    </>
  );
}

/**
 * 정원 판 — 잔디 뚜껑 + 흙 단면.
 * 단면이 층으로 보여야 "땅을 도려내 온 조각"으로 읽힌다(참고 이미지의 그 느낌).
 * 격자는 단계 2에서 가구를 스냅 배치할 때의 눈금이다.
 */
function TileFloor({ nightRef }: { nightRef: React.RefObject<number> }) {
  const grass = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    // 밤에 잔디가 아주 옅게 자체 발광한다 — 판이 어둠에 완전히 먹히지 않게 붙잡아 주는 장치.
    if (grass.current) grass.current.emissiveIntensity = nightRef.current * 0.22;
  });

  return (
    <group>
      <mesh position={[0, -GRASS_H / 2, 0]} receiveShadow>
        <boxGeometry args={[SPAN, GRASS_H, SPAN]} />
        <meshStandardMaterial
          ref={grass}
          color="#A9CC72"
          emissive="#B9DD7E"
          emissiveIntensity={0}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, -GRASS_H - SLAB_H / 2, 0]}>
        <boxGeometry args={[SPAN, SLAB_H, SPAN]} />
        <meshStandardMaterial color="#8A6650" roughness={1} metalness={0} />
      </mesh>

      <gridHelper args={[SPAN, GRID, '#8FB35F', '#9CC169']} position={[0, 0.004, 0]} />
    </group>
  );
}

export default function IsoStage() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isNight, setIsNight] = useState(false);

  // 낮(0)↔밤(1)의 현재 값. 하늘·구름·빛이 모두 이 하나를 읽는다.
  const nightRef = useRef(0);

  const focus =
    selected === null
      ? null
      : new THREE.Vector3(
          PROBES[selected].tile[0] * TILE,
          PROBES[selected].size[1] / 2,
          PROBES[selected].tile[1] * TILE,
        );

  useEffect(() => {
    document.body.style.cursor = hovered !== null ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        shadows
        // dpr 2배는 픽셀 4배 = GPU 컨텍스트 소실 위험. 여기 함부로 올리지 않는다.
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        onPointerMissed={() => setSelected(null)}
      >
        {/* 안개는 먼 하늘로 자연스럽게 녹아들게 하는 용도. 색은 Mood가 낮/밤에 맞춰 몰아준다. */}
        <fog attach="fog" args={['#DCEBF2', SPAN * 4, SPAN * 11]} />

        <OrthographicCamera makeDefault position={CAM_POS} near={-200} far={400} />
        <Controls />
        <CameraRig focus={focus} />
        <Mood target={isNight ? 1 : 0} nightRef={nightRef} />

        <Sky nightRef={nightRef} />
        <Surroundings nightRef={nightRef} />
        <TileFloor nightRef={nightRef} />
        <Fireflies nightRef={nightRef} />

        {/*
          Bloom — 밤의 필수 요소. 반딧불이가 "빛"으로 보이려면 번져야 한다.
          단, 후처리는 GPU를 잡아먹는다(집 PC에서 컨텍스트 소실 전력 있음). mipmapBlur + 보수적 설정 유지.
        */}
        <EffectComposer>
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.62}
            luminanceSmoothing={0.25}
            mipmapBlur
            radius={0.72}
          />
        </EffectComposer>

        {PROBES.map((probe, i) => (
          <ProbeBlock
            key={i}
            probe={probe}
            hovered={hovered === i}
            selected={selected === i}
            onHover={(v) => setHovered(v ? i : null)}
            onSelect={() => setSelected((cur) => (cur === i ? null : i))}
          />
        ))}
      </Canvas>

      <Hud
        isNight={isNight}
        onToggleNight={() => setIsNight((v) => !v)}
        // 각 항목이 어느 오브젝트로 카메라를 데려갈지는 단계 6(콘텐츠)에서 연결한다.
        onNav={() => setSelected(null)}
      />
    </div>
  );
}
