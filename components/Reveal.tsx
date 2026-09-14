"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Variant = "up" | "scale" | "left" | "right";

const variantClass: Record<Variant, string> = {
  up: "reveal-up",
  scale: "reveal-scale",
  left: "reveal-left",
  right: "reveal-right",
};

export default function Reveal({
  children,
  delayMs = 0,
  variant = "up",
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  variant?: Variant;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.transitionDelay = `${delayMs}ms`;

    // Toggling the class both ways (rather than unobserving after the first
    // reveal) lets the transition run smoothly whether the user scrolls
    // down into the element or back up past it.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} className={`reveal ${variantClass[variant]} ${className}`}>
      {children}
    </div>
  );
}
