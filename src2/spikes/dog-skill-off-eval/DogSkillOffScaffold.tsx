"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { buildDogParts } from "./anatomy";

/**
 * Stage-1 scaffold render: every anatomical mass in one neutral single value.
 * No eyes, no nose material, no markings, no coat colour, no strands, no
 * animation. Silhouette and mass placement are the only things being judged.
 */
export function DogSkillOffScaffold({ flat }: { flat: boolean }) {
  const parts = useMemo(() => buildDogParts(), []);

  const material = useMemo(() => {
    if (flat) {
      return new THREE.MeshBasicMaterial({ color: "#2e3237" });
    }
    return new THREE.MeshStandardMaterial({
      color: "#c8cbd0",
      roughness: 0.92,
      metalness: 0,
    });
  }, [flat]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(
    () => () => {
      for (const part of parts) part.geometry.dispose();
    },
    [parts],
  );

  return (
    <group name="dog-skill-off-stage-1">
      {parts.map((part) => (
        <mesh
          key={part.name}
          name={part.name}
          geometry={part.geometry}
          material={material}
          castShadow={!flat}
          receiveShadow={!flat}
        />
      ))}
    </group>
  );
}

export default DogSkillOffScaffold;
