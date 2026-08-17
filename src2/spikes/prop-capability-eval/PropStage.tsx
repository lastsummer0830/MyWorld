'use client';

// AJP-004 · prop capability eval — 소품 판정용 결정적 무대.
//
// 이 화면은 제품이 아니라 **판정용 표본**이다. 조형을 구제해 줄 장치를 전부 뺀다:
//   - OrbitControls 없음, 애니메이션 없음, bloom/안개/파티클 없음.
//   - 카메라·조명·배율이 URL 에서 첫 프레임에 확정된다(= 캡처 재현성).
//   - 캡처 박스를 960×720 으로 고정한다. 창 크기가 달라도 프레임이 같다.
//
// 상태 10개:
//   /capability-eval/watering-can?view=front|left|right|three-quarter|back&flat=0|1
//   flat=0 : 파스텔 재질 + 접지 그림자
//   flat=1 : 흰 배경 위 단일 값 실루엣(재질 도움 없이 윤곽만 본다)
//
// 부각은 다섯 뷰 모두 제품 카메라와 같은 30° 디메트릭이다(`src2/scene/constants.ts` CAM_ELEV_DEG).
// 정면만 el=0 으로 보는 편법은 쓰지 않는다 — 소품은 실제 아이소 각도에서 읽혀야 한다.

import { useMemo, useSyncExternalStore } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import WateringCanView from './WateringCanView';
import { buildWateringCan, canBounds } from './wateringCan';
import { FLAT, SHADED } from './palette';

export const CAPTURE = { width: 960, height: 720 } as const;

const DEG = Math.PI / 180;

/** 제품 카메라 부각. 아이소메트릭 룩을 만드는 건 직교 투영이고, 부각은 이 값 하나로 고정한다. */
const ELEV = 30;

/** az 는 +Z(주둥이가 향하는 앞)에서 +X 로 잰다. 물뿌리개는 X=0 대칭이라 left/right 는 거울쌍이다. */
const VIEWS = {
  front: { az: 0, label: 'front (+Z · 주둥이 정면)' },
  left: { az: 90, label: 'left flank (camera +X)' },
  right: { az: 270, label: 'right flank (camera −X · 거울쌍)' },
  'three-quarter': { az: 45, label: 'three-quarter (제품 기본 방위)' },
  back: { az: 180, label: 'back (−Z · 손잡이 쪽)' },
} as const;

export type ViewKey = keyof typeof VIEWS;

export const STATES: ReadonlyArray<string> = (Object.keys(VIEWS) as ViewKey[]).flatMap((v) => [
  `?view=${v}&flat=0`,
  `?view=${v}&flat=1`,
]);

const CAM_DISTANCE = 6;
/** 프레임 여유. 1.0 이면 물건이 화면 끝에 붙는다. */
const MARGIN = 1.18;

function dirFrom(az: number, el: number): THREE.Vector3 {
  const ce = Math.cos(el * DEG);
  return new THREE.Vector3(Math.sin(az * DEG) * ce, Math.sin(el * DEG), Math.cos(az * DEG) * ce);
}

function parseState(search: string): { view: ViewKey; flat: boolean } {
  const q = new URLSearchParams(search);
  const raw = q.get('view') ?? 'three-quarter';
  const view = (Object.hasOwn(VIEWS, raw) ? raw : 'three-quarter') as ViewKey;
  const flat = q.get('flat');
  return { view, flat: flat === '1' || flat === 'true' };
}

/**
 * 배율을 **투영된 실제 바운딩 박스**에서 뽑는다.
 * 직교라 거리로는 크기가 변하지 않으므로, 눈대중 zoom 은 뷰마다 다른 크기를 만든다.
 * 다섯 뷰 중 가장 큰 투영을 기준으로 한 배율을 공유해야 뷰 사이 비례를 비교할 수 있다.
 */
