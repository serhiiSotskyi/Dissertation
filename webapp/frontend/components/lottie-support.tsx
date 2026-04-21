"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Lottie = dynamic(() => import("lottie-react").then((module) => module.default), { ssr: false });

type LottieSupportProps = {
  name: string | null;
  className?: string;
  loop?: boolean;
};

export function LottieSupport({
  name,
  className,
  loop = true,
}: LottieSupportProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAnimationData(null);
    setFailed(false);

    if (!name || !name.toLowerCase().endsWith(".json")) {
      return;
    }

    let cancelled = false;

    fetch(`/api/animations?name=${encodeURIComponent(name)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Animation unavailable");
        }
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          setAnimationData(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!name || failed) {
    return null;
  }

  const src = `/api/animations?name=${encodeURIComponent(name)}`;
  if (name.toLowerCase().endsWith(".lottie")) {
    return <DotLottieReact className={className} src={src} loop={loop} autoplay />;
  }

  if (!animationData) {
    return null;
  }

  return <Lottie className={className} animationData={animationData} loop={loop} autoplay />;
}
