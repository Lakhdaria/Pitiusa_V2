"use client";

import { useEffect, useRef } from "react";

type Options = {
  onProgress: (progress: number) => void;
  disabled?: boolean;
};

/**
 * Tracks scroll progress (0..1) through a tall container that holds a
 * `position: sticky` child. Progress is 0 the moment the sticky child pins,
 * and 1 the moment it unpins — i.e. exactly the scroll distance the user
 * spends "inside" the pinned view. This relies on native sticky positioning
 * rather than scroll-jacking (no preventDefault, no wheel hijacking), so
 * trackpads, wheels and touch all behave normally; we only read position.
 */
export function usePinnedProgress<T extends HTMLElement>({
  onProgress,
  disabled,
}: Options) {
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
      const scrollable = rect.height - vh;
      const raw = scrollable > 0 ? -rect.top / scrollable : 0;
      onProgressRef.current(Math.min(1, Math.max(0, raw)));
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
          window.addEventListener("resize", onScroll, { passive: true });
          update();
        } else if (!isIntersecting && listening) {
          listening = false;
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      },
      { rootMargin: "0px", threshold: 0 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [disabled]);

  return ref;
}
