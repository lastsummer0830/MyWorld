/**
 * portfolioData.ts — 포트폴리오 콘텐츠 데이터
 * 여기만 수정하면 모달 내용이 전부 바뀝니다.
 *
 * 줄바꿈은 텍스트 중간 \n 로 가능
 *
 * 이미지는 고해상도로 정해진 경로에 정확히 저장할것
 * 프로필 사진 = /public/images/
 * 프로젝트 사진 = /public/images/projects/
 *
 * ★ TODO(아진): 아래에 "TODO" 표시된 곳은 직접 채우거나 다듬을 것.
 *   현황판(PORTFOLIO_STATUS.md)에 있는 사실만 채워뒀고, 부풀린 내용은 없음.
 */

// ── About Me ──────────────────────────────────────────────────
export const ABOUT_DATA = {
  name:   "조아진",
  role:   "WEB DEVELOPER",
  tagline: "TODO: 나를 한 줄로 소개하는 문장", // TODO(아진)
  avatar: "",   // TODO(아진): /public/images/ 에 사진 넣고 "/images/profile.jpg" 로. 비우면 이니셜 표시

  intro:
    "TODO(아진): 2~3줄 자기소개.\n" +
    "어떤 계기로 개발을 시작했고, 뭘 만들 때 즐거운지.",

  experience: [
    // 신입이라 비워둠 — 이직 시점에 사용
  ] as { role: string; company: string; period: string; desc: string }[],

  education: [
    // TODO(아진): 학력/교육과정 기입 (예: 학원 과정, 학교)
    // { school: "학교/과정명", major: "전공/과정", period: "YYYY.MM — YYYY.MM" },
  ] as { school: string; major: string; period: string }[],

  ps: [
    "자유롭게 탐험해 보세요! 즐거운 시간 되시길 바랍니다 :)",
    "PROJECT 탭에서 제 작품들을 확인하실 수 있습니다!",
    "방문해 주셔서 감사합니다!",
  ],
};

// ── Skills ────────────────────────────────────────────────────
// 카테고리별 기술명만 배열로 나열하면 모달에 배지(로고+색)로 표시됩니다.
// (로고·색은 PortfolioModal.tsx 의 SKILL_META 에서 관리)
// TODO(아진): 실제 다룰 수 있는 것만 남기고 조정할 것
export const SKILLS_DATA = [
  {
    category: "Frontend",
    items: ["HTML5", "CSS3", "JavaScript", "TypeScript"],
  },
  {
    category: "Backend",
    items: ["Java", "Spring", "JSP"],
  },
  {
    category: "Database",
    items: ["MySQL"],
  },
  {
    category: "Tools",
    items: ["Git"],
  },
];

