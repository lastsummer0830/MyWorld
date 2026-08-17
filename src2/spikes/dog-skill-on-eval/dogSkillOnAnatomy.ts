import type { Section, SectionSolidOptions } from "./sectionSolid";
import { mirrorSections } from "./sectionSolid";

/**
 * Stage-1 anatomy scaffold for the user's blue-merle Shetland Sheepdog.
 *
 * Sole visual authority: the RIGHT-HAND real pet photo in
 * `Pick/2026-08-01_비교_모델vs사진.png`. The left-hand model in that image and
 * `Pick/2026-08-01_강아지_4면도.png` are rejected failure evidence only.
 *
 * Axis convention
 * - +Z is the dog's forward (nose) direction, +Y is up, ground plane is y = 0.
 * - The dog's own right side is therefore -X and its left side is +X.
 *
 * Scale reference (all values are in these scaffold units)
 * - withers height 3.55, elbow / brisket 1.80, nose tip z = +2.88,
 *   point of buttock z = -3.32, head length 1.60 (0.45 x withers).
 */

export type PartGroup =
  | "head"
  | "ear"
  | "neck"
  | "trunk"
  | "foreLimb"
  | "hindLimb"
  | "tail"
  | "coat";

export type Part = {
  id: string;
  group: PartGroup;
  /** Short note tying the mass back to an observed trait in the real photo. */
  note: string;
  sections: Section[];
  options?: SectionSolidOptions;
};

const VERTICAL_AXIS: SectionSolidOptions = { axisUp: [0, 0, 1] };

// ---------------------------------------------------------------------------
// Head: compact wedge with real skull and cheek mass, modest tapered muzzle.
// ---------------------------------------------------------------------------

const skull: Part = {
  id: "skull",
  group: "head",
  note: "flat-topped wedge, widest at the cheek, occiput at z=+1.28",
  sections: [
    { at: [0, 3.83, 1.28], halfWidth: 0.36, halfHeight: 0.34, roundness: 3.0 },
    { at: [0, 3.8, 1.55], halfWidth: 0.4, halfHeight: 0.36, roundness: 3.0 },
    { at: [0, 3.76, 1.85], halfWidth: 0.37, halfHeight: 0.34, roundness: 2.9 },
    { at: [0, 3.7, 2.06], halfWidth: 0.29, halfHeight: 0.3, roundness: 2.8 },
  ],
};

const muzzle: Part = {
  id: "muzzle",
  group: "head",
  note: "half of head length, blunt end, centreline dropped 0.08 to read a modest stop",
  sections: [
    { at: [0, 3.62, 2.08], halfWidth: 0.27, halfHeight: 0.26, roundness: 2.7 },
    { at: [0, 3.6, 2.35], halfWidth: 0.24, halfHeight: 0.23, roundness: 2.6 },
    { at: [0, 3.56, 2.62], halfWidth: 0.2, halfHeight: 0.2, roundness: 2.5 },
    { at: [0, 3.53, 2.86], halfWidth: 0.17, halfHeight: 0.17, roundness: 2.5 },
  ],
};

const lowerJaw: Part = {
  id: "lower-jaw",
  group: "head",
  note: "jaw depth under the muzzle so the front of the head is not a cone",
  sections: [
    { at: [0, 3.46, 2.14], halfWidth: 0.21, halfHeight: 0.14, roundness: 2.6 },
    { at: [0, 3.43, 2.44], halfWidth: 0.18, halfHeight: 0.12, roundness: 2.5 },
    { at: [0, 3.41, 2.72], halfWidth: 0.14, halfHeight: 0.1, roundness: 2.5 },
  ],
};

const cheek: Part = {
  id: "cheek",
  group: "head",
  note: "paired zygomatic fill so the wedge keeps skull mass behind the muzzle",
  sections: [
    { at: [0, 3.66, 1.6], halfWidth: 0.4, halfHeight: 0.24, roundness: 2.6 },
    { at: [0, 3.63, 1.88], halfWidth: 0.34, halfHeight: 0.21, roundness: 2.5 },
    { at: [0, 3.6, 2.08], halfWidth: 0.27, halfHeight: 0.17, roundness: 2.5 },
  ],
};

