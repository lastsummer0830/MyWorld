// 아이소메트릭 씬의 기하 상수 — 카메라 각도와 타일 단위의 유일한 정본.
// 여기 값을 바꾸면 씬 전체의 문법이 바뀐다. 개별 컴포넌트에서 각도·거리를 다시 계산하지 않는다.

/** 월드 1타일 = 1 유닛. 모든 오브젝트의 발밑 좌표는 이 격자에 스냅한다. */
export const TILE = 1;

/** 디오라마 바닥판 한 변의 타일 수. */
export const GRID = 10;

/** 바닥판 두께 — 가장자리가 보여야 "케이크 단면" 같은 디오라마 감이 산다. */
export const SLAB_H = 0.4;

/** 카메라 거리. ortho라 크기에는 영향이 없고, 잘림(near/far) 여유를 만드는 값이다. */
const CAM_D = 20;

/**
 * 트루 아이소메트릭: 수평 45°, 내려보는 각 = atan(1/√2) ≈ 35.264°.
 * y 계수 0.8165(= 1/√1.5)가 그 각을 만든다. 프로젝트 전체가 이 각 하나로 통일된다.
 */
export const CAM_POS: [number, number, number] = [CAM_D, CAM_D * 0.8165, CAM_D];

/** 화면이 작아지면 zoom을 비례해 낮춘다 — 모바일에서 씬이 잘리지 않게. */
export const ZOOM_BASE = 62;
export const ZOOM_REF_PX = 900;

/** 주광 위치 — 카메라 반대편 위. 두 벽의 명암이 갈려야 입체감이 생긴다. */
export const SUN_POS: [number, number, number] = [-9, 14, -6];

/** 좌표를 타일 격자에 맞춘다. */
export const snap = (v: number) => Math.round(v / TILE) * TILE;
