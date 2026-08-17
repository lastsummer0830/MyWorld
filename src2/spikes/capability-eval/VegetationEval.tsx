'use client';

// AJP-004 — vegetation capability eval 무대.
//
// 이 화면은 제품이 아니라 "조형 능력 표본"이다. 그래서 의도적으로 벌거벗겨 놓는다:
//   - bloom / 빛기둥 / 안개 / 파티클 / 난수 scatter 없음. 약한 조형을 가려 줄 장치를 두지 않는다.
//   - 중성 파스텔 지면과 단순한 3광원. 색이 아니라 형태로 판정한다.
//   - 낮/밤 전환 애니메이션 없음. URL 상태가 첫 프레임에서 그대로 확정돼야 캡처가 재현된다.
//
// 검수 URL
//   ?inspect=overview&night=0   ?inspect=overview&night=1
//   ?inspect=tree&night=0       ?inspect=tree-back&night=0
//   ?inspect=flowers&night=0    ?inspect=flowers-back&night=0

import { useMemo, useSyncExternalStore } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import HeroTree from './HeroTree';
import FlowerBed from './FlowerBed';
import { LIGHT, STAGE } from './palette';

const TREE_AT: [number, number, number] = [-3.6, 0, -0.9];
const BED_AT: [number, number, number] = [3.3, 0, 1.5];

const DEG = Math.PI / 180;

type View = {
  /** 카메라가 바라보는 점 */
  target: [number, number, number];
  /** 수평 방위 / 부각(rad) */
  az: number;
  el: number;
  /** 화면 짧은 변에 담기는 월드 폭(m). 배율은 여기서 결정된다. */
  span: number;
};

/**
 * 검수 상태. 각 상태는 고정된 시선·배율·각도를 가진다.
 * back 각도는 정면에서 가려지는 가지 접합부와 뒤쪽 실루엣을 드러내기 위한 것이다.
 */
export const VIEWS = {
  overview: { target: [0, 2.0, 0.3], az: 45 * DEG, el: 30 * DEG, span: 15.5 },
  tree: { target: [-3.6, 3.5, -0.9], az: 38 * DEG, el: 24 * DEG, span: 11 },
  'tree-back': { target: [-3.6, 3.0, -0.9], az: 214 * DEG, el: 19 * DEG, span: 11 },
  flowers: { target: [3.3, 0.72, 1.5], az: 18 * DEG, el: 17 * DEG, span: 4.4 },
  'flowers-back': { target: [3.3, 0.68, 1.5], az: 201 * DEG, el: 14 * DEG, span: 4.4 },
} satisfies Record<string, View>;

export type InspectKey = keyof typeof VIEWS;

const CAM_DISTANCE = 60;

function parseState(search: string): { inspect: InspectKey; night: boolean } {
  const q = new URLSearchParams(search);
  const raw = q.get('inspect') ?? 'overview';
  const inspect = (Object.hasOwn(VIEWS, raw) ? raw : 'overview') as InspectKey;
  const nightParam = q.get('night');
  return { inspect, night: nightParam === '1' || nightParam === 'true' };
}

/**
 * 직교 카메라와 컨트롤. 위치·배율을 상태에서 직접 계산해 첫 프레임에 확정한다.
 * 보간 없이 값을 바로 넣는 이유는 캡처 타이밍에 따라 화면이 달라지면 안 되기 때문이다.
 * OrbitControls는 켜 두되(수동 확인용) 초기 프레임에는 관여하지 않는다.
 */
function Rig({ view }: { view: View }) {
  const size = useThree((s) => s.size);
  const zoom = Math.min(size.width, size.height) / view.span;

  const position = useMemo<[number, number, number]>(() => {
    const ce = Math.cos(view.el);
    return [
      view.target[0] + Math.sin(view.az) * ce * CAM_DISTANCE,
      view.target[1] + Math.sin(view.el) * CAM_DISTANCE,
      view.target[2] + Math.cos(view.az) * ce * CAM_DISTANCE,
    ];
  }, [view]);

  return (
    <>
      {/* near를 음수로 두면 카메라 뒤쪽 지오메트리도 잘리지 않는다(직교 투영). */}
      <OrthographicCamera makeDefault position={position} zoom={zoom} near={-200} far={400} />
      <OrbitControls
        makeDefault
        target={view.target}
        enablePan={false}
        enableDamping={false}
        minZoom={zoom * 0.3}
        maxZoom={zoom * 5}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI * 0.495}
      />
    </>
  );
}

/** 3광원 — 방향광(그림자) + 반구광 + 약한 환경광. 그 이상은 조형 판정을 흐린다. */
function Lights({ night }: { night: boolean }) {
  const preset = night ? LIGHT.night : LIGHT.day;
  const p = preset.sun.position;

  return (
    <>
      <ambientLight color={preset.ambient.color} intensity={preset.ambient.intensity} />
      <hemisphereLight
        color={preset.hemi.sky}
        groundColor={preset.hemi.ground}
        intensity={preset.hemi.intensity}
      />
      <directionalLight
        position={[p[0] * 1.8, p[1] * 1.8, p[2] * 1.8]}
        color={preset.sun.color}
        intensity={preset.sun.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={0.5}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </>
  );
}

/** 디오라마 판. 그림자가 떨어지는 걸 보기 위한 최소한의 바닥이다. */
function Ground({ night }: { night: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[26, 0.4, 18]} />
        <meshStandardMaterial color={night ? STAGE.groundNight : STAGE.groundDay} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[25.4, 0.44, 17.4]} />
        <meshStandardMaterial color={night ? STAGE.rimNight : STAGE.rimDay} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

function Label({ inspect, night }: { inspect: InspectKey; night: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        top: 12,
        padding: '5px 9px',
        borderRadius: 6,
        background: night ? 'rgba(12,16,24,0.62)' : 'rgba(255,255,255,0.66)',
        color: night ? '#D8E0EC' : '#2C3428',
        font: '500 11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace',
        letterSpacing: 0.2,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      AJP-004 vegetation capability eval · inspect={inspect} · {night ? 'night' : 'day'}
    </div>
  );
}

/**
 * URL query는 브라우저에만 있는 외부 상태다. 서버 스냅샷은 null이고,
 * 클라이언트에서 hydration이 끝난 뒤에야 실제 search 문자열이 들어온다.
 * effect에서 setState로 흉내 내지 않는 이유: 그 방식은 렌더를 한 번 더 태우고,
 * 중간 프레임에 기본 카메라가 잠깐 보일 수 있다.
 */
const subscribeLocation = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => null;

export default function VegetationEval() {
  const search = useSyncExternalStore(subscribeLocation, getSearch, getServerSearch);
  const state = useMemo(() => (search === null ? null : parseState(search)), [search]);

  // 상태가 정해지기 전에는 Canvas를 만들지 않는다 —
  // 그래야 첫 렌더 프레임이 이미 최종 카메라·조명이고, 서버 렌더와도 어긋나지 않는다.
  if (!state) return <div style={{ position: 'fixed', inset: 0, background: STAGE.bgDay }} />;

  const view = VIEWS[state.inspect];
  const background = state.night ? STAGE.bgNight : STAGE.bgDay;

  return (
    <div style={{ position: 'fixed', inset: 0, background }}>
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={[background]} />
        <Rig view={view} />
        <Lights night={state.night} />
        <Ground night={state.night} />
        <HeroTree position={TREE_AT} />
        <FlowerBed position={BED_AT} night={state.night} />
      </Canvas>
      <Label inspect={state.inspect} night={state.night} />
    </div>
  );
}
