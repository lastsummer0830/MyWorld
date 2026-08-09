# MyWorld — Claude Code 규칙

## 범위와 권위

- 이 파일은 `MyWorld` Git repo에만 적용한다. 다른 AJ_Proj 하위 repo나 외부 작업공간을 읽거나 변경하지 않는다.
- 우선순위는 사용자 최신 지시 > 이 파일 > 실제 코드·Git·실행 결과 > `README.md`·`REBUILD_PLAN.md`·legacy 문서다.
- 상위 `AJ_Proj/CLAUDE.md`와 충돌하면 이 repo에 더 구체적인 이 파일을 따른다.

## Hermes 감독–Claude 작업자 계약

- Hermes가 목표·범위·도구·완료 조건을 정하고 Claude Code Opus 5는 이 repo 안에서 구현한다. Claude의 자체 보고는 승인이 아니다.
- Hermes는 Claude를 MyWorld Git root에서 repo-local settings와 작업별 최소 tools로 실행하고, 이후 diff·테스트·실제 화면을 독립 검증한다.
- 부모·사용자 legacy Skill·agent·hook·plugin·MCP를 자동 사용하지 않는다. 3D 시각 구현에는 repo-local `myworld-visual-implementation` Skill을 적용한다.
- agent team, background worker, worktree, 추가 디렉터리는 Hermes 작업 계약에 명시된 경우만 사용한다.

## 작업 시작과 승인 경계

- Hermes wrapper가 시작 전에 Git root와 `git status --short --branch`를 기록한다. Claude는 제공된 baseline의 기존 변경을 보존하고 지정 파일만 다룬다.
- 변경 전에 목표, 이유, 영향 파일을 설명하고 Hermes가 승인한 범위만 작업한다. 같은 범위의 일반 수정·검증은 다시 묻지 않는다.
- 삭제·대량 이동·패키지 설치·commit·push·배포는 Claude가 수행하지 않는다. 필요한 경우 Hermes에 근거와 범위를 보고한다.
- repo·목표·영향 파일 또는 side-effect 범위가 넓어지면 멈추고 Hermes에 보고한다.
- `reset --hard`, `restore`, `clean`, `rebase`, amend, force push 등 변경·이력을 유실하거나 재작성하는 작업을 수행하지 않는다.

## MyWorld / MyRoom 제품 경계

- `MyWorld`는 현재 repo 및 제품 표기다. `myRoom`·`MyRoom`을 자동으로 같은 이름이나 현행 제품명으로 취급하지 않는다.
- 현재 `src/`의 방·박물관 경로와 `src2/` 및 `/rebuild`의 정원 개편 경로가 공존한다.
- MyWorld/MyRoom 관계, 최종 제품 범위, legacy 코드 계보, Credits·LICENSE 상태를 실제 파일과 사용자 의도로 확인하기 전에는 이름·설명·라우트·라이선스 의미를 바꾸지 않는다.
- `README.md`, `REBUILD_PLAN.md`, 주석, 외부 reference는 서로 다른 시점의 증거일 수 있으며 단독 정본으로 간주하지 않는다.
- 팀 또는 원작의 기여를 사용자 개인 기여로 바꾸지 않는다.

## 제품 작업과 검증

- 문서의 기능·기술·기여 서술은 현재 코드와 Git 증거로 대조한다.
- Claude는 변경 파일과 필요한 검증 명령을 보고하고 완료를 자가 승인하지 않는다. Hermes가 관련 lint·build·test를 실제 실행하며, 실행하지 못한 항목은 이유와 함께 `미검증`으로 표시한다.
- 3D 시각 작업은 reference, 형태·비율·실루엣, 카메라, 재질·조명 기준을 먼저 정한다.
- 시각 작업 완료는 Hermes가 실제 route를 렌더하고 screenshot을 reference 및 acceptance와 비교한 뒤에만 선언한다. 코드 생성만으로 승인하지 않는다.
- 새 문제는 직접 증거가 있을 때만 보고하며, 승인 범위 밖 제품 작업으로 자동 확장하지 않는다.
