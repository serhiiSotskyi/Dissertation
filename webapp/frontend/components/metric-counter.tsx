"use client";

import { animate, motion } from "motion/react";
import { useEffect, useState } from "react";

type MetricCounterProps = {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export function MetricCounter({
  value,
  suffix = "",
  decimals = 0,
  className,
}: MetricCounterProps) {
  const [displayValue, setDisplayValue] = useState(() => value.toFixed(decimals));

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate(latestValue) {
        setDisplayValue(latestValue.toFixed(decimals));
      },
    });
    return () => controls.stop();
  }, [decimals, value]);

  return (
    <motion.span className={className}>
      {displayValue}
      {suffix}
    </motion.span>
  );
}
