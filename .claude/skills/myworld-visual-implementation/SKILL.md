---
name: myworld-visual-implementation
description: Use when implementing or revising MyWorld Three.js/R3F visuals, including composition, orthographic camera, terrain, structures, materials, lighting, day/night states, or visual polish.
---

# MyWorld Visual Implementation

Claude is the implementation worker. Hermes owns scope, acceptance, independent rendering, and final approval.

## Before editing

1. Hermes가 기록한 MyWorld Git baseline을 확인하고 기존 dirty를 보존한다.
2. Read `VISUAL_ACCEPTANCE.md`, the active spike README, and only the source needed for the assigned object family.
3. Restate the target, allowed files, supplied reference, and observable acceptance criteria.
4. If reference or product meaning is missing, implement reversible composition/blockout work only and report final art as unverified.

## Implementation order

1. Fix screen-space hierarchy and overlap at the actual orthographic camera before adding detail.
2. Validate silhouette and proportions before material, lighting, or decorative polish.
3. Change one coherent family at a time: terrain, bridge/pond, architecture, vegetation, character, or atmosphere.
4. Preserve `/rebuild` as the comparison baseline; use `/rebuild-reset` until Hermes explicitly promotes work.
5. Do not restore or lightly polish the unapproved dog, flowers, trees, clouds, outer islands, house, pergola, pond, or bridge as a shortcut.
6. Reuse current project architecture where sound, but do not inherit fixed coordinates, palettes, geometry recipes, licensing claims, or camera assumptions from legacy Skills without current evidence.

## Quality rules

- Judge composition in screen space, not world coordinates alone.
- Prefer a clear silhouette and focal hierarchy over primitive count or surface detail.
- Keep day and night readable; ambient brightness must not erase form, and darkness must not collapse key silhouettes.
- Use deterministic geometry only when it improves reproducibility; avoid repeated identical scatter and arbitrary complexity.
- Treat build success as technical evidence only, never visual approval.

## Verification contract

Claude does not receive Bash, server, browser, or MCP tools. Claude must report the files it changed, the checks Hermes should run, and anything it could not verify; it must not claim technical or visual completion.

Hermes independently performs the required acceptance loop:

1. Run targeted ESLint for affected files while iterating.
2. Run `npm run lint`, `npm run build`, and `git diff --check`; distinguish pre-existing failures from regressions.
3. Render comparable desktop day/night overviews and close-ups of each affected family.
4. Check browser JavaScript errors and warnings separately from the visual verdict.
5. Stop bounded dev processes and verify their port is released.
6. Compare Claude's reported files with the real Git diff and classify remaining items as `VALIDATED`, `PARTIAL`, `INVALIDATED`, or `unverified`.

## Prohibited side effects

Do not install packages, delete or move files, commit, push, deploy, access sibling repositories, or modify Claude/Hermes controls unless the current Hermes task contract explicitly assigns that control-plane work.
