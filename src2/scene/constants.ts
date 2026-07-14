// 아이소메트릭 씬의 기하 상수 — 섬의 크기·윤곽과 카메라 각도의 유일한 정본.
// 여기 값을 바꾸면 씬 전체의 문법이 바뀐다. 개별 컴포넌트에서 각도·거리를 다시 계산하지 않는다.

import * as THREE from 'three';

/** 월드 1유닛 = 1m. 오브젝트 배치는 이 단위로 생각한다. */
export const TILE = 1;

/**
 * 정원 섬의 평균 반경 → 지름 44m.
 * ★ 이 섬이 주인공이다. 바깥 하늘·구름·부유섬은 배경 — 첫 화면에서 섬이 화면을 지배해야 한다.
 * 44m면 퍼걸러(6m)·연못(10m)·집 외관(8m)이 다 들어가고 강아지가 뛸 여백이 남는다.
 */
export const ISLAND_R = 22;

/** 윤곽의 각도 분할 수. 잔디·흙·밑동이 모두 이 수로 쪼개져야 이음새가 안 보인다. */
export const ISLAND_SEG = 72;

/**
 * 유기적 윤곽 — 각도 a에서 섬의 반경.
 * 낮은 주파수의 사인 4개를 겹쳐 매끄럽고 불규칙한 가장자리를 만든다.
 * ★ 난수를 쓰지 않는 이유: 각도에 대해 항상 같은 값이 나와야 잔디·흙·밑동의 윤곽이 정확히 포개진다.
 *   (난수를 쓰면 세 층의 가장자리가 미세하게 어긋나 틈이 보인다.)
 */
export const islandRadius = (a: number) =>
  ISLAND_R *
  (1 +
    0.062 * Math.sin(a * 2 + 0.6) +
    0.042 * Math.sin(a * 3 - 1.9) +
    0.026 * Math.sin(a * 5 + 2.3) +
    0.014 * Math.sin(a * 7 - 0.4));

/** 최대 반경 — 카메라 배율을 잡을 때 이 값을 기준으로 해야 섬이 화면 밖으로 삐져나가지 않는다. */
export const ISLAND_R_MAX = ISLAND_R * 1.145;

/** 오브젝트를 안전하게 놓을 수 있는 반경(가장 좁은 지점보다 안쪽). 배치는 이 원 안에서만. */
export const ISLAND_R_SAFE = ISLAND_R * 0.82;

/** 잔디층 두께. */
export const GRASS_H = 0.9;

/** 흙 단면 두께 — 가장자리가 층으로 보여야 "땅을 도려내 온 조각"으로 읽힌다. */
export const SLAB_H = 2.6;

/** 잔디 윗면 모서리를 굴리는 양. 각진 모서리는 "코드로 대충 만든 티"의 주범이다. */
export const GRASS_BEVEL = 0.22;

/** 바위 밑동의 길이. 길면 화면 아래를 잡아먹고, 짧으면 섬이 아니라 접시가 된다. */
export const BASE_H = 19;

/** 카메라 거리. ortho라 크기에는 영향이 없고, 잘림(near/far) 여유를 만드는 값이다. */
export const CAM_D = 20;

/**
 * 내려보는 각 30° (게임식 2:1 디메트릭).
 * ★ 아이소메트릭 룩을 만드는 건 "카메라를 고정하는 것"이 아니라 "직교 투영(원근 왜곡 없음)"이다.
 *   그래서 마우스로 360° 돌려도 미니어처 느낌은 유지된다. 부각만 이 값으로 잠근다.
 */
export const CAM_ELEV_DEG = 30;
const ELEV = THREE.MathUtils.degToRad(CAM_ELEV_DEG);

/** OrbitControls의 polar angle(+Y축 기준)로 환산한 값. 이 각으로 상·하를 잠근다. */
export const CAM_POLAR = THREE.MathUtils.degToRad(90 - CAM_ELEV_DEG);

/** 초기 카메라 위치 — 수평 45°, 부각 30°. */
export const CAM_POS: [number, number, number] = [
  CAM_D,
  CAM_D * Math.SQRT2 * Math.tan(ELEV),
  CAM_D,
];

/**
 * 첫 화면의 배율 — 섬이 화면 가로를 꽉 채우게 잡는다.
 *
 * 부각 30° 카메라에서 화면에 맺히는 크기:
 *   - 수평면의 깊이(z)는 sin(30°)=0.5배로 눌리고, 가로(x)는 그대로다 → 원이 납작한 타원으로 보인다.
 *   - 높이(y)는 cos(30°)=0.866배로 보인다.
 * ★ 원형 섬의 이점: 어느 각도로 돌려도 화면상 가로폭이 항상 지름으로 일정하다(사각 판은 회전하면 √2배로 커진다).
 *
 * 밑동은 세로 계산에서 뺐다 — 화면 아래로 잘려 나가도 된다.
 * 밑동까지 화면에 넣으려 하면 정작 정원이 작아진다. "섬이구나"는 축소하면 드러난다.
 */
export const fitZoom = (w: number, h: number) => {
  const sceneW = ISLAND_R_MAX * 2;
  const sceneH = ISLAND_R_MAX * 2 * Math.sin(ELEV) + (GRASS_H + SLAB_H) * Math.cos(ELEV);
  // 0.98 = 가장자리가 화면에 딱 붙어 잘리지 않을 만큼의 최소 여백.
  return Math.min(w / sceneW, h / sceneH) * 0.98;
};

/** 휠 확대 범위 — 기본 배율 대비 배수. 축소 쪽을 넉넉히 열어 섬 전체·구름까지 물러날 수 있게 한다. */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 5.0;

/** 오브젝트를 클릭해 "안으로 들어갔을 때"의 배율. */
export const ZOOM_FOCUS = 2.6;

/**
 * 주광 위치 — 두 면의 명암이 갈려야 입체감이 생긴다.
 *
 * ★ 높이(y)를 낮게 잡는 게 핵심이다. 해가 머리 위에 있으면(y가 크면)
 *   ① 그림자가 발밑에 눌려 짧아지고 ② 햇살 빛기둥이 화면에서 수직으로 서서 밋밋해진다.
 *   부각 약 39°의 오후 해로 두면 그림자가 길게 눕고 빛이 화면을 비스듬히 가로지른다 — 그게 "따사로움"이다.
 * ★ 여기 y를 바꾸면 지면에 닿는 빛의 양(= 입사각)이 함께 바뀌므로 palette의 sunIntensity도 다시 맞춰야 한다.
 */
export const SUN_POS: [number, number, number] = [-30, 26, -12];

/** 그림자 프러스텀이 덮어야 할 범위. 섬 전체 + 여유. */
export const SHADOW_SPAN = ISLAND_R_MAX * 1.3;

/** 좌표를 1m 격자에 맞춘다. */
export const snap = (v: number) => Math.round(v / TILE) * TILE;
