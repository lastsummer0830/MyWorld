'use client';

// 아이소메트릭 무대 (단계 0 스캐폴드).
// 목적은 "새 씬을 브라우저로 볼 수 있는 창구"를 여는 것 — 고정 ortho 카메라 + 주광 + 타일 바닥까지만.
// 팔레트·재질·에셋은 단계 1 이후에 들어온다. 지금 색은 전부 임시 회색이다.

import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { CAM_POS, GRID, SLAB_H, SUN_POS, TILE, ZOOM_BASE, ZOOM_REF_PX } from './constants';

const SPAN = GRID * TILE;

/** 고정각 아이소메트릭 카메라. 각도는 상수로 박고, 화면 크기 대응은 zoom으로만 한다. */
function IsoCamera() {
  const size = useThree((s) => s.size);
  const zoom = (ZOOM_BASE * Math.min(size.width, size.height)) / ZOOM_REF_PX;

  return (
    <OrthographicCamera
      makeDefault
      zoom={zoom}
      position={CAM_POS}
      near={-100}
      far={200}
      onUpdate={(cam) => cam.lookAt(0, 0, 0)}
    />
  );
}

/** 바닥판 + 타일 격자. 격자는 단계 2에서 가구를 스냅 배치할 때의 눈금이다. */
function TileFloor() {
  return (
    <group>
      <mesh position={[0, -SLAB_H / 2, 0]} receiveShadow>
        <boxGeometry args={[SPAN, SLAB_H, SPAN]} />
        <meshStandardMaterial color="#CFC9BF" roughness={0.95} metalness={0} />
      </mesh>
      <gridHelper args={[SPAN, GRID, '#9E978B', '#BDB6AA']} position={[0, 0.002, 0]} />
    </group>
  );
}

/**
 * 스캐폴드 검증용 회색 박스.
 * 빈 바닥만 띄우면 카메라 각·그림자 방향·격자 스냅이 맞는지 볼 수가 없어서 세 개만 세워 둔다.
 * 단계 2(그레이블록)에서 실제 가구 배치로 대체된다.
 */
function ProbeBlocks() {
  const blocks: { tile: [number, number]; size: [number, number, number] }[] = [
    { tile: [-3, -3], size: [2, 2, 1] },
    { tile: [2, -1], size: [1, 1, 1] },
    { tile: [0, 3], size: [3, 0.6, 1] },
  ];

  return (
    <group>
      {blocks.map(({ tile, size }, i) => (
        <mesh key={i} position={[tile[0] * TILE, size[1] / 2, tile[1] * TILE]} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#B7B0A6" roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

export default function IsoStage() {
  return (
    <Canvas
      shadows
      // dpr 2배는 픽셀 4배 = GPU 컨텍스트 소실 위험. 여기 함부로 올리지 않는다.
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      style={{ position: 'fixed', inset: 0, background: '#E9E4DA' }}
    >
      <IsoCamera />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={SUN_POS}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        // 그림자 프러스텀 기본값(±5)은 바닥판보다 좁아 그림자가 잘린다. 판 전체를 덮게 넓힌다.
        shadow-camera-left={-SPAN}
        shadow-camera-right={SPAN}
        shadow-camera-top={SPAN}
        shadow-camera-bottom={-SPAN}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
      />

      <TileFloor />
      <ProbeBlocks />
    </Canvas>
  );
}
