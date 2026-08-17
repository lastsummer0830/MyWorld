import { DogSkillOnStage } from "@iso/spikes/dog-skill-on-eval/DogSkillOnStage";
import { parseFlat, parseView } from "@iso/spikes/dog-skill-on-eval/views";

export const metadata = {
  title: "Skill-ON · stage-1 dog anatomy scaffold",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Isolated capability-evaluation route.
 * `?view=front|left|right|three-quarter|back` and `?flat=0|1`.
 */
export default async function DogSkillOnEvalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <DogSkillOnStage
      view={parseView(params.view)}
      flat={parseFlat(params.flat)}
    />
  );
}
