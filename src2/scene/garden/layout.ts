// 정원 배치 정본 — 오브젝트가 놓이는 자리와 "무엇이 어디에 심기는가"를 여기 한 곳에 모은다.
// 좌표는 [x, z] (월드 미터). x+ 는 화면 오른쪽, z+ 는 카메라 앞쪽.
// 배치는 ISLAND_R_SAFE(약 18m) 원 안에서만 — 그 바깥은 가장자리가 불규칙해 땅이 없을 수 있다.

import { islandRadius } from '../constants';
import { mulberry32 } from './rng';

export type Spot = { pos: [number, number]; rotY?: number };

const D = Math.PI / 180;
const TAU = Math.PI * 2;

/**
 * ★ 배치를 벌리는 배수 (2026-08-01).
 *
 * 아래 좌표들은 섬 반경이 22m이던 시절에 잡은 값이다. 섬을 27m로 키우면서 좌표를 그대로 두면
 * 큰 것들이 여전히 가운데에 몰리고 바깥이 텅 빈 도넛이 된다 — 반대 방향으로 같은 문제다.
 * 좌표 40여 개를 손으로 고치는 대신 여기서 한 번에 곱한다. **섬 반경과 이 값은 한 몸이다.**
 */
export const SPREAD = 1.12;

const sp = (p: [number, number]): [number, number] => [p[0] * SPREAD, p[1] * SPREAD];

/** 주요 구조물·생물의 자리. (좌표는 SPREAD가 곱해진 뒤의 값이 실제 자리다.) */
const RAW_GARDEN = {
  // 중앙 살짝 뒤 — 정원의 중심. 그네벤치가 카메라를 향하도록 돌린다.
  pergola: { pos: [-3.5, -3], rotY: 45 * D } as Spot,
  // 카메라 앞쪽 — 맥북이 놓인 티테이블(포트폴리오 진입점)이 가장 잘 보이는 자리.
  teaTable: { pos: [5, 5.5], rotY: -18 * D } as Spot,
  // 오른쪽 뒤 — 연못 + 나무다리.
  pond: { pos: [9, -8], rotY: 0 } as Spot,
  // 왼쪽 뒤 구석 — 집 외관은 배경 오브젝트.
  house: { pos: [-11.5, -8], rotY: 18 * D } as Spot,
  // 티테이블 근처 — 나비를 보며 노는 강아지(주인공).
  dog: { pos: [7.5, 1], rotY: -120 * D } as Spot,
};

export const GARDEN: Record<keyof typeof RAW_GARDEN, Spot> = Object.fromEntries(
  Object.entries(RAW_GARDEN).map(([k, v]) => [k, { pos: sp(v.pos), rotY: v.rotY }]),
) as Record<keyof typeof RAW_GARDEN, Spot>;

/**
 * 나무 자리.
 * ▸ 섬에 수직 요소가 집·퍼걸러뿐이라 실루엣이 납작했다. 나무는 **가장자리 쪽**에 두어
 *   가운데(퍼걸러·티테이블·강아지)를 가리지 않으면서 섬의 윤곽을 만든다.
 * ▸ 큰 벚나무 하나를 주인공으로 두고 나머지는 조연 — 같은 크기로 늘어놓으면 가로수길이 된다.
 */
export const TREES: {
  pos: [number, number];
  species: 'cherry' | 'lemon';
  scale: number;
  seed: number;
}[] = (
  [
    { pos: [-7.5, -11], species: 'cherry', scale: 1.15, seed: 501 }, //  집 오른편 뒤 — 주인공
    { pos: [8.5, 10.5], species: 'cherry', scale: 0.82, seed: 502 }, //  앞쪽 오른편 조연
    { pos: [12.5, 2.5], species: 'lemon', scale: 1.0, seed: 503 }, //  연못과 꽃밭 사이
    { pos: [-13.5, -1.5], species: 'lemon', scale: 0.88, seed: 504 }, //  집 앞 왼편
  ] as { pos: [number, number]; species: 'cherry' | 'lemon'; scale: number; seed: number }[]
).map((t) => ({ ...t, pos: sp(t.pos) }));

