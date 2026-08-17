'use client';

// AJP-004 · prop capability eval — 물뿌리개 메시.
//
// 부재마다 mesh 를 나누는 이유는 장식이 아니라 **값 구분**이다.
// 굽/배/아가리/안쪽이 같은 재질 하나로 묶이면 회전체가 한 덩어리로 뭉개져
// 벽 두께도 구멍도 읽히지 않는다. 재질은 전부 무광 비금속이다.
//
// 파일명이 `WateringCanView` 인 이유: 부재 그래프 모듈이 `wateringCan.ts` 라
// 대소문자를 구분하지 않는 파일시스템(Windows 마운트)에서 `./WateringCan` 이
// 그쪽으로 해석돼 빌드가 깨진다. 모듈 이름만 구분하고 조형은 그대로다.

import * as THREE from 'three';
import { FLAT } from './palette';
import type { CanPart } from './wateringCan';

export default function WateringCanView({ parts, flat }: { parts: CanPart[]; flat: boolean }) {
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
