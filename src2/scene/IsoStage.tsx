'use client';

// 아이소메트릭 무대.
// 카메라: 직교 투영(원근 왜곡 없음) + 부각 30° 고정 + 수평 360° 자유 회전 + 휠 확대.
//   ★ 아이소메트릭 룩을 만드는 건 직교 투영이지 카메라 잠금이 아니다. 그래서 돌려도 미니어처 느낌이 유지된다.
// 인터랙션: 호버 시 떠오름, 클릭 시 그 오브젝트 속으로 파고드는 카메라.
// 지금 놓인 회색 박스는 가구가 아니라 검사용 말뚝이다 — 단계 2에서 실제 배치로 대체된다.
//
// `?swatch=1` 로 열면 정원 위에 색견본이 깔린다. 실제 조명·실제 각도에서 색을 확인하기 위한 것.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import { BloomEffect } from 'postprocessing';
import * as THREE from 'three';
import {
  CAM_POLAR,
  CAM_POS,
  ISLAND_R,
  ISLAND_R_SAFE,
  SHADOW_SPAN,
  SUN_POS,
  ZOOM_FOCUS,
  ZOOM_MAX,
  ZOOM_MIN,
  fitZoom,
} from './constants';
import { DAY, moodColor, moodNumber } from './palette';
import { MAT, SWATCHES, tickMaterials } from './materials';
import Island from './Island';
import Surroundings from './Surroundings';
import Sky from './Sky';
import Sunlight from './Sunlight';
import Motes from './Motes';
import Fireflies from './Fireflies';
import Hud from '../ui/Hud';

const ORIGIN = new THREE.Vector3(0, 0, 0);

type Probe = { pos: [number, number]; size: [number, number, number] };

// 44m 정원의 스케일 감을 보려고 세운 말뚝들. 실제 크기를 흉내 낸다.
// 퍼걸러(6×3×6m) / 티테이블(1.6m) / 연못 자리(10×7m) — 단계 2에서 진짜 배치로 대체된다.
const PROBES: Probe[] = [
  { pos: [-8, -5], size: [6, 3, 6] },
  { pos: [2, 3], size: [1.6, 0.9, 1.6] },
  { pos: [9, -9], size: [10, 0.3, 7] },
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
  const [x, z] = probe.pos;
  const baseY = probe.size[1] / 2;

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const k = 1 - Math.pow(0.003, dt);
    const goalY = baseY + (hovered || selected ? 0.35 : 0);
    mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, goalY, k);
  });

  const mat = MAT('matte', selected ? 'blockActive' : hovered ? 'blockHover' : 'block');

  return (
    <mesh
      ref={ref}
      position={[x, baseY, z]}
      material={mat}
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
    </mesh>
  );
}

/**
 * 낮/밤 분위기 — 하늘·빛·안개·발광 재질·Bloom을 한꺼번에 몰아준다.
 * night는 0(낮)↔1(밤) 사이를 lerp로 오간다. "확 전환"되되 뚝 끊기지는 않게.
 */
/** 태양이 월드에서 향하는 방향(고정). 화면상 방향은 카메라가 돌 때마다 다시 구한다. */
const SUN_WORLD = new THREE.Vector3(...SUN_POS).normalize();

