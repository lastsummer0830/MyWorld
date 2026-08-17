/**
 * Deterministic capture states for `/capability-eval/dog-skill-on`.
 *
 * The stage box is a fixed pixel size and the camera is orthographic with a
 * fixed zoom, so the same query string always frames the scaffold identically
 * regardless of window size.
 */

export const DOG_EVAL_VIEWS = [
  "front",
  "left",
  "right",
  "three-quarter",
  "back",
] as const;

export type DogEvalView = (typeof DOG_EVAL_VIEWS)[number];

/** `right` matches the side of the dog shown in the real pet photo. */
export const DEFAULT_VIEW: DogEvalView = "right";

/** Fixed capture box in CSS pixels. Framing depends on this staying constant. */
export const STAGE_SIZE = { width: 960, height: 720 } as const;

/** Orthographic pixels per scaffold unit. 960/118 = 8.14 units across. */
export const STAGE_ZOOM = 118;

export const STAGE_TARGET: [number, number, number] = [0, 2.35, -0.4];

const DISTANCE = 14;

function orbit(
  azimuthDeg: number,
  elevationDeg: number,
): [number, number, number] {
  const azimuth = (azimuthDeg * Math.PI) / 180;
  const elevation = (elevationDeg * Math.PI) / 180;
  const horizontal = Math.cos(elevation) * DISTANCE;
  return [
    STAGE_TARGET[0] + Math.sin(azimuth) * horizontal,
    STAGE_TARGET[1] + Math.sin(elevation) * DISTANCE,
    STAGE_TARGET[2] + Math.cos(azimuth) * horizontal,
  ];
}

/**
 * The dog faces +Z and its own right side is -X, so `right` places the camera
 * at -X and the dog reads facing screen-right exactly as in the photo.
 */
export const VIEW_CAMERAS: Record<DogEvalView, [number, number, number]> = {
  front: orbit(0, 0),
  left: orbit(90, 0),
  right: orbit(-90, 0),
  "three-quarter": orbit(-40, 15),
  back: orbit(180, 0),
};

export function parseView(raw: string | string[] | undefined): DogEvalView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return DOG_EVAL_VIEWS.includes(value as DogEvalView)
    ? (value as DogEvalView)
    : DEFAULT_VIEW;
}

export function parseFlat(raw: string | string[] | undefined): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "1";
}
