// AJP-004 · Skill-ON v2 · stage-1 — normalized landmark card (rev.2).
//
// animal-scaffold-eval.md §2 "Make a normalized landmark card before code" 의 산출물이다.
// 이 파일이 먼저 존재하고, scaffold.ts 의 좌표는 전부 여기서 나온다.
//
// rev.2 는 rev.1 렌더(tag v2-tool-proof-1)가 goat/llama 로 읽혀 무효 판정된 뒤
// **canonical 사진을 화면 좌표로 다시 재서** 만든 카드다. 바뀐 핵심은 셋이다:
//   1. 코트 아랫단이 팔꿈치(0.5W)가 아니라 0.30W 까지 내려온다 → 다리가 짧아진다.
//   2. 머리가 가슴 앞으로 뻗지 않는다. 코끝이 가슴 앞단보다 0.19W 만 앞이다.
//   3. 정면 최대 폭이 0.49W 로 커진다 → 세로로 선 달걀이 아니라 낮고 넓은 코트 덩어리.
//
// ── 정규화 ─────────────────────────────────────────────────────────
//   ground y = 0, ground-to-withers W = 1.0
//   +Y 위, +Z 개의 정면(코 방향), +X 개의 왼쪽
//
// ── 증거 한계(§1) ──────────────────────────────────────────────────
//   canonical : Pick/2026-08-01_비교_모델vs사진.png 의 **오른쪽 실사 1장뿐**.
//               view = 개의 왼쪽 near-profile + 머리만 카메라 쪽으로 돌린 three-quarter.
//               흰 테이블 위에 네 발로 서 있다.
//   실측 방식 : 사진 픽셀에서 기갑(y≈215) ~ 발바닥(y≈545) = 330px 을 W=1.0 으로 두고 잰다.
//   가려진 것 : 오른쪽 옆면 전체, 정면, 후면, 등마루 상면, 팔꿈치·무릎·비절 각도,
//               꼬리 뿌리 접합부, 발가락.
//   왜곡      : 실내 근거리 촬영이라 머리 쪽이 크게, 뒷몸이 작게 찍힌다. 머리가 카메라
//               쪽으로 돌아 있어 두개골이 단축된다 → 머리 길이는 상한(0.44W) 아래로 잡는다.
//   rejected  : Pick/2026-08-01_강아지_4면도.png 전 패널, 위 비교 이미지의 **왼쪽 모델**,
//               그리고 이 eval 자신의 rev.1 캡처(v2-tool-proof-1). anti-landmark 용도로만 쓴다.

/** 사진에서 직접 읽히는 landmark. 단위는 W. */
export const DIRECT = {
  /** 코트 겉 실루엣이 키보다 확실히 길다. 사진은 비스듬해 단축돼 있어 하한으로 잡는다. */
  bodyLengthOverWithers: 1.3,
  /** 등선은 기갑에서 거의 수평, 엉덩이에서만 완만히 떨어진다. */
  withersY: 1.0,
  loinY: 0.98,
  croupY: 0.93,
  /**
   * 코트 아랫단. 사진에서 배털 끝 y≈470, 발바닥 y≈545 → (545-470)/330 = 0.23W.
   * 가슴 앞은 이보다 조금 더 내려오고 허리는 올라붙는다. 팔꿈치 높이가 아니다.
   */
  coatBottomChestY: 0.3,
  coatBottomLoinY: 0.38,
  coatBottomRearY: 0.44,
  /** 뼈대 팔꿈치. 코트에 완전히 가려 실루엣에 나오지 않는다. */
  elbowY: 0.51,
  /** 목은 보이지 않는다. 머리 털뭉치 아랫단이 어깨 갈기에 바로 얹힌다. */
  visibleNeckGap: 0.0,
  /** 정수리는 기갑보다 0.19W 위. 머리를 세워 든 자세이고 앞으로 뻗지 않았다. */
  skullTopY: 1.19,
  /** 정수리~코끝 = 119px/330 = 0.36W. 품종 상한 0.44W 아래로 0.435 를 쓴다(단축 보정). */
  headLength: 0.435,
  /** 주둥이는 두개골+뺨보다 짧다. */
  muzzleShareOfHead: 0.437,
  /**
   * 코끝이 가슴 코트 앞단보다 얼마나 앞인가. 사진 x: 코끝 940, 가슴 앞 885 → 55px = 0.17W.
   * rev.1 은 이 값이 0.31W 여서 개미핥기/말로 읽혔다.
   */
  noseAheadOfChestFront: 0.19,
  /** 귀는 두개골 위로 조금만 솟는다. 사진 32px/330 = 0.10W. 밴드 하한 0.11 을 쓴다. */
  earRiseAboveSkull: 0.113,
  /** 귀 밑동은 넓고 서로 떨어져 있다. 밑동 폭이 높이의 0.7 이상이라 뿔이 아니다. */
  earBaseSpan: 0.117,
  earBaseGap: 0.083,
  /** 머리 털뭉치(뺨·두개골 코트)가 두개골보다 넓어 주둥이가 작게 읽힌다. */
  headCoatWidth: 0.26,
  /** 갈기·ruff 는 층진 방패다. 가장 넓은 곳이 몸통보다 넓다. */
  ruffMaxWidth: 0.49,
  ruffLayerCount: 3,
  /** 발은 짧지만 체중을 받는다. 코트 아래로 아랫다리가 확실히 드러난다. */
  visibleForelegBelowCoat: 0.3,
  visibleHindlegBelowCoat: 0.44,
  /** 꼬리는 엉덩이 안에서 시작해 낮게 늘어지고 비절 근처까지 온다. */
  tailRootY: 0.845,
  tailTipY: 0.3,
} as const;

