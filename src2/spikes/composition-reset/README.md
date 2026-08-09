# Composition Reset Spike

## Question

Given the visually unacceptable `/rebuild` baseline, does a reduced scene built from the island silhouette and three focal masses establish a readable hierarchy without restoring unapproved legacy assets?

## Route and boundary

- Baseline: `/rebuild` (preserved)
- Spike: `/rebuild-reset` (composition blockout only)
- Excluded: legacy dog, flowers, trees, clouds, outer islands, motes, fireflies, and sunlight overlay
- External image reference: unverified

## Iterations

1. Removed primitive scatter and isolated the island, pergola/tea table, pond/bridge, and house.
2. Corrected a ground-shape z reflection and established the first focal triangle.
3. Reduced the oversized rock wall from 12.5 to 6.4 world units, limited base taper, lightened the rock material, and moved pond/bridge to the right foreground.

## Render evidence

- A verified fresh MyWorld `next-server` served `/rebuild` and `/rebuild-reset` with HTTP 200.
- Day overview: the rock side no longer dominates the lower frame, and pond/bridge no longer intersects the pergola mass.
- Night overview: geometry separation survives, but the scene is too dark and has no usable focal lighting.
- Pond close-up: the location works as a blockout; rails float, support is absent, and the bridge does not yet read as a structurally credible crossing.
- Island inspect: reduced depth is visible in overview, but the close-up target does not expose the full side and the terrain still reads as layered slab geometry.
- Browser console: 0 JavaScript errors; repeated Three.js `Clock` and `PCFSoftShadowMap` deprecation warnings.

## Technical verification

- Targeted ESLint for `ResetIsland.tsx`, `ResetComposition.tsx`, and the reset route: passed.
- `npm run build`: passed; `/rebuild-reset` prerendered successfully.
- `npm run lint`: failed on pre-existing repository-wide debt (55 errors, 33 warnings); no new spike-file lint error.
- `git diff --check`: passed.
- The tracked dev server and exact repo-local orphan child were stopped; port 3000 was released.

## Verdict: PARTIAL

### Validated in iteration 3

- The oversized black cliff was materially reduced.
- Pond/bridge moved into a distinct right-foreground secondary zone.
- House, pergola, and pond now form a clearer screen-space triangle.

### Still failed

- Island top and side remain broad, crude slab geometry rather than intentional terrain.
- Pergola, house, pond bank, and bridge are placeholders, not production assets.
- Night lighting hides structure instead of creating focal hierarchy.
- Pond bank is too regular, bridge support is absent, and close-up material response is flat.
- Final art approval remains impossible without verified image references.

## Next visual question

Keep `/rebuild-reset` separate. Next fix the night focal-light system and create a stable side-inspection target before another terrain pass. Do not restore unapproved legacy assets.