// ═══════════════════════════════════════════════════════════════════
//  식재 구조 — "화단 정원" (2026-08-01 전면 재설계)
// ═══════════════════════════════════════════════════════════════════

/**
 * ★★★ 정원 구성의 근본 규칙. 여기를 이해하지 않고 아래 값을 만지면 같은 실수로 되돌아간다.
 *
 * 지금까지 실패한 세 방향:
 *   ① 섬 전체에 잔디 포기를 균일 스캐터 → "바닥에 잔디를 복붙한" 꼴 (2026-07-22 지적).
 *   ② 잔디 원 + 가장자리 보더 → 꽃이 늘 바깥 링에만 남음 (2026-07-22 지적).
 *   ③ **"섬 − 잔디 = 전부 식재"** → 섬 둘레가 통째로 초록 벽이 되고, 그 벽이 제일 키가 커서
 *      정원이 사발 안처럼 **좁아 보였다**. "빈 공간을 잡초로 메꾼 수준"(2026-08-01 지적).
 *      ③은 ①②를 고치려다 만든 구조인데, 셋 다 뿌리가 같다 —
 *      **"어디를 비울지"를 정하지 않고 "어디를 채울지"만 정했다.**
 *
 * → 이번엔 규칙을 뒤집는다. **화단으로 지정한 자리에만 심는다. 나머지는 전부 열린 잔디다.**
 *   레퍼런스 정원(idea_resources/Garden)이 전부 이 문법이다 — 화단·길·잔디마당·연못가가
 *   눈에 보이게 구획돼 있고, 그 사이가 시원하게 비어 있어서 **넓어 보인다.**
 *   식재율은 섬 면적의 25~30%가 상한이다. 넘어가면 다시 수풀 도배다.
 *
 * ★ 키의 규칙도 뒤집었다. 예전엔 "잔디에서 멀수록 키 큼"이라 **섬 가장자리가 제일 높았다**.
 *   이제 키는 **화단의 성격(tone)** 이 정하고, 섬 가장자리로 갈수록 오히려 **낮아진다.**
 *   시야가 바깥으로 트여야 섬이 넓어 보인다. 키 큰 관목은 카메라 반대편(집 뒤)에만 둔다.
 */

/** 화단의 성격 — 그 화단에 심기는 것의 최대 키를 정한다. */
export type BedTone = 'tall' | 'mid' | 'low';

/** 성격별 키 배율(대략의 실제 높이 m). 이 값이 곧 정원의 층이다. */
export const TONE_H: Record<BedTone, number> = { tall: 1.55, mid: 0.85, low: 0.42 };

type Bed = {
  tone: BedTone;
  /** 화단 윤곽 = 원들의 합집합 [x, z, r] */
  blobs: [number, number, number][];
};

/**
 * 화단 목록. 구조물(집·연못·퍼걸러·티테이블)에 **붙여서** 배치한다 —
 * 정원의 식재는 원래 건물·물·길의 가장자리를 따라 생긴다. 허공에 떠 있는 화단은 인공적이다.
 */
