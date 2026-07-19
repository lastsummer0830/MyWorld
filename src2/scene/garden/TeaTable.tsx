'use client';

// 비스트로 티테이블 — 흰 주철 원형 테이블 + 의자 2개 + 맥북.
// ★ 맥북이 이 정원의 "포트폴리오 진입점"이다. (방·책상·모니터가 통째로 불필요해진다)
//   화면에 실제 포트폴리오를 렌더하는 것은 단계 6(렌더타겟). 지금은 켜진 화면으로 읽히게만 한다.

import { RoundedBox } from '@react-three/drei';
import { MAT } from '../materials';

const TOP_Y = 0.72; //  테이블 높이
const TOP_R = 0.56; //  상판 반지름

const white = () => MAT('glossy', 'metalWhite');

/** 흰 주철 의자 하나. */
function Chair({ pos, rotY }: { pos: [number, number]; rotY: number }) {
  const seatY = 0.44;
  return (
    <group position={[pos[0], 0, pos[1]]} rotation={[0, rotY, 0]}>
      {/* 좌판 */}
      <mesh position={[0, seatY, 0]} material={white()} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.05, 20]} />
      </mesh>
      {/* 쿠션 */}
      <mesh position={[0, seatY + 0.045, 0]} material={MAT('fabric', 'fabric')} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 20]} />
      </mesh>
      {/* 등받이 — 살짝 뒤로 눕힌 부채 */}
      <mesh position={[0, seatY + 0.28, -0.19]} rotation={[-0.18, 0, 0]} material={white()} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.34, 16, 1, true, Math.PI * 0.15, Math.PI * 0.7]} />
      </mesh>
      {/* 다리 3개 */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.15, seatY / 2, Math.sin(a) * 0.15]}
            rotation={[Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16]}
            material={white()}
            castShadow
          >
            <cylinderGeometry args={[0.018, 0.018, seatY, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 맥북 — 켜진 화면. */
function MacBook() {
  const bw = 0.34; //  본체 폭
  const bd = 0.24; //  본체 깊이
  return (
    <group position={[0, TOP_Y + 0.03, 0.02]} rotation={[0, -0.5, 0]}>
      {/* 하판(키보드 데크) */}
      <RoundedBox args={[bw, 0.016, bd]} radius={0.008} smoothness={2} material={MAT('glossy', 'metalWhite')} castShadow />
      {/* 화면 — 뒤로 젖혀 세운다 */}
      <group position={[0, 0, -bd / 2]} rotation={[-1.9, 0, 0]}>
        {/* 화면 등짝 */}
        <RoundedBox args={[bw, bd * 0.92, 0.012]} radius={0.008} smoothness={2} position={[0, bd * 0.46, 0]} material={MAT('glossy', 'metalWhite')} castShadow />
        {/* 켜진 화면 패널 — 자체 발광이라 "켜져 있다"로 읽힌다. 밤엔 더 밝게. */}
        <mesh position={[0, bd * 0.46, 0.008]} material={MAT('glow', 'screen', { dayGlow: 0.5, nightGlow: 1.4 })}>
          <planeGeometry args={[bw * 0.88, bd * 0.78]} />
        </mesh>
      </group>
    </group>
  );
}

export default function TeaTable() {
  return (
    <group>
      {/* 상판 */}
      <mesh position={[0, TOP_Y, 0]} material={white()} castShadow receiveShadow>
        <cylinderGeometry args={[TOP_R, TOP_R, 0.05, 32]} />
      </mesh>
      {/* 상판 테두리 몰딩 */}
      <mesh position={[0, TOP_Y - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={white()} castShadow>
        <torusGeometry args={[TOP_R - 0.03, 0.03, 10, 32]} />
      </mesh>
      {/* 기둥 다리 */}
      <mesh position={[0, TOP_Y / 2, 0]} material={white()} castShadow>
        <cylinderGeometry args={[0.045, 0.055, TOP_Y - 0.05, 16]} />
      </mesh>
      {/* 삼각 받침 발 */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.16, 0.05, Math.sin(a) * 0.16]}
            rotation={[0, -a, 0.5]}
            material={white()}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.03, 0.02, 0.4, 10]} />
          </mesh>
        );
      })}

      <MacBook />
      <Chair pos={[0.02, 0.92]} rotY={Math.PI} />
      <Chair pos={[-0.7, -0.55]} rotY={0.7} />
    </group>
  );
}
