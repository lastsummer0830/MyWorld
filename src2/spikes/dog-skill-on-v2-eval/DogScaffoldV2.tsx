'use client';

// AJP-004 · Skill-ON v2 · stage-1 — scaffold mesh 하나.
//
// stage-1 은 "중성 단일 값" 이다. vertex color 도, 재질 가족도, 눈/코/입/마킹도 없다.
// 형태가 스스로 종(種)을 말해야 하고, 못 하면 그건 재질로 가릴 문제가 아니다.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { buildDogScaffoldV2 } from './scaffold';

type Props = {
  color: string;
  /** true = 무광 실루엣(빛 무시), false = 중성 clay(면·접합 확인) */
  flat: boolean;
};

export default function DogScaffoldV2({ color, flat }: Props) {
  const geometry = useMemo(() => buildDogScaffoldV2(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      {flat ? (
        // 실루엣 모드: 조명이 없으니 윤곽 외의 정보가 남지 않는다.
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      ) : (
        // clay 모드: flatShading 으로 authored plane 이 그대로 보이게 한다.
        <meshStandardMaterial
          color={color}
          roughness={0.94}
          metalness={0}
          flatShading
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}
