'use client';

// 금빛 부유물 — 햇살 속에 떠다니는 꽃가루·먼지.
// 밤의 반딧불이에 대응하는 "낮의 반짝임"이다. 이게 없으면 공기가 텅 빈 진공처럼 보인다.
//
// ★ 반딧불이와 다른 점: 반딧불이는 스스로 빛나는 광원이고, 이것은 햇빛을 받아 반짝이는 먼지다.
//   그래서 밤이 되면 사라진다(빛이 없으면 먼지도 안 보인다). 두 요소가 낮/밤에 서로 자리를 넘겨준다.
//
// 개수가 많아 InstancedMesh로 한 번에 그린다. 낱개 mesh로 뿌리면 draw call이 개수만큼 늘어난다.

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ISLAND_R } from './constants';
import { COLOR } from './palette';

const COUNT = 90;
const TOP = 11; //  떠오를 수 있는 최대 높이

type Mote = { x: number; z: number; y0: number; rise: number; phase: number; sway: number; size: number };

export default function Motes({ nightRef }: { nightRef: React.RefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR.mote),
        // 조명 계산을 거치지 않아야 "빛나는 티끌"로 보인다. Bloom이 이 밝기를 집어내 부드럽게 번지게 한다.
        toneMapped: false,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    [],
  );

  const motes = useMemo<Mote[]>(() => {
    let s = 77113;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    // 섬 위에 고르게. sqrt를 씌우지 않으면 중심에 몰린다.
    return Array.from({ length: COUNT }, () => {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * ISLAND_R * 1.05;
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        y0: rand() * TOP,
        rise: 0.12 + rand() * 0.3, //  아주 느리게 떠오른다
        phase: rand() * Math.PI * 2,
        sway: 0.3 + rand() * 0.9,
        // ★ 실제 꽃가루 크기(수 cm)로 만들면 화면에서 1픽셀이라 아예 안 보인다.
        //   44m 섬이 화면 폭 850px이면 1m ≈ 19px — 즉 반지름 0.1m는 되어야 겨우 4px이다.
        size: 0.09 + rand() * 0.15,
      };
    });
  }, []);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const day = 1 - nightRef.current;

    mat.opacity = day * 0.75;
    // 밤에는 통째로 숨긴다 — 투명해도 90개를 계속 그리는 건 낭비다.
    m.visible = day > 0.02;
    if (!m.visible) return;

    for (let i = 0; i < COUNT; i++) {
      const p = motes[i];
      // 천천히 떠올랐다가 꼭대기에서 아래로 되돌아온다(나머지 연산). 위로만 흐르면 곧 화면 밖으로 사라진다.
      const y = (p.y0 + t * p.rise) % TOP;
      dummy.position.set(
        p.x + Math.sin(t * 0.3 + p.phase) * p.sway,
        y,
        p.z + Math.cos(t * 0.22 + p.phase) * p.sway,
      );
      // 반짝임 — 먼지가 빛의 각도에 따라 번쩍이는 것. 위상이 제각각이어야 살아 있는 공기가 된다.
      const twinkle = 0.45 + 0.55 * Math.sin(t * 1.7 + p.phase * 4);
      dummy.scale.setScalar(p.size * twinkle);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} material={mat} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
    </instancedMesh>
  );
}
