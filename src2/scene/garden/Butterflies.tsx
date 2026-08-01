'use client';

// 나비 — 강아지가 올려다보며 노는 대상. 꽃밭과 강아지 사이를 낮게 떠다닌다.
// 날개는 얇은 원뿔 2쌍, 파스텔 색. 가볍게 위아래로 흔들리고 날개를 팔랑인다(useFrame).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MAT } from '../materials';
import type { ColorKey } from '../palette';
import { mulberry32 } from './rng';
import { claimButterflySlot } from './butterflySwarm';
import { SPREAD } from './layout';

const SPOTS: { pos: [number, number, number]; color: ColorKey; phase: number }[] = (() => {
  const rand = mulberry32(451);
  const cols: ColorKey[] = ['petalPink', 'petalLav', 'petalYellow', 'petalWhite'];
  // 강아지(약 [7.5,1]) 위쪽과 오른쪽 꽃밭 부근에 모아 둔다.
  const bases: [number, number][] = [
    [7.0, 1.8],
    [8.2, 0.2],
    [6.4, 2.6],
    [11.5, 3.5],
    [12.2, -2.2],
  ];
  // 섬을 키우면서 배치를 벌렸으므로(layout.SPREAD) 나비도 같이 벌린다 —
  // 안 그러면 나비만 옛 좌표에 남아 강아지·꽃밭에서 떨어진 허공에 뜬다.
  return bases.map((b, i) => ({
    pos: [b[0] * SPREAD, 1.1 + rand() * 0.7, b[1] * SPREAD] as [number, number, number],
    color: cols[i % cols.length],
    phase: rand() * Math.PI * 2,
  }));
})();

function Butterfly({ base, color, phase }: { base: [number, number, number]; color: ColorKey; phase: number }) {
  const group = useRef<THREE.Group>(null);
  const lw = useRef<THREE.Mesh>(null);
  const rw = useRef<THREE.Mesh>(null);
  // 강아지 두뇌가 읽어 갈 자리. 렌더 트리를 거치지 않고 프레임 루프끼리 주고받는다.
  const slot = useMemo(() => claimButterflySlot(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (group.current) {
      group.current.position.y = base[1] + Math.sin(t * 1.6) * 0.22;
      group.current.position.x = base[0] + Math.sin(t * 0.7) * 0.5;
      group.current.position.z = base[2] + Math.cos(t * 0.9) * 0.5;
      group.current.rotation.y = t * 0.5;
      slot.copy(group.current.position);
    }
    const flap = Math.sin(t * 9) * 0.8 + 0.35; //  날개 접힘 각
    if (lw.current) lw.current.rotation.x = flap;
    if (rw.current) rw.current.rotation.x = -flap;
  });

  return (
    <group ref={group} position={base}>
      {/* 몸통 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT('matte', 'dogInk')}>
        <capsuleGeometry args={[0.018, 0.1, 3, 6]} />
      </mesh>
      {/* 날개 2쌍 — 몸통을 축으로 위아래로 팔랑인다 */}
      <mesh ref={lw} position={[0, 0, 0]} material={MAT('fabric', color)}>
        <coneGeometry args={[0.06, 0.16, 3]} />
      </mesh>
      <mesh ref={rw} position={[0, 0, 0]} material={MAT('fabric', color)}>
        <coneGeometry args={[0.06, 0.16, 3]} />
      </mesh>
    </group>
  );
}

export default function Butterflies() {
  return (
    <>
      {SPOTS.map((s, i) => (
        <Butterfly key={i} base={s.pos} color={s.color} phase={s.phase} />
      ))}
    </>
  );
}
