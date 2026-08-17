"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { DOG_SKILL_ON_PARTS } from "./dogSkillOnAnatomy";
import { buildSectionSolid } from "./sectionSolid";

type DogSkillOnScaffoldProps = {
  /** Silhouette mode: unlit single-value fill instead of shaded neutral clay. */
  flat: boolean;
};

/**
 * Stage-1 untextured anatomy scaffold. Every mass uses the same single-value
 * material: no markings, no coat colour, no face materials at this stage.
 */
export function DogSkillOnScaffold({ flat }: DogSkillOnScaffoldProps) {
  const parts = useMemo(
    () =>
      DOG_SKILL_ON_PARTS.map((part) => ({
        id: part.id,
        geometry: buildSectionSolid(part.sections, part.options),
      })),
    [],
  );

  const shaded = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c6c9cd",
        roughness: 0.88,
        metalness: 0,
        flatShading: true,
      }),
    [],
  );

  const silhouette = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#14181d" }),
    [],
  );

  useEffect(
    () => () => {
      parts.forEach((part) => part.geometry.dispose());
      shaded.dispose();
      silhouette.dispose();
    },
    [parts, shaded, silhouette],
  );

  const material = flat ? silhouette : shaded;

  return (
    <group>
      {parts.map((part) => (
        <mesh
          key={part.id}
          name={part.id}
          geometry={part.geometry}
          material={material}
          castShadow={!flat}
          receiveShadow={!flat}
        />
      ))}
    </group>
  );
}
