"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { PhaseGroup } from "../room/AnimatedWrapper";
import { LOW_END_DEVICE } from "@/components/room/Performance";

// 꽃잎 색상 5종 — 코랄 / 옐로우 / 라벤더 / 화이트 / 핑크
const PETAL_COLORS = ["#FF7F6E", "#FFD44D", "#B79CE4", "#FFFFFF", "#FF9EC4"] as const;

const FLOWER_COUNT = LOW_END_DEVICE ? 60 : 120;

interface FlowerFieldProps {
  patches:    [number, number, number][]; // 군락 중심 (x, z, 반경)
  baseDelay?: number;
}

// 꽃밭 — 줄기 1 + 색상별 꽃송이 5 = 총 6 draw call (instancedMesh)
export default function FlowerField({ patches, baseDelay = 0 }: FlowerFieldProps) {
  const stemRef  = useRef<THREE.InstancedMesh>(null!);
  const headRefs = useRef<(THREE.InstancedMesh | null)[]>(Array(PETAL_COLORS.length).fill(null));

  // 꽃 데이터 생성 — 군락별로 랜덤 분포
  const flowers = useMemo(() => {
    const list: { x: number; z: number; scale: number; color: number }[] = [];
    for (let i = 0; i < FLOWER_COUNT; i++) {
      const [cx, cz, r] = patches[i % patches.length];
      const a    = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * r;
      list.push({
        x:     cx + Math.cos(a) * dist,
        z:     cz + Math.sin(a) * dist,
        scale: 0.7 + Math.random() * 0.6,
        color: Math.floor(Math.random() * PETAL_COLORS.length),
      });
    }
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 색상별 인덱스 분류 (색상 그룹당 instancedMesh 1개)
  const byColor = useMemo(() => {
    const groups: number[][] = PETAL_COLORS.map(() => []);
    flowers.forEach((f, i) => groups[f.color].push(i));
    return groups;
  }, [flowers]);

  // 인스턴스 행렬 설정 (마운트 후 1회)
  useEffect(() => {
    if (!stemRef.current) return;
    const dummy = new THREE.Object3D();

    // 줄기
    flowers.forEach((f, i) => {
      dummy.position.set(f.x, 0.16 * f.scale, f.z);
      dummy.scale.setScalar(f.scale);
      dummy.updateMatrix();
      stemRef.current.setMatrixAt(i, dummy.matrix);
    });
    stemRef.current.instanceMatrix.needsUpdate = true;

    // 꽃송이 (색상 그룹별)
    byColor.forEach((idxList, c) => {
      const mesh = headRefs.current[c];
      if (!mesh) return;
      idxList.forEach((fi, j) => {
        const f = flowers[fi];
        dummy.position.set(f.x, 0.34 * f.scale, f.z);
        dummy.scale.set(f.scale, f.scale * 0.65, f.scale); // 살짝 납작한 꽃송이
        dummy.updateMatrix();
        mesh.setMatrixAt(j, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [flowers, byColor]);

  return (
    <PhaseGroup delay={baseDelay}>
      {/* 줄기 — 1 draw call */}
      <instancedMesh ref={stemRef} args={[undefined, undefined, flowers.length]}>
        <cylinderGeometry args={[0.015, 0.022, 0.32, 4]} />
        <meshStandardMaterial color="#4E8C3C" roughness={0.9} />
      </instancedMesh>

      {/* 꽃송이 — 색상별 1 draw call */}
      {PETAL_COLORS.map((color, c) => (
        <instancedMesh
          key={color}
          ref={(el) => { headRefs.current[c] = el; }}
          args={[undefined, undefined, byColor[c].length]}
        >
          <sphereGeometry args={[0.10, 6, 5]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.15}
            roughness={0.7}
          />
        </instancedMesh>
      ))}
    </PhaseGroup>
  );
}
