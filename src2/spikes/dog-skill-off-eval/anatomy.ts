import * as THREE from "three";

import {
  buildSectionSolid,
  mirrorZ,
  type Section,
  type SolidOptions,
} from "./sectionSolid";

/**
 * Skill-OFF stage-1 anatomy scaffold: blue-merle Shetland Sheepdog.
 *
 * Reference authority: the RIGHT-HAND real pet photo in
 * Pick/2026-08-01_비교_모델vs사진.png. The left-hand model in that image and
 * Pick/2026-08-01_강아지_4면도.png are rejected failure evidence only.
 *
 * Model space
 *   +X  forward (muzzle)          +Y  up (ground plane at y = 0)
 *   +Z  the dog's own right side  -Z  the dog's own left side
 *
 * Scale: 1.0 unit = height at the withers under the coat.
 *
 * Landmarks driving every number below:
 *   withers 1.00 | elbow 0.50 | chest floor 0.51 | carpus 0.145
 *   hip 0.76 | stifle 0.455 | hock 0.255 (well let down) | paw pads 0.00
 *   point of shoulder x +0.46 | buttock x -0.74 | trunk length 1.20
 */

export type PartGroup =
  | "head"
  | "ear"
  | "neck"
  | "ruff"
  | "trunk"
  | "coat"
  | "forelimb"
  | "hindlimb"
  | "tail";

type PartSpec = {
  name: string;
  group: PartGroup;
  /** Authored once on the dog's right (+Z) side and mirrored to the left. */
  paired?: boolean;
  options?: SolidOptions;
  sections: Section[];
};

export type DogPart = {
  name: string;
  group: PartGroup;
  geometry: THREE.BufferGeometry;
};

const HORIZONTAL: SolidOptions = { segments: 20, frameUp: [0, 1, 0] };
const VERTICAL: SolidOptions = { segments: 12, frameUp: [1, 0, 0] };

/* ------------------------------------------------------------------ head */

// Compact wedge: real braincase and cheek mass behind, modest tapered muzzle
// in front, a slight but definite stop between two parallel top planes.
const SKULL: PartSpec = {
  name: "skull",
  group: "head",
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.700, 1.252, 0], a: 0.068, b: 0.078, roundness: 2.5, topScale: 0.9 },
    { at: [0.735, 1.247, 0], a: 0.108, b: 0.100, roundness: 2.6, topScale: 0.9 },
    { at: [0.790, 1.236, 0], a: 0.118, b: 0.104, roundness: 2.7, topScale: 0.86, bottomScale: 0.92 },
    { at: [0.848, 1.226, 0], a: 0.117, b: 0.098, roundness: 2.7, topScale: 0.84, bottomScale: 0.9 },
    { at: [0.905, 1.213, 0], a: 0.096, b: 0.088, roundness: 2.5, topScale: 0.85, bottomScale: 0.88 },
    { at: [0.952, 1.202, 0], a: 0.078, b: 0.079, roundness: 2.4, topScale: 0.88 },
  ],
};

const MUZZLE: PartSpec = {
  name: "muzzle",
  group: "head",
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.940, 1.186, 0], a: 0.074, b: 0.070, roundness: 2.4, topScale: 0.9 },
    { at: [1.000, 1.178, 0], a: 0.063, b: 0.062, roundness: 2.4, topScale: 0.9 },
    { at: [1.060, 1.169, 0], a: 0.053, b: 0.055, roundness: 2.3, topScale: 0.92 },
    { at: [1.112, 1.161, 0], a: 0.045, b: 0.049, roundness: 2.2 },
    { at: [1.148, 1.155, 0], a: 0.035, b: 0.041, roundness: 2.1 },
  ],
};

