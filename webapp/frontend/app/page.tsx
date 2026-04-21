import { LandingStory } from "@/components/landing-story";
import { getAvailableAnimations, getLandingMetrics, pickAnimation } from "@/lib/server-data";

export default async function HomePage() {
  const [metrics, availableAnimations] = await Promise.all([
    getLandingMetrics(),
    getAvailableAnimations(),
  ]);

  return (
    <LandingStory
      metrics={metrics}
      ambientAnimationName={pickAnimation(availableAnimations, ["wave.lottie", "wave.json"])}
      scannerAnimationName={pickAnimation(availableAnimations, ["scanner.lottie", "scanner.json"])}
    />
  );
}
