'use client';

// AJP-004 dog capability eval — STAGE 1 조립 (무텍스처 해부 스캐폴드).
//
// pass 1 폐기 사유: 코끝~꼬리를 단일 loft 한 장으로 이어 종이 사라졌다.
// 그래서 여기서는 **부위별 덩어리를 겹쳐서만** 몸을 만든다. 잇는 중심선이 존재하지 않는다.
// (`mass.ts`에는 덩어리를 봉합하는 함수 자체가 없다.)
//
// STAGE 1에 **없어야 하는 것**: 눈, 코 재질, 무늬, 정점 색, 털 결, 애니메이션,
// 밤 모드, 블룸, 안개, 파티클, 제품 씬 연동. 있으면 그 자체로 단계 위반이다.
// 자세는 중립 기립 하나뿐 — 자세로 해부를 가리지 않는다.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { massGeometry } from './mass';
import { CORE_PARTS, EAR_PARTS, EAR_PLACE, sideParts, type Side } from './scaffoldAnatomy';
import { FLAT, SCAFFOLD } from './scaffoldPalette';

function buildParts() {
  const core = CORE_PARTS.map((p) => ({ name: p.name, geometry: massGeometry(p.spec) }));
  const sides = ([1, -1] as Side[]).map((s) => ({
    side: s,
    parts: sideParts(s).map((p) => ({ name: p.name, geometry: massGeometry(p.spec) })),
  }));
  // 귀는 로컬 좌표(밑동 원점, 위 +y)로 굽고 배치는 group이 한다.
  const ear = EAR_PARTS.map((p) => ({ name: p.name, geometry: massGeometry(p.spec) }));

  const all = [
    ...core.map((p) => p.geometry),
    ...sides.flatMap((s) => s.parts.map((p) => p.geometry)),
    ...ear.map((p) => p.geometry),
  ];

  return { core, sides, ear, all };
}

export default function DogSample({ flat }: { flat: boolean }) {
  const parts = useMemo(() => buildParts(), []);

  const material = useMemo(
    () =>
      flat
        ? new THREE.MeshBasicMaterial({ color: FLAT.body })
        : new THREE.MeshStandardMaterial({
            color: SCAFFOLD.anatomy,
            roughness: 1,
            metalness: 0,
            flatShading: true,
          }),
    [flat],
  );

  useEffect(() => () => parts.all.forEach((g) => g.dispose()), [parts]);
  useEffect(() => () => material.dispose(), [material]);

  const shadow = !flat;

  return (
    <group>
      {parts.core.map((p) => (
        <mesh key={p.name} name={p.name} geometry={p.geometry} material={material} castShadow={shadow} />
      ))}

      {parts.sides.map(({ side, parts: list }) =>
        list.map((p) => (
          <mesh
            key={`${p.name}:${side}`}
            name={`${p.name}:${side > 0 ? 'r' : 'l'}`}
            geometry={p.geometry}
            material={material}
            castShadow={shadow}
          />
        )),
      )}

      {/* 귀: 좌우로 눕히는 회전만 group이 준다. 앞접힘은 지오메트리 축이 이미 갖고 있다. */}
      {([1, -1] as Side[]).map((s) => (
        <group
          key={`ear:${s}`}
          position={[EAR_PLACE.position[0], EAR_PLACE.position[1], s * EAR_PLACE.z]}
          rotation={[s * EAR_PLACE.tilt, 0, 0]}
        >
          {parts.ear.map((p) => (
            <mesh
              key={p.name}
              name={`${p.name}:${s > 0 ? 'r' : 'l'}`}
              geometry={p.geometry}
              material={material}
              castShadow={shadow}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