// Chin / underjaw mass so the muzzle is a head, not a tube stub.
const UNDERJAW: PartSpec = {
  name: "underjaw",
  group: "head",
  options: { segments: 12, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.930, 1.133, 0], a: 0.060, b: 0.040, roundness: 2.4 },
    { at: [1.000, 1.126, 0], a: 0.052, b: 0.035, roundness: 2.3 },
    { at: [1.070, 1.119, 0], a: 0.043, b: 0.030, roundness: 2.2 },
    { at: [1.118, 1.114, 0], a: 0.032, b: 0.024, roundness: 2.1 },
  ],
};

// Cheek coat flare that carries the head mass back into the ruff, as in the
// photo where the cheek fringe reads as one form with the mane.
const CHEEK_COAT: PartSpec = {
  name: "cheekCoat",
  group: "head",
  paired: true,
  options: { segments: 12, frameUp: [1, 0, 0] },
  sections: [
    { at: [0.845, 1.205, 0.088], a: 0.030, b: 0.070, roundness: 2.3 },
    { at: [0.805, 1.150, 0.112], a: 0.046, b: 0.085, roundness: 2.2 },
    { at: [0.760, 1.085, 0.132], a: 0.052, b: 0.090, roundness: 2.2 },
    { at: [0.716, 1.020, 0.138], a: 0.046, b: 0.078, roundness: 2.2 },
  ],
};

/* ------------------------------------------------------------------- ear */

// Semi-prick: broad attachment across the back of the skull crown, erect for
// the lower two thirds, tip folded forward. Thin axis is lateral (a), broad
// axis is fore-aft (b). Negative roll turns the concave face forward-outward.
const EAR: PartSpec = {
  name: "ear",
  group: "ear",
  paired: true,
  options: { segments: 10, frameUp: [1, 0, 0] },
  sections: [
    { at: [0.775, 1.285, 0.075], a: 0.030, b: 0.078, roundness: 2.6, roll: -0.34 },
    { at: [0.772, 1.365, 0.086], a: 0.028, b: 0.072, roundness: 2.5, roll: -0.38 },
    { at: [0.778, 1.440, 0.094], a: 0.023, b: 0.056, roundness: 2.4, roll: -0.42 },
    { at: [0.812, 1.492, 0.093], a: 0.018, b: 0.040, roundness: 2.3, roll: -0.46 },
    { at: [0.862, 1.505, 0.089], a: 0.013, b: 0.026, roundness: 2.2, roll: -0.48 },
    { at: [0.900, 1.487, 0.085], a: 0.008, b: 0.014, roundness: 2.1, roll: -0.5 },
  ],
};

/* ------------------------------------------------------- neck and ruff */

// Short and clearly sloped (about 42 degrees), never a vertical llama column.
const NECK: PartSpec = {
  name: "neck",
  group: "neck",
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.390, 0.880, 0], a: 0.118, b: 0.145, roundness: 2.3 },
    { at: [0.505, 0.982, 0], a: 0.110, b: 0.132, roundness: 2.3 },
    { at: [0.620, 1.085, 0], a: 0.098, b: 0.116, roundness: 2.3 },
    { at: [0.720, 1.175, 0], a: 0.082, b: 0.098, roundness: 2.3 },
    { at: [0.762, 1.215, 0], a: 0.072, b: 0.086, roundness: 2.3 },
  ],
};

// Three stacked collars swept perpendicular to the neck axis. Layer 1 is the
// main shawl over withers and chest, layer 2 the forward bib, layer 3 the cape
// behind the ears. They interpenetrate the neck and the ribcage on purpose so
// the mane reads as one continuous coat form, not a detached chest pillow.
const RUFF_SHAWL: PartSpec = {
  name: "ruffShawl",
  group: "ruff",
  options: { segments: 20, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.300, 0.812, 0], a: 0.235, b: 0.200, roundness: 2.4, topScale: 0.9 },
    { at: [0.400, 0.900, 0], a: 0.305, b: 0.258, roundness: 2.5, topScale: 0.88 },
    { at: [0.500, 0.988, 0], a: 0.318, b: 0.268, roundness: 2.5, topScale: 0.86 },
    { at: [0.598, 1.075, 0], a: 0.262, b: 0.218, roundness: 2.4, topScale: 0.88 },
    { at: [0.685, 1.152, 0], a: 0.186, b: 0.152, roundness: 2.3 },
    { at: [0.748, 1.207, 0], a: 0.122, b: 0.100, roundness: 2.2 },
  ],
};

