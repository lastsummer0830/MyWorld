'use client';

// AJP-004 — 강아지 조형 능력 표본 라우트.
// 제품(`/rebuild`)·구도 스파이크(`/rebuild-reset`)·식생 표본(`/capability-eval/vegetation`)과
// 완전히 분리된 화면이다. 승급 대상이 아니라 판정용 표본이며, 제품 씬의 코드·에셋을 재사용하지 않는다.

import DogEval from '@iso/spikes/dog-capability-eval/DogEval';

export default function DogCapabilityEvalPage() {
  return <DogEval />;
}
