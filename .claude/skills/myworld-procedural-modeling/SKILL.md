---
name: myworld-procedural-modeling
description: Use when building or revising MyWorld flowers, trees, plants, animals, terrain, structures, or props. Produces authored low-poly geometry instead of primitive blobs.
---

# Reference-driven procedural modeling for MyWorld

## Purpose
Create stylized low-poly assets in Three.js/R3F whose anatomy, part hierarchy, silhouette, and controlled variation remain readable in both close-up and the product camera. Low-poly means simplified planes, not incomplete construction.

Read `references/modeling-recipes.md` and the explicit reference paths in `/myworld-visual-implementation` before editing. For an animal, also read and follow `references/animal-scaffold-eval.md`; it is the controlling construction and eval procedure when generic guidance conflicts.

## 1. Decompose the reference
Write a part graph, not a list of primitives:
- parent-child structure;
- major masses and secondary accents;
- taper and width changes;
- overlap and attachment points;
- negative spaces that define the silhouette;
- color/material families;
- which traits must survive at overview scale.

Record approximate ratios from the image. Avoid arbitrary coordinates until the hierarchy is clear.

## 2. Choose geometry by shape requirement
Primitives may establish hidden support or a first proportion check. They are not a finished organic silhouette.

Prefer, where appropriate:
- custom `BufferGeometry` or `ShapeGeometry` for tapered petals, leaves, fins, rock planes, and irregular silhouettes;
- `TubeGeometry` along authored curves or tapered segment meshes for stems and branches;
- explicit branch graphs with parent radius, child radius, direction, and attachment position;
- several designed canopy or blossom masses with local substructure;
- flat shading, vertex/color variation, and deliberate plane breaks;
- merged geometry or instancing only after authored variants pass visual review.

Do not add a package merely to avoid understanding the geometry.

### Props and style grammar
- Build a prop from its functional part graph: load-bearing body, handles/supports, openings, joins, ground contact, then accents. A pile of unrelated boxes and cylinders is not construction.
- Use `RoundedBox`, beveled `ExtrudeGeometry`, lathed profiles, tapered tubes, and custom silhouette geometry when the visible shape requires them. Rounded edges help, but cannot rescue wrong proportions or missing joins.
- Keep palette and material families centralized in the assigned product architecture. Use restrained pastel value families, tinted neutrals, matte/non-metal defaults, and reserve glossy response for materials that visibly need it.
- Judge the untextured silhouette first at the actual orthographic product angle. If the prop is not identifiable when reduced to one value, revise its major masses before adding color, decals, bloom, or tiny detail.
- Repeated assets need a few authored structural variants before deterministic rotation or scale variation. Random scatter cannot supply design.
- Estimate detail in screen pixels before building it. Geometry too small to survive the product camera is wasted complexity and often becomes visual noise.

## 3. Build in quality order
1. proportion and ground contact;
2. primary silhouette and negative space;
3. parent-child structure and attachment;
4. secondary masses;
5. plane, palette, and material variation;
6. small accents that remain visible at the intended camera scale.

If a stage fails, fix it before adding scatter, bloom, or extra detail.

### Mandatory animal checkpoint
Animals use the staged contract in `references/animal-scaffold-eval.md`; do not implement a finished asset in one pass.

1. Before code, classify each image as canonical, style-only, or rejected and create a normalized landmark card with direct, inferred, and anti-landmarks.
2. State the fixed-view silhouette budget and the wrong-species cues that must not appear.
3. Build only a neutral single-value scaffold: species-specific anatomy, major coat-outline planes, limb segments/joints, paws, ears, and tail. One convenience loft/sweep may not span multiple anatomical regions.
4. Self-check shaded and flat front, both profiles, three-quarter, and back views. If any view reads as another species, or shows a neck stalk, box muzzle, horn ear, chest egg/pouch, stick leg, or detached tail, revise the scaffold rather than adding detail.
5. Stop for Hermes capture and comparison. Do not add eyes, nose color, mouth line, markings, merle pattern, fur strands, animation, or scene integration.
6. Continue only after Hermes explicitly records a stage-1 silhouette/anatomy pass. Face construction, authored markings, and production integration each remain later gates.

Numeric ratios and part counts are constraints, not proof. The smallest fresh render wins: if a ratio-compliant, multi-part asset reads as another species, the stage fails.

## 4. Family variation
Author a small family of meaningful variants. Variation changes structure: branch lean, canopy grouping, flower stage, leaf pair height, petal opening, or root flare. Random rotation and uniform scale alone do not constitute a variant.

Use deterministic seeds. Keep the family palette and construction grammar shared.

## 5. Hard failure conditions
Reject the asset when any applies:
- it reads as cylinder + sphere/cone blobs;
- the silhouette depends on dozens of identical copies;
- branches do not form a visible parent-child hierarchy;
- petals, leaves, canopy, or roots are merely painted color changes on one mass;
- parts float, intersect without a plausible joint, or fail to meet the ground;
- close-up exposes blockout geometry while the report calls it final;
- random scatter is used to hide a weak authored base;
- it compiles but no fresh render evidence exists.

## 6. Evidence contract
For each asset report:
- reference path used;
- part graph and authored variants;
- geometry types selected and why;
- overview and close-up capture paths;
- observed pass/fail against the gates in `references/modeling-recipes.md`;
- remaining weak areas without euphemism.