const RUFF_BIB: PartSpec = {
  name: "ruffBib",
  group: "ruff",
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.398, 0.760, 0], a: 0.190, b: 0.150, roundness: 2.4 },
    { at: [0.482, 0.834, 0], a: 0.238, b: 0.186, roundness: 2.5 },
    { at: [0.566, 0.908, 0], a: 0.236, b: 0.184, roundness: 2.5 },
    { at: [0.648, 0.981, 0], a: 0.190, b: 0.148, roundness: 2.4 },
    { at: [0.712, 1.037, 0], a: 0.132, b: 0.104, roundness: 2.3 },
  ],
};

const RUFF_CAPE: PartSpec = {
  name: "ruffCape",
  group: "ruff",
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.386, 0.986, 0], a: 0.170, b: 0.126, roundness: 2.4, topScale: 0.9 },
    { at: [0.470, 1.060, 0], a: 0.188, b: 0.140, roundness: 2.5, topScale: 0.88 },
    { at: [0.556, 1.135, 0], a: 0.176, b: 0.132, roundness: 2.5, topScale: 0.88 },
    { at: [0.640, 1.209, 0], a: 0.140, b: 0.104, roundness: 2.4 },
    { at: [0.706, 1.266, 0], a: 0.090, b: 0.068, roundness: 2.3 },
  ],
};

// Brisket apron: carries the mane down in front of the forelegs to just under
// the elbow line, closing the ruff into the chest instead of floating over it.
const BRISKET_COAT: PartSpec = {
  name: "brisketCoat",
  group: "ruff",
  options: { segments: 16, frameUp: [1, 0, 0] },
  sections: [
    { at: [0.545, 0.760, 0], a: 0.185, b: 0.110, roundness: 2.4 },
    { at: [0.520, 0.660, 0], a: 0.186, b: 0.108, roundness: 2.4 },
    { at: [0.480, 0.558, 0], a: 0.165, b: 0.098, roundness: 2.3 },
    { at: [0.440, 0.470, 0], a: 0.130, b: 0.080, roundness: 2.2 },
    { at: [0.412, 0.418, 0], a: 0.088, b: 0.056, roundness: 2.1 },
  ],
};

/* ----------------------------------------------------------------- trunk */

// Split into three authored solids with different cross-section characters so
// the body is never one nose-to-tail loft. Ribcage carries a keel (bottomScale)
// and a narrowed spine (topScale); the loin is smaller and tucked; the croup is
// boxier and wider at the hips.
const RIBCAGE: PartSpec = {
  name: "ribcage",
  group: "trunk",
  options: HORIZONTAL,
  sections: [
    { at: [0.470, 0.796, 0], a: 0.128, b: 0.150, roundness: 2.3, topScale: 0.8, bottomScale: 0.78 },
    { at: [0.396, 0.784, 0], a: 0.172, b: 0.208, roundness: 2.4, topScale: 0.78, bottomScale: 0.74 },
    { at: [0.300, 0.776, 0], a: 0.198, b: 0.244, roundness: 2.4, topScale: 0.76, bottomScale: 0.72 },
    { at: [0.180, 0.772, 0], a: 0.209, b: 0.258, roundness: 2.4, topScale: 0.76, bottomScale: 0.72 },
    { at: [0.050, 0.772, 0], a: 0.202, b: 0.252, roundness: 2.4, topScale: 0.78, bottomScale: 0.74 },
    { at: [-0.075, 0.778, 0], a: 0.178, b: 0.222, roundness: 2.4, topScale: 0.8, bottomScale: 0.78 },
    { at: [-0.140, 0.782, 0], a: 0.162, b: 0.198, roundness: 2.4, topScale: 0.82, bottomScale: 0.82 },
  ],
};

