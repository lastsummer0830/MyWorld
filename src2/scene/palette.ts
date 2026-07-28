// 색의 유일한 정본. 오브젝트 색(COLOR)과 낮/밤 분위기(DAY/NIGHT)를 여기서만 정한다.
// mesh에 hex를 직접 쓰지 않는다 — 파일마다 색이 조금씩 어긋나면 "코드로 대충 만든 티"가 난다.
//
// 파스텔 문법 (스타일가이드 §2): 채도 20~45% · 명도 80% 이상.
// 포인트 색만 채도 60%대 허용. 검정은 쓰지 않는다 — 어두운 색이 필요하면 "그늘진 같은 색"으로 간다.

import * as THREE from 'three';

export const COLOR = {
  // 땅
  grass: '#AFD177', //  잔디 — 노란기를 살짝 넣어야 햇살 아래 초록으로 읽힌다
  grassEdge: '#96B863', //  섬 가장자리·풀숲의 짙은 초록
  soil: '#9C7357', //  흙 단면 (따뜻한 갈색)
  soilDeep: '#82604A', //  흙 아래쪽
  rock: '#A08974', //  바위 밑동
  rockShade: '#8A7361', //  밑동의 그늘진 면

  // 구조물 (단계 3~4에서 쓴다)
  metalWhite: '#F7F4EE', //  퍼걸러·비스트로 테이블의 흰 주철
  wood: '#C9AE8C', //  밝은 오크 (원작 컨셉 계승)
  woodDark: '#A88A67', //  나무다리·기둥의 짙은 부분
  fabric: '#F2E8DC', //  차양·쿠션의 천
  roof: '#CDA091', //  집 지붕 — 부드러운 테라코타
  mint: '#DCEBDD', //  집 벽 — 민트크림 (원작 컨셉 계승)
  glass: '#DCEFF5', //  유리
  water: '#7FC4D9', //  연못
  waterDeep: '#4F97B5', //  연못 깊은 곳

  // 정원 식물·꽃 (단계 3~4)
  leaf: '#8FB56A', //  덩굴·잎사귀 — 잔디보다 조금 짙고 선명한 초록
  leafDark: '#6E9450', //  잎의 그늘진 쪽
  leafDeep: '#4E7A42', //  꽃 밑동의 넓은 잎 — 레퍼런스처럼 깊고 선명한 초록(밑동 그림자용)
  rose: '#E8A9BC', //  퍼걸러 장미덩굴 — 파스텔 로즈 (포인트 색)
  petalPink: '#F3B9CE', //  꽃밭 — 분홍
  petalYellow: '#F4D97E', //  꽃밭 — 노랑
  petalWhite: '#F6F0E7', //  꽃밭 — 흰
  petalLav: '#C9B8E4', //  꽃밭 — 라벤더
  petalCoral: '#F3B49B', //  꽃밭 — 살구/코랄 (레퍼런스 폭스글러브 계열)
  pollen: '#F2C14E', //  꽃 수술(중심) — 따뜻한 노랑. 꽃잎보다 채도 높은 포인트
  lily: '#7FB07A', //  연잎

  // 나무 (2026-07-22)
  bark: '#B0937A', //  줄기 — 따뜻한 회갈색. 검은 갈색은 파스텔 씬에서 구멍처럼 뚫린다
  barkShade: '#93785F', //  줄기의 그늘진 면·가지
  // ★ 잎벚꽃(늦게 피는 겹벚꽃)의 새잎은 "청동빛 도는 초록"이다 — 만개 벚꽃처럼 분홍 덩어리가 아니라
  //   초록 잎이 분홍 꽃송이를 절반쯤 가린 상태. 그래서 잎 색을 따로 둔다. (근거: japan-guide 벚꽃 품종)
  leafCherry: '#A8C47C', //  벚나무 새잎 — 연한 초록
  leafCherryBronze: '#B3B478', //  새잎의 청동기 도는 쪽
  // ★ 꽃·열매는 팔레트 값보다 어둡게 찍힌다(빛이 곱해지므로). 화면에서 분홍으로 읽히려면
  //   팔레트에선 거의 흰분홍이어야 한다 — #F6C6D8로 넣었더니 화면엔 칙칙한 자주로 나왔다(실측 07-22).
  blossom: '#FDDCE8', //  겹벚꽃 꽃송이 — 밝은 분홍
  blossomDeep: '#F7C2D6', //  꽃송이 그늘 쪽
  leafCitrus: '#7BA85F', //  레몬나무 잎 — 벚나무보다 짙고 광택 있는 상록
  leafCitrusDeep: '#5F8A49', //  레몬나무 잎 그늘
  lemon: '#F8D95E', //  레몬 열매 — 짙은 잎 사이에서 튀어야 하므로 채도를 올린 포인트 색
  koi: '#F0A268', //  코이 — 주황
  koiPale: '#F6E7D2', //  코이 — 흰바탕

  // 생물 (단계 4)
  dogCream: '#F2E3C8',
  dogBrown: '#B98A5F',
  dogSlate: '#8C93A6', //  블루멀 셸티의 회청색 무늬
  dogInk: '#5C5F70', //  코·눈
  eyeBlue: '#A9CBDD', //  오드아이의 파란 눈

  // 빛나는 것
  screen: '#CFE7F4', //  맥북 켜진 화면 — 옅은 하늘빛 발광
  firefly: '#FFE07A', //  밤의 주인공
  mote: '#FFF0C8', //  낮의 금빛 부유물(꽃가루). 햇빛을 받아 반짝이는 티끌.
  lamp: '#FFD9A0',
  star: '#FFF6E0',

  // 임시 — 단계 2의 그레이블록. 에셋이 들어오면 사라진다.
  block: '#B7B0A6',
  blockHover: '#CFC7BB',
  blockActive: '#E4D9A8',
} as const;

