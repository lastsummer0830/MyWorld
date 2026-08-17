---
name: myworld-visual-implementation
description: Use for any MyWorld 3D scene, lighting, composition, camera, terrain, or asset implementation. Enforces reference-first planning and render evidence.
---

# MyWorld visual implementation

## Authority
Hermes supplies the task contract, allowed files, reference set, and acceptance target. Implement only that contract. Report evidence to Hermes; do not ask the user directly and do not edit Claude controls.

## Required inputs
Read before code:
1. the task contract;
2. the assigned source files and their direct dependencies;
3. `REBUILD_PLAN.md` and the relevant section of `VISUAL_ACCEPTANCE.md`;
4. every reference path named by Hermes;
5. `references/reference-map.md` in this Skill.

If a required reference cannot be read, stop and report the exact inaccessible path. Do not substitute memory or a generic web aesthetic.

For flowers, trees, plants, animals, architecture, props, or terrain geometry, also apply `/myworld-procedural-modeling`.

## Phase 1 — evidence and plan
Before editing, return a compact plan containing:
- observed reference traits: silhouette, part hierarchy, proportions, negative space, palette, surface planes;
- current render/code defects tied to those traits;
- geometry/material/lighting changes;
- allowed files only;
- overview, close-up, day, and night checks that apply.

A Hermes implementation prompt may include an already-approved plan. In that case, verify it against the references and proceed without asking for another approval.

## Phase 2 — implementation
- Preserve pre-existing dirty work and unrelated behavior.
- Build major silhouette and part hierarchy before decorative detail.
- Keep authored family resemblance; do not hide weak assets with random scale/rotation scatter.
- Use deterministic variation. Seeded variation may adjust authored variants but must not invent the structure.
- Keep palette and material families centralized where the current architecture already does so.
- Do not remove intended sunlight shafts, day/night mood, or focal elements without explicit contract scope.
- Do not install packages. Prefer existing Three.js/R3F capabilities.

### Orthographic diorama rules
- Orthographic projection creates the isometric look; it does not excuse crude geometry or require a locked horizontal orbit.
- Pick one elevation family for the task (30° dimetric or 35.264° true isometric) and judge composition in the actual product camera, not a convenient front view.
- Distance does not make objects smaller in an orthographic camera. Build distant masses physically smaller and use fog/value separation deliberately.
- Derive framing from the projected scene bounds. At 30° elevation, horizontal depth contributes about `sin(30°)` and vertical height about `cos(30°)` to screen height; verify the result in a fresh render rather than trusting the estimate.
- World-space sky domes and radial perspective-style god rays are poor defaults for an orthographic scene. Prefer screen-space sky treatment and parallel light shafts aligned from the projected sun direction when the task includes atmosphere.
- Lighting must preserve palette and form: use one readable key direction, restrained ambient fill, grounded hemisphere color, and shadows wide enough for the diorama. Warmth comes from color contrast and direction, not indiscriminate brightness or bloom.

Every visual worker run targets one meaningful checkpoint named by the Hermes contract. Do not force a fixed checkpoint count or fixed three-stage sequence. Stop when that checkpoint's deterministic route/query and fixed camera states are ready, and do not continue into the next major revision unless the contract records the previous Hermes render verdict.

For animals, Phase 2 ends after the untextured anatomy scaffold. Return control to Hermes for the fixed multi-view silhouette gate defined in `/myworld-procedural-modeling`. Do not spend the same worker run on face details, fur, markings, animation, or scene integration unless the task contract cites a recorded Hermes scaffold pass.

## Phase 3 — self-check
Run the allowed checks relevant to the changed files. Build success proves only code health, not visual quality.

For every visual task, direct worker render inspection is mandatory. The worker environment can run the wrapper-bounded capture tool and read its PNG output; the obsolete claim that Claude cannot see a 3D scene no longer applies here. Run the exact capture command named in the Hermes contract after each judgeable revision, then use `Read` on its contact sheet and relevant individual PNGs. State what is visibly wrong, compare it with the assigned style/reference criteria, and revise before reporting ready. Code inspection, numeric ratios, route availability, and a capture path that was not opened are not substitutes. If the capture tool fails or cannot be read, return `blocked`; do not claim the checkpoint is ready.

Before reporting completion, inspect the fresh captures you generated and state:
- what changed in the silhouette and hierarchy;
- what remains primitive-like or visually unresolved;
- whether overview and close-up both read;
- whether day/night focal hierarchy survives;
- which claims still require a fresh Hermes render.

Return the named checkpoint, deterministic route/query, required overview/close-up states, and known visual failures. A file path or successful build is not render evidence, and the worker must never claim that the user has seen an image. Hermes owns fresh capture, comparison, user-visible attachment, and verdict.

## Promotion gate
A spike or capability sample is not production. Hermes promotes it only after independent diff review, lint/build, clean runtime console, and fresh reference comparison. Never replace production code merely because a sample compiles.