const LOIN: PartSpec = {
  name: "loin",
  group: "trunk",
  options: HORIZONTAL,
  sections: [
    { at: [-0.120, 0.782, 0], a: 0.164, b: 0.200, roundness: 2.3, topScale: 0.84, bottomScale: 0.84 },
    { at: [-0.210, 0.790, 0], a: 0.152, b: 0.184, roundness: 2.3, topScale: 0.86, bottomScale: 0.86 },
    { at: [-0.300, 0.792, 0], a: 0.154, b: 0.182, roundness: 2.3, topScale: 0.88, bottomScale: 0.88 },
    { at: [-0.372, 0.788, 0], a: 0.164, b: 0.186, roundness: 2.4, topScale: 0.9, bottomScale: 0.9 },
  ],
};

const CROUP: PartSpec = {
  name: "croupPelvis",
  group: "trunk",
  options: HORIZONTAL,
  sections: [
    { at: [-0.350, 0.788, 0], a: 0.166, b: 0.188, roundness: 2.5, topScale: 0.9, bottomScale: 0.9 },
    { at: [-0.450, 0.790, 0], a: 0.178, b: 0.192, roundness: 2.6, topScale: 0.9, bottomScale: 0.88 },
    { at: [-0.556, 0.776, 0], a: 0.172, b: 0.180, roundness: 2.6, topScale: 0.9, bottomScale: 0.88 },
    { at: [-0.650, 0.742, 0], a: 0.138, b: 0.148, roundness: 2.5, topScale: 0.92 },
    { at: [-0.722, 0.694, 0], a: 0.096, b: 0.104, roundness: 2.4 },
  ],
};

// Slight forward point of the sternum ahead of the forelegs.
const PROSTERNUM: PartSpec = {
  name: "prosternum",
  group: "trunk",
  options: { segments: 12, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.430, 0.700, 0], a: 0.120, b: 0.108, roundness: 2.3 },
    { at: [0.495, 0.692, 0], a: 0.106, b: 0.098, roundness: 2.3 },
    { at: [0.545, 0.682, 0], a: 0.080, b: 0.074, roundness: 2.2 },
  ],
};

/* ------------------------------------------------------------------ coat */

// Flank skirt: the long-coat curtain hanging off the ribs and loin, kept as one
// broad neutral slab per side rather than any strand detail.
const FLANK_SKIRT: PartSpec = {
  name: "flankSkirt",
  group: "coat",
  paired: true,
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.330, 0.640, 0.150], a: 0.030, b: 0.090, roundness: 2.3 },
    { at: [0.230, 0.606, 0.196], a: 0.048, b: 0.140, roundness: 2.4 },
    { at: [0.100, 0.586, 0.212], a: 0.054, b: 0.162, roundness: 2.4 },
    { at: [-0.040, 0.582, 0.208], a: 0.052, b: 0.166, roundness: 2.4 },
    { at: [-0.170, 0.594, 0.196], a: 0.048, b: 0.152, roundness: 2.4 },
    { at: [-0.290, 0.624, 0.180], a: 0.040, b: 0.122, roundness: 2.3 },
    { at: [-0.380, 0.660, 0.164], a: 0.030, b: 0.086, roundness: 2.2 },
  ],
};

// Culotte / trousers over thigh and buttock, hanging to about the hock.
const CULOTTE: PartSpec = {
  name: "culotte",
  group: "coat",
  paired: true,
  options: { segments: 16, frameUp: [1, 0, 0] },
  sections: [
    { at: [-0.470, 0.740, 0.140], a: 0.082, b: 0.140, roundness: 2.4 },
    { at: [-0.512, 0.626, 0.166], a: 0.094, b: 0.166, roundness: 2.5 },
    { at: [-0.552, 0.508, 0.172], a: 0.090, b: 0.164, roundness: 2.5 },
    { at: [-0.590, 0.398, 0.162], a: 0.072, b: 0.134, roundness: 2.4 },
    { at: [-0.612, 0.320, 0.150], a: 0.048, b: 0.092, roundness: 2.3 },
  ],
};

