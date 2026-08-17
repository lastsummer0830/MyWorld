'use client';

// AJP-004 — Skill-ON v2 · stage-1 (재설계 Skill 재평가용 새 라우트).
//
// 이전 실패 라우트(`/capability-eval/dog-skill-on`)는 그대로 둔다. 여기는 별도 표본이며,
// 제품 씬·기존 dog 소스·이전 dog eval 소스를 읽지도 재사용하지도 않았다.
// 승급 대상이 아니다. stage-1 실루엣/해부 판정만을 위한 화면이다.
//
//   /capability-eval/dog-skill-on-v2?view=front|left|right|three-quarter|back&flat=0|1

import StageV2 from '@iso/spikes/dog-skill-on-v2-eval/StageV2';

export default function DogSkillOnV2EvalPage() {
  return <StageV2 />;
}
