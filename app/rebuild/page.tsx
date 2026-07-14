// 개편(아이소메트릭) 씬 전용 라우트 — /rebuild
// 구 씬(/)을 건드리지 않고 새 씬을 나란히 띄워 두는 창구다.
// 개편이 끝나면(REBUILD_PLAN 단계 7) 이 씬이 /로 승격되고 이 라우트는 사라진다.

'use client';

import IsoStage from '@iso/scene/IsoStage';

export default function RebuildPage() {
  return <IsoStage />;
}
