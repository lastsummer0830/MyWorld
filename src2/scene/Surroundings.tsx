'use client';

// 무대 "바깥" 세계 — 정원 섬이 허공에 덩그러니 뜬 게 아니라 넓은 하늘 한복판에 있게 만든다.
// 구성: 멀리 떠다니는 작은 섬들 + 구름. (섬의 밑동은 Island.tsx가 가진다.)
//
// ★★ 직교(ortho) 카메라에는 원근이 없다 — 멀리 둬도 작아지지 않는다.
//   원근 카메라라면 100m 밖 섬은 알아서 작게 보이지만, 직교에서는 100m 밖이든 10m 밖이든 같은 크기로 그려진다.
//   그래서 "멀리 밀고 크게 만든다"는 통하지 않는다(그렇게 짰다가 배경 섬이 거대한 회색 원뿔로 화면을 덮었다).
//   → 원경은 **실제로 작게 만들고**(주인공 섬의 1/6~1/15), **안개로 흐려서** 멀어 보이게 한다.
//
// 원경은 그림자를 만들지도 받지도 않는다 — 비용만 들고 보이지 않는다.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLAND_R } from './constants';
import { COLOR, moodColor } from './palette';
import { MAT } from './materials';

/** 섬의 지름 — 바깥 세계의 거리는 전부 이 값의 배수로 잡는다. */
const D = ISLAND_R * 2;

/** 결정적 난수 — Math.random을 쓰면 리렌더마다 섬이 순간이동한다. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 흙 위에 잔디 뚜껑을 덮은 작은 부유섬. 주인공 섬의 축소판이라 같은 문법으로 읽힌다. */
function Islet({ pos, r, h }: { pos: [number, number, number]; r: number; h: number }) {
  return (
    <group position={pos}>
      <mesh material={MAT('foliage', 'grassEdge')}>
        <cylinderGeometry args={[r, r * 0.92, 0.35, 7]} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.15, 0]} rotation={[Math.PI, 0, 0]} material={MAT('rock', 'rock')}>
        <coneGeometry args={[r * 0.92, h, 6, 1]} />
      </mesh>
      <mesh position={[r * 0.25, 0.85, 0]} material={MAT('foliage', 'grass')}>
        <coneGeometry args={[r * 0.42, 1.4, 6]} />
      </mesh>
    </group>
  );
}

/**
 * 구름 무리 — 뭉게구름 여러 덩이를 instancedMesh 하나로 그린다.
 *
 * ★ 덩이마다 blob 배치를 새로 뽑는다. 예전엔 blob 배열이 상수라 18덩이가 전부 같은 모양이었고,
 *   그 반복이 눈에 그대로 보였다("조잡한 구름"). 사람 눈은 반복을 제일 먼저 잡아낸다.
 * ★ 크기는 이 파일 맨 위 규칙(주인공 섬의 1/6~1/15)을 따른다. 예전 구름은 최대 23m까지 부풀어
 *   섬(44m)의 절반이었다 — 직교라 멀리 둬도 안 작아지니 배경이 주인공만 해졌다.
 * ★ 구름은 가로로 퍼진다. 구를 그대로 쓰면 공 뭉치로 읽히므로 세로로 눌러 준다.
 */
const CLOUD_COUNT = 18;

/** 세로로 누르는 비율 — 구름은 공이 아니라 가로로 퍼진 덩어리다. */
const SQUASH = 0.58;

/**
 * 덩이 하나의 blob들 — 로컬 좌표(가로 지름 ≈ 3.5)와 반지름.
 *
 * ★ 뭉게구름의 핵심은 "바닥이 평평하고 위가 봉긋"이다. 수증기가 이슬점 고도에서 응결하기 때문에
 *   바닥 높이가 가지런하다. 이 단서가 없으면 그냥 공 뭉치로 읽힌다.
 *   → 각 blob의 **밑면을 같은 높이에 맞춘다**(y = r*SQUASH). 중앙일수록 위로 더 부풀린다.
 * ★ 한 줄로 늘어놓지 말 것. 예전엔 x축 위에 나란히 굴려놔서 소금빵이 됐다.
 *   → x·z **평면(원반)에 흩는다.**
 */
function makeBlobs(rand: () => number) {
  const n = 7 + Math.floor(rand() * 5); // 7~11개
  return Array.from({ length: n }, () => {
    // 원반 위에 고르게 흩기 (sqrt를 씌워야 가장자리로 몰리지 않는다)
    const a = rand() * Math.PI * 2;
    const rad = Math.sqrt(rand());
    const centerness = 1 - rad;
    const r = 0.26 + centerness * 0.34 + rand() * 0.12;
    return {
      x: Math.cos(a) * rad,
      z: Math.sin(a) * rad * 0.75, // z를 살짝 좁혀 옆에서 봐도 넓적하게
      // 밑면 정렬 + 중앙 봉긋 + 아주 약한 흔들림(완벽히 평평하면 인공물로 보인다)
      y: r * SQUASH + centerness * 0.2 + (rand() - 0.5) * 0.05,
      r,
    };
  });
}

