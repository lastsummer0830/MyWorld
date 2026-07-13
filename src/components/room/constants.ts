// ─────────────────────────────────────────────
//  Room 전체에서 공유하는 상수
//  좌표·크기·색상을 한 곳에서 관리해
//  하나 바꿔도 연쇄 오차가 생기지 않도록 합니다.
// ─────────────────────────────────────────────

// ── 방 구조 ──────────────────────────────────
export const ROOM = {
  size:           6,      // 가로·깊이 (8 → 6)
  height:         5.5,    // 천장 높이 (7 → 5.5)
  wallThickness:  0.25,
  floorThickness: 0.4,
} as const;

// 자주 쓰는 파생값 (함수보다 상수가 더 예측 가능)
export const WALL_HALF  = ROOM.size / 2;                          //  3
export const WALL_LEFT  = -WALL_HALF + ROOM.wallThickness / 2;   // -2.875
export const WALL_BACK  = -WALL_HALF + ROOM.wallThickness / 2;   // -2.875

// ── 창문 ─────────────────────────────────────
export const WIN = {
  w:  1.8,   // 2.5 → 1.8
  h:  2.6,   // 3.5 → 2.6
  x:  0.9,   // 뒷벽 기준 X 오프셋
  y:  2.8,   // 높이 중심
} as const;

// ── 색상 팔레트 — 파스텔 + 밝은 우드 플랜테리어 ───
//  5단계 우드 명도 체계: #F7F3EA → #E8DCC8 → #C9AE8C → #A0805C → #6B4F35
//  밝은 내추럴 오크 우드 위에 파스텔·프레시 그린 포인트를 얹습니다.
export const COLOR = {
  // ── 공간 구조 (밝음 → 어두움) ──────────────────
  bg:           "#D9EEF3",   // 배경 — 연한 파스텔 스카이
  wall:         "#F2F7EF",   // 벽 — 아주 연한 민트 크림 화이트
  floor:        "#C9AE8C",   // 3단계 — 내추럴 오크 (바닥)
  moulding:     "#E8DCC8",   // 2단계 — 라이트 애쉬 (몰딩)
  windowFrame:  "#A0805C",   // 4단계 — 미드 오크 (창문 프레임)

  // ── 가구 — 재질별 개별 색상 ───────────────────
  woodLight:    "#D9C4A3",   // 책상 — 라이트 오크
  woodMid:      "#C9AE8C",   // 선반 — 내추럴 오크
  woodDark:     "#A0805C",   // 4단계 — 미드 오크 (포인트용)
  woodChair:    "#EDE3D2",   // 서랍장 — 화이트 애쉬

  // ── 가구 — 다크 계열 ───────────────────────────
  darkBody:     "#4A4038",   // 의자 — 웜 그레이 브라운
  darkMid:      "#5C5248",   // 사이값
  darkDeep:     "#3A322B",   // 가장 어두운 포인트

  // ── 침구 ───────────────────────────────────────
  bedFrame:     "#C9AE8C",   // 침대 프레임 — 내추럴 오크
  mattress:     "#F4EDDD",   // 매트리스 — 밝은 크림
  pillow:       "#CDE8F0",   // 베개 — 파스텔 스카이블루
  blanket:      "#CBE5BC",   // 이불 — 파스텔 연두

  // ── 강아지 ─────────────────────────────────────
  dogBrown:  "#B98A5F",   // 브라운 털 (귀·등 패치)
  dogCream:  "#F2E3C8",   // 크림 털 (몸통 베이스)
  dogNose:   "#5C4638",   // 다크 브라운 코
  dogEye:    "#3A2E26",   // 진한 브라운 눈
  dogTongue: "#EE9E9E",   // 분홍 혀

  // ── 소품 ───────────────────────────────────────
  rug:          "#F0A88E",   // 러그 — 파스텔 코랄
  plant:        "#7FBF6A",   // 식물 — 프레시 그린 (기본)
  plantLight:   "#A5D68C",   // 식물 — 라이트 그린 (새잎)
  plantDeep:    "#5C9E4E",   // 식물 — 딥 프레시 그린 (그늘잎)
  pot:          "#DCA47F",   // 화분 — 라이트 테라코타
  bookRed:      "#E8836E",   // 책 — 소프트 코랄
  bookBlue:     "#7FAFC9",   // 책 — 파스텔 블루
  curtain:      "#F7F2E4",   // 커튼 — 크림 화이트
  curtainFold:  "#E6DCC4",   // 커튼 주름 — 크림 쉐도우
  drawerBody:   "#EDE3D2",   // 서랍장 — 화이트 애쉬
  drawerHandle: "#A0805C",   // 손잡이 — 미드 오크
  fridgeBody:   "#CFE8DA",   // 냉장고 — 파스텔 민트
  fridgeHandle: "#8FBFA6",   // 냉장고 손잡이 — 세이지 그린
  dogFrames:    "#A0805C",   // 액자 프레임 — 미드 오크
  corkboard:    "#E8DCC8",   // 코르크 — 라이트 샌드
  bowlPink:     "#EDAFBD",   // 밥그릇 — 더스티 핑크
  bowlBlue:     "#9CC8E0",   // 물그릇 — 스카이 블루
  bone:         "#F7EFE2",   // 뼈다귀 — 아이보리
  macrame:      "#EDE3D2",   // 행잉 플랜트 줄 — 마크라메 크림

  // ── PC (블루 RGB는 파스텔 톤 내 유일한 포인트) ───
  pcBody:       "#4A4038",   // 웜 그레이 브라운
  pcRgb:        "#60A5FA",   // 블루 포인트 유지
  screenBlue:   "#1A2A3A",
  screenGreen:  "#1A2A1A",
  textBlue:     "#7EC8F8",
  textGreen:    "#6AE898",
} as const;

// ── 애니메이션 딜레이 (초) ────────────────────
export const DELAY = {
  floor:        0,
  rug:          0.4,
  wallLeft:     0.2,
  wallBack:     0.3,
  desk:         0.5,
  bed:          0.7,
  dogFrames:    0.8,
  shelfLower:   1.1,
  shelfUpper:   1.0,
  drawer:       1.1,
  fridge:       1.2,
  plants:       1.3,
  clock:        1.4,
  curtainL:     1.5,
  curtainR:     1.6,
  iconBase:     1.2,   // 아이콘 액자: base + i * 0.1
} as const;
