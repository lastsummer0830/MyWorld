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
 * 내용은 각 repo README·이력서의 사실만 반영했다 (부풀림 없음).
 *   이미지는 캡처 확보 후 넣는다 (보류 항목).
 */

// ── About Me ──────────────────────────────────────────────────
export const ABOUT_DATA = {
  name:   "조아진",
  role:   "WEB DEVELOPER",
  tagline: "현장에서 익힌 실행력을 코드로 옮기는 신입 개발자",
  avatar: "/images/profile.jpg",   // 320x320 정사각 크롭 (80px 원형으로 표시). 비우면 이니셜 표시

  intro:
    "요식업 현장에서 5년 넘게 일했습니다.\n" +
    "조리 자격증 없이 실력만으로 헤드셰프까지 올라가, 직원 관리와 발주, 레시피 관리를 맡았습니다.\n" +
    "거기서 멈추지 않고 개발로 방향을 튼 건, 불편한 걸 말하는 쪽이 아니라 직접 고치는 쪽이 되고 싶어서였습니다.\n" +
    "\n" +
    "지금은 규칙이 얽힌 데이터를 구조로 푸는 일이 제일 즐겁습니다.\n" +
    "포켓몬 타입 상성표를 손으로 설계하다 키 하나가 안 맞아 며칠을 헤맸던 것도,\n" +
    "결국 그게 재미있어서 계속 붙잡고 있었습니다.",

  experience: [
    // 신입이라 비워둠 — 이직 시점에 사용
  ] as { role: string; company: string; period: string; desc: string }[],

  /**
   * 학력 = 정규 교육과정만. 학원은 여기 넣지 않는다 (→ training).
   * 고등학교부터 이어 적는 이유: 학점은행제만 두면 그 앞이 빈 것처럼 보인다.
   * 전향(메이크업 → 요식업 → 개발)의 맥락은 위 intro가 이미 설명하므로 중퇴를 감추지 않는다.
   */
  education: [
    { school: "사동고등학교",   major: "",                    period: "2019.02 졸업" },
    { school: "정화예술대학교", major: "메이크업학과 · 중퇴", period: "2019 입학" },
    { school: "학점은행제",     major: "컴퓨터공학 (공학사)", period: "2027.02 취득 예정" },
  ] as { school: string; major: string; period: string }[],

  /** 교육사항 — 학원·부트캠프 등 정규 학력이 아닌 이수 과정. */
  training: [
    { school: "에이콘아카데미", major: "자바 웹 개발자 과정", period: "2026.01 — 2026.07 (수료 예정)" },
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
export const SKILLS_DATA = [
  {
    category: "Frontend",
    items: ["HTML5", "CSS3", "JavaScript", "jQuery", "TypeScript"],
  },
  {
    category: "Backend",
    items: ["Java", "Spring", "Spring Boot", "JPA", "MyBatis", "Servlet/JSP"],
  },
  {
    category: "Database",
    items: ["Oracle", "MySQL"],
  },
  {
    category: "Tools",
    items: ["Git", "Maven", "Gradle", "Tomcat", "Docker", "AWS EC2"],
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
//  ※ repo들이 Public이라 github 링크가 바로 유효함.
//
export const PROJECTS_DATA = [
  {
    title:    "pokemonJava",
    period:   "2026",
    status:   "completed" as "completed" | "inprogress",

    images: [] as string[],   // 캡처 대기(보류 항목) — pokemonJava README 캡처와 공용 가능

    summary:
      "Java Swing으로 만든 턴제 포켓몬 RPG.\n" +
      "24개 클래스, 약 3,560줄 규모로 게임 메커니즘을 직접 구현했습니다.",

    background:
      "자바 기본기를 완결된 게임 하나로 정리하고 싶었습니다.\n" +
      "포켓몬은 타입 상성·상태이상·진화처럼 규칙이 서로 얽힌 데이터가 많습니다.\n" +
      "데이터 설계와 로직 분리를 연습하기 좋은 소재라고 판단했습니다.",

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

    images: [] as string[],   // 캡처 대기(보류 항목)

    summary:
      "pokemonJava를 잇는 TypeScript 리메이크/발전작. 현재 개발 진행 중입니다.",

    background:
      "Java 선행작의 그래픽·데이터 관리 한계를 웹에서 개선하고 싶었습니다.\n" +
      "기존 게임 데이터를 눈대중이 아니라 원본 파일에서 추출해 옮기는 것을 원칙으로 삼았습니다.",

    approach:
      "게임 엔진 없이 Phaser 3 + TypeScript로 2D 타일 RPG를 밑바닥부터 만들고 있습니다.\n" +
      "전투·포획·인카운터 로직은 Phaser에 의존하지 않는 순수 함수로 분리했습니다.\n" +
      "난수를 주입해 재현하고, 결과를 픽셀 단위로 원본과 대조해 검증합니다.",

    features: [
      "오버월드 격자 이동 — 맵 3장을 단일 격자로 심리스 연결",
      "5세대 공식을 그대로 이식한 포획·야생 조우 확률",
      "타입 상성·상태이상·트레이너전을 갖춘 턴제 전투",
      "Playwright + 픽셀 diff로 원본과 재현 대조 (464px 중 불일치 0)",
    ],

    skills:  ["TypeScript"],
    link:    "",
    github:  "https://github.com/lastsummer0830/Pokemon_With",
  },

  {
    title:    "nintendo-switch-web",
    period:   "2026 — 개편 중",
    status:   "inprogress" as "completed" | "inprogress",

    images: [] as string[],   // 캡처 대기 — 개편 후 before/after

    summary:
      "닌텐도 스위치 UI 컨셉의 웹 포트폴리오. 스위치 홈 화면을 재현하고\n" +
      "대표 게임별 아이덴티티 페이지를 만드는 프로젝트로, 현재 개편 진행 중입니다.",

    background:
      "초기에 만든 프로젝트를 컨셉부터 다시 잡아 리메이크하고 있습니다.\n" +
      "스위치 홈 화면 수준의 재현 + 마리오가 점프해서 ?박스를 치면\n" +
      "프로젝트 카드가 나오는 인터랙션이 목표입니다.",

    approach:
      "개편 진행 중이라 아직 목표 단계입니다.\n" +
      "초기엔 유튜브 임베드·외부 이미지로 화면을 때웠습니다.\n" +
      "스위치 홈 UI와 마리오 ?박스를 CSS·SVG·Canvas로 직접 그려 교체하고 있습니다.",

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
