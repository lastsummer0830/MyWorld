'use client';

// AJP-004 — 소품 조형 능력 표본 라우트(파스텔 물뿌리개).
//
// 제품(`/rebuild`)·구도 스파이크(`/rebuild-reset`)·기존 capability-eval 라우트와 완전히 분리된 화면이다.
// 승급 대상이 아니라 판정용 표본이며, 제품 씬의 코드·에셋을 읽지도 재사용하지도 않았다.
// 외부 모델/텍스처 없이 전부 코드 조형이다.
//
//   /capability-eval/watering-can?view=front|left|right|three-quarter|back&flat=0|1

import PropStage from '@iso/spikes/prop-capability-eval/PropStage';

export default function WateringCanCapabilityEvalPage() {
  return <PropStage />;
}
