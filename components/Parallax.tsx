"use client";

import { useCallback, type ReactNode } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function Parallax({
  children,
  strength = 16,
  className = "",
}: {
  children: ReactNode;
  /** Max vertical travel in pixels, in each direction. */
  strength?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  const onProgress = useCallback(
    (progress: number, el: HTMLDivElement) => {
      const shift = (progress - 0.5) * strength;
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    },
    [strength]
  );

  const ref = useScrollProgress<HTMLDivElement>({
    onProgress,
    disabled: reduced,
  });

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