/* -------------------------------------------------------------- forelimb */

// Rhythm: laid-back scapula -> humerus angled down and BACK -> elbow -> straight
// forearm -> carpus knob -> short sloped pastern -> flat-padded paw.
const SCAPULA: PartSpec = {
  name: "scapula",
  group: "forelimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [0.282, 1.000, 0.112], a: 0.030, b: 0.086, roundness: 2.3 },
    { at: [0.350, 0.902, 0.128], a: 0.038, b: 0.104, roundness: 2.4 },
    { at: [0.412, 0.812, 0.138], a: 0.040, b: 0.098, roundness: 2.4 },
    { at: [0.458, 0.744, 0.142], a: 0.036, b: 0.078, roundness: 2.3 },
  ],
};

const HUMERUS: PartSpec = {
  name: "humerus",
  group: "forelimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [0.458, 0.742, 0.142], a: 0.040, b: 0.074, roundness: 2.3 },
    { at: [0.398, 0.650, 0.144], a: 0.043, b: 0.078, roundness: 2.4 },
    { at: [0.340, 0.556, 0.145], a: 0.041, b: 0.070, roundness: 2.4 },
    { at: [0.302, 0.504, 0.146], a: 0.038, b: 0.062, roundness: 2.3 },
  ],
};

const ELBOW: PartSpec = {
  name: "elbow",
  group: "forelimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [0.300, 0.532, 0.146], a: 0.034, b: 0.058, roundness: 2.4 },
    { at: [0.304, 0.494, 0.147], a: 0.041, b: 0.068, roundness: 2.5 },
    { at: [0.312, 0.458, 0.148], a: 0.036, b: 0.058, roundness: 2.4 },
  ],
};

const FOREARM: PartSpec = {
  name: "forearm",
  group: "forelimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [0.308, 0.492, 0.147], a: 0.038, b: 0.062, roundness: 2.4 },
    { at: [0.314, 0.400, 0.148], a: 0.034, b: 0.055, roundness: 2.4 },
    { at: [0.319, 0.300, 0.149], a: 0.030, b: 0.046, roundness: 2.3 },
    { at: [0.323, 0.210, 0.150], a: 0.027, b: 0.040, roundness: 2.3 },
    { at: [0.326, 0.158, 0.150], a: 0.026, b: 0.037, roundness: 2.3 },
  ],
};

const CARPUS: PartSpec = {
  name: "carpus",
  group: "forelimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [0.326, 0.170, 0.150], a: 0.027, b: 0.038, roundness: 2.4 },
    { at: [0.330, 0.142, 0.150], a: 0.032, b: 0.046, roundness: 2.6 },
    { at: [0.336, 0.116, 0.150], a: 0.028, b: 0.040, roundness: 2.4 },
  ],
};

const FORE_PASTERN: PartSpec = {
  name: "forePastern",
  group: "forelimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [0.332, 0.132, 0.150], a: 0.028, b: 0.040, roundness: 2.4 },
    { at: [0.342, 0.094, 0.150], a: 0.027, b: 0.038, roundness: 2.4 },
    { at: [0.352, 0.056, 0.150], a: 0.026, b: 0.036, roundness: 2.4 },
  ],
};