function Mood({
  target,
  nightRef,
  sunDirRef,
  bloom,
}: {
  target: number;
  nightRef: React.RefObject<number>;
  sunDirRef: React.RefObject<THREE.Vector2>;
  bloom: BloomEffect;
}) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const sun = useRef<THREE.DirectionalLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const tmp = useRef(new THREE.Color());
  const tmpV = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    // 태양 방향을 카메라 공간으로 옮기면, 그 x·y가 곧 "화면에서 해가 있는 쪽"이 된다.
    // 하늘의 빛무리와 빛기둥이 이 값을 읽으므로, 카메라를 돌리면 햇살 각도도 자연스럽게 따라 돈다.
    const v = tmpV.current.copy(SUN_WORLD).transformDirection(camera.matrixWorldInverse);
    const len = Math.hypot(v.x, v.y);
    // 해가 시선축과 거의 일치하면 화면상 방향이 정의되지 않는다 — 직전 값을 유지한다.
    if (len > 1e-3) sunDirRef.current.set(v.x / len, v.y / len);

    // 프레임률과 무관한 감쇠. 고정 계수로 lerp하면 저사양 기기에서 전환 속도가 달라진다.
    const k = 1 - Math.pow(0.02, dt);
    // 하늘·구름·재질이 모두 같은 값을 읽어야 하므로 state가 아니라 ref로 흘린다(매 프레임 리렌더 방지).
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
    if (hemi.current) {
      moodColor(tmp.current, 'hemiSky', t);
      hemi.current.color.copy(tmp.current);
      moodColor(tmp.current, 'hemiGround', t);
      hemi.current.groundColor.copy(tmp.current);
      hemi.current.intensity = moodNumber('hemiIntensity', t);
    }

    // ★ Bloom은 밤에만. 낮에 켜 두면 하늘(밝기 0.72~0.92)과 흰 구름이 통째로 번져
    //   화면이 하얗게 씻겨 나간다 — 반딧불이를 살리려던 장치가 정반대로 작동한다.
    bloom.intensity = moodNumber('bloom', t);

    // 발광 재질(잔디의 밤빛·알전구)을 한곳에서 갱신한다.
    tickMaterials(t);
  });

  return (
    <>
      {/*
        ambient는 약하게. 세게 주면 그늘이 사라져 전체가 균일하게 창백해진다(= 흐린 날).
        햇살은 밝기가 아니라 "밝은 면과 그늘의 대비"에서 나온다.
      */}
      <ambientLight ref={amb} color={DAY.ambient} intensity={DAY.ambientIntensity} />

      {/*
        ★ 정원 느낌의 핵심. 위에서는 하늘색이, 아래에서는 잔디에 반사된 연둣빛이 올라온다.
        이게 있어야 그늘진 면에 초록빛이 배어들어 "풀밭 위에 놓인 물건"으로 보인다.
        없으면 그늘이 그냥 회색이 되어 오브젝트가 바닥에서 붕 뜬다.
      */}
      <hemisphereLight
        ref={hemi}
        color={DAY.hemiSky}
        groundColor={DAY.hemiGround}
        intensity={DAY.hemiIntensity}
      />

      <directionalLight
        ref={sun}
        position={SUN_POS}
        color={DAY.sun}
        intensity={DAY.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        // 그림자 프러스텀 기본값(±5)은 섬보다 좁아 그림자가 잘린다. 섬 전체를 덮게 넓힌다.
        shadow-camera-left={-SHADOW_SPAN}
        shadow-camera-right={SHADOW_SPAN}
        shadow-camera-top={SHADOW_SPAN}
        shadow-camera-bottom={-SHADOW_SPAN}
        shadow-camera-near={0.1}
        shadow-camera-far={140}
        // 넓은 프러스텀에서 생기는 그림자 얼룩(acne)을 지운다.
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />
    </>
  );
}

/**
 * 색견본 (`?swatch=1`) — 등록된 재질을 실제 조명 아래 늘어놓는다.
 * 스타일가이드 §5: 색은 정면 평면이 아니라 "실제 사용 각도·실제 빛"에서 판단해야 한다.
 * 구와 상자를 함께 두는 이유: 곡면의 부드러운 명암과 평면의 딱 떨어지는 명암이 둘 다 보여야 재질이 판단된다.
 */
