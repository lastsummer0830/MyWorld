// 재질의 유일한 정본 — MAT 팩토리.
//
// 왜 팩토리인가:
//   ① 같은 (프리셋 + 색) 조합은 인스턴스를 재사용한다. mesh마다 재질을 새로 만들면
//      셰이더 프로그램이 매번 컴파일되고 draw call이 배치되지 못한다(꽃 300송이면 300번).
//   ② 스타일 통일의 핵심은 roughness/metalness를 제멋대로 두지 않는 것이다.
//      스타일가이드 §3: roughness 0.7~1.0 고정대역, metalness 0. (glossy·glass·water만 예외)
//      이 대역을 지켜야 잔디·나무·천이 "같은 세계의 물건"으로 보인다.

import * as THREE from 'three';
import { COLOR, type ColorKey } from './palette';

export type Preset =
  | 'matte' //  기본 — 흙·나무·구조물
  | 'foliage' //  잎·잔디 — 빛을 거의 반사하지 않는다
  | 'rock' //  바위 — 각진 면(flatShading)으로 굴곡을 만든다
  | 'fur' //  털 — 바위와 같은 각진 면. 이유는 아래 ★ 참고
  | 'fabric' //  천 — 가장 거칠다
  | 'glossy' //  도자기·찻잔 — 대역 예외
  | 'glass' //  유리 — 반투명
  | 'water' //  물 — 반투명 + 매끈
  | 'glow'; //  스스로 빛나는 것 (반딧불이·알전구). 밤에 Bloom이 이걸 집어낸다.

type Spec = Partial<THREE.MeshStandardMaterialParameters> & { flatShading?: boolean };

const SPEC: Record<Preset, Spec> = {
  matte: { roughness: 0.88, metalness: 0 },
  foliage: { roughness: 0.95, metalness: 0 },
  rock: { roughness: 1.0, metalness: 0, flatShading: true },
  /**
   * ★ 털이 flatShading인 이유 (2026-08-01 · 강아지가 풍선으로 보인 원인 중 하나)
   *   이 정원의 꽃·잎·바위·나무는 전부 각진 면이 살아 있는 저폴리다. 그런데 강아지만
   *   매끈하게 셰이딩되니 혼자 다른 세계의 물건 — 고무풍선 — 으로 보였다.
   *   표면에 털의 결을 아무리 새겨 넣어도 부드럽게 뭉개져 아무것도 안 보였다.
   *   각진 면으로 바꾸면 결 하나하나가 다른 밝기를 받아 **털 다발로 읽힌다.**
   */
  fur: { roughness: 0.95, metalness: 0, flatShading: true },
  fabric: { roughness: 1.0, metalness: 0 },
  glossy: { roughness: 0.28, metalness: 0 },
  glass: { roughness: 0.12, metalness: 0, transparent: true, opacity: 0.32 },
  water: { roughness: 0.18, metalness: 0, transparent: true, opacity: 0.82 },
  glow: { roughness: 1.0, metalness: 0, toneMapped: false },
};

const cache = new Map<string, THREE.MeshStandardMaterial>();

/**
 * 밤에 반응하는 재질들. 한곳에 모아 두고 프레임마다 일괄로 갱신한다.
 * 컴포넌트마다 ref와 useFrame을 따로 들고 있으면 낮/밤 전환이 파일마다 어긋난다.
 */
type NightLit = { mat: THREE.MeshStandardMaterial; day: number; night: number };
const nightLit: NightLit[] = [];

export type MatOpts = {
  /** 밤에 이만큼 자체 발광한다. 0이면 밤에도 반응하지 않는다. */
  nightGlow?: number;
  /** 낮에도 발광하는 정도 (알전구는 0, 반딧불이는 1). */
  dayGlow?: number;
  /** 지오메트리에 구워 둔 색(얼룩·그라데이션)을 곱한다. */
  vertexColors?: boolean;
};

/**
 * 공유 재질을 가져온다. 같은 인자로 부르면 항상 같은 인스턴스가 돌아온다.
 * ★ 돌려받은 재질의 색이나 수치를 바깥에서 직접 바꾸지 말 것 — 그 재질을 쓰는 모든 mesh가 함께 바뀐다.
 */
export function MAT(
  preset: Preset,
  color: ColorKey,
  opts: MatOpts = {},
): THREE.MeshStandardMaterial {
  const { nightGlow = 0, dayGlow = 0, vertexColors = false } = opts;
  const key = `${preset}|${color}|${nightGlow}|${dayGlow}|${vertexColors}`;

  const hit = cache.get(key);
  if (hit) return hit;

  const mat = new THREE.MeshStandardMaterial({
    color: COLOR[color],
    vertexColors,
    ...SPEC[preset],
  });

  if (nightGlow > 0 || dayGlow > 0) {
    mat.emissive = new THREE.Color(COLOR[color]);
    mat.emissiveIntensity = dayGlow;
    nightLit.push({ mat, day: dayGlow, night: nightGlow });
  }

  cache.set(key, mat);
  return mat;
}

/** 낮(0)↔밤(1). 발광 재질을 한 번에 갱신한다. IsoStage의 Mood가 프레임마다 부른다. */
export function tickMaterials(night: number) {
  for (const e of nightLit) {
    e.mat.emissiveIntensity = THREE.MathUtils.lerp(e.day, e.night, night);
  }
}

/**
 * 색견본용 — 등록된 프리셋 전부. `?swatch=1`에서 실제 조명 아래 늘어놓고 눈으로 확인한다.
 * 스타일가이드 §5: 색은 정면이 아니라 "실제 사용 각도·실제 조명"에서 판단해야 한다.
 */
export const SWATCHES: { preset: Preset; color: ColorKey; label: string }[] = [
  { preset: 'foliage', color: 'grass', label: '잔디' },
  { preset: 'foliage', color: 'grassEdge', label: '풀숲' },
  { preset: 'matte', color: 'soil', label: '흙' },
  { preset: 'rock', color: 'rock', label: '바위' },
  { preset: 'matte', color: 'metalWhite', label: '흰 주철' },
  { preset: 'matte', color: 'wood', label: '오크' },
  { preset: 'matte', color: 'woodDark', label: '짙은 나무' },
  { preset: 'fabric', color: 'fabric', label: '천' },
  { preset: 'glossy', color: 'dogCream', label: '도자기' },
  { preset: 'glass', color: 'glass', label: '유리' },
  { preset: 'water', color: 'water', label: '물' },
  { preset: 'matte', color: 'dogCream', label: '강아지 크림' },
  { preset: 'matte', color: 'dogBrown', label: '강아지 브라운' },
  { preset: 'glow', color: 'lamp', label: '알전구' },
];