const RAW_BEDS: Bed[] = [
  // ── 집 뒤·왼쪽 배경 관목: 유일하게 키 큰 구역. 카메라 기본 각에서 가장 먼 뒤쪽이라
  //    실루엣을 만들면서도 정원을 가리지 않는다.
  { tone: 'tall', blobs: [[-16.5, -8.5, 3.0], [-13.5, -12.5, 3.2], [-8.5, -14.5, 2.9], [-3.5, -14.0, 2.4]] },

  // ── 집 발치 보더 — 벽을 따라 흐르는 띠
  { tone: 'mid', blobs: [[-15.0, -4.6, 2.4], [-12.0, -3.8, 2.5], [-9.2, -4.4, 2.1]] },

  // ── 연못가 습지 — 물가를 두르되 한쪽(다리 진입로)은 비워 둔다
  { tone: 'mid', blobs: [[5.6, -11.2, 2.3], [9.5, -13.2, 2.4], [13.6, -11.0, 2.2], [14.6, -6.5, 2.1]] },

  // ── 앞쪽 왼편 코티지 화단 — 화면 가까이라 꽃이 가장 잘 보이는 자리
  { tone: 'mid', blobs: [[-11.5, 6.5, 2.8], [-13.0, 10.0, 2.5], [-8.0, 9.5, 2.3]] },

  // ── 앞쪽 오른편 화단 (레몬나무 발치)
  { tone: 'mid', blobs: [[12.0, 7.0, 2.6], [14.0, 3.5, 2.3]] },

  // ── 퍼걸러 뒤 낮은 화단 — 그네에 앉은 시선 앞을 낮게 깐다
  { tone: 'low', blobs: [[-5.5, -7.8, 2.0], [-1.8, -8.6, 1.8]] },

  // ── 티테이블 곁 낮은 화단 — 진입점 주변을 꾸미되 테이블을 가리지 않게
  { tone: 'low', blobs: [[2.0, 10.0, 1.9], [5.8, 11.2, 1.7]] },

  // ── 섬 앞 가장자리 악센트 — 윤곽에 리듬을 준다. 링으로 두르지는 않는다.
  { tone: 'low', blobs: [[-3.0, 16.0, 2.4], [1.5, 17.0, 2.0]] },
  { tone: 'mid', blobs: [[8.5, 14.5, 2.4], [12.0, 12.0, 2.2]] },

  // ── 앞마당 왼쪽 큰 화단 — 여기가 비면 화면 아래 절반이 통째로 빈 잔디가 된다.
  { tone: 'mid', blobs: [[-6.5, 12.5, 2.7], [-3.0, 10.5, 2.3]] },

  // ── 오른쪽 옆구리(연못과 앞마당 사이) — 섬의 우측이 통째로 비어 있던 자리
  { tone: 'mid', blobs: [[16.0, 1.0, 2.6], [15.0, -3.0, 2.4]] },

  // ── 왼쪽 옆구리 — 집 앞 보더와 앞마당 화단 사이를 잇는다
  { tone: 'low', blobs: [[-16.0, 1.5, 2.4], [-15.0, 5.0, 2.2]] },

  // ── 퍼걸러 오른쪽, 연못 앞 — 가운데가 너무 뚫려 보이지 않게 잡아 주는 섬 화단
  { tone: 'low', blobs: [[6.0, -3.5, 2.0]] },
];

/**
 * 화단 반경 배수. 위 좌표는 배치(어디에)를 정하고, 이 값이 면적(얼마나)을 정한다.
 * ★ 목표는 **섬 면적의 25~30%**. 1차 렌더에서 14%였더니 "휑한 초록 접시"가 됐고,
 *   그 전 구조는 60%라 "수풀 도배"였다. 이 둘 사이가 정원이다.
 */
const BED_R_GAIN = 0.98;

/**
 * 화단 자리도 구조물과 같이 벌린다. **반경(r)은 키우지 않는다** —
 * 화단이 함께 커지면 벌린 만큼 다시 메워져 열린 잔디가 늘지 않는다.
 */
/**
 * 섬 가장자리 지피 띠 — **각도 구간 몇 곳에만** 두른다(단위 °).
 *
 * ★ 한 바퀴 두르면 그게 바로 예전의 "초록 벽"이다. 반대로 전혀 없으면 이번 1차 렌더처럼
 *   윤곽이 민둥해져 섬이 **초록 접시**로 보인다. 둘레의 절반쯤만 덮어 리듬을 준다.
 * ★ tone은 반드시 low — 가장자리가 높아지는 순간 다시 사발 안이 된다.
 */
const RIM_ARCS: [number, number][] = [
  [186, 268], //  왼쪽 뒤(집 뒤편)
  [16, 62], //  오른쪽 뒤(연못 바깥)
  [108, 138], //  앞쪽 왼편
];

const rimBed = (): Bed => {
  const blobs: [number, number, number][] = [];
  for (const [a0, a1] of RIM_ARCS) {
    for (let deg = a0; deg <= a1; deg += 9) {
      const a = deg * D;
      const r = islandRadius(a) * 0.93;
      // ★ 이 반경은 BED_R_GAIN을 타지 않는다(가장자리 띠는 실좌표). 여기서 직접 정한다.
      blobs.push([Math.cos(a) * r, Math.sin(a) * r, 1.7]);
    }
  }
  return { tone: 'low', blobs };
};