export type ColorKey = keyof typeof COLOR;

export type Mood = {
  skyTop: string;
  skyBottom: string;
  fog: string;
  sun: string;
  sunIntensity: number;
  ambient: string;
  ambientIntensity: number;
  /** 하늘에서 내려오는 빛 / 땅에서 반사돼 올라오는 빛. 그늘의 색을 결정한다. */
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  cloud: string;
  /** Bloom 세기 — 낮에는 0이어야 한다. (아래 주석 참고) */
  bloom: number;
};

/**
 * ★★ 광량의 기준 — 왜 하필 이런 숫자인가 (건드리기 전에 반드시 읽을 것)
 *
 * ① Three.js는 r155부터 물리 기반 조명 단위를 쓴다. 확산 반사(Lambert) 계산에 1/π가 곱해지므로,
 *    "빛의 세기 합이 π ≈ 3.14"여야 물체가 팔레트에 적힌 색 그대로 화면에 나온다.
 *    합이 1.0이면 색이 팔레트의 약 1/3 밝기로 어둡게 뭉개진다. (실측으로 확인함)
 *
 * ② EffectComposer(후처리)가 붙으면 렌더러의 톤매핑이 강제로 꺼진다(NoToneMapping).
 *    1.0을 넘는 밝기를 부드럽게 눌러 주던 장치가 없으므로, π를 크게 넘기면 흰색으로 타 버린다.
 *
 * → 그래서 "햇빛이 정면으로 닿는 면에서 태양 + 반구광 + 환경광 ≈ π"를 목표로 잡는다.
 *   잔디 윗면(법선 +Y)에서: 태양 3.05 × 0.63(입사각 — SUN_POS의 높이에서 나온다) + 반구광 0.9 + 환경광 0.25 ≈ 3.1
 *   그늘진 면은 반구광 + 환경광만 받아 ≈ 1.15 → 팔레트 색의 약 37% 밝기가 된다. 이 낙차가 "햇살"이다.
 *
 * ★ 2026-07-28 시도했다가 되돌림: 채움광 합을 1.15 → 0.71로 내리고 줄어든 만큼을 태양에 되돌려
 *   (π는 유지한 채) 그늘만 깊게 파 봤다. 실측으로 그늘/양지 비는 0.77 → 0.69로 실제로 내려갔다.
 *   **그런데 조아진이 원한 방향이 아니었다** — "저렇게까지 어두운 걸 바라지도 않았어".
 *   → 밝은 파스텔은 유지한다. 그늘을 파는 방향으로 다시 가지 말 것.
 *
 * ★ SUN_POS를 옮기면 입사각(0.63)이 바뀌므로 sunIntensity를 다시 맞춰야 한다. 안 그러면 씬이 어두워지거나 탄다.
 */

/**
 * 낮 — "따사롭게 내리쬐는 햇살".
 *
 * ★ 햇살은 밝기가 아니라 대비에서 나온다.
 *   ambient를 세게 주면 그늘이 사라져 전체가 균일하게 창백해진다(= 흐린 날).
 *   그래서 ambient는 낮추고, 따뜻한 직사광을 세게 넣어 밝은 면과 그늘을 확실히 가른다.
 *
 * ★ hemisphereLight가 "정원"의 핵심이다.
 *   위(hemiSky)는 하늘색, 아래(hemiGround)는 잔디에서 반사된 연둣빛.
 *   이게 있어야 그늘진 면에 잔디의 초록빛이 배어들어 "풀밭 위에 서 있는 물건"으로 보인다.
 *   없으면 그늘이 그냥 회색이 되어 물체가 바닥에서 붕 뜬다.
 */