// Paw: every section centre sits at y = b so the pad bottom is exactly y = 0,
// and a boxier roundness keeps that contact flat instead of ball-shaped.
const FORE_PAW: PartSpec = {
  name: "forePaw",
  group: "forelimb",
  paired: true,
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [0.300, 0.026, 0.150], a: 0.030, b: 0.026, roundness: 2.8 },
    { at: [0.328, 0.030, 0.150], a: 0.042, b: 0.030, roundness: 2.9 },
    { at: [0.360, 0.028, 0.150], a: 0.043, b: 0.028, roundness: 2.9 },
    { at: [0.388, 0.022, 0.150], a: 0.036, b: 0.022, roundness: 2.8 },
    { at: [0.408, 0.014, 0.150], a: 0.024, b: 0.014, roundness: 2.6 },
  ],
};

/* -------------------------------------------------------------- hindlimb */

// Rhythm: hip mass -> broad upper thigh angled down and FORWARD -> stifle ->
// second thigh angled down and BACK -> low hock with a rear point -> vertical
// rear pastern -> flat-padded paw. Deliberately a different rhythm from the
// front column so the two ends do not read as the same four sticks.
const HIP: PartSpec = {
  name: "hip",
  group: "hindlimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [-0.470, 0.856, 0.116], a: 0.056, b: 0.098, roundness: 2.4 },
    { at: [-0.486, 0.780, 0.140], a: 0.076, b: 0.122, roundness: 2.5 },
    { at: [-0.498, 0.704, 0.146], a: 0.072, b: 0.116, roundness: 2.5 },
  ],
};

const UPPER_THIGH: PartSpec = {
  name: "upperThigh",
  group: "hindlimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [-0.500, 0.762, 0.142], a: 0.078, b: 0.128, roundness: 2.5 },
    { at: [-0.462, 0.678, 0.148], a: 0.080, b: 0.132, roundness: 2.5 },
    { at: [-0.418, 0.588, 0.152], a: 0.070, b: 0.112, roundness: 2.4 },
    { at: [-0.382, 0.506, 0.155], a: 0.055, b: 0.086, roundness: 2.4 },
    { at: [-0.364, 0.462, 0.156], a: 0.046, b: 0.070, roundness: 2.3 },
  ],
};

const STIFLE: PartSpec = {
  name: "stifle",
  group: "hindlimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [-0.368, 0.492, 0.155], a: 0.042, b: 0.062, roundness: 2.4 },
    { at: [-0.366, 0.455, 0.156], a: 0.046, b: 0.066, roundness: 2.5 },
    { at: [-0.376, 0.418, 0.156], a: 0.042, b: 0.060, roundness: 2.4 },
  ],
};

const SECOND_THIGH: PartSpec = {
  name: "secondThigh",
  group: "hindlimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [-0.368, 0.462, 0.155], a: 0.046, b: 0.076, roundness: 2.4 },
    { at: [-0.428, 0.404, 0.155], a: 0.046, b: 0.082, roundness: 2.4 },
    { at: [-0.494, 0.344, 0.155], a: 0.041, b: 0.072, roundness: 2.4 },
    { at: [-0.552, 0.292, 0.155], a: 0.034, b: 0.056, roundness: 2.3 },
    { at: [-0.582, 0.266, 0.155], a: 0.030, b: 0.048, roundness: 2.3 },
  ],
};

const HOCK: PartSpec = {
  name: "hock",
  group: "hindlimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [-0.578, 0.298, 0.155], a: 0.031, b: 0.056, roundness: 2.4 },
    { at: [-0.590, 0.258, 0.155], a: 0.035, b: 0.064, roundness: 2.6 },
    { at: [-0.590, 0.222, 0.155], a: 0.030, b: 0.050, roundness: 2.4 },
  ],
};

const REAR_PASTERN: PartSpec = {
  name: "rearPastern",
  group: "hindlimb",
  paired: true,
  options: VERTICAL,
  sections: [
    { at: [-0.588, 0.240, 0.156], a: 0.029, b: 0.044, roundness: 2.4 },
    { at: [-0.587, 0.170, 0.158], a: 0.027, b: 0.040, roundness: 2.4 },
    { at: [-0.586, 0.100, 0.159], a: 0.026, b: 0.037, roundness: 2.4 },
    { at: [-0.585, 0.056, 0.160], a: 0.025, b: 0.035, roundness: 2.4 },
  ],
};