// Ears: broad base, separated by a real gap, top third folding forward.
const earLeft: Section[] = [
  { at: [0.3, 4.02, 1.46], halfWidth: 0.22, halfHeight: 0.1, roundness: 2.6 },
  { at: [0.34, 4.22, 1.48], halfWidth: 0.2, halfHeight: 0.09, roundness: 2.5 },
  { at: [0.38, 4.4, 1.53], halfWidth: 0.16, halfHeight: 0.08, roundness: 2.4 },
  { at: [0.41, 4.52, 1.62], halfWidth: 0.11, halfHeight: 0.07, roundness: 2.3 },
  { at: [0.42, 4.58, 1.74], halfWidth: 0.07, halfHeight: 0.055, roundness: 2.2 },
  { at: [0.42, 4.6, 1.82], halfWidth: 0.03, halfHeight: 0.03, roundness: 2.2 },
];

// ---------------------------------------------------------------------------
// Neck: short and sloped, later swallowed by the ruff layers.
// ---------------------------------------------------------------------------

const neck: Part = {
  id: "neck",
  group: "neck",
  note: "~40 degree slope from the withers to the occiput, length 1.06",
  sections: [
    { at: [0, 3.1, 0.4], halfWidth: 0.42, halfHeight: 0.5, roundness: 2.5 },
    { at: [0, 3.3, 0.68], halfWidth: 0.4, halfHeight: 0.46, roundness: 2.4 },
    { at: [0, 3.55, 0.98], halfWidth: 0.37, halfHeight: 0.42, roundness: 2.4 },
    { at: [0, 3.76, 1.24], halfWidth: 0.34, halfHeight: 0.36, roundness: 2.5 },
  ],
};

// ---------------------------------------------------------------------------
// Trunk: three separate horizontal masses, deeper than wide, no chest egg.
// ---------------------------------------------------------------------------

const ribcage: Part = {
  id: "ribcage",
  group: "trunk",
  note: "depth 1.64 vs width 1.20, keeled underline reaching the elbow at y=1.84",
  sections: [
    {
      at: [0, 2.55, 1.02],
      halfWidth: 0.34,
      halfHeight: 0.55,
      roundness: 2.5,
      lowerWidthScale: 0.75,
    },
    {
      at: [0, 2.62, 0.62],
      halfWidth: 0.5,
      halfHeight: 0.82,
      roundness: 2.5,
      lowerWidthScale: 0.7,
    },
    {
      at: [0, 2.66, 0.15],
      halfWidth: 0.58,
      halfHeight: 0.88,
      roundness: 2.4,
      lowerWidthScale: 0.68,
    },
    {
      at: [0, 2.66, -0.35],
      halfWidth: 0.6,
      halfHeight: 0.82,
      roundness: 2.4,
      lowerWidthScale: 0.7,
    },
    {
      at: [0, 2.65, -0.8],
      halfWidth: 0.56,
      halfHeight: 0.76,
      roundness: 2.4,
      lowerWidthScale: 0.76,
    },
    {
      at: [0, 2.68, -1.2],
      halfWidth: 0.48,
      halfHeight: 0.68,
      roundness: 2.4,
      lowerWidthScale: 0.85,
    },
  ],
};

const loin: Part = {
  id: "loin",
  group: "trunk",
  note: "narrower than the ribcage with a rising tuck, top line nearly level",
  sections: [
    {
      at: [0, 2.72, -1.2],
      halfWidth: 0.47,
      halfHeight: 0.66,
      roundness: 2.4,
      lowerWidthScale: 0.88,
    },
    {
      at: [0, 2.78, -1.6],
      halfWidth: 0.43,
      halfHeight: 0.58,
      roundness: 2.4,
      lowerHeightScale: 0.85,
    },
    {
      at: [0, 2.84, -2.0],
      halfWidth: 0.44,
      halfHeight: 0.54,
      roundness: 2.4,
      lowerHeightScale: 0.82,
    },
  ],
};

