'use client';

// AJP-004 · Skill-ON v2 · stage-1 — 결정적 다면 실루엣 무대.
//
// 이 화면은 제품이 아니라 **판정용 표본**이다. 조형을 구제해 줄 장치를 전부 뺀다:
//   - OrbitControls 없음, 애니메이션 없음, bloom/안개/파티클/장식 조명 없음.
//   - 카메라·조명·배율이 URL 에서 첫 프레임에 확정된다(= 캡처 재현성).
//   - 캡처 박스를 960×720 으로 고정한다. 창 크기가 달라도 프레임이 같다.
//
// 상태 10개 (animal-scaffold-eval.md §6):
//   /capability-eval/dog-skill-on-v2?view=front|left|right|three-quarter|back&flat=0|1
//   flat=0 : 중성 clay(면과 접합을 드러낸다)
//   flat=1 : 흰 배경 위 무광 실루엣(재질 도움 없이 윤곽만 본다)

import { useMemo, useSyncExternalStore } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import DogScaffoldV2 from './DogScaffoldV2';

export const CAPTURE = { width: 960, height: 720 } as const;

const DEG = Math.PI / 180;

type View = { az: number; el: number; label: string };

/**
 * 다섯 개의 고정 시점. az 는 +Z(개의 정면)에서 +X(개의 왼쪽)로 잰다.
 * 옆·정면·후면은 el=0 으로 둔다 — 순수 직교 실루엣이라야 윤곽 판정이 흐려지지 않고,
 * 발바닥과 지면선 사이의 틈(= 접지 실패)도 그대로 드러난다.
 */
export const VIEWS = {
  front: { az: 0, el: 0, label: 'front (+Z)' },
  left: { az: 90, el: 0, label: "left profile (dog's left)" },
  right: { az: 270, el: 0, label: "right profile (dog's right, mirrored — unverified)" },
  'three-quarter': { az: 38, el: 14, label: 'three-quarter (front-left)' },
  back: { az: 180, el: 0, label: 'back (-Z)' },
} satisfies Record<string, View>;

export type ViewKey = keyof typeof VIEWS;

export const STATES: ReadonlyArray<string> = (Object.keys(VIEWS) as ViewKey[]).flatMap((v) => [
  `?view=${v}&flat=0`,
  `?view=${v}&flat=1`,
]);

/** 다섯 뷰 모두 같은 배율·같은 시선점. 뷰 사이 비례를 비교할 수 있어야 한다. */
const SPAN_Y = 1.68;
const TARGET: [number, number, number] = [0, 0.66, -0.02];
const CAM_DISTANCE = 20;

const CLAY = { bg: '#3b4048', ground: '#2d323a', body: '#cdc7bd' };
const FLAT = { bg: '#ffffff', ground: '#dcdcdc', body: '#14161a' };

function parseState(search: string): { view: ViewKey; flat: boolean } {
  const q = new URLSearchParams(search);
  const raw = q.get('view') ?? 'left';
  const view = (Object.hasOwn(VIEWS, raw) ? raw : 'left') as ViewKey;
  const flat = q.get('flat');
  return { view, flat: flat === '1' || flat === 'true' };
}

function dirFrom(az: number, el: number): [number, number, number] {
  const ce = Math.cos(el * DEG);
  return [Math.sin(az * DEG) * ce, Math.sin(el * DEG), Math.cos(az * DEG) * ce];
}

/** 직교 카메라. zoom 은 캔버스 높이/월드 세로폭이라 캡처 박스가 고정되면 배율도 고정된다. */
function Rig({ view }: { view: View }) {
  const height = useThree((s) => s.size.height);
  const position = useMemo<[number, number, number]>(() => {
    const d = dirFrom(view.az, view.el);
    return [
      TARGET[0] + d[0] * CAM_DISTANCE,
      TARGET[1] + d[1] * CAM_DISTANCE,
      TARGET[2] + d[2] * CAM_DISTANCE,
    ];
  }, [view]);

  return (
    <OrthographicCamera
      makeDefault
      position={position}
      // 직교라 near 를 음수로 두면 카메라 뒤쪽도 잘리지 않는다.
      near={-100}
      far={200}
      zoom={height / SPAN_Y}
      onUpdate={(cam) => cam.lookAt(TARGET[0], TARGET[1], TARGET[2])}
    />
  );
}

