# CLAUDE.md — MyWorld 프로젝트 지침

이 폴더는 **MyWorld** — 조아진의 3D 인터랙티브 포트폴리오 (독립 git repo).
상위 폴더 `D:\dev\AJ_Proj\`의 감독관 지침(CLAUDE.md)이 함께 적용된다.
충돌 시: **git/승인/보고 규칙은 감독관 지침**을, **코드 컨벤션은 이 문서**를 따른다.

## 1. 프로젝트 정체성

- 원작: [cjfwls39/myRoom](https://github.com/cjfwls39/myRoom) (CC BY-NC 4.0) — 뼈대만 가져온 리메이크.
  README의 Credits 섹션과 LICENSE 파일은 **절대 지우지 않는다.**
- 컨셉 (조아진 확정, 2026-07-13):
  - 배경: 겨울 스노우글로브 → **여름 정원 유리 구슬** (잔디·활엽수·꽃밭·연못·큰나무+그네·피크닉)
  - 방: **파스텔 + 밝은 오크 + 플랜테리어** (민트크림 벽 #F2F7EF, 오크 바닥 #C9AE8C)
  - 동물: 고양이 → **강아지** (골든 크림 #F2E3C8 + 브라운 #B98A5F)
  - 날씨: 눈보라 → 소나기 / 밤: 반딧불이, 낮: 나비
- 겨울·고양이 요소를 다시 들여오지 않는다.

## 2. 코드 컨벤션 (원작 스타일 유지)

- 스택: Next.js 16 App Router + TS5 + Three.js r183 + R3F 9 + drei 10. 외부 3D 모델/텍스처 없음 — 전부 프리미티브 절차 생성, 그림 텍스처는 canvas 2D (`dogTextures.ts` 참고).
- 색은 `src/components/room/constants.ts`의 COLOR, 재질은 `materials.ts`의 MAT 경유 (하드코딩 금지). 배치 좌표는 `layout.ts`.
- 성능: instancedMesh로 draw call 최소화, `Performance.ts`의 LOW_END_DEVICE 분기 유지, useFrame 안에서는 lerp 패턴 + 할당 최소화.
- 등장 연출: `AnimatedWrapper.tsx`의 PhaseGroup/SceneItem 패턴.
- 주석은 한국어, 파일 상단에 역할 설명.
- 포트폴리오 내용 수정 = `src/components/room/portfolioData.ts` 한 곳. 단 **프로젝트 개수를 바꾸면** `museum/GalleryRoom.tsx`의 EXHIBIT_ZS/SIDES도 맞출 것 (현재 3개 기준).

## 3. 현재 상태 (2026-07-13 Cowork 세션에서 세팅)

완료:
- 뼈대 복사, 여름 배경(`summerBackground/` 11개 파일), 방 리스타일(파스텔+강아지+식물), 옛 겨울/고양이 파일·원작자 이미지 삭제
- portfolioData/메타데이터/README를 조아진 기준으로 교체

미완 (Cowork 샌드박스 제약으로 넘김): **git init, npm 빌드 검증** — 아래 TODO 0·1이 최우선.

## 4. 다음 작업 (TODO)

> ★ **2026-07-14 방향 확정: 아이소메트릭 전면 개편 + 원작 라이선스 완전 탈피.**
> 계획서 = `REBUILD_PLAN.md` (이 파일부터 읽는다). 기법 스킬 = **AJ_Proj 루트**의 `.claude/skills/isometric-diorama-builder`, `.claude/skills/procedural-asset-styleguide` (repo 밖에 둠 — Public 전환 대비).
> 아래 기존 TODO 중 0·1(git/빌드 검증)은 유효, 나머지는 개편 단계에 흡수됨.


0. **`git init` + 첫 커밋** — 이 폴더에서 `git init` → `.gitignore` 확인 → 첫 커밋. (AJ_Proj 규칙: `git add .` 금지 — 파일 명시적으로 add. push는 조아진 승인 후.)
1. **`npm install` + `npm run dev`로 실제 화면 확인** — 여름 배경/방 리스타일은 코드만 작성된 상태로 아직 빌드·화면 검증이 안 됐다. 타입 에러가 있으면 먼저 잡고, 색감·배치·애니메이션 어색한 곳 조아진과 함께 조정.
2. `portfolioData.ts`의 `TODO(아진)` 채우기 — tagline, intro, 학력, 프로젝트 background/approach, 캡처 이미지.
3. `app/layout.tsx`의 metadataBase/openGraph.url — 배포 후 실제 주소로.
4. 모바일 확인 + 갤러리 업적 동작 확인.
5. GitHub repo 생성 + push (조아진 승인 후. 계정: lastsummer0830).
6. 배포(Vercel) 및 README에 라이브 데모 링크 추가.
7. 완료 시 `D:\dev\AJ_Proj\PORTFOLIO_STATUS.md`의 MyWorld 체크리스트 갱신.

## 5. 주의

- secret 금지 (감독관 지침 공통). `.env*`는 gitignore에 이미 있음.
- push·force push·기록 변경은 감독관 지침 그대로: **조아진 승인 후에만 push, force push 금지.**
- 원작 대비 "직접 만든 것"을 부풀리지 않는다. README에도 리메이크임을 명시한 상태 유지.
