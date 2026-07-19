'use client';

// 연못 — 물 수면 + 초록 둔덕 + 연잎 + 코이 + 이를 가로지르는 나무다리.
// ★ 물은 잔디(y=0)보다 살짝 "올라온" 얕은 basin으로 만든다.
//   수면을 잔디 아래로 내리면 섬 잔디에 가려 안 보인다(그렇게 만들었다가 초록 웅덩이가 됐다).
//   그래서 초록 둔덕을 얕게 두르고, 그 안에 파란 수면을 둔덕보다 조금 높게 띄운다.

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { MAT } from '../materials';
import { mulberry32 } from './rng';

const RX = 4.2; //  수면 반경 x
const RZ = 2.9; //  수면 반경 z
const BANK_Y = 0.16; //  둔덕 윗면
const WATER_Y = 0.2; //  수면 — 둔덕보다 살짝 높아 파란 면이 드러난다
const DEEP_Y = 0.1; //  물 아래 짙은 바닥

/** 연잎 + 가끔 연꽃. */
function LilyPads() {
  const pads = useMemo(() => {
    const rand = mulberry32(310);
    const out: { x: number; z: number; s: number; flower: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const ang = rand() * Math.PI * 2;
      const rr = 0.35 + rand() * 0.5;
      out.push({ x: Math.cos(ang) * RX * rr, z: Math.sin(ang) * RZ * rr, s: 0.6 + rand() * 0.5, flower: rand() > 0.55 });
    }
    return out;
  }, []);

  return (
    <>
      {pads.map((p, i) => (
        <group key={i} position={[p.x, WATER_Y + 0.02, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, i]} material={MAT('foliage', 'lily')} receiveShadow>
            <circleGeometry args={[0.34 * p.s, 20, 0.5, Math.PI * 1.82]} />
          </mesh>
          {p.flower && (
            <mesh position={[0, 0.07, 0]} material={MAT('matte', 'petalPink')} castShadow>
              <icosahedronGeometry args={[0.1 * p.s, 0]} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

/** 코이 — 몸통(캡슐) + 꼬리. 수면 바로 아래를 맴돈다. */
function Koi() {
  const fish = useMemo(() => {
    const rand = mulberry32(77);
    return [0, 1, 2].map(() => {
      const ang = rand() * Math.PI * 2;
      const rr = 0.3 + rand() * 0.45;
      return { x: Math.cos(ang) * RX * rr, z: Math.sin(ang) * RZ * rr, rot: rand() * Math.PI * 2, pale: rand() > 0.5 };
    });
  }, []);

  return (
    <>
      {fish.map((f, i) => (
        <group key={i} position={[f.x, WATER_Y - 0.02, f.z]} rotation={[0, f.rot, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={MAT('matte', f.pale ? 'koiPale' : 'koi')}>
            <capsuleGeometry args={[0.08, 0.24, 4, 8]} />
          </mesh>
          <mesh position={[-0.22, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT('matte', f.pale ? 'koiPale' : 'koi')}>
            <coneGeometry args={[0.1, 0.18, 8, 1, true]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** 나무다리 — 물 위를 낮은 아치로 가로지른다. */
function Bridge() {
  const SPAN = RX * 2 + 1.2; //  양 둔덕에 살짝 걸치는 길이
  const W = 1.05;
  const PLANKS = 13;
  const rise = 0.24; //  아치 높이 — 낮게. 높으면 다리가 물에서 붕 뜬다.
  const baseY = WATER_Y + 0.16;

  const planks = [];
  for (let i = 0; i < PLANKS; i++) {
    const t = i / (PLANKS - 1) - 0.5;
    const x = t * SPAN;
    const y = baseY + Math.cos(t * Math.PI) * rise;
    const tilt = Math.sin(t * Math.PI) * 0.24;
    planks.push(
      <RoundedBox key={i} args={[SPAN / PLANKS + 0.16, 0.08, W]} radius={0.025} smoothness={2} position={[x, y, 0]} rotation={[0, 0, tilt]} material={MAT('matte', 'wood')} castShadow receiveShadow />,
    );
  }

  const rails = [];
  for (const side of [-1, 1]) {
    // 손잡이 기둥
    for (let i = 0; i < 6; i++) {
      const t = (i / 5 - 0.5) * 0.9;
      const x = t * SPAN;
      const y = baseY + Math.cos(t * Math.PI) * rise;
      rails.push(
        <mesh key={`p${side}-${i}`} position={[x, y + 0.28, (side * W) / 2]} material={MAT('matte', 'woodDark')} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.56, 8]} />
        </mesh>,
      );
    }
    // 손잡이 가로대 (아치 따라 완만히)
    rails.push(
      <mesh key={`h${side}`} position={[0, baseY + rise * 0.4 + 0.52, (side * W) / 2]} rotation={[0, 0, 0]} material={MAT('matte', 'woodDark')} castShadow>
        <boxGeometry args={[SPAN * 0.9, 0.05, 0.05]} />
      </mesh>,
    );
  }

  return (
    <group rotation={[0, Math.PI / 2.4, 0]}>
      {planks}
      {rails}
    </group>
  );
}

export default function Pond() {
  return (
    <group>
      {/* 초록 둔덕 — 물을 두르는 얕은 뱅크. 물보다 넓고 조금 낮다. */}
      <mesh position={[0, BANK_Y / 2, 0]} scale={[RX + 0.7, 1, RZ + 0.7]} material={MAT('foliage', 'grassEdge')} receiveShadow>
        <cylinderGeometry args={[1, 1.08, BANK_Y, 44]} />
      </mesh>
      {/* 짙은 바닥 — 반투명 수면 아래로 비쳐 깊이감을 만든다. */}
      <mesh position={[0, DEEP_Y, 0]} scale={[RX, 1, RZ]} material={MAT('matte', 'waterDeep')}>
        <cylinderGeometry args={[0.98, 0.9, 0.2, 44]} />
      </mesh>
      {/* 수면 — 둔덕보다 살짝 높아 파란 면이 드러난다. */}
      <mesh position={[0, WATER_Y - 0.05, 0]} scale={[RX, 1, RZ]} material={MAT('water', 'water')} receiveShadow>
        <cylinderGeometry args={[0.99, 0.99, 0.12, 44]} />
      </mesh>

      <LilyPads />
      <Koi />
      <Bridge />
    </group>
  );
}
