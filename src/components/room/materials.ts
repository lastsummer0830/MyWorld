/**
 * materials.ts — 씬 전체 재질(roughness/metalness) 설정
 *
 * 재질 특성 기준:
 *   벽/천장    — 무광 페인트:       roughness 0.95, metalness 0
 *   나무       — 가구/선반:         roughness 0.75, metalness 0
 *   패브릭     — 커튼/침구/털:      roughness 1.00, metalness 0
 *   플라스틱   — 가전/소품:         roughness 0.60, metalness 0.05
 *   가죽/폼    — 의자/쿠션:         roughness 0.50, metalness 0.1
 *   금속       — 손잡이/나사/핀:    roughness 0.30, metalness 0.6
 *   유리       — 모니터/강화유리:   roughness 0.10, metalness 0.5
 */

// ── 타입 ──────────────────────────────────────
export interface MatProps {
  roughness:  number;
  metalness?: number;
}

// ── 재질 프리셋 ───────────────────────────────
export const MAT = {

  // 구조
  wall:         { roughness: 0.95, metalness: 0    },  // 벽 페인트
  floor:        { roughness: 0.90, metalness: 0    },  // 바닥 원목
  moulding:     { roughness: 0.75, metalness: 0    },  // 몰딩 나무

  // 나무 계열
  woodLight:    { roughness: 0.75, metalness: 0    },  // 밝은 나무 (책상)
  woodMid:      { roughness: 0.75, metalness: 0    },  // 중간 나무 (선반)
  woodDark:     { roughness: 0.80, metalness: 0    },  // 어두운 나무 (액자테두리)
  woodChair:    { roughness: 0.75, metalness: 0    },  // 의자 나무

  // 패브릭
  fabric:       { roughness: 1.00, metalness: 0    },  // 커튼/침구/러그
  curtain:      { roughness: 1.00, metalness: 0    },
  mattress:     { roughness: 1.00, metalness: 0    },
  pillow:       { roughness: 1.00, metalness: 0    },
  blanket:      { roughness: 1.00, metalness: 0    },
  rug:          { roughness: 1.00, metalness: 0    },

  // 가전/플라스틱
  fridge:       { roughness: 0.55, metalness: 0.05 },  // 냉장고
  drawer:       { roughness: 0.80, metalness: 0    },  // 서랍장 나무

  // 전자기기 (어두운 소재)
  darkBody:     { roughness: 0.50, metalness: 0.10 },  // PC/의자 본체
  darkMid:      { roughness: 0.40, metalness: 0.30 },  // 금속 느낌 부품
  pcGlass:      { roughness: 0.10, metalness: 0.50 },  // PC 강화유리

  // 금속
  metalHandle:  { roughness: 0.30, metalness: 0.60 },  // 손잡이/나사
  metalBright:  { roughness: 0.15, metalness: 0.85 },  // 밝은 금속 (시계 핀 등)

  // 강아지
  dogFur:       { roughness: 1.00, metalness: 0    },  // 털
  dogEye:       { roughness: 0.30, metalness: 0    },  // 눈
  dogNose:      { roughness: 0.80, metalness: 0    },  // 코

  // 소품
  plant:        { roughness: 1.00, metalness: 0    },  // 식물
  pot:          { roughness: 0.85, metalness: 0    },  // 화분 도자기
  book:         { roughness: 0.85, metalness: 0    },  // 책
  cork:         { roughness: 1.00, metalness: 0    },  // 코르크 보드
  paper:        { roughness: 0.95, metalness: 0    },  // 메모지/봉투
  pin:          { roughness: 0.40, metalness: 0.30 },  // 핀

  // 창문
  windowFrame:  { roughness: 0.70, metalness: 0.10 },  // 창문 프레임
  glass:        { roughness: 0.05, metalness: 0.90 },  // 유리
} as const;

// ── 편의 함수 ─────────────────────────────────
// <meshStandardMaterial color={...} {...spread(MAT.wood)} />
export function spread(mat: MatProps) {
  return mat;
}
