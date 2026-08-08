# MyWorld — Claude Code 규칙

## 범위와 권위

- 이 파일은 `MyWorld` Git repo에만 적용한다. 다른 AJ_Proj 하위 repo나 외부 작업공간을 읽거나 변경하지 않는다.
- 우선순위는 사용자 최신 지시 > 이 파일 > 실제 코드·Git·실행 결과 > `README.md`·`REBUILD_PLAN.md`·legacy 문서다.
- 상위 `AJ_Proj/CLAUDE.md`와 충돌하면 이 repo에 더 구체적인 이 파일을 따른다.

## 작업 시작과 승인 경계

- 시작 시 `git status --short --branch`와 Git root를 확인하고 기존 변경을 보존한다.
- 변경 전에 목표, 이유, 영향 파일을 설명하고 사용자가 승인한 범위만 작업한다.
- 작업 계획 승인 1회는 그 계획에 명시된 일반 파일 수정과 검증 전체를 승인한 것으로 본다. 같은 범위에서는 다시 묻지 않는다.
- 삭제·대량 이동·패키지 설치·commit·push·배포는 계획에 미리 명시해 함께 승인받을 수 있으며, 이미 승인된 항목은 실행 직전에 재확인하지 않는다.
- 최초 승인에 없던 위험 작업이나 repo·목표·영향 파일 범위 확대가 생길 때만 추가 승인을 요청한다.
- 상위 규칙의 자동 commit·push 및 MyStudy backup/commit/push는 MyWorld 작업에 적용하지 않는다.
- `reset --hard`, `restore`, `clean`, `rebase`, amend, force push 등 변경·이력을 유실하거나 재작성하는 작업을 임의로 수행하지 않는다.
- legacy hook·agent·Skill은 감사와 별도 승인 없이 실행·복원·복사하지 않는다.

## MyWorld / MyRoom 제품 경계

- `MyWorld`는 현재 repo 및 제품 표기다. `myRoom`·`MyRoom`을 자동으로 같은 이름이나 현행 제품명으로 취급하지 않는다.
- 현재 `src/`의 방·박물관 경로와 `src2/` 및 `/rebuild`의 정원 개편 경로가 공존한다.
- MyWorld/MyRoom 관계, 최종 제품 범위, legacy 코드 계보, Credits·LICENSE 상태를 실제 파일과 사용자 의도로 확인하기 전에는 이름·설명·라우트·라이선스 의미를 바꾸지 않는다.
- `README.md`, `REBUILD_PLAN.md`, 주석, 외부 reference는 서로 다른 시점의 증거일 수 있으며 단독 정본으로 간주하지 않는다.
- 팀 또는 원작의 기여를 사용자 개인 기여로 바꾸지 않는다.

## 제품 작업과 검증

- 문서의 기능·기술·기여 서술은 현재 코드와 Git 증거로 대조한다.
- 코드 변경은 관련 lint·build·test를 실제 실행해 검증하고, 실행하지 못한 항목은 이유와 함께 `미검증`으로 표시한다.
- 3D 시각 작업은 reference, 형태·비율·실루엣, 카메라, 재질·조명 기준을 먼저 정한다.
- 시각 작업 완료는 실제 route를 렌더하고 screenshot을 reference 및 acceptance와 비교한 뒤에만 선언한다. 코드 생성만으로 승인하지 않는다.
- 새 문제는 직접 증거가 있을 때만 보고하며, 승인 범위 밖 제품 작업으로 자동 확장하지 않는다.
