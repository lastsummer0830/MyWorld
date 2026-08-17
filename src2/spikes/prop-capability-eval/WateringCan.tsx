'use client';

// AJP-004 · prop capability eval — 물뿌리개 메시.
//
// 부재마다 mesh 를 나누는 이유는 장식이 아니라 **값 구분**이다.
// 굽/배/아가리/안쪽이 같은 재질 하나로 묶이면 회전체가 한 덩어리로 뭉개져
// 벽 두께도 구멍도 읽히지 않는다. 재질은 전부 무광 비금속이다.

import * as THREE from 'three';
import { FLAT } from './palette';
import type { CanPart } from './wateringCan';

export default function WateringCan({ parts, flat }: { parts: CanPart[]; flat: boolean }) {
  return (
    <group>
      {parts.map((part) => {
        const side = part.open ? THREE.DoubleSide : THREE.FrontSide;
        return (
          <mesh key={part.key} geometry={part.geometry} castShadow receiveShadow>
            {flat ? (
              <meshBasicMaterial color={FLAT.body} side={side} />
            ) : (
              <meshStandardMaterial color={part.color} roughness={0.87} metalness={0} side={side} />
            )}
          </mesh>
        );
      })}
    </group>
  );
}
