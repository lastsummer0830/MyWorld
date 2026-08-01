// 나비 떼의 **현재 위치**를 담아 두는 공유 판.
//
// ★ 왜 필요한가: 강아지가 나비를 쫓으려면 나비가 지금 어디 있는지 알아야 한다.
//   React state로 올리면 나비가 움직일 때마다(매 프레임) 리렌더가 돌아 씬 전체가 멈춘다.
//   그래서 프레임 루프끼리는 **모듈 스코프의 배열**로 주고받는다 — 렌더 트리를 거치지 않는다.
//
// 쓰는 쪽: Butterflies가 매 프레임 자기 자리를 적고, Dog의 두뇌가 읽는다.

import * as THREE from 'three';

/** index → 현재 위치. Butterflies가 마운트될 때 자리를 만들고 프레임마다 갱신한다. */
const swarm: THREE.Vector3[] = [];

/** 나비 한 마리의 자리를 확보한다. 반환된 벡터에 직접 써 넣으면 된다. */
export function claimButterflySlot(): THREE.Vector3 {
  const v = new THREE.Vector3();
  swarm.push(v);
  return v;
}

/**
 * (x, z)에서 가장 가까운 나비. 없거나 maxDist보다 멀면 null.
 * ★ 높이는 비교에서 뺀다 — 강아지는 땅 위를 달리므로 "얼마나 멀리 있나"는 수평 거리다.
 */
export function nearestButterfly(x: number, z: number, maxDist: number): THREE.Vector3 | null {
  let best: THREE.Vector3 | null = null;
  let bestD = maxDist * maxDist;
  for (const b of swarm) {
    const d = (b.x - x) ** 2 + (b.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}