// ── Projects ──────────────────────────────────────────────────
//
//  이 배열이 두 곳에서 동시에 쓰입니다:
//    1) 박물관(3D 갤러리)에 전시물(액자)로 자동 전시됨
//    2) 전시물 클릭 시 뜨는 상세 패널 내용
//
//  ▶ 프로젝트 추가/삭제는 이 배열만 수정하면 됩니다.
//  ▶ 단, 전시물 "개수"를 바꾸면 박물관 전시 위치도 맞춰야 합니다:
//     → src/components/museum/GalleryRoom.tsx 의 EXHIBIT_ZS / SIDES
//       (자세한 규칙은 그 파일 상단 주석 참고)
//
//  필드 설명:
//    title      : 프로젝트명 (한글 포함 시 자동으로 한글 폰트 적용)
//    period     : 기간 표기
//    status     : "completed"(완료) | "inprogress"(진행중) — 뱃지 색 결정
//    images     : /public/images/projects/ 경로. 여러 장이면 캐러셀, 없으면 placeholder
//    summary    : 한 줄 요약 (줄바꿈은 \n)
//    background : 💡 왜 만들었나 — 문제의식·동기 (선택, 비우면 섹션 숨김)
//    approach   : 🛠 어떻게 만들었나 — 기술 선택 이유·구현 포인트 (선택, 비우면 숨김)
//    features   : 주요 기능 목록 (▸ 불릿으로 표시)
//    skills     : 기술 스택 태그
//    link       : 배포 사이트 URL (없으면 버튼 숨김)
//    github     : 저장소 URL (없으면 버튼 숨김)
//
//  ※ 현재 3개 기준으로 갤러리가 배치되어 있음. 개수 유지하며 내용만 다듬는 게 안전.
//  ※ repo들이 아직 Private이므로 github 링크는 Public 전환 후에 유효해짐.
//
export const PROJECTS_DATA = [
  {
    title:    "pokemonJava",
    period:   "2026",
    status:   "completed" as "completed" | "inprogress",

    images: [] as string[],   // TODO(아진): 실행 캡처 넣기 (pokemonJava README용 캡처와 공용 가능)

    summary:
      "Java Swing으로 만든 턴제 포켓몬 RPG.\n" +
      "22개 클래스, 약 3,200줄 규모로 게임 메커니즘을 직접 구현했습니다.",

    background:
      "TODO(아진): 왜 만들었는지 — 포켓몬 게임을 직접 구현해보고 싶었던 동기 등.",

    approach:
      "외부 API 없이 포켓몬·기술 데이터를 전부 직접 설계했습니다. 그 과정에서\n" +
      "\"불\"/\"불꽃\" 같은 키 불일치 버그를 겪으며 데이터 일관성의 중요성을 배웠고,\n" +
      "진화 시 레벨업 기술 습득 타이밍 같은 세부 규칙도 직접 풀어냈습니다.\n\n" +
      "구조는 BattleEngine / GameDataManager / Pokedex / SaveManager 등으로 계층을 분리했고,\n" +
      "BattleLogger 함수형 인터페이스로 로그 출력을 주입해 콘솔↔Swing UI를 교체할 수 있게 했습니다.",

    features: [
      "타입 상성 · 상태이상 · 진화 · 레벨업 기술 습득 등 실제 게임 메커니즘",
      "BattleEngine 등 역할별 클래스 계층 분리",
      "함수형 인터페이스(BattleLogger)로 로그 출력 주입 — 콘솔↔Swing 교체 가능",
      "SwingUtilities.invokeAndWait 를 이용한 EDT 처리",
    ],

    skills:  ["Java", "Swing"],
    link:    "",
    github:  "https://github.com/lastsummer0830/pokemonJava",
  },

  {
    title:    "Pokemon With",
    period:   "2026 — 진행 중",
    status:   "inprogress" as "completed" | "inprogress",

    images: [] as string[],   // TODO(아진)

    summary:
      "pokemonJava를 잇는 TypeScript 리메이크/발전작. 현재 개발 진행 중입니다.",

    background:
      "TODO(아진): Java 선행작에서 무엇이 아쉬워서 TS로 다시 만드는지.",

    approach:
      "TODO(아진): 기술 선택 이유와 현재까지의 구현 포인트.",

    features: [
      "TODO(아진): 현재까지 구현된 기능",
    ],

    skills:  ["TypeScript"],
    link:    "",
    github:  "https://github.com/lastsummer0830/Pokemon_With",
  },

  {
    title:    "nintendo-switch-web",
    period:   "2026 — 개편 중",
    status:   "inprogress" as "completed" | "inprogress",

    images: [] as string[],   // TODO(아진): 개편 후 before/after 캡처

    summary:
      "닌텐도 스위치 UI 컨셉의 웹 포트폴리오. 스위치 홈 화면을 재현하고\n" +
      "대표 게임별 아이덴티티 페이지를 만드는 프로젝트로, 현재 개편 진행 중입니다.",

    background:
      "초기에 만든 프로젝트를 컨셉부터 다시 잡아 리메이크하고 있습니다.\n" +
      "스위치 홈 화면 수준의 재현 + 마리오가 점프해서 ?박스를 치면\n" +
      "프로젝트 카드가 나오는 인터랙션이 목표입니다.",

    approach:
      "TODO(아진): 개편하면서 유튜브 임베드를 직접 구현 인터랙션으로 바꾸는 과정 등.",

    features: [
      "닌텐도 스위치 홈 화면 UI 재현 (개편 목표)",
      "마리오 ?박스 점프 인터랙션으로 프로젝트 노출 (개편 목표)",
    ],

    skills:  ["HTML5", "CSS3", "JavaScript"],
    link:    "",
    github:  "https://github.com/lastsummer0830/nintendo-switch-web",
  },
];

// ── Contact ───────────────────────────────────────────────────
export const CONTACT_DATA = {
  email:    "lastsummer0830@gmail.com",
  phone:    "",   // 비우면 표시 안 됨
  github:   "https://github.com/lastsummer0830",
  linkedin: "",
  twitter:  "",
  other:    [] as { label: string; url: string }[],
};
