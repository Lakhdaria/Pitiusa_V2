"use client";

import { useCallback, useMemo, useRef } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function ScrollColorText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const words = useMemo(() => text.split(" "), [text]);
  const spanRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const activeCount = useRef(0);
  const reduced = useReducedMotion();

  const onProgress = useCallback(
    (progress: number) => {
      // Activate through the middle stretch of the scroll journey so the
      // effect neither fires instantly nor lags until the element is gone.
      const eased = Math.min(1, Math.max(0, (progress - 0.12) / 0.55));
      const target = Math.round(eased * words.length);
      if (target === activeCount.current) return;
      const from = activeCount.current;
      activeCount.current = target;
      if (target > from) {
        for (let i = from; i < target; i++)
          spanRefs.current[i]?.classList.add("is-active");
      } else {
        for (let i = target; i < from; i++)
          spanRefs.current[i]?.classList.remove("is-active");
      }
    },
    [words.length]
  );

  const ref = useScrollProgress<HTMLParagraphElement>({
    onProgress,
    disabled: reduced,
  });

  return (
    <p ref={ref} className={`scroll-color-text ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          ref={(el) => {
            spanRefs.current[i] = el;
          }}
          className={reduced ? "is-active" : undefined}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