function SwatchBoard() {
  const COLS = 7;
  const GAP = 5;

  return (
    <group position={[0, 0, 0]}>
      {SWATCHES.map((s, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = (col - (COLS - 1) / 2) * GAP;
        const z = (row - 0.5) * GAP * 1.4;
        const mat = MAT(s.preset, s.color, s.preset === 'glow' ? { dayGlow: 0.6, nightGlow: 2.2 } : {});

        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[-1, 1.1, 0]} material={mat} castShadow receiveShadow>
              <sphereGeometry args={[1.1, 32, 24]} />
            </mesh>
            <mesh position={[1.1, 0.9, 0]} material={mat} castShadow receiveShadow>
              <boxGeometry args={[1.6, 1.8, 1.6]} />
            </mesh>
            <Html position={[0, -0.1, 1.6]} center style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  font: '600 12px/1 system-ui, sans-serif',
                  color: '#2E3A2A',
                  background: 'rgba(255,255,255,0.72)',
                  padding: '3px 7px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function IsoStage() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [swatch, setSwatch] = useState(false);

  // 낮(0)↔밤(1)의 현재 값. 하늘·구름·빛·재질이 모두 이 하나를 읽는다.
  const nightRef = useRef(0);

  // 화면에서 해가 있는 방향. Mood가 매 프레임 갱신하고, 하늘과 햇살이 읽어 간다.
  const sunDirRef = useRef(new THREE.Vector2(0, 1));

  /**
   * ★ Bloom을 <Bloom> 컴포넌트 + ref로 쓰면 안 된다.
   *   React 19부터 ref는 일반 prop으로 전달되는데, @react-three/postprocessing의 wrapEffect가
   *   받은 prop 전체를 JSON.stringify해 캐시 키로 쓴다. 마운트 후 ref.current에 들어간 BloomEffect는
   *   내부에 순환 참조(KawaseBlurPass → Resolution → resizable)가 있어 stringify가 그대로 터진다.
   *   → 인스턴스를 직접 만들어 <primitive>로 넣는다. EffectComposer는 자식 중 Effect를 찾아 쓰므로 동작은 같고,
   *     매 프레임 intensity를 만질 핸들도 그대로 얻는다.
   */
  const bloom = useMemo(
    () =>
      new BloomEffect({
        intensity: 0, //  세기는 Mood가 낮/밤에 맞춰 몰아준다.
        // ★ 0.9 — 이 값이 "무엇이 빛나는가"를 정한다.
        //   낮 하늘이 0.72~0.87이므로 하늘은 걸리지 않고, 해 원반과 햇빛이 정면으로 때린 면만 번진다.
        //   낮추면(0.62였다) 하늘이 통째로 걸려 화면이 하얗게 씻겨 나간다 — 오늘 그렇게 한 번 태웠다.
        luminanceThreshold: 0.9,
        luminanceSmoothing: 0.25,
        mipmapBlur: true,
        radius: 0.72,
      }),
    [],
  );
  useEffect(() => () => bloom.dispose(), [bloom]);

  // 쿼리 파라미터는 마운트 후에 읽는다 — 서버 렌더 결과와 달라지면 hydration이 깨진다.
  useEffect(() => {
    setSwatch(new URLSearchParams(window.location.search).has('swatch'));
  }, []);

  const focus =
    selected === null
      ? null
      : new THREE.Vector3(PROBES[selected].pos[0], PROBES[selected].size[1] / 2, PROBES[selected].pos[1]);

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
        {/* 안개 — 직교 카메라에는 원근이 없어서 거리감을 만들 수단이 이것뿐이다.
            원경(부유섬·구름)을 하늘색으로 흐리게 지워 "저 멀리"로 밀어낸다.
            섬 자체(반경 22m)에는 닿지 않게 60m부터 시작하고, 154m에서 완전히 하늘색이 된다.
            far를 멀리 잡으면(13배로 뒀었다) 원경이 또렷하게 남아 거대한 회색 덩어리로 보인다.
            색은 Mood가 낮/밤에 맞춰 몰아준다. */}
        <fog attach="fog" args={[DAY.fog, ISLAND_R * 2.7, ISLAND_R * 7]} />

        <OrthographicCamera makeDefault position={CAM_POS} near={-300} far={600} />
        <Controls />
        <CameraRig focus={focus} />
        <Mood target={isNight ? 1 : 0} nightRef={nightRef} sunDirRef={sunDirRef} bloom={bloom} />

        <Sky nightRef={nightRef} sunDirRef={sunDirRef} />
        <Surroundings nightRef={nightRef} />
        <Island />
        {/* 낮의 금빛 부유물 ↔ 밤의 반딧불이. 낮/밤에 서로 자리를 넘겨준다. */}
        <Motes nightRef={nightRef} />
        <Fireflies nightRef={nightRef} />

        {/* 햇살 — 씬 위에 얹히는 빛기둥. 맨 마지막에 가산 합성으로 그린다. */}
        <Sunlight nightRef={nightRef} sunDirRef={sunDirRef} />

        {swatch ? (
          <SwatchBoard />
        ) : (
          PROBES.map((probe, i) => (
            <ProbeBlock
              key={i}
              probe={probe}
              hovered={hovered === i}
              selected={selected === i}
              onHover={(v) => setHovered(v ? i : null)}
              onSelect={() => setSelected((cur) => (cur === i ? null : i))}
            />
          ))
        )}

        {/*
          Bloom — 밤의 필수 요소. 반딧불이가 "빛"으로 보이려면 번져야 한다.
          intensity는 Mood가 밤 값에 맞춰 몰아준다(낮 = 0).
          EffectComposer를 조건부로 넣었다 뺐다 하면 셰이더가 재컴파일되며 화면이 깜빡인다 —
          그래서 항상 두고 세기만 0으로 내린다.
        */}
        <EffectComposer>
          <primitive object={bloom} />
        </EffectComposer>
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

// 배치 가능 반경 — 단계 2에서 오브젝트를 놓을 때 이 원 안에 들어오는지 확인한다.
export const PLACEABLE_R = ISLAND_R_SAFE;