export const BEDS: Bed[] = [
  // 손으로 잡은 화단 — 좌표는 22m 섬 기준이라 SPREAD로 벌린다.
  ...RAW_BEDS.map((b) => ({
    tone: b.tone,
    blobs: b.blobs.map(
      ([x, z, r]) => [x * SPREAD, z * SPREAD, r * BED_R_GAIN] as [number, number, number],
    ),
  })),
  // 가장자리 띠 — islandRadius로 직접 뽑은 실좌표다. SPREAD를 곱하면 섬 밖으로 나간다.
  rimBed(),
];

/**
 * 화단 경계의 흔들림 — 원 합집합이 그대로 드러나면 "동그라미를 겹친 것"으로 보인다.
 * 위치에만 의존하는 완만한 잡음이라 프레임마다 같은 모양이 나온다.
 */
const bedWobble = (x: number, z: number) =>
  0.62 * Math.sin(x * 0.78 + z * 0.51 + 1.2) + 0.38 * Math.sin(x * 1.31 - z * 1.07 - 0.4);

/**
 * 점 (x,z)가 어느 화단의 얼마나 안쪽인가.
 * @returns core 0 = 화단 밖(잔디), 1 = 화단 한복판. tone = 그 화단의 성격.
 *
 * ★ core를 키 배율에 쓰면 화단이 **가운데가 봉긋한 무더기**가 된다. 가장자리가 낮게 스며야
 *   잔디와 이어지고, 딱 끊기면 "오려 붙인 화단"이 된다.
 */
export function bedAt(x: number, z: number): { core: number; tone: BedTone } {
  let best = 0;
  let tone: BedTone = 'low';
  const wob = bedWobble(x, z);
  for (const bed of BEDS) {
    for (const [cx, cz, r] of bed.blobs) {
      const rEff = r + wob * 0.5;
      const c = 1 - Math.hypot(x - cx, z - cz) / Math.max(rEff, 0.3);
      if (c > best) {
        best = c;
        tone = bed.tone;
      }
    }
  }
  return { core: Math.min(Math.max(best, 0), 1), tone };
}

/**
 * 밀도 얼룩 — 같은 화단 안에서도 빽빽한 데와 성긴 데가 있어야 사람이 심은 것으로 읽힌다.
 * 균일하게 채우면 화단 하나하나가 다시 "초록 덩어리"가 된다.
 */
export function plantDensity(x: number, z: number) {
  return (
    0.62 +
    0.26 * Math.sin(x * 0.29 + 1.3) * Math.cos(z * 0.25 - 0.8) +
    0.16 * Math.sin((x + z) * 0.17 + 2.1)
  );
}

/** 식재를 심지 않는 구역 — 물속·건물 바닥·앉는 자리. */
const NO_PLANT: { x: number; z: number; r: number }[] = [
  { x: GARDEN.pond.pos[0], z: GARDEN.pond.pos[1], r: 5.4 },
  { x: GARDEN.house.pos[0], z: GARDEN.house.pos[1], r: 3.4 },
  { x: GARDEN.pergola.pos[0], z: GARDEN.pergola.pos[1], r: 3.2 },
  { x: GARDEN.teaTable.pos[0], z: GARDEN.teaTable.pos[1], r: 2.6 },
];

/**
 * 섬 가장자리로 갈수록 키를 눌러 시야를 튼다(1 → 0.35).
 * ★ 이게 없으면 어떤 화단이든 섬 끝에 걸치는 순간 다시 "둘러싼 벽"이 된다.
 */
export function rimFalloff(x: number, z: number) {
  const a = Math.atan2(z, x);
  const rel = Math.hypot(x, z) / islandRadius(a);
  return 1 - 0.65 * Math.min(1, Math.max(0, (rel - 0.72) / 0.28));
}

/** 식재 층 — 화단 성격을 그대로 쓴다(꽃 종을 고를 때의 키 기준). */
export type PlantLayer = 'back' | 'mid' | 'front';

