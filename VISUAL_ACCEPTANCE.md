# MyWorld Visual Acceptance

## 현재 판정

`/rebuild`의 현행 화면은 포트폴리오 메인 비주얼로 승인하지 않는다.
강아지뿐 아니라 섬, 꽃, 나무, 연못, 다리, 퍼걸러, 집, 외곽 구름과 부유섬까지 전체 형태 언어가 조잡하고 서로 통일되지 않았다.
기존 에셋을 조금씩 다듬는 방식 대신 구도 골격부터 다시 검증한다.

## Reference 상태

- 제품 컨셉 정본: `REBUILD_PLAN.md`의 정원 섬, 퍼걸러, 티테이블 맥북, 연못, 강아지, 낮/밤 방향.
- 현재 baseline: `/rebuild` 실제 데스크톱 렌더(1280×577)와 낮/밤 전환.
- repo 내부 이미지 reference: profile 사진 외 없음.
- 외부 이미지 reference: 검색 경로가 bot/CAPTCHA로 차단돼 이번 spike에서는 `미검증`이다.
- 따라서 `/rebuild-reset`은 최종 미술 시안이 아니라 composition blockout으로만 판정한다.

## Composition acceptance

1. 섬 전체 실루엣이 한눈에 읽히고, 둥근 사각 접시처럼 보이지 않는다.
2. 화면 가장자리와 섬 사이에 숨 쉴 여백이 있으며 흙·바위 단면이 잘리지 않는다.
3. 퍼걸러/티테이블이 1차 초점, 연못이 2차 초점, 집이 3차 초점으로 읽힌다.
4. 구조물 사이에 의도적인 이동 흐름과 열린 잔디가 있다.
5. 작은 에셋을 흩뿌리지 않아도 큰 식재 매스와 여백만으로 정원 구도가 성립한다.
6. 외곽 구름·부유섬·빛기둥 없이도 주인공 섬이 충분히 완결돼 보인다.

## Asset acceptance

- 꽃: 개별 줄기 scatter 금지. 멀리서 하나의 화단 매스로, 가까이서 종별 실루엣으로 읽혀야 한다.
- 나무: 구·원뿔 덩어리 금지. 줄기에서 가지와 수관으로 이어지는 연속 실루엣이 필요하다.
- 연못: 타원 접시 금지. 비대칭 호안, 깊이, 물 가장자리와 다리 지지 구조가 보여야 한다.
- 강아지: 현재 모델 사용 금지. 실제 블루멀 셸티 reference와 정면·측면 silhouette gate 전에는 씬에 복귀시키지 않는다.
- 구름/외곽섬: sphere 뭉치와 cylinder+cone 조합 사용 금지. 원경 깊이를 개선한다는 실제 렌더 증거가 없으면 제외한다.

## Lighting acceptance

- 낮: 화면을 씻는 반투명 빛기둥 금지. 초점 구조물과 지면의 local contrast가 유지돼야 한다.
- 밤: 집 창문만 밝아지는 상태 금지. 퍼걸러 알전구와 반딧불이가 초점을 만들되 정원 실루엣은 읽혀야 한다.
- Bloom은 발광체에만 제한되고 하늘·잔디·UI를 번지게 하지 않는다.

## Verification gate

- desktop day/night screenshot 비교
- 주요 에셋 close-up screenshot
- console error 0
- `npm run lint`와 `npm run build`
- 실제 이미지 reference가 없으면 최종 승인 대신 `미검증`으로 유지

## Composition spike verdict

`/rebuild-reset` 3차 렌더의 전체 판정은 여전히 `PARTIAL`이다. 과대한 암반 깊이 축소와 pond/bridge 우측 분리는 실제 fresh day 렌더에서 검증됐고 초점 삼각형도 개선됐다. 그러나 night는 구조물이 검게 잠겨 초점 조명이 실패하며, 섬 단면·pond bank·bridge·pergola·house는 여전히 조잡한 blockout이다. production 승격은 금지하고 외부 이미지 reference도 `미검증`으로 유지한다.
