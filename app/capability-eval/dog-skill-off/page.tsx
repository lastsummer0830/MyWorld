import { Suspense } from "react";

import SkillOffStage from "@iso/spikes/dog-skill-off-eval/SkillOffStage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Skill-OFF · stage-1 dog anatomy scaffold",
};

export default function DogSkillOffPage() {
  return (
    <Suspense fallback={null}>
      <SkillOffStage />
    </Suspense>
  );
}