const croup: Part = {
  id: "croup",
  group: "trunk",
  note: "hip width 1.16 then a gradual slope down to the low tail set at y=2.48",
  sections: [
    { at: [0, 2.86, -2.05], halfWidth: 0.46, halfHeight: 0.54, roundness: 2.4 },
    { at: [0, 2.82, -2.4], halfWidth: 0.58, halfHeight: 0.56, roundness: 2.4 },
    { at: [0, 2.74, -2.8], halfWidth: 0.54, halfHeight: 0.5, roundness: 2.4 },
    { at: [0, 2.6, -3.12], halfWidth: 0.4, halfHeight: 0.4, roundness: 2.4 },
    { at: [0, 2.48, -3.32], halfWidth: 0.3, halfHeight: 0.32, roundness: 2.4 },
  ],
};

// ---------------------------------------------------------------------------
// Tail: broad root continuous with the croup, carried low to hock height.
// ---------------------------------------------------------------------------

const tail: Part = {
  id: "tail",
  group: "tail",
  note: "root radius matches the croup end, plume swell mid-length, tip at y=1.05",
  sections: [
    { at: [0, 2.46, -3.36], halfWidth: 0.26, halfHeight: 0.28, roundness: 2.4 },
    { at: [0, 2.2, -3.6], halfWidth: 0.28, halfHeight: 0.3, roundness: 2.4 },
    { at: [0, 1.8, -3.7], halfWidth: 0.27, halfHeight: 0.3, roundness: 2.4 },
    { at: [0, 1.4, -3.66], halfWidth: 0.22, halfHeight: 0.25, roundness: 2.4 },
    { at: [0, 1.05, -3.52], halfWidth: 0.13, halfHeight: 0.15, roundness: 2.3 },
  ],
  options: { axisUp: [0, 0, 1] },
};

// ---------------------------------------------------------------------------
// Fore limb: scapula -> upper arm -> elbow -> forearm -> carpus -> pastern -> paw
// ---------------------------------------------------------------------------

const scapula: Section[] = [
  { at: [0.5, 3.42, -0.22], halfWidth: 0.13, halfHeight: 0.4, roundness: 2.6 },
  { at: [0.54, 2.95, 0.12], halfWidth: 0.17, halfHeight: 0.42, roundness: 2.5 },
  { at: [0.56, 2.48, 0.48], halfWidth: 0.18, halfHeight: 0.38, roundness: 2.5 },
  { at: [0.55, 2.15, 0.76], halfWidth: 0.16, halfHeight: 0.28, roundness: 2.5 },
];

const upperArm: Section[] = [
  { at: [0.53, 2.14, 0.72], halfWidth: 0.19, halfHeight: 0.26, roundness: 2.5 },
  { at: [0.5, 1.98, 0.36], halfWidth: 0.2, halfHeight: 0.26, roundness: 2.5 },
  { at: [0.47, 1.84, 0.02], halfWidth: 0.19, halfHeight: 0.24, roundness: 2.5 },
  { at: [0.46, 1.78, -0.1], halfWidth: 0.16, halfHeight: 0.2, roundness: 2.5 },
];

const elbow: Section[] = [
  { at: [0.47, 1.95, -0.02], halfWidth: 0.18, halfHeight: 0.24, roundness: 3.0 },
  { at: [0.45, 1.78, -0.04], halfWidth: 0.2, halfHeight: 0.26, roundness: 3.0 },
  { at: [0.44, 1.62, 0.0], halfWidth: 0.17, halfHeight: 0.22, roundness: 2.8 },
];

