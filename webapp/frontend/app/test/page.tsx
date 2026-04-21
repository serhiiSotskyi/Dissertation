import { TestWorkbench } from "@/components/test-workbench";
import { buildLocalDemoCases, getAvailableAnimations, pickAnimation } from "@/lib/server-data";

export default async function TestPage() {
  const [demoCases, availableAnimations] = await Promise.all([
    buildLocalDemoCases(),
    getAvailableAnimations(),
  ]);

  return (
    <TestWorkbench
      demoCases={demoCases}
      scannerAnimationName={pickAnimation(availableAnimations, ["scanner.lottie", "scanner.json"])}
      successAnimationName={pickAnimation(
        availableAnimations,
        ["success circle check.lottie", "success circle check.json"],
      )}
      tapeAnimationName={pickAnimation(availableAnimations, ["Tape Medical.lottie", "Tape Medical.json"])}
    />
  );
}
