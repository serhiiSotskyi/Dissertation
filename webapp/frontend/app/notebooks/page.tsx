import { NotebooksView } from "@/components/notebooks-view";
import { lottieSearchGroups, lottieStyleFilters, notebooks } from "@/lib/content";
import { getAvailableAnimations, pickAnimation } from "@/lib/server-data";

export default async function NotebooksPage() {
  const availableAnimations = await getAvailableAnimations();

  return (
    <NotebooksView
      notebooks={notebooks}
      lottieSearchGroups={lottieSearchGroups}
      lottieStyleFilters={lottieStyleFilters}
      supportAnimationName={pickAnimation(
        availableAnimations,
        ["Microscope IB.lottie", "Microscope IB.json"],
      )}
    />
  );
}
