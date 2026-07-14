// 낮/밤 두 벌의 분위기 팔레트 — 하늘·빛·안개 색의 유일한 정본.
// 낮은 "따사롭게 내리쬐는 햇살", 밤은 "따뜻한 알전구가 켜진 꿈같은 하늘"이 목표다.
// 검정은 쓰지 않는다. 어두운 색이 필요하면 검정이 아니라 "그늘진 같은 색"으로 간다.

import * as THREE from 'three';

export type Mood = {
  skyTop: string;
  skyBottom: string;
  fog: string;
  sun: string;
  sunIntensity: number;
  ambient: string;
  ambientIntensity: number;
  cloud: string;
};

export const DAY: Mood = {
  skyTop: '#79C4EE',
  skyBottom: '#FFE7CF',
  fog: '#DCEBF2',
  sun: '#FFF2D9',
  sunIntensity: 1.35,
  ambient: '#CFE4F2',
  ambientIntensity: 0.62,
  cloud: '#FFFFFF',
};

// 밤의 원리: 하늘빛을 거의 꺼서 씬을 어둠에 담그고, 빛나는 것들(반딧불이·알전구)만 살린다.
// 달빛을 밝게 두면 "파랗기만 한 낮"이 된다 — 반딧불이가 진짜 광원으로 읽히려면 주변이 어두워야 한다.
export const NIGHT: Mood = {
  skyTop: '#232647',
  skyBottom: '#3E3558',
  fog: '#2E2C4A',
  sun: '#8FA0D8', // 달빛 — 형태만 겨우 읽히는 정도
  sunIntensity: 0.22,
  ambient: '#4A4870',
  ambientIntensity: 0.2,
  cloud: '#5C5680',
};

/** 낮(0) ↔ 밤(1) 사이를 오가는 색. 전환은 이 함수 하나로만 만든다. */
export const moodColor = (out: THREE.Color, key: keyof Mood, t: number) => {
  const a = new THREE.Color(DAY[key] as string);
  const b = new THREE.Color(NIGHT[key] as string);
  return out.copy(a).lerp(b, t);
};

export const moodNumber = (key: 'sunIntensity' | 'ambientIntensity', t: number) =>
  THREE.MathUtils.lerp(DAY[key], NIGHT[key], t);