/**
 * 실사 1장으로는 증명되지 않는 추정치. **unverified** 로 취급한다.
 * front / back / 오른쪽 옆면은 전부 이 블록 위에 세운 gross silhouette 검사용이다.
 */
export const INFERRED = {
  /** 정면 폭. 사진에는 정면이 없다. 장모 셸티의 코트 폭 가설. */
  ribcageWidth: 0.32,
  bodyCoatWidth: 0.44,
  hipWidth: 0.41,
  skullWidth: 0.186,
  muzzleTipWidth: 0.038,
  /** 앞다리 간격 — 어깨 폭에서 내려온다고 가정. */
  forelegSpacing: 0.23,
  hindlegSpacing: 0.22,
  /** 발 폭 / 가장 가는 pastern 폭. §5 하한 1.35× 이상. */
  forePawWidthRatio: 1.75,
  hindPawWidthRatio: 1.68,
  /** 뒷다리 각도. 사진에서는 코트에 가려 보이지 않는다. */
  stifleY: 0.52,
  hockY: 0.26,
  /** 오른쪽 옆면은 왼쪽의 거울로 가정한다. 실제 개체 비대칭은 확인 불가. */
  rightSideIsMirror: true,
} as const;

/**
 * anti-landmark. rejected 증거의 잘못된 극점이다.
 * **구현 좌표가 아니라 "넘어가면 실패"인 경계다.** scaffold.ts 는 이 값을 읽지 않는다.
 */
export const ANTI = {
  /** 뿔귀: 밑동이 좁고(<0.10W) 높이가 밑동의 1.6배 넘게 솟은 뾰족한 스파이크. rev.1 이 그랬다. */
  hornEarRise: 0.15,
  hornEarBaseSpan: 0.092,
  /** 목 기둥: ruff 와 두개골 사이에 노출된 수직 목. */
  neckStalkGap: 0.18,
  /** 상자/관 주둥이: 길이가 폭의 2배를 넘고 뺨 덩어리와 끊긴 주둥이. rev.1 = 1.9. */
  tubeMuzzleAspect: 1.7,
  /** 가슴 달걀: 정면에서 하나의 닫힌 세로 타원. rev.1 은 폭 0.36 · 높이 0.72 였다. */
  chestEggWidthOverHeight: 0.55,
  /** 막대 다리: 코트 밖으로 0.4W 넘게 나온 굵기 0.1W 미만의 기둥. rev.1 = 0.42W · 0.066W. */
  stickLegExposure: 0.4,
  stickLegWidth: 0.1,
  /** 분리된 꼬리: 엉덩이 코트 뒤로 떨어져 매달린 판. */
  detachedTailGap: 0.02,
  /** 안장 등 / 통짜 배럴: 옆에서 위아래가 평행한 직사각 몸통. */
  barrelUnderlineFlatness: 0.03,
  /** 종 오독 목록 — 어느 뷰에서든 나오면 즉시 실패. */
  wrongSpecies: ['donkey', 'llama', 'deer', 'anteater', 'borzoi', 'goat', 'sheep'],
} as const;

/**
 * 뷰별 실루엣 예산(§3). 각 뷰가 썸네일 크기에서 무엇으로 읽혀야 하는지.
 * 구현 뒤 self-check 는 이 문장들에 대해 예/아니오로 답한다.
 */
export const SILHOUETTE_BUDGET = {
  profile: [
    '낮고 긴 코트 덩어리 한 개(길이/깊이 ≈ 2). 다리 위에 얹힌 배럴이 아니다.',
    '아랫단이 가슴에서 내려가고 허리에서 올라붙었다가 뒷바지에서 다시 내려온다.',
    '아랫단에 층진 털끝 요철이 보인다. 매끈한 수평선이 아니다.',
    '머리 털뭉치가 어깨 갈기에 바로 얹힌다. 드러난 목이 없다.',
    '코끝이 가슴 앞단보다 0.2W 안쪽에 있다. 앞으로 뻗은 주둥이가 아니다.',
    '앞다리는 코트 밖 0.3W 짜리 곧은 기둥, 뒷다리는 비절에서 꺾인 지그재그다.',
    '꼬리가 엉덩이 코트와 겹쳐 내려간다.',
  ],
  front: [
    '위에서 아래로 머리뭉치 → 갈기 → 중간 ruff → 앞자락 3단 계단으로 좁아진다.',
    '하나의 닫힌 세로 달걀/주머니/턱받이가 아니다.',
    '귀는 밑동이 넓고 서로 떨어진 짧은 삼각형이고 머리 털뭉치보다 작다.',
    '코트 아래로 굵은 앞다리 두 개와 그보다 넓은 발이 보인다.',
  ],
  threeQuarter: [
    '머리·갈기·갈비·뒷바지·꼬리가 읽히는 깊이 순서로 겹친다.',
    '주둥이 뿌리가 뺨/머리 털뭉치에 묻혀 있다.',
    '가까운 다리와 먼 다리가 하나의 기둥으로 뭉치지 않는다.',
  ],
  back: [
    '엉덩이, 뒷바지, 비절 리듬, 꼬리 뿌리가 각각 구분된다.',
    '꼬리가 떨어진 판/호스/고리가 아니라 엉덩이에서 이어진 하나의 plume 이다.',
  ],
} as const;
