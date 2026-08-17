import * as THREE from "three";

/**
 * Swept cross-section solid builder for the Skill-OFF stage-1 anatomy scaffold.
 *
 * Every anatomical mass is authored as an explicit list of cross-sections that
 * are swept along their own path. This is deliberately NOT a primitive capsule
 * / cone / box kit: each section carries independent lateral half-extent,
 * vertical half-extent, superellipse roundness and top/bottom lateral bias, so
 * a ribcage can be pear-shaped, a skull can be a flat-crowned wedge and a paw
 * can have a flat contact pad.
 */
export type Section = {
  /** Section centre in model space. */
  at: readonly [number, number, number];
  /** Half extent along the frame side axis. */
  a: number;
  /** Half extent along the frame up axis. */
  b: number;
  /** Superellipse exponent. 2 = ellipse, >2 = boxier, <2 = diamond. */
  roundness?: number;
  /** Lateral scale applied at the top of the section (b = +b). */
  topScale?: number;
  /** Lateral scale applied at the bottom of the section (b = -b). */
  bottomScale?: number;
  /** Rotation of the section about its path tangent, in radians. */
  roll?: number;
};

export type SolidOptions = {
  /** Radial samples per section. */
  segments?: number;
  /**
   * Reference axis used to build the section frame. Use [0,1,0] for paths that
   * run mostly horizontally and [1,0,0] for paths that run mostly vertically,
   * so `a` always stays lateral and `b` always stays the in-profile axis.
   */
  frameUp?: readonly [number, number, number];
};

const EPS = 1e-8;

function superellipse(t: number, section: Section): [number, number] {
  const roundness = section.roundness ?? 2;
  const exponent = 2 / roundness;
  const c = Math.cos(t);
  const s = Math.sin(t);

  let px = Math.sign(c) * Math.abs(c) ** exponent * section.a;
  const py = Math.sign(s) * Math.abs(s) ** exponent * section.b;

  const topScale = section.topScale ?? 1;
  const bottomScale = section.bottomScale ?? 1;
  if (topScale !== 1 || bottomScale !== 1) {
    const yn = section.b === 0 ? 0 : py / section.b;
    const bias = yn >= 0 ? 1 + (topScale - 1) * yn : 1 + (bottomScale - 1) * -yn;
    px *= bias;
  }

  return [px, py];
}

/**
 * Build a closed solid by sweeping `sections` along the polyline they define.
 *
 * Winding is authored so that face normals point outward: the side quads use
 * (ring_i[j], ring_i+1[j], ring_i+1[j+1]) and the two caps fan in opposite
 * directions. Normals are smoothed across the whole solid.
 */
export function buildSectionSolid(
  sections: readonly Section[],
  options: SolidOptions = {},
): THREE.BufferGeometry {
  if (sections.length < 2) {
    throw new Error("buildSectionSolid needs at least two sections");
  }

  const segments = options.segments ?? 16;
  const hint = options.frameUp ?? [0, 1, 0];
  const frameUp = new THREE.Vector3(hint[0], hint[1], hint[2]).normalize();
  const fallbackUp = new THREE.Vector3(0, 0, 1);

  const count = sections.length;
  const centres = sections.map(
    (s) => new THREE.Vector3(s.at[0], s.at[1], s.at[2]),
  );

  const tangents = centres.map((_, i) => {
    const prev = centres[Math.max(0, i - 1)];
    const next = centres[Math.min(count - 1, i + 1)];
    const t = next.clone().sub(prev);
    if (t.lengthSq() < EPS) t.set(1, 0, 0);
    return t.normalize();
  });

  const positions: number[] = [];
  const indices: number[] = [];

  const side = new THREE.Vector3();
  const up = new THREE.Vector3();
  const point = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const section = sections[i];
    const tangent = tangents[i];

    side.copy(tangent).cross(frameUp);
    if (side.lengthSq() < EPS) side.copy(tangent).cross(fallbackUp);
    side.normalize();
    up.copy(side).cross(tangent).normalize();

    const roll = section.roll ?? 0;
    if (roll !== 0) {
      side.applyAxisAngle(tangent, roll);
      up.applyAxisAngle(tangent, roll);
    }

    for (let j = 0; j < segments; j += 1) {
      const theta = (j / segments) * Math.PI * 2;
      const [px, py] = superellipse(theta, section);
      point
        .copy(centres[i])
        .addScaledVector(side, px)
        .addScaledVector(up, py);
      positions.push(point.x, point.y, point.z);
    }
  }

  for (let i = 0; i < count - 1; i += 1) {
    for (let j = 0; j < segments; j += 1) {
      const jNext = (j + 1) % segments;
      const a0 = i * segments + j;
      const b0 = i * segments + jNext;
      const a1 = (i + 1) * segments + j;
      const b1 = (i + 1) * segments + jNext;
      indices.push(a0, a1, b1, a0, b1, b0);
    }
  }

  const startCentre = positions.length / 3;
  positions.push(centres[0].x, centres[0].y, centres[0].z);
  for (let j = 0; j < segments; j += 1) {
    indices.push(startCentre, j, (j + 1) % segments);
  }

  const endRing = (count - 1) * segments;
  const endCentre = positions.length / 3;
  const last = centres[count - 1];
  positions.push(last.x, last.y, last.z);
  for (let j = 0; j < segments; j += 1) {
    indices.push(endCentre, endRing + ((j + 1) % segments), endRing + j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

/**
 * Mirror a solid across the Z = 0 plane, restoring outward winding.
 * Used to derive the left limb / ear / coat masses from the authored right side.
 */
export function mirrorZ(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const mirrored = geometry.clone();
  const position = mirrored.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, -position.getZ(i));
  }
  position.needsUpdate = true;

  const index = mirrored.getIndex();
  if (index) {
    const array = index.array as ArrayLike<number>;
    const flipped: number[] = new Array(array.length);
    for (let i = 0; i < array.length; i += 3) {
      flipped[i] = array[i];
      flipped[i + 1] = array[i + 2];
      flipped[i + 2] = array[i + 1];
    }
    mirrored.setIndex(flipped);
  }

  mirrored.computeVertexNormals();
  mirrored.computeBoundingBox();
  return mirrored;
}
