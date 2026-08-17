/**
 * Deterministic camera states for /capability-eval/dog-skill-off.
 *
 * Everything here is fixed data: no orbit controls, no animation, no responsive
 * framing. The canvas is pinned to STAGE_WIDTH x STAGE_HEIGHT CSS pixels, and
 * R3F derives the orthographic frustum from that pixel size, so world units per
 * pixel are identical on every machine and every capture.
 *
 *   visible world height = STAGE_HEIGHT / zoom = 820 / 440 = 1.864
 *   visible world width  = STAGE_WIDTH  / zoom = 1100 / 440 = 2.500
 *
 * Scaffold bounds are roughly x [-0.89, 1.16], y [0, 1.51], z [+-0.35], so a
 * target of (0.15, 0.73, 0) leaves margin on every side in every view.
 */

export const VIEW_NAMES = [
  "front",
  "left",
  "right",
  "three-quarter",
  "back",
] as const;

export type ViewName = (typeof VIEW_NAMES)[number];

export const DEFAULT_VIEW: ViewName = "right";

export const STAGE_WIDTH = 1100;
export const STAGE_HEIGHT = 820;

export const CAMERA_TARGET: readonly [number, number, number] = [0.15, 0.73, 0];
export const CAMERA_ZOOM = 440;
export const CAMERA_DISTANCE = 8;

type ViewSpec = {
  /** Degrees, measured from +X (the dog's nose) rotating toward +Z (its right). */
  azimuth: number;
  /** Degrees above the ground plane. */
  elevation: number;
  note: string;
};

const VIEW_SPECS: Readonly<Record<ViewName, ViewSpec>> = {
  // True elevations at 0 degrees so the ground plane collapses to a single line
  // and proportions are readable without any foreshortening.
  front: { azimuth: 0, elevation: 0, note: "true front elevation" },
  right: { azimuth: 90, elevation: 0, note: "reference-matching side, nose at screen right" },
  left: { azimuth: -90, elevation: 0, note: "opposite side, nose at screen left" },
  back: { azimuth: 180, elevation: 0, note: "true rear elevation" },
  // The only raised view: needed to read all four ground contacts at once.
  "three-quarter": { azimuth: 40, elevation: 18, note: "front-right three-quarter, all four contacts visible" },
};

export type CameraState = {
  position: [number, number, number];
  zoom: number;
  note: string;
};

export function cameraFor(view: ViewName): CameraState {
  const spec = VIEW_SPECS[view];
  const az = (spec.azimuth * Math.PI) / 180;
  const el = (spec.elevation * Math.PI) / 180;
  const r = CAMERA_DISTANCE;

  return {
    position: [
      CAMERA_TARGET[0] + r * Math.cos(el) * Math.cos(az),
      CAMERA_TARGET[1] + r * Math.sin(el),
      CAMERA_TARGET[2] + r * Math.cos(el) * Math.sin(az),
    ],
    zoom: CAMERA_ZOOM,
    note: spec.note,
  };
}

export function parseView(raw: string | null): ViewName {
  const found = VIEW_NAMES.find((name) => name === raw);
  return found ?? DEFAULT_VIEW;
}

/** flat=1 switches to the unlit single-value silhouette read. */
export function parseFlat(raw: string | null): boolean {
  return raw === "1" || raw === "true";
}