const forearm: Section[] = [
  { at: [0.44, 1.66, -0.01], halfWidth: 0.16, halfHeight: 0.22, roundness: 2.6 },
  { at: [0.42, 1.3, 0.02], halfWidth: 0.14, halfHeight: 0.19, roundness: 2.5 },
  { at: [0.41, 0.95, 0.05], halfWidth: 0.12, halfHeight: 0.16, roundness: 2.5 },
  { at: [0.4, 0.74, 0.07], halfWidth: 0.11, halfHeight: 0.14, roundness: 2.5 },
];

const carpus: Section[] = [
  { at: [0.4, 0.8, 0.06], halfWidth: 0.12, halfHeight: 0.16, roundness: 3.0 },
  { at: [0.39, 0.68, 0.08], halfWidth: 0.14, halfHeight: 0.18, roundness: 3.0 },
  { at: [0.39, 0.58, 0.09], halfWidth: 0.12, halfHeight: 0.15, roundness: 2.8 },
];

const forePastern: Section[] = [
  { at: [0.39, 0.6, 0.09], halfWidth: 0.12, halfHeight: 0.15, roundness: 2.6 },
  { at: [0.38, 0.38, 0.12], halfWidth: 0.12, halfHeight: 0.15, roundness: 2.6 },
  { at: [0.38, 0.24, 0.15], halfWidth: 0.13, halfHeight: 0.16, roundness: 2.6 },
];

const forePaw: Section[] = [
  { at: [0.38, 0.26, 0.15], halfWidth: 0.14, halfHeight: 0.18, roundness: 2.9 },
  { at: [0.38, 0.14, 0.18], halfWidth: 0.17, halfHeight: 0.23, roundness: 2.9 },
  { at: [0.38, 0.04, 0.19], halfWidth: 0.18, halfHeight: 0.25, roundness: 3.2 },
  { at: [0.38, 0.0, 0.19], halfWidth: 0.16, halfHeight: 0.22, roundness: 3.2 },
];

// ---------------------------------------------------------------------------
// Hind limb: thigh -> stifle -> lower thigh -> hock -> rear pastern -> paw
// ---------------------------------------------------------------------------

const thigh: Section[] = [
  { at: [0.56, 2.8, -2.6], halfWidth: 0.3, halfHeight: 0.52, roundness: 2.5 },
  { at: [0.56, 2.42, -2.66], halfWidth: 0.32, halfHeight: 0.56, roundness: 2.5 },
  { at: [0.53, 2.05, -2.55], halfWidth: 0.28, halfHeight: 0.46, roundness: 2.5 },
  { at: [0.51, 1.82, -2.44], halfWidth: 0.22, halfHeight: 0.34, roundness: 2.5 },
];

const stifle: Section[] = [
  { at: [0.51, 1.92, -2.46], halfWidth: 0.2, halfHeight: 0.28, roundness: 3.0 },
  { at: [0.5, 1.76, -2.42], halfWidth: 0.21, halfHeight: 0.29, roundness: 3.0 },
  { at: [0.49, 1.62, -2.46], halfWidth: 0.18, halfHeight: 0.25, roundness: 2.8 },
];

const lowerThigh: Section[] = [
  { at: [0.5, 1.7, -2.44], halfWidth: 0.19, halfHeight: 0.28, roundness: 2.6 },
  { at: [0.48, 1.45, -2.62], halfWidth: 0.17, halfHeight: 0.24, roundness: 2.5 },
  { at: [0.47, 1.28, -2.8], halfWidth: 0.14, halfHeight: 0.19, roundness: 2.5 },
  { at: [0.46, 1.16, -2.9], halfWidth: 0.12, halfHeight: 0.16, roundness: 2.5 },
];

const hock: Section[] = [
  { at: [0.47, 1.3, -2.84], halfWidth: 0.13, halfHeight: 0.2, roundness: 3.4 },
  { at: [0.46, 1.16, -2.94], halfWidth: 0.14, halfHeight: 0.24, roundness: 3.4 },
  { at: [0.45, 1.02, -2.94], halfWidth: 0.12, halfHeight: 0.18, roundness: 3.2 },
];