export type PlantPt = {
  x: number;
  z: number;
  /** 화단 한복판 정도 0~1 */
  core: number;
  /** 이 자리에 허용되는 키(m) — 화단 성격 × 화단 안쪽 정도 × 섬 가장자리 감쇠 */
  h: number;
  tone: BedTone;
  layer: PlantLayer;
  /** 개체 회전(rad) */
  a: number;
  /** 크기 변주 0.7~1.4 */
  s: number;
  /** 색·형태 선택용 0~1 */
  c: number;
};

/** tone → 꽃 배치에서 쓰는 층 이름. */
const TONE_LAYER: Record<BedTone, PlantLayer> = { tall: 'back', mid: 'mid', low: 'front' };

/**
 * 화단 안에 심을 자리를 뽑는다. **화단 밖은 한 포기도 심지 않는다** — 그게 이 설계의 전부다.
 *
 * @param tries 후보 추첨 횟수. 화단이 섬 면적의 4분의 1 남짓이라 실제 통과는 15% 안팎이다.
 */
export function samplePlanting(tries: number, seed: number): PlantPt[] {
  const rand = mulberry32(seed);
  const out: PlantPt[] = [];

  for (let i = 0; i < tries; i++) {
    const a = rand() * TAU;
    const r = Math.sqrt(rand()) * islandRadius(a) * 0.985;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;

    const { core, tone } = bedAt(x, z);
    if (core <= 0) continue; //  화단 밖 = 잔디. 여기서 끝.
    // 가장자리로 갈수록 확률적으로 솎아 잔디와 스미게 한다.
    if (rand() > 0.25 + 0.75 * core) continue;
    if (rand() > plantDensity(x, z)) continue;
    if (NO_PLANT.some((e) => Math.hypot(x - e.x, z - e.z) < e.r)) continue;

    // 키: 화단 성격이 상한, 안쪽일수록 크고, 섬 끝으로 갈수록 눌린다.
    const h = TONE_H[tone] * (0.4 + 0.6 * core) * rimFalloff(x, z);

    out.push({
      x,
      z,
      core,
      h,
      tone,
      layer: TONE_LAYER[tone],
      a: rand() * TAU,
      s: 0.7 + rand() * 0.7,
      c: rand(),
    });
  }
  return out;
}

// ── 꽃 종(種) ────────────────────────────────────────────────────
export type FlowerSpecies = 'daisy' | 'primrose' | 'allium' | 'foxglove';

/** 키큰 종 / 낮은 종. 층(layer)에 따라 어느 쪽에서 고를지가 갈린다. */
const TALL_SPECIES: FlowerSpecies[] = ['foxglove', 'allium'];
const LOW_SPECIES: FlowerSpecies[] = ['daisy', 'primrose'];

/**
 * ★★ 꽃의 종은 **위치로 정한다.** 점마다 랜덤으로 뽑으면 색종이 뿌린 티가 난다.
 *   (이 원칙은 예전 layout.ts 주석에 이미 적혀 있었는데 지키지 않고 있었다.)
 *   완만한 잡음을 좌표에 걸면 가까운 꽃끼리 같은 종이 되어 **드리프트(무리)** 가 생긴다.
 *   ▸ 1할만 다른 그룹에서 섞어 경계를 흐린다 — 완벽히 구획되면 그건 그것대로 인공적이다.
 */
export function speciesAt(x: number, z: number, tall: boolean, roll: number): FlowerSpecies {
  const group = (roll < 0.1 ? !tall : tall) ? TALL_SPECIES : LOW_SPECIES;
  const v =
    Math.sin(x * 0.205 + 0.7) * Math.cos(z * 0.175 - 1.4) +
    0.62 * Math.sin(x * 0.13 - z * 0.155 + 2.2) +
    0.34 * Math.cos(x * 0.31 + z * 0.28 - 0.5);
  const t = (v + 1.96) / 3.92; //  0~1로 정규화
  return group[Math.min(group.length - 1, Math.max(0, Math.floor(t * group.length)))];
}
