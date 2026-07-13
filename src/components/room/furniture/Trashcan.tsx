"use client";

import { POS, SIZE } from "../layout";
import { SceneItem } from "../AnimatedWrapper";
import { DELAY } from "../constants";
import { MAT } from "../materials";

function TrashcanBody() {
  const { w: BW, h: BH, d: BD } = SIZE.trashcan;

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, BH / 2, 0]}>
        <boxGeometry args={[BW, BH, BD]} />
        <meshStandardMaterial color="#2A2A2A" {...MAT.darkBody} />
      </mesh>
      {/* 뚜껑 */}
      <mesh castShadow position={[0, BH + 0.018, 0]}>
        <boxGeometry args={[BW + 0.01, 0.035, BD + 0.01]} />
        <meshStandardMaterial color="#1E1E1E" {...MAT.darkMid} />
      </mesh>
      {/* 뚜껑 버튼 */}
      <mesh position={[0, BH + 0.04, 0]}>
        <boxGeometry args={[BW * 0.4, 0.018, BD * 0.3]} />
        <meshStandardMaterial color="#333333" {...MAT.darkBody} />
      </mesh>
      {/* 페달 */}
      <mesh position={[0, 0.025, BD / 2 + 0.025]} castShadow>
        <boxGeometry args={[BW * 0.55, 0.018, 0.06]} />
        <meshStandardMaterial color="#1A1A1A" {...MAT.darkMid} />
      </mesh>
      {/* 앞면 세로 라인 */}
      {([-BW * 0.28, BW * 0.28] as number[]).map((x, i) => (
        <mesh key={i} position={[x, BH * 0.5, BD / 2 + 0.001]}>
          <boxGeometry args={[0.006, BH * 0.75, 0.002]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.3} />
        </mesh>
      ))}
      {/* 손잡이 */}
      <mesh position={[0, BH * 0.82, -BD / 2 - 0.012]} castShadow>
        <boxGeometry args={[BW * 0.35, 0.022, 0.018]} />
        <meshStandardMaterial color="#333333" {...MAT.darkMid} />
      </mesh>
    </group>
  );
}

export default function Trashcan() {
  const { w, h, d } = SIZE.trashcan;
  return (
    <SceneItem
      delay={DELAY.desk + 0.5}
      position={POS.trashcan}
      liftHeight={0.04}
      hitbox={[w + 0.08, h + 0.08, d + 0.08]}
      hitboxPos={[0, h / 2, 0]}
    >
      <TrashcanBody />
    </SceneItem>
  );
}
