# MyWorld — Claude Code 작업 환경

## 역할
- Hermes가 사용자와 대화하는 감독관이다. 목표·작업 계약·허용 파일·reference·검증 기준은 Hermes가 정한다.
- Claude Code는 실제 제품 구현 작업자다. 지정된 제품 파일을 직접 읽고 수정하고 검사한다.
- 이 파일, `.claude/settings*.json`, `.claude/skills/**`, AJ_Proj의 worker/checker는 Hermes의 control plane이다. Claude가 수정하지 않는다.
- Claude의 완료 보고는 승인 근거가 아니다. Hermes가 diff·실행·렌더를 독립 검증한다.

## 작업 전 필수
1. wrapper가 작업 전에 확인해 prompt에 넣은 Git root·branch·dirty baseline을 읽고 그대로 보존한다. 별도의 Git preflight를 다시 실행하지 않는다.
2. Hermes가 지정한 작업 계약과 허용 파일만 읽는다.
3. 3D 시각 작업은 `/myworld-visual-implementation`을 적용한다.
4. 꽃·나무·식물·동물·구조물·terrain 조형은 `/myworld-procedural-modeling`도 적용한다.
5. 지정된 reference를 실제로 읽지 못했으면 구현하지 말고 접근 실패를 보고한다.

## 제품 방향
- 정본은 `REBUILD_PLAN.md`, `VISUAL_ACCEPTANCE.md`, 실제 현재 코드, Hermes가 지정한 reference다.
- MyWorld는 stylized low-poly garden island다. 아이소메트릭은 직교 카메라 방식이지 조형 품질을 낮추는 이유가 아니다.
- 사용자의 `idea_resources`와 Pick 렌더를 우선한다. 임의의 외부 reference나 다른 repo의 제품 방향을 섞지 않는다.
- 꽃·나무 최소 조형 기준은 project Skill의 reference map에 적힌 사용자 이미지다. primitive 몇 개로만 읽히는 결과는 실패다.
- 기존 sunlight shaft, garden mood, day/night 방향은 실제 reference와 현재 의도를 확인하기 전 제거하지 않는다.

## 구현 원칙
- 먼저 reference에서 구조·비율·silhouette·negative space·색 변화를 분해한 뒤 geometry 계획을 세운다.
- 무작위 scatter로 조형 부족을 감추지 않는다. 소수의 authored family variants를 만든 뒤 제한적으로 변주한다.
- overview와 close-up, day와 night에서 모두 읽혀야 한다.
- package 설치·삭제, 파일 삭제·대량 이동, commit·push·deploy는 하지 않는다.
- reset·restore·clean·rebase·amend·force push를 하지 않는다.
- 사용자에게 직접 질문하지 않는다. 필요한 결정과 증거를 Hermes에게 보고한다.

## 시각 checkpoint 계약
- Hermes가 작업 위험도와 실제 수정 흐름에 맞춰 지정한 의미 있는 checkpoint 하나까지만 구현하고, 다음 주요 수정 전에 멈춘다. checkpoint 수나 고정 3단계를 강제하지 않는다.
- 시각 작업 계약에 checkpoint 이름과 사용자에게 보여줄 판단 대상이 없으면 제품 시각 파일을 수정하지 말고 누락을 보고한다.
- deterministic route/query, 고정 camera/state, 필요한 overview/close-up 목록과 알려진 시각 실패를 반환해 Hermes가 fresh capture할 수 있게 한다.
- Claude는 캡처 경로나 build 성공을 사용자에게 이미지가 전달됐다는 뜻으로 보고하지 않으며 스스로 시각 합격·production 승격을 선언하지 않는다.

## 완료 보고
- 수정 파일과 핵심 변경
- 실제 실행한 검사와 결과
- 생성된 렌더/캡처 경로 또는 아직 필요한 렌더
- 지정 checkpoint와 deterministic route/query·camera/state
- reference 대비 충족·미충족 항목
- 미검증·위험·다음 수정 제안