function Clouds({ material }: { material: THREE.Material }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  // 각 blob의 최종 정보를 미리 굽는다 — useFrame에서는 위치만 더한다(객체 생성 금지).
  const { blobs, count } = useMemo(() => {
    const rand = seeded(9911);
    const out: { base: THREE.Vector3; r: number; cloud: number; drift: number; phase: number }[] = [];

    for (let c = 0; c < CLOUD_COUNT; c++) {
      const a = rand() * Math.PI * 2;
      const dist = D * 1.6 + rand() * D * 3.0;
      const cx = Math.cos(a) * dist;
      const cy = -38 + rand() * 68;
      const cz = Math.sin(a) * dist;

      // 가로 지름 3.2~7.2m = 섬(44m)의 1/13 ~ 1/6. 규칙 안쪽.
      const size = (1.6 + rand() * 2.0) / 2;
      const rotY = rand() * Math.PI * 2; // 덩이마다 다른 방향 → 같은 실루엣이 반복되지 않는다
      const flat = 0.5 + rand() * 0.12;  // 세로로 눌러 구름 모양으로
      const drift = 0.03 + rand() * 0.05;
      const phase = rand() * Math.PI * 2;

      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);

      for (const b of makeBlobs(rand)) {
        const lx = b.x * size;
        const lz = b.z * size;
        out.push({
          base: new THREE.Vector3(
            cx + lx * cos - lz * sin,
            cy + b.y * size * flat,
            cz + lx * sin + lz * cos,
          ),
          r: b.r * size,
          cloud: c,
          drift,
          phase,
        });
      }
    }
    return { blobs: out, count: out.length };
  }, []);

  // useFrame 안에서 새로 만들지 않도록 임시 객체를 미리 잡아 둔다.
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }),
    [],
  );

  useFrame((state) => {
    const im = mesh.current;
    if (!im) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      // 좌우로 아주 느리게 흐른다. 완전히 멈춰 있으면 배경이 죽은 그림처럼 보인다.
      const dx = Math.sin(t * b.drift + b.phase) * 6;
      tmp.p.set(b.base.x + dx, b.base.y, b.base.z);
      // 세로로 눌러 둔다 — 구름은 공이 아니라 가로로 퍼진 덩어리다.
      tmp.s.set(b.r, b.r * 0.62, b.r);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      im.setMatrixAt(i, tmp.m);
    }
    im.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={material} frustumCulled={false}>
      {/* 화면상 지름이 20~40px 수준이라 이 정도 분할이면 각진 티가 안 난다. */}
      <sphereGeometry args={[1, 14, 10]} />
    </instancedMesh>
  );
}

export default function Surroundings({ nightRef }: { nightRef: React.RefObject<number> }) {
  // 구름 전부가 이 재질 하나를 공유한다 — 그래야 낮/밤 색이 한 번에 바뀐다.
  // (MAT 캐시를 쓰지 않는 이유: 이 재질은 매 프레임 색이 바뀌는 특수 재질이다.)
  const cloudMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLOR.metalWhite, roughness: 1, metalness: 0 }),
    [],
  );

  useFrame(() => {
    moodColor(cloudMat.color, 'cloud', nightRef.current);
  });

  const islets = useMemo(() => {
    const rand = seeded(20260714);
    return Array.from({ length: 10 }, () => {
      const a = rand() * Math.PI * 2;
      const dist = D * 2.0 + rand() * D * 2.6;
      // ★ 반지름 1.5~4m. 주인공 섬(22m)의 1/6~1/15밖에 안 된다 — 이렇게 작게 만들어야 "멀리 있는 것"으로 읽힌다.
      const r = 1.5 + rand() * 2.5;
      return {
        // 아래로 깔아 둔다. 주인공 섬보다 낮은 데 떠 있어야 "이 섬이 제일 높다"는 인상이 생긴다.
        pos: [Math.cos(a) * dist, -26 - rand() * 44, Math.sin(a) * dist] as [number, number, number],
        r,
        h: r * (2 + rand() * 1.6),
      };
    });
  }, []);

  return (
    <group>
      {islets.map((isle, i) => (
        <Islet key={`i${i}`} {...isle} />
      ))}
      <Clouds material={cloudMat} />
    </group>
  );
}
