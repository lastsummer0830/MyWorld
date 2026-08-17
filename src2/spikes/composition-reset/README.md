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
4. Added reset-only warm pergola bulbs and localized spill, restrained cool pond fill, and per-target inspect framing using two verified night-pergola photographs as lighting references.

## Render evidence

- A verified fresh MyWorld `next-server` served `/rebuild` and `/rebuild-reset` with HTTP 200.
- Day overview: the rock side no longer dominates the lower frame, and pond/bridge no longer intersects the pergola mass.
- Night overview: pergola now reads as the warm primary focus, pond remains a restrained cool secondary, and house stays tertiary without washing the island.
- Pond close-up: the location works as a blockout; rails float, support is absent, and the bridge does not yet read as a structurally credible crossing.
- Island inspect: per-target framing now exposes the near contour and grass/soil/rock layers together; night still merges the dark side layers.
- Pergola close-up: seven small emitters remain localized and the table/posts/ground receive warm spill without the final frame washing out the white beams.
- Browser console: 0 JavaScript errors in the final day/night and inspect captures.

## Technical verification

- Targeted ESLint for `ResetIsland.tsx`, `ResetComposition.tsx`, and the reset route: passed.
- `npm run build`: passed; `/rebuild-reset` prerendered successfully.
- `npm run lint`: failed on pre-existing repository-wide debt (55 errors, 33 warnings); no new spike-file lint error.
- `git diff --check`: passed.
- The tracked dev server and exact repo-local orphan child were stopped after fresh-render verification; port 3000 was released.

## Verdict: PARTIAL

### Validated in iteration 3

- The oversized black cliff was materially reduced.
- Pond/bridge moved into a distinct right-foreground secondary zone.
- House, pergola, and pond now form a clearer screen-space triangle.
- Reset night now has a usable warm pergola primary and restrained cool pond secondary.
- Per-target inspection provides a stable island-side evidence frame.

### Still failed

- Island top and side remain broad, crude slab geometry rather than intentional terrain.
- Pergola, house, pond bank, and bridge are placeholders, not production assets.
- Night island-side layers still merge into a dark slab outside the focal pool.
- Pond bank is too regular, bridge support is absent, and close-up material response is flat.
- Final art approval remains impossible without verified terrain and asset image references.

## Next visual question

Keep `/rebuild-reset` separate. Next use the stable island-side inspect to redesign the grass/soil/rock silhouette as intentional terrain, then rebuild pond-bank and bridge support behind their own reference and close-up gates. Do not restore unapproved legacy assets.
