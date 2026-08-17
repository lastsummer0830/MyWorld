# dog-skill-on-eval — AJP-004 Skill-ON baseline, stage 1

Isolated capability-evaluation spike. **Not production.** Nothing here is
approved; this is the first judgeable anatomy scaffold and nothing more.

## Reference actually used

Single visual authority:

- `/mnt/c/Users/ONE/Documents/GitHub/Lucario/MyRoom/Pick/2026-08-01_비교_모델vs사진.png`
  — **right-hand real pet photo only** (blue-merle Shetland Sheepdog standing,
  seen from its right side, head turned toward the camera).

Inspected only to enumerate failures to avoid:

- `/mnt/c/Users/ONE/Documents/GitHub/Lucario/MyRoom/Pick/2026-08-01_강아지_4면도.png`
  — rejected model contact sheet. The left-hand model in the comparison image is
  part of the same rejected set.

No existing dog, product, or other capability-eval source was read, imported, or
copied. This directory has no dependency on any other spike.

### Traits taken from the real photo

| Observed in photo | Encoded in the scaffold |
| --- | --- |
| Total height (ear tip → ground) ≈ 1.32 × withers height | ear tip y = 4.60, withers y = 3.55 → 1.30 |
| Head reads small and compact against the coat mass | head length 1.60 = 0.45 × withers height |
| Muzzle is modest and blunt, roughly half the head | skull z +1.28 → +2.06, muzzle +2.08 → +2.88 |
| Skull has real cheek/zygomatic width | skull half-width 0.40 at the cheek (0.50 × head length) |
| Small ears set high and wide, tips folding forward | ear height 0.58 = 0.36 × head length, base gap 0.16 |
| Neck barely visible, swallowed by a layered mane | neck length 1.06 at ~40°, three overlapping ruff masses |
| Body reads long and horizontal, not egg-shaped | coat mass ≈ 4.0 long × 2.0 tall; chest depth 1.64 > width 1.20 |
| Brisket/elbow at about half the withers height | elbow y = 1.80, brisket y = 1.84 (0.51 × withers) |
| Only the lower legs show below the coat | skirt lower edge y ≈ 1.55, so ~1.55 of visible leg |
| Tail low, thick, reaching roughly hock height | tail set y = 2.48, tip y = 1.05, hock y = 1.16 |

### Failures from the rejected sheet that this scaffold is built against

Upright llama neck with the head far above the shoulders; one giant chest egg
with stubs underneath; tall curved horn ears; one nose-to-tail tube; stick legs
without shoulder, thigh, or joint mass; flat flap tail.

## Part graph

44 independent solids (9 axial + 28 mirrored limb masses + 7 coat masses). Each
is its own authored cross-section stack; there is no
single nose-to-tail loft and no capsule primitives.

```
trunk      ribcage ── loin ── croup ── tail
head       skull ── cheek ── muzzle ── lower-jaw
           ear-left / ear-right          (broad base, top third folded forward)
neck       neck                          (short, sloped, under the ruff)
fore limb  scapula → upper-arm → elbow → forearm → carpus → fore-pastern → fore-paw   (×2)
hind limb  thigh → stifle → lower-thigh → hock → rear-pastern → rear-paw              (×2)
coat       ruff-collar (inner) ── chest-frill + apron (outer) ── shoulder-cape
           side-skirt (×2) ── rear-pants (×2)
```

Joint rhythms differ front and rear by construction: the front column is
scapula(45° laid back) → humerus down-and-back → near-vertical forearm →
slightly forward pastern; the rear column is femur down-and-forward to a stifle
ahead of the hip → tibia down-and-back → angular rearward-projecting hock →
vertical metatarsus.

Coat masses are anchored, not floating: the frill overlaps the prosternum, the
collar overlaps the neck and withers, the cape bridges withers to side skirt,
and the pants overlap the thigh. There is no detached chest pillow.

## Geometry choices

`sectionSolid.ts` sweeps a superellipse ring through authored world-space
section centres, deriving a stable frame per ring from the local tangent.

- Superellipse `roundness` gives deliberate plane breaks: 2.4–2.5 for soft body
  masses, 2.8–3.4 for angular joints (elbow, carpus, stifle, hock) and paws,
  3.0 for the flat-topped skull wedge.
- `lowerWidthScale` keels the ribcage underline; `lowerHeightScale` lifts the
  loin into a belly tuck.
- `axisUp: [0,0,1]` is used for near-vertical sweeps (limbs, ears, frill) so the
  ring frame does not degenerate.
- Non-indexed triangles + `flatShading` keep the low-poly facet read.
- Limbs are mirrored by negating section-centre X, which preserves winding.

Rings are 12 segments by default — enough to carry taper, too few to look
smooth-organic.

## Explicit stage-1 exclusions

None of the following exist in this spike, by contract:

eyes; nose material; any face detailing; markings; blue-merle or any coat
colour; fur strands or feathering detail; animation; night mood; bloom;
particles; scene decoration; production integration.

Everything renders in one neutral value (`#c6c9cd` clay, or `#14181d` unlit in
flat mode).

## Routes

`/capability-eval/dog-skill-on`

| Query | Values | Default |
| --- | --- | --- |
| `view` | `front`, `left`, `right`, `three-quarter`, `back` | `right` |
| `flat` | `0`, `1` | `0` |

Determinism: fixed 960 × 720 stage box, orthographic camera at zoom 118, fixed
target `(0, 2.35, -0.4)`, distance 14, `dpr={2}`, no orbit controls, no
animation loop content, world-fixed lights. `preserveDrawingBuffer` is on so the
canvas can be captured directly. The state label sits inside the capture box;
the state links sit outside it.

Axis convention: the dog faces `+Z`, so its own right side is `-X`. `view=right`
therefore shows the same side as the real photo, with the dog facing screen-right.

The ten capture states are:

```
?view=front&flat=0          ?view=front&flat=1
?view=left&flat=0           ?view=left&flat=1
?view=right&flat=0          ?view=right&flat=1
?view=three-quarter&flat=0  ?view=three-quarter&flat=1
?view=back&flat=0           ?view=back&flat=1
```

## Unverified and known risks

- **No render has been inspected.** No screenshot of this route has been taken
  or compared with the reference. Lint/typecheck results say nothing about how
  it looks. Hermes owns the fresh capture and the verdict.
- The coat masses are the highest risk: the frill (1.64 wide) plus side skirts
  (1.92 wide) could still read as a rounded blob from `front` and `back`, which
  is the exact failure mode of the rejected model. The intended defence is that
  the widest point is mid-ribcage rather than the chest, and that ~1.55 units of
  leg stay visible below the skirt. This needs a real front-view render.
- The three ruff layers may merge into one silhouette under flat shading; the
  layering may only read in the shaded view.
- The stop is only a 0.08 centreline drop plus a radius step. It may be too
  subtle to read at this camera zoom.
- Ear proportion is the second-highest risk. They are deliberately small to
  avoid the horn failure and may now read as too small or too fused into the
  skull from `front`.
- Overlaps are authored by coordinate, not booleaned. Interpenetration seams may
  be visible at joints in flat mode.
- Paws are compact ovals with no toe articulation. Ground contact is exact
  (`y = 0`) but the contact may read soft under the directional shadow.
- Values were derived by eye from a single three-quarter photo, so true body
  length is inferred from breed proportion rather than measured; the profile may
  be longer or shorter than the real dog.