function fitZoom(box: THREE.Box3, pxW: number, pxH: number): number {
  const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  let zoom = Infinity;
  for (const key of Object.keys(VIEWS) as ViewKey[]) {
    const d = dirFrom(VIEWS[key].az, ELEV);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
    const up = new THREE.Vector3().crossVectors(d, right).normalize();
    const span = (a: THREE.Vector3) =>
      2 * (Math.abs(a.x) * half.x + Math.abs(a.y) * half.y + Math.abs(a.z) * half.z);
    zoom = Math.min(zoom, pxW / (span(right) * MARGIN), pxH / (span(up) * MARGIN));
  }
  return zoom;
}

function Rig({ az, target, zoom }: { az: number; target: THREE.Vector3; zoom: number }) {
  const position = useMemo(
    () => target.clone().addScaledVector(dirFrom(az, ELEV), CAM_DISTANCE),
    [az, target],
  );
  return (
    <OrthographicCamera
      makeDefault
      position={position}
      // 직교라 near 를 음수로 두면 카메라 뒤쪽도 잘리지 않는다.
      near={-20}
      far={40}
      zoom={zoom}
      onUpdate={(cam) => cam.lookAt(target)}
    />
  );
}

/**
 * 조명을 **카메라 방위에 묶는다.** 월드 고정 조명이면 back 뷰만 역광이 되어
 * 조형이 아니라 조명 때문에 판정이 갈린다. 뷰마다 같은 각도에서 빛이 온다.
 * 밝기는 파스텔을 태우지 않는 선에서 면 대비만 만든다.
 */
function Lights({ az, target }: { az: number; target: THREE.Vector3 }) {
  const key = useMemo(() => target.clone().addScaledVector(dirFrom(az + 34, 46), 2.2), [az, target]);
  const fill = useMemo(() => target.clone().addScaledVector(dirFrom(az - 72, 16), 2.2), [az, target]);
  return (
    <>
      <ambientLight intensity={0.34} />
      <hemisphereLight color="#f3f7f4" groundColor="#8a9689" intensity={0.72} />
      <directionalLight
        position={key}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-0.7}
        shadow-camera-right={0.7}
        shadow-camera-top={0.7}
        shadow-camera-bottom={-0.7}
        shadow-camera-near={0.1}
        shadow-camera-far={6}
        shadow-bias={-0.0008}
      />
      <directionalLight position={fill} intensity={0.34} />
    </>
  );
}

/** 접지 판. 바닥선과 그림자가 함께 보여야 "떠 있는지"가 드러난다. */
function Ground({ flat }: { flat: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[0.9, 64]} />
      {flat ? (
        <meshBasicMaterial color={FLAT.ground} />
      ) : (
        <meshStandardMaterial color={SHADED.ground} roughness={0.95} metalness={0} />
      )}
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
        background: flat ? 'rgba(255,255,255,0.9)' : 'rgba(16,19,24,0.55)',
        color: flat ? '#3a3f47' : '#f2f6f4',
        font: '500 11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace',
        letterSpacing: 0.2,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      watering-can · view={view} · flat={flat ? '1' : '0'} · elev {ELEV}° · {VIEWS[view].label}
    </div>
  );
}

function Scene({ flat, az }: { flat: boolean; az: number }) {
  const parts = useMemo(() => buildWateringCan(), []);
  const box = useMemo(() => canBounds(parts), [parts]);
  const target = useMemo(() => box.getCenter(new THREE.Vector3()), [box]);
  const size = useThree((s) => s.size);
  const zoom = useMemo(() => fitZoom(box, size.width, size.height), [box, size]);

  return (
    <>
      <Rig az={az} target={target} zoom={zoom} />
      {!flat && <Lights az={az} target={target} />}
      <Ground flat={flat} />
      <WateringCanView parts={parts} flat={flat} />
    </>
  );
}

const subscribeLocation = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => null;

export default function PropStage() {
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
        <div style={{ ...box, background: SHADED.bg }} />
      </div>
    );
  }

  const bg = state.flat ? FLAT.bg : SHADED.bg;

  return (
    <div style={shell}>
      <div style={{ ...box, background: bg }}>
        <Canvas
          shadows={!state.flat}
          dpr={[1, 2]}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={[bg]} />
          <Scene flat={state.flat} az={VIEWS[state.view].az} />
        </Canvas>
        <Label view={state.view} flat={state.flat} />
      </div>
    </div>
  );
}