/**
 * 조명을 **카메라 방위에 묶는다.** 월드 고정 조명이면 back 뷰만 역광이 되어
 * 실루엣이 아니라 조명 때문에 판정이 갈린다. 뷰마다 같은 각도에서 빛이 오게 한다.
 */
function Lights({ view }: { view: View }) {
  const key = useMemo(() => dirFrom(view.az + 34, 42), [view]);
  const fill = useMemo(() => dirFrom(view.az - 62, 12), [view]);
  return (
    <>
      <ambientLight intensity={0.34} />
      <hemisphereLight color="#e8ecf2" groundColor="#4a4f57" intensity={0.5} />
      <directionalLight position={[key[0] * 8, key[1] * 8, key[2] * 8]} intensity={1.55} />
      <directionalLight position={[fill[0] * 8, fill[1] * 8, fill[2] * 8]} intensity={0.4} />
    </>
  );
}

/**
 * 지면선. el=0 뷰에서는 얇은 띠로 보이며 네 발의 접지/부유를 그대로 노출한다.
 * flat 모드에서는 실루엣과 섞이지 않도록 밝은 회색으로 둔다.
 */
function Ground({ flat }: { flat: boolean }) {
  return (
    <mesh position={[0, -0.012, 0]}>
      <boxGeometry args={[4, 0.024, 4]} />
      <meshBasicMaterial color={flat ? FLAT.ground : CLAY.ground} />
    </mesh>
  );
}

function Label({ view, flat }: { view: ViewKey; flat: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 10,
        bottom: 10,
        padding: '5px 9px',
        borderRadius: 5,
        background: flat ? 'rgba(255,255,255,0.9)' : 'rgba(16,19,24,0.62)',
        color: flat ? '#3a3f47' : '#dfe4ec',
        font: '500 11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace',
        letterSpacing: 0.2,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      Skill-ON v2 · stage-1 · view={view} · flat={flat ? '1' : '0'} · {VIEWS[view].label}
    </div>
  );
}

const subscribeLocation = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => null;

export default function StageV2() {
  // URL query 는 브라우저에만 있는 외부 상태다. 확정되기 전에는 Canvas 를 만들지 않는다 —
  // 그래야 첫 렌더 프레임이 이미 최종 카메라·조명이고 캡처가 흔들리지 않는다.
  const search = useSyncExternalStore(subscribeLocation, getSearch, getServerSearch);
  const state = useMemo(() => (search === null ? null : parseState(search)), [search]);

  const shell: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    background: '#20242b',
  };
  const box: React.CSSProperties = {
    position: 'relative',
    width: CAPTURE.width,
    height: CAPTURE.height,
    overflow: 'hidden',
  };

  if (!state) {
    return (
      <div style={shell}>
        <div style={{ ...box, background: CLAY.bg }} />
      </div>
    );
  }

  const view = VIEWS[state.view];
  const bg = state.flat ? FLAT.bg : CLAY.bg;

  return (
    <div style={shell}>
      <div style={{ ...box, background: bg }}>
        <Canvas dpr={[1, 2]} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }}>
          <color attach="background" args={[bg]} />
          <Rig view={view} />
          {!state.flat && <Lights view={view} />}
          <Ground flat={state.flat} />
          <DogScaffoldV2 color={state.flat ? FLAT.body : CLAY.body} flat={state.flat} />
        </Canvas>
        <Label view={state.view} flat={state.flat} />
      </div>
    </div>
  );
}