export const DAY: Mood = {
  // ★ "밝은 아침"과 "따사로운 오후"를 가르는 건 밝기가 아니라 색온도다.
  //   빛이 중성적인 흰색이면 아무리 밝아도 서늘한 아침이 된다. 해를 금빛으로 기울이고,
  //   지평선과 땅 반사광에 노란기를 넣어야 "따스함"이 생긴다.
  skyTop: '#86C9EC',
  skyBottom: '#FFDCB8', //  복숭아빛 지평선
  fog: '#E6DFD2', //  따뜻한 흰 안개. 원경을 여기로 녹인다.
  sun: '#FFD190', //  금빛 햇살 (중성 흰빛이면 아침이 된다)
  sunIntensity: 3.05, //  해가 낮아져 입사각이 얕아진 만큼 올렸다 (위 ★ 참고)
  ambient: '#CBD2E8', //  그늘에 깔리는 색. 하늘의 푸른빛이 약간 — 이 대비가 햇살을 살린다.
  ambientIntensity: 0.25,
  hemiSky: '#C8E2F2',
  hemiGround: '#D9CE93', //  잔디에서 반사돼 올라오는 빛. 따뜻한 연둣빛이라 그늘이 노랗게 물든다.
  hemiIntensity: 0.9,
  // ★ 크림색(#FFF6E8)이었다가 금빛 해(#FFD190)를 받으니 완전히 빵 색이 됐다("소금빵이니").
  //   구름 자체는 거의 흰색이어야 한다 — 따뜻함은 햇빛이 입히는 것이지 구름이 갖고 있는 게 아니다.
  cloud: '#FCFDFF',
  /**
   * ★ 낮 Bloom은 "아주 약하게".
   *
   * 처음엔 0으로 못 박았었다 — 조명 총량이 2.6인데 톤매핑이 꺼져 있어 하늘과 구름이
   * 이미 1.0을 넘긴 상태였고, 거기에 임계값 0.62짜리 Bloom을 걸었더니 화면 전체가 하얗게 씻겨 나갔다.
   *
   * 지금은 조건이 다르다. 광량을 π 기준으로 맞춰 하늘이 0.72~0.87에 들어오고, 임계값을 0.9로 올렸다.
   * → 이제 Bloom에 걸리는 건 **해 원반과 햇빛이 정면으로 때린 밝은 면뿐**이다.
   *   그 부분만 부드럽게 번지는 게 바로 "따스함"의 정체다. 세기는 낮게 유지할 것.
   */
  bloom: 0.5,
};

/**
 * 밤 — "따뜻한 알전구가 켜진 꿈같은 하늘".
 * 하늘빛을 거의 꺼서 씬을 어둠에 담그고, 빛나는 것들(반딧불이·알전구)만 살린다.
 * 달빛을 밝게 두면 "파랗기만 한 낮"이 된다 — 반딧불이가 진짜 광원으로 읽히려면 주변이 어두워야 한다.
 */
export const NIGHT: Mood = {
  skyTop: '#232647',
  skyBottom: '#3E3558',
  fog: '#2E2C4A',
  sun: '#8FA0D8', //  달빛 — 형태만 겨우 읽히는 정도
  sunIntensity: 0.45,
  ambient: '#4A4870',
  ambientIntensity: 0.18,
  hemiSky: '#2E3560',
  hemiGround: '#3B4740',
  hemiIntensity: 0.35,
  cloud: '#5C5680',
  bloom: 1.4,
};

const _a = new THREE.Color();
const _b = new THREE.Color();

/** 낮(0) ↔ 밤(1) 사이를 오가는 색. 전환은 이 함수 하나로만 만든다. */
export const moodColor = (out: THREE.Color, key: keyof Mood, t: number) => {
  _a.set(DAY[key] as string);
  _b.set(NIGHT[key] as string);
  return out.copy(_a).lerp(_b, t);
};

export const moodNumber = (
  key: 'sunIntensity' | 'ambientIntensity' | 'hemiIntensity' | 'bloom',
  t: number,
) => THREE.MathUtils.lerp(DAY[key], NIGHT[key], t);
