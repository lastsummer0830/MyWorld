'use client';

// 정원 조립기 — 구조물·생물을 layout의 자리에 놓는다.
// 배치 좌표/회전은 layout.ts 한 곳에서만 온다. 여기선 "무엇을 어디에"만 조립한다.

import { GARDEN } from './layout';
import Pergola from './Pergola';
import TeaTable from './TeaTable';
import Pond from './Pond';
import House from './House';
import Meadow from './Meadow';
import Dog from './Dog';
import Butterflies from './Butterflies';
import type { Spot } from './layout';

function At({ spot, children }: { spot: Spot; children: React.ReactNode }) {
  return (
    <group position={[spot.pos[0], 0, spot.pos[1]]} rotation={[0, spot.rotY ?? 0, 0]}>
      {children}
    </group>
  );
}

export default function Garden() {
  return (
    <group>
      <Meadow />
      <At spot={GARDEN.pergola}>
        <Pergola />
      </At>
      <At spot={GARDEN.teaTable}>
        {/* 맥북이 놓인 진입점 — 개요 화면에서도 읽히게 조금 크게 둔다. */}
        <group scale={1.5}>
          <TeaTable />
        </group>
      </At>
      <At spot={GARDEN.pond}>
        <Pond />
      </At>
      <At spot={GARDEN.house}>
        <House />
      </At>
      <At spot={GARDEN.dog}>
        <group scale={1.3}>
          <Dog />
        </group>
      </At>
      <Butterflies />
    </group>
  );
}
