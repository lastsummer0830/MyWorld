# Reference-to-scaffold animal eval

Use this procedure for the first judgeable animal silhouette. It is deliberately stricter than a generic low-poly recipe: many connected parts can still form the wrong species.

## 1. Declare evidence limits

For every source image, record:
- whether it is the real subject, an approved style reference, or rejected failure evidence;
- view (`front`, `profile`, `three-quarter`, `back`) and visible side;
- occluded landmarks and perspective distortion;
- which claims are directly observed versus inferred.

A single three-quarter image does not prove hidden-side, front, or back anatomy. Build those views for gross silhouette checking, but label inferred traits `unverified`. Never fill gaps from a rejected model.

## 2. Make a normalized landmark card before code

Use ground-to-withers height `W = 1.0`. Record image-derived ranges rather than isolated world coordinates:

- ground, paw fronts/backs, carpus/hock, elbow/stifle, brisket, withers, croup;
- shoulder front, ribcage rear, point of buttock, tail root/tip;
- skull back/top/base, stop, muzzle root/tip, ear bases/tips;
- outline samples for topline, underline, ruff edge, belly/coat edge, rear pants, and tail.

The card must include:
1. `direct`: landmarks visible in the canonical real-subject image;
2. `inferred`: hidden-view estimates with uncertainty;
3. `anti-landmarks`: the rejected model's wrong extrema (for example horn tip, chest-egg bottom, detached tail bend).

Do not start mesh construction until this card exists in the eval README or source comments.

## 3. Build a screen-space silhouette budget

Before choosing geometry, state what each fixed view must read at thumbnail size.

### Profile
- one low horizontal canine body line, not a saddle-backed tube;
- head joined to the shoulder by a short concealed neck/ruff transition;
- compact skull-to-muzzle wedge, not a rectangular snout on a stalk;
- front and rear legs with different bend rhythms and weight-bearing paw width;
- tail continuous with the croup and carried low.

### Front
- skull and paired ears remain wider and more informative than the muzzle tip;
- ears are short triangles with broad separated bases and forward-folded tips;
- ruff is a tapered layered shield around a narrower chest, never one oval/egg/pouch;
- paired forelegs emerge from shoulder width and end in visible paws; they are not two sticks under a ball.

### Three-quarter
- head, ruff, ribcage, limbs, and tail overlap in a readable depth order;
- muzzle root remains integrated with cheek/skull mass;
- near and far legs do not collapse into a single post.

### Back
- croup, rear pants, hock rhythm, and tail root remain distinct;
- tail is not a detached flap, hose, ring, or hanging polygon bundle.

## 4. Select geometry by anatomical span

One convenience generator must not span more than one anatomical region. In particular:
- no nose-to-tail, skull-to-muzzle, neck-to-chest, trunk-to-tail, or hip-to-paw loft;
- no long section sweep used merely because it can pass through many coordinates;
- no separate lower-jaw box that turns a tapered canine muzzle into stacked cartons;
- no curved ear tube or swept spike; construct a broad-base ear plane/wedge and a short folded tip;
- no coat mass whose front/back silhouette is a closed egg.

Prefer a small number of authored faceted solids with explicit attachment planes:
- skull wedge + cheek planes + short tapered muzzle;
- ribcage + loin + croup with shared overlap but distinct outline roles;
- shoulder/upper arm/forearm/pastern/paw and thigh/stifle/lower thigh/hock/rear pastern/paw;
- two or three open-edged ruff/coat planes that follow the body instead of surrounding it as a balloon;
- tail root, descending body, and tapered tip with continuous tangent and overlap.

A hidden support primitive is allowed. A visible primitive silhouette must be intentionally reshaped.

## 5. MyWorld blue-merle Shetland Sheepdog floor

Canonical real-subject evidence:
`/mnt/c/Users/ONE/Documents/GitHub/Lucario/MyRoom/Pick/2026-08-01_비교_모델vs사진.png` (real photo on the right only).

Rejected evidence:
`/mnt/c/Users/ONE/Documents/GitHub/Lucario/MyRoom/Pick/2026-08-01_강아지_4면도.png` and every rendered model panel in the comparison sheet.

Observed constraints from the real photo:
- compact Sheltie scale: long-coat body reads horizontal and low, with no exposed upright neck;
- head is a compact wedge carried only modestly above the withers/ruff, not far forward on a stalk;
- muzzle is shorter than the skull/cheek region, starts broad, and tapers to a blunt nose;
- ear height above the skull is small relative to head length; bases are broad and tips fold forward;
- chest coat falls in layered points and side planes, leaving a body/leg relationship; it is not a smooth pendant oval;
- lower legs and paws are short but weight-bearing, with coat feathering represented only as major silhouette planes at this stage;
- tail begins broadly at the croup and falls as a tapered plume, never as a detached rear blob.

Starting ranges are hypotheses to test in the render, not proof:
- crown-to-nose head length: `0.36–0.44 W`;
- muzzle portion: `0.40–0.48` of head length;
- ear rise above skull: `0.11–0.16 W`;
- visible neck gap between ruff and skull: `0–0.08 W`;
- brisket/coat bottom: approximately elbow level, never near the paws;
- visible lower foreleg: at least `0.27 W` including paw;
- paw width: at least `1.35×` the narrowest pastern width in front view.

If a range-compliant render reads as donkey, llama, deer, anteater, borzoi, goat, or sheep, it fails immediately. Visual species identity outranks the table.

## 6. Stage-1 exclusions and required modes

Stage 1 includes only neutral single-value silhouette construction:
- anatomy masses, major coat-outline planes, ears, paws, and tail;
- no eyes, nose color, mouth line, markings, merle pattern, fur strands, animation, scene integration, bloom, or decorative lighting.

Provide two deterministic render modes from the same geometry:
1. neutral shaded clay to reveal planes and attachments;
2. unlit flat silhouette to reveal the outline without material rescue.

Capture `front`, `left`, `right`, `three-quarter`, and `back` with orthographic cameras at one scale. Keep the prior failed route intact and create a new route for a redesign eval.

## 7. Pre-report anti-species test

Before returning control to Hermes, run the bounded capture command from the Hermes worker contract, open the generated contact sheet and relevant full-size PNGs with `Read`, and answer yes/no with observed image evidence. Do not infer this checklist from source code or coordinates:

- Does the head attach without a visible upright neck stalk?
- Is the muzzle a continuous compact wedge rather than a box or tube?
- Are both ears short, broad-based, separated, and folded rather than horn-like?
- Does the front silhouette avoid an egg, pouch, bib, or bell shape?
- Do fore and hind limbs have different joint rhythms and visible paws?
- Does the tail emerge continuously from the croup without a detached blob?
- At thumbnail size, does every view read as a small long-haired dog before any markings or eyes?

Any `no` means the checkpoint is not ready. Revise within the allowed eval paths, render again under a new unique tag, and re-open the images; do not add details to disguise it. The final worker report must name the inspected contact sheet and the last revision's visible remaining failures.

## 8. Hermes verdict rubric

Critical zero-tolerance gates:
- correct small-dog species read in front/profile/three-quarter;
- no horn ears, chest egg/pouch, neck stalk, box muzzle, stick legs, or detached tail;
- four plausible contacts and distinct front/rear joint rhythms.

Secondary gates:
- coat planes reinforce rather than hide anatomy;
- faceting is authored and consistent;
- inferred views remain plausible and are labeled unverified.

`VALIDATED` means stage-1 silhouette only. It does not authorize face, markings, animation, or production integration.