const rearPastern: Section[] = [
  { at: [0.45, 1.06, -2.93], halfWidth: 0.12, halfHeight: 0.15, roundness: 2.7 },
  { at: [0.44, 0.66, -2.92], halfWidth: 0.11, halfHeight: 0.14, roundness: 2.7 },
  { at: [0.43, 0.28, -2.91], halfWidth: 0.12, halfHeight: 0.15, roundness: 2.7 },
];

const rearPaw: Section[] = [
  { at: [0.43, 0.28, -2.91], halfWidth: 0.13, halfHeight: 0.17, roundness: 2.9 },
  { at: [0.43, 0.14, -2.88], halfWidth: 0.16, halfHeight: 0.21, roundness: 2.9 },
  { at: [0.43, 0.04, -2.87], halfWidth: 0.17, halfHeight: 0.23, roundness: 3.2 },
  { at: [0.43, 0.0, -2.87], halfWidth: 0.15, halfHeight: 0.2, roundness: 3.2 },
];

// ---------------------------------------------------------------------------
// Coat: major neutral masses only. Three overlapping front layers plus side
// skirt and rear pants, all anchored on the anatomy underneath.
// ---------------------------------------------------------------------------

const ruffCollar: Part = {
  id: "ruff-collar",
  group: "coat",
  note: "innermost mane layer wrapping the neck and reaching back onto the withers",
  sections: [
    { at: [0, 3.05, 0.3], halfWidth: 0.72, halfHeight: 0.72, roundness: 2.4 },
    { at: [0, 3.15, 0.62], halfWidth: 0.78, halfHeight: 0.8, roundness: 2.3 },
    { at: [0, 3.42, 0.92], halfWidth: 0.7, halfHeight: 0.7, roundness: 2.3 },
    { at: [0, 3.62, 1.16], halfWidth: 0.52, halfHeight: 0.5, roundness: 2.4 },
  ],
};

const chestFrill: Part = {
  id: "chest-frill",
  group: "coat",
  note: "outer frill and apron, wider than the chest, overlapping the prosternum",
  sections: [
    { at: [0, 3.2, 0.95], halfWidth: 0.62, halfHeight: 0.42, roundness: 2.4 },
    { at: [0, 2.8, 1.1], halfWidth: 0.8, halfHeight: 0.55, roundness: 2.3 },
    { at: [0, 2.35, 1.1], halfWidth: 0.82, halfHeight: 0.5, roundness: 2.3 },
    { at: [0, 1.98, 0.95], halfWidth: 0.7, halfHeight: 0.42, roundness: 2.3 },
    { at: [0, 1.8, 0.9], halfWidth: 0.62, halfHeight: 0.36, roundness: 2.3 },
    { at: [0, 1.62, 0.8], halfWidth: 0.5, halfHeight: 0.28, roundness: 2.3 },
  ],
  options: VERTICAL_AXIS,
};

const shoulderCape: Part = {
  id: "shoulder-cape",
  group: "coat",
  note: "third ruff layer flowing over the withers and into the side skirt",
  sections: [
    { at: [0, 3.15, 0.85], halfWidth: 0.55, halfHeight: 0.35, roundness: 2.4 },
    { at: [0, 3.18, 0.35], halfWidth: 0.72, halfHeight: 0.45, roundness: 2.4 },
    { at: [0, 3.1, -0.1], halfWidth: 0.76, halfHeight: 0.42, roundness: 2.4 },
    { at: [0, 2.95, -0.45], halfWidth: 0.66, halfHeight: 0.35, roundness: 2.4 },
  ],
};

