"use client";

import GalleryRoom, { GW, EXHIBIT_ZS, SIDES } from "./GalleryRoom";
import ProjectExhibit from "./ProjectExhibit";
import Pottery from "./Pottery";
import { PROJECTS_DATA } from "@/components/room/portfolioData";

// ── 박물관 씬 (RenderTexture 내부) ────────────────────────────
//
// 전시물은 PROJECTS_DATA를 그대로 순회해 자동 생성됩니다.
// 즉 portfolioData.ts 에 프로젝트를 추가하면 여기 코드를 고치지 않아도
// 전시물이 하나 더 생깁니다.
//   - 위치(Z)·벽(L/R): GalleryRoom 의 EXHIBIT_ZS / SIDES 에서 결정
//   - 액자 높이      : 아래 position 의 Y값(3.0). 액자를 위아래로 옮기려면 여기.
//   - 상세 모달 내용 : 클릭 시 portfolioData 의 해당 항목이 그대로 표시됨
// (전시 위치 배열을 PROJECTS_DATA 길이에 맞추는 규칙은 GalleryRoom 주석 참고)
//
export default function MuseumScene() {
  return (
    <group>
      <GalleryRoom />

      {PROJECTS_DATA.map((proj, i) => (
        <ProjectExhibit
          key={i}
          project={proj}
          index={i}
          position={[
            // 벽에 살짝 띄워 부착 (left 벽 = -X쪽, right 벽 = +X쪽)
            SIDES[i] === "left" ? -(GW / 2) + 0.06 : (GW / 2) - 0.06,
            3.0,                 // 액자 중심 높이
            EXHIBIT_ZS[i] ?? 0,  // 통로 앞뒤 위치 (배열이 짧으면 0으로 겹침 주의)
          ]}
          side={SIDES[i]}
        />
      ))}

      {/* ── 이스터에그: "만지지 마시오" 도자기 (Do Not Touch / Vandal 업적) ──
          위치만 바꾸면 통로 어디든 배치 가능. [x, 0, z] (y=0 바닥 기준) */}
      <Pottery position={[3.2, 0, -7]} />
    </group>
  );
}
