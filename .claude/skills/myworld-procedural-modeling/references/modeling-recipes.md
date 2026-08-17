# Modeling recipes and visual gates

These are construction recipes, not fixed source code. Adapt ratios to the assigned reference and current scene scale.

## Flower quality floor
Reference: `idea_resources/요소/b8b8f32ae3776982c8ada5a3693bbeb1.jpg`

### Required construction
- A tapered or curved stem with visible nodes, not one constant-radius cylinder.
- Leaves attached at authored heights and directions. Each leaf needs a tapered outline, orientation/fold, and readable attachment.
- A flower head built from layered blossom/petal/calyx elements whose scale and opening change along the head.
- Distinct depth between central and outer petal layers.
- Controlled family variants: at minimum growth stage, head lean, leaf arrangement, and color balance vary.
- Plane/value changes inside one palette so petals do not collapse into one flat blob.

### Fail
Cone or sphere flowers; identical radial petals; stem with disconnected leaves; one copied flower rotated many times; color noise without structural variation.

## Tree quality floor
Reference: `idea_resources/요소/0c8a56239f696f395fbf8b35c6aefd9b.jpg`

### Required construction
- Root flare or exposed root forms that anchor the trunk to terrain.
- Trunk taper and an explicit skeleton: trunk → primary branches → secondary branches.
- Branch radii decrease toward tips, and junctions overlap intentionally without looking pasted on.
- Several asymmetric macro canopy masses with designed gaps; smaller clusters reinforce those masses.
- Canopy silhouettes are lobed or faceted, not perfect spheres or repeated cones.
- A restrained color/value family distinguishes lit planes, shaded planes, and selected clusters.
- At least one deliberate asymmetry in lean, branch reach, or canopy weight.

### Fail
One cylinder trunk; Y-shaped sticks with no secondary hierarchy; sphere/cone canopy; floating foliage; identical clusters distributed uniformly; roots absent at a visible close-up.

## Terrain and rock
- Start from the intended top contour and underside silhouette, not stacked cylinders or a thick extruded puck.
- Separate grass-cap edge, soil transition, and rock planes only where the reference supports them.
- Use broad authored planes, ledges, and fissures. Noise may perturb a designed form but cannot design the form.
- Inspect from overview and at least two close angles to catch cake-layer bands, vertical skirts, and repeated facets.

## Structures and props
- Identify load-bearing and connecting parts before decoration.
- Expose thickness, joins, supports, and ground contact where visible in the reference.
- Rounded edges are optional style decisions, not a substitute for proportion or construction.
- A prop should retain its identity as an untextured silhouette before decals or glow.

## Animal gate
Read `animal-scaffold-eval.md` before animal work. It controls reference classification, normalized landmarks, silhouette budgets, geometry-span limits, wrong-species tests, fixed views, and the stage-1 verdict. Do not use generic capsule anatomy or a long convenience loft/sweep as a final visible silhouette.

### Mandatory staged construction
1. **Evidence and landmarks:** classify canonical/style/rejected sources; record normalized direct, inferred, and anti-landmarks before coordinates or geometry.
2. **Skeleton and silhouette shell only:** neutral standing pose, untextured single-value material, visible shoulder/elbow/wrist/pastern/paw and hip/stifle/hock/rear-pastern/paw changes, four stable contacts, authored ear/tail silhouettes, and only the major coat-outline planes needed for breed read.
3. **Worker anti-species check:** inspect fresh shaded and flat fixed views. Revise instead of reporting ready if any view reads as another species or contains a neck stalk, box muzzle, horn ear, chest egg/pouch, stick leg, or detached tail.
4. **Hermes silhouette gate:** fresh fixed-camera front, left, right, three-quarter, back, and flat captures. Stop here until Hermes compares them with the canonical contact sheet. A compiler pass, part count, or numeric ratio table cannot unlock the next stage.
5. **Face refinement:** after anatomy passes, refine skull, stop, muzzle root/taper, cheeks, eyes, ear folds, neck/ruff, feathering, pants, and tail plume. Render the same views plus a face close-up.
6. **Markings:** only after face and coat silhouette pass, apply authored surface-following markings from the real animal. Then render day/night and reference side-by-side evidence.

### Blue-merle Shetland Sheepdog gate
Canonical subject: the user's actual blue-merle Shetland Sheepdog with heterochromia. Use the dog entries in `myworld-visual-implementation/references/reference-map.md`; generic stylized dogs are technique references only.

Required traits:
- compact wedge head with visible skull/cheek mass, modest stop, and a muzzle that tapers without reading as a rat, anteater, deer, llama, or borzoi;
- separated semi-prick ears with broad bases and the top quarter folding forward, never tall curved horns;
- small integrated almond eyes with dark rims, pupil and restrained highlight; confirm heterochromia side from the actual face reference before final capture;
- short sloped neck under a layered ruff that flows over chest and shoulders without becoming an oval pillow or balloon;
- horizontal ribcage/loin/croup with tucked belly and breed-specific long-coat silhouette;
- front and rear legs with different joint rhythms, enough width to carry weight, readable paws, feathering, and four contacts;
- a broad feathered tail emerging continuously from the croup and carried low;
- deterministic blue-merle, black, tan, blaze, ruff, chest, sock, and tail markings that follow coat surfaces rather than rectangular decals or giant pixel blocks.

Hard fail: another-species silhouette; any convenience loft/sweep spanning more than one anatomical region; giant chest egg/pouch/bib; visible upright neck stalk; stacked-box or tube muzzle; stick/cone/capsule legs; missing joints or paws; horn ears; detached blob/hose tail; sticker eyes; random/noise markings; detailing before the silhouette gate; or any report that calls the dog acceptable without fresh multi-view Hermes renders.

## Render evidence
Minimum evaluation set for a promoted asset:
1. clean overview in day;
2. clean overview in night when the asset is visible at night;
3. close-up from product camera family;
4. second close angle revealing attachments and backside silhouette;
5. reference side-by-side or contact sheet;
6. browser console, lint, and build results.

A visual pass requires Hermes inspection. Claude's self-report is diagnostic evidence only.