const REAR_PAW: PartSpec = {
  name: "rearPaw",
  group: "hindlimb",
  paired: true,
  options: { segments: 16, frameUp: [0, 1, 0] },
  sections: [
    { at: [-0.618, 0.024, 0.160], a: 0.028, b: 0.024, roundness: 2.8 },
    { at: [-0.594, 0.029, 0.160], a: 0.039, b: 0.029, roundness: 2.9 },
    { at: [-0.564, 0.027, 0.160], a: 0.040, b: 0.027, roundness: 2.9 },
    { at: [-0.538, 0.021, 0.160], a: 0.033, b: 0.021, roundness: 2.8 },
    { at: [-0.518, 0.013, 0.160], a: 0.022, b: 0.013, roundness: 2.6 },
  ],
};

/* ------------------------------------------------------------------ tail */

// Low set, broad where it leaves the croup, widening into a coat flag through
// the middle and tapering to the tip past the hock. Fore-aft extent (b) always
// exceeds lateral extent (a) so it reads as a plume, never a round hose.
const TAIL: PartSpec = {
  name: "tail",
  group: "tail",
  options: { segments: 16, frameUp: [1, 0, 0] },
  sections: [
    { at: [-0.700, 0.740, 0], a: 0.082, b: 0.096, roundness: 2.4 },
    { at: [-0.742, 0.640, 0], a: 0.076, b: 0.104, roundness: 2.4 },
    { at: [-0.776, 0.522, 0], a: 0.068, b: 0.100, roundness: 2.3 },
    { at: [-0.792, 0.404, 0], a: 0.058, b: 0.088, roundness: 2.3 },
    { at: [-0.790, 0.296, 0], a: 0.045, b: 0.068, roundness: 2.2 },
    { at: [-0.778, 0.214, 0], a: 0.030, b: 0.044, roundness: 2.2 },
    { at: [-0.766, 0.168, 0], a: 0.017, b: 0.024, roundness: 2.1 },
  ],
};

const PART_SPECS: readonly PartSpec[] = [
  SKULL,
  MUZZLE,
  UNDERJAW,
  CHEEK_COAT,
  EAR,
  NECK,
  RUFF_SHAWL,
  RUFF_BIB,
  RUFF_CAPE,
  BRISKET_COAT,
  RIBCAGE,
  LOIN,
  CROUP,
  PROSTERNUM,
  FLANK_SKIRT,
  CULOTTE,
  SCAPULA,
  HUMERUS,
  ELBOW,
  FOREARM,
  CARPUS,
  FORE_PASTERN,
  FORE_PAW,
  HIP,
  UPPER_THIGH,
  STIFLE,
  SECOND_THIGH,
  HOCK,
  REAR_PASTERN,
  REAR_PAW,
  TAIL,
];

/** Part graph as documented in the README, for the label and the report. */
export const PART_GRAPH: Readonly<Record<PartGroup, readonly string[]>> =
  PART_SPECS.reduce(
    (acc, spec) => {
      acc[spec.group] = [...(acc[spec.group] ?? []), spec.name];
      return acc;
    },
    {} as Record<PartGroup, string[]>,
  );

export function buildDogParts(): DogPart[] {
  const parts: DogPart[] = [];

  for (const spec of PART_SPECS) {
    const geometry = buildSectionSolid(spec.sections, spec.options);
    if (spec.paired) {
      parts.push({
        name: `${spec.name}.R`,
        group: spec.group,
        geometry,
      });
      parts.push({
        name: `${spec.name}.L`,
        group: spec.group,
        geometry: mirrorZ(geometry),
      });
    } else {
      parts.push({ name: spec.name, group: spec.group, geometry });
    }
  }

  return parts;
}
