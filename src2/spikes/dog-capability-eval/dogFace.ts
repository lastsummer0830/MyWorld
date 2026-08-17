// AJP-004 dog capability eval — 눈 조각.
//
// 눈은 네 겹이다: 눈꺼풀 테 → 홍채 → 검은 동공 → 아주 작은 하이라이트.
// 각 겹은 앞 겹의 꼭대기보다 위에서 시작하도록 z를 벌려 둔다 — 안 그러면 동공이 홍채 안에 묻히거나
// z-fighting으로 깜빡인다. 총 돌출은 0.013H로, 각막이 살짝 부푼 정도다.
//
// 오분류 방지: **강아지 왼쪽(−z)이 파랑, 오른쪽(+z)이 짙은 갈색**이다(MyWorld 좌표 규약).
// 흰자를 만들지 않는다. 창백한 원반은 실패 조건이다.

import * as THREE from 'three';
import { domeDisc } from './loft';
import { EYE_PLACE } from './dogAnatomy';

export type EyeGeometry = {
  rim: THREE.BufferGeometry;
  iris: THREE.BufferGeometry;
  pupil: THREE.BufferGeometry;
  highlight: THREE.BufferGeometry;
  all: THREE.BufferGeometry[];
};

/** 눈 조각 넷. 로컬 프레임은 x = 눈초리 축, y = 위, z = 바깥이다. */
export function buildEyeGeometry(): EyeGeometry {
  // almond 지수 1.45 → 안팎 눈초리가 뾰족해진다. 1이면 그냥 타원(=인형 눈)이다.
  const rim = domeDisc(EYE_PLACE.len / 2, EYE_PLACE.height / 2, 0.005, 26, 1.45);
  const iris = domeDisc(0.0115, 0.0115, 0.0035, 20, 1);
  const pupil = domeDisc(0.0055, 0.0058, 0.0015, 16, 1);
  const highlight = domeDisc(0.0022, 0.0022, 0.0008, 12, 1);

  iris.translate(0, 0, 0.0055);
  pupil.translate(0, 0, 0.0098);
  // 하이라이트는 가운데가 아니라 위-앞으로 비껴 있어야 시선이 살아난다.
  highlight.translate(0.004, 0.005, 0.012);

  return { rim, iris, pupil, highlight, all: [rim, iris, pupil, highlight] };
}

/**
 * 눈 하나를 두개골 표면에 얹는 변환.
 * `side`: +1 = 강아지 오른쪽(+z), −1 = 왼쪽(−z).
 */
export function eyeTransform(side: 1 | -1): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
  const n = new THREE.Vector3(
    EYE_PLACE.outward[0],
    EYE_PLACE.outward[1],
    EYE_PLACE.outward[2] * side,
  ).normalize();

  // 긴 축은 앞아래를 향한다(안쪽 눈초리가 낮다). 법선 성분을 걷어내 표면에 눕힌다.
  const t = new THREE.Vector3(EYE_PLACE.axis[0], EYE_PLACE.axis[1], EYE_PLACE.axis[2]);
  t.addScaledVector(n, -t.dot(n)).normalize();
  const v = new THREE.Vector3().crossVectors(n, t).normalize();

  const position = new THREE.Vector3(
    EYE_PLACE.center[0],
    EYE_PLACE.center[1],
    EYE_PLACE.z * side,
  ).addScaledVector(n, 0.002);

  const m = new THREE.Matrix4().makeBasis(t, v, n);
  return { position, quaternion: new THREE.Quaternion().setFromRotationMatrix(m) };
}
