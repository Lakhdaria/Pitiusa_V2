"use client";

import { useEffect, useRef } from "react";

type Options<T> = {
  onProgress: (progress: number, el: T) => void;
  disabled?: boolean;
};

/**
 * Calls onProgress(0..1, element) as the element travels through the
 * viewport: 0 when its top touches the bottom edge, 1 when its bottom
 * touches the top edge. The scroll listener is only attached while the
 * element is near the viewport (gated by IntersectionObserver), and
 * updates are throttled to one per animation frame.
 */
export function useScrollProgress<T extends HTMLElement>({
  onProgress,
  disabled,
}: Options<T>) {
  const ref = useRef<T | null>(null);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    let listening = false;

    const update = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const raw = total > 0 ? (vh - rect.top) / total : 0;
      const progress = Math.min(1, Math.max(0, raw));
      onProgressRef.current(progress, el);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0]?.isIntersecting ?? false;
        if (isIntersecting && !listening) {
          listening = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          update();
        } else if (!isIntersecting && listening) {
          listening = false;
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "25% 0px 25% 0px", threshold: 0 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [disabled]);

  return ref;
}