const sideSkirt: Section[] = [
  { at: [0.6, 2.45, 0.55], halfWidth: 0.22, halfHeight: 0.62, roundness: 2.4 },
  { at: [0.7, 2.35, -0.1], halfWidth: 0.26, halfHeight: 0.78, roundness: 2.4 },
  { at: [0.7, 2.32, -0.75], halfWidth: 0.26, halfHeight: 0.8, roundness: 2.4 },
  { at: [0.62, 2.35, -1.35], halfWidth: 0.22, halfHeight: 0.74, roundness: 2.4 },
  { at: [0.52, 2.45, -1.9], halfWidth: 0.17, halfHeight: 0.6, roundness: 2.4 },
];

const rearPants: Section[] = [
  { at: [0.58, 2.85, -2.35], halfWidth: 0.3, halfHeight: 0.55, roundness: 2.4 },
  { at: [0.62, 2.35, -2.7], halfWidth: 0.34, halfHeight: 0.6, roundness: 2.4 },
  { at: [0.58, 1.85, -2.85], halfWidth: 0.28, halfHeight: 0.48, roundness: 2.4 },
  { at: [0.52, 1.5, -2.9], halfWidth: 0.2, halfHeight: 0.32, roundness: 2.4 },
];

function sidePair(
  id: string,
  group: PartGroup,
  note: string,
  sections: Section[],
  options?: SectionSolidOptions,
): Part[] {
  return [
    { id: `${id}-left`, group, note, sections, options },
    { id: `${id}-right`, group, note, sections: mirrorSections(sections), options },
  ];
}

export const DOG_SKILL_ON_PARTS: Part[] = [
  ribcage,
  loin,
  croup,
  neck,
  skull,
  cheek,
  muzzle,
  lowerJaw,
  tail,
  ...sidePair("ear", "ear", "broad base, separated, top third folded forward", earLeft, VERTICAL_AXIS),
  ...sidePair("scapula", "foreLimb", "laid-back shoulder blade carrying the withers", scapula),
  ...sidePair("upper-arm", "foreLimb", "humerus running down and back to the elbow", upperArm),
  ...sidePair("elbow", "foreLimb", "elbow mass set behind the shoulder joint", elbow, VERTICAL_AXIS),
  ...sidePair("forearm", "foreLimb", "near vertical column, oval in section", forearm, VERTICAL_AXIS),
  ...sidePair("carpus", "foreLimb", "wrist widening between forearm and pastern", carpus, VERTICAL_AXIS),
  ...sidePair("fore-pastern", "foreLimb", "short pastern sloping slightly forward", forePastern, VERTICAL_AXIS),
  ...sidePair("fore-paw", "foreLimb", "compact oval paw, flat contact at y=0", forePaw, VERTICAL_AXIS),
  ...sidePair("thigh", "hindLimb", "broad laterally flattened thigh, widest rear mass", thigh, VERTICAL_AXIS),
  ...sidePair("stifle", "hindLimb", "stifle set forward of the hip joint", stifle, VERTICAL_AXIS),
  ...sidePair("lower-thigh", "hindLimb", "tibia running down and back to a well let down hock", lowerThigh, VERTICAL_AXIS),
  ...sidePair("hock", "hindLimb", "angular hock projecting rearward", hock, VERTICAL_AXIS),
  ...sidePair("rear-pastern", "hindLimb", "vertical metatarsus", rearPastern, VERTICAL_AXIS),
  ...sidePair("rear-paw", "hindLimb", "slightly smaller rear paw, flat contact at y=0", rearPaw, VERTICAL_AXIS),
  ruffCollar,
  chestFrill,
  shoulderCape,
  ...sidePair("side-skirt", "coat", "coat skirt hugging the ribs, lower edge below the belly", sideSkirt),
  ...sidePair("rear-pants", "coat", "thigh pants ending above the hock", rearPants, VERTICAL_AXIS),
];

/** Ground contacts the scaffold must show in every view. */
export const GROUND_CONTACTS = [
  "fore-paw-left",
  "fore-paw-right",
  "rear-paw-left",
  "rear-paw-right",
] as const;
