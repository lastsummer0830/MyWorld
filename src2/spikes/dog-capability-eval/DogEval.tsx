'use client';

// AJP-004 dog capability eval — STAGE 1 무대.
//
// 판정 대상은 **해부와 실루엣뿐**이다. 그래서 무대에서 가려 줄 장치를 전부 뺐다:
//   bloom / 빛기둥 / 안개 / 파티클 / 난수 / 애니메이션 / 밤 모드 없음.
//   무광 중간회색 한 재질 + 대비되는 중성 지면 + 그림자 + 3광원.
// 전환 애니메이션이 없고 URL 상태가 **첫 프레임에서 확정**돼야 캡처가 재현된다.
//
// 검수 URL
//   ?view=front  ?view=left  ?view=right  ?view=three-quarter  ?view=back
//   어디에나 &flat=1 을 붙이면 조명 없는 단색 실루엣이 된다.

import { useMemo, useSyncExternalStore } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import DogSample from './DogSample';
import { FLAT, LIGHT, SCAFFOLD } from './scaffoldPalette';

const DEG = Math.PI / 180;

type View = {
  /** 카메라가 바라보는 점 */
  target: [number, number, number];
  /** 수평 방위(0 = +z에서 본다, 90° = +x에서 본다) / 부각(rad) */
  az: number;
  el: number;
  /** 화면에 담아야 하는 월드 폭·높이. 둘 다 들어가도록 배율을 정한다. */
  spanX: number;
  spanY: number;
};

/**
 * 고정 검수 시점. 강아지는 +x를 보고 왼쪽이 −z다.
 *   front = 정면(+x에서), left = 강아지 왼쪽(−z에서), right = 오른쪽(+z에서), back = 뒤(−x에서).
 * 부각을 6~8°만 준 이유는, 정투영에서 완전히 수평으로 보면 네 발의 접지가 한 줄로 겹쳐
 * "떠 있는지" 판정이 불가능해지기 때문이다.
 * STAGE 1에는 face 시점이 없다 — 볼 얼굴이 아직 없어야 정상이다.
 */
export const VIEWS = {
  front: { target: [0.1, 0.56, 0], az: 90 * DEG, el: 7 * DEG, spanX: 0.66, spanY: 1.32 },
  left: { target: [-0.09, 0.56, 0], az: 180 * DEG, el: 6 * DEG, spanX: 2.05, spanY: 1.32 },
  right: { target: [-0.09, 0.56, 0], az: 0 * DEG, el: 6 * DEG, spanX: 2.05, spanY: 1.32 },
  'three-quarter': { target: [-0.05, 0.56, 0], az: 132 * DEG, el: 20 * DEG, spanX: 1.94, spanY: 1.4 },
  back: { target: [-0.62, 0.55, 0], az: 270 * DEG, el: 8 * DEG, spanX: 0.66, spanY: 1.32 },
} satisfies Record<string, View>;

export type ViewKey = keyof typeof VIEWS;

const CAM_DISTANCE = 12;

function parseState(search: string): { view: ViewKey; flat: boolean } {
  const q = new URLSearchParams(search);
  const raw = q.get('view') ?? 'three-quarter';
  const view = (Object.hasOwn(VIEWS, raw) ? raw : 'three-quarter') as ViewKey;
  const f = q.get('flat');
  return { view, flat: f === '1' || f === 'true' };
}

/**
 * 직교 카메라. 위치·배율을 상태에서 직접 계산해 첫 프레임에 확정한다.
 * 배율은 가로·세로 요구치를 **둘 다** 만족하는 쪽으로 정한다 —
 * 창 비율이 달라도 같은 프레이밍이 나와야 캡처끼리 비교가 된다.
 * OrbitControls는 수동 확인용으로만 켜 두고 초기 프레임에 관여하지 않는다.
 */
function Rig({ view }: { view: View }) {
  const size = useThree((s) => s.size);
  const zoom = Math.min(size.width / view.spanX, size.height / view.spanY);

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
      <OrthographicCamera makeDefault position={position} zoom={zoom} near={-40} far={80} />
      <OrbitControls
        makeDefault
        target={view.target}
        enablePan={false}
        enableDamping={false}
        minZoom={zoom * 0.3}
        maxZoom={zoom * 6}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI * 0.495}
      />
    </>
  );
}

/** 3광원 — 방향광(그림자) + 반구광 + 약한 환경광. 그 이상은 조형 판정을 흐린다. */
function Lights() {
  const p = LIGHT.sun.position;
  return (
    <>
      <ambientLight color={LIGHT.ambient.color} intensity={LIGHT.ambient.intensity} />
      <hemisphereLight
        color={LIGHT.hemi.sky}
        groundColor={LIGHT.hemi.ground}
        intensity={LIGHT.hemi.intensity}
      />
      <directionalLight
        position={p}
        color={LIGHT.sun.color}
        intensity={LIGHT.sun.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
        shadow-bias={-0.0002}
        shadow-normalBias={0.012}
      />
    </>
  );
}

/** 디오라마 판. 윗면이 정확히 y = 0이라 네 발이 닿았는지 눈으로 바로 판정된다. */
function Ground({ flat }: { flat: boolean }) {
  const top = flat ? FLAT.groundTop : SCAFFOLD.groundTop;
  const rim = flat ? FLAT.groundRim : SCAFFOLD.groundRim;

  return (
    <group>
      <mesh position={[0, -0.09, 0]} receiveShadow={!flat}>
        <boxGeometry args={[3.2, 0.18, 2.4]} />
        {flat ? (
          <meshBasicMaterial color={top} />
        ) : (
          <meshStandardMaterial color={top} roughness={1} metalness={0} />
        )}
      </mesh>
      <mesh position={[0, -0.26, 0]}>
        <boxGeometry args={[3.1, 0.18, 2.3]} />
        {flat ? (
          <meshBasicMaterial color={rim} />
        ) : (
          <meshStandardMaterial color={rim} roughness={1} metalness={0} />
        )}
      </mesh>
    </group>
  );
}

function Label({ view, flat }: { view: ViewKey; flat: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        top: 12,
        padding: '5px 9px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.7)',
        color: '#2C3428',
        font: '500 11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace',
        letterSpacing: 0.2,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      AJP-004 dog stage-1 scaffold · view={view} · flat={flat ? 'on' : 'off'}
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

export default function DogEval() {
  const search = useSyncExternalStore(subscribeLocation, getSearch, getServerSearch);
  const state = useMemo(() => (search === null ? null : parseState(search)), [search]);

  // 상태가 정해지기 전에는 Canvas를 만들지 않는다 —
  // 그래야 첫 렌더 프레임이 이미 최종 카메라·조명이고, 서버 렌더와도 어긋나지 않는다.
  if (!state) return <div style={{ position: 'fixed', inset: 0, background: SCAFFOLD.bg }} />;

  const view = VIEWS[state.view];
  const background = state.flat ? FLAT.bg : SCAFFOLD.bg;

  return (
    <div style={{ position: 'fixed', inset: 0, background }}>
      <Canvas shadows={!state.flat} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={[background]} />
        <Rig view={view} />
        {state.flat ? <ambientLight intensity={1} /> : <Lights />}
        <Ground flat={state.flat} />
        <DogSample flat={state.flat} />
      </Canvas>
      <Label view={state.view} flat={state.flat} />
    </div>
  );
}
