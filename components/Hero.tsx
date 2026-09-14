"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useIsDesktop } from "@/lib/useIsDesktop";

export default function Hero() {
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const sectionEl = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // Drive the load-in sequence from React state rather than a named
  // @keyframes animation, so it never silently breaks if the keyframes
  // get renamed or removed elsewhere. Two rAFs guarantee the browser has
  // painted the initial (hidden) state before we flip to visible, so the
  // CSS transition actually has something to animate from.
  useEffect(() => {
    let raf2 = 0;
    let introTimer = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setMounted(true);
        // Once the entrance transition (700ms + its 600ms delay) has had
        // time to finish, drop the CSS transition entirely. Leaving it on
        // permanently means every scroll-driven inline-style update below
        // fights a 700ms easing curve that never has time to catch up —
        // that's what reads as "laggy" rather than 1:1 with the scroll.
        introTimer = window.setTimeout(() => setIntroDone(true), 1400);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(introTimer);
    };
  }, []);

  // Cursor parallax on the hero image — a few px of drift, purely decorative.
  // Applied to an inner layer only: the layer that clips the photo (and
  // therefore defines where the white frame's edge sits) never moves, so
  // the parallax can never drift over the border regardless of cursor
  // position. Desktop-only (no real cursor on touch), and paused whenever
  // the hero scrolls out of view so this rAF loop doesn't run forever.
  useEffect(() => {
    if (reduced || !isDesktop) return;
    const section = sectionEl.current;
    if (!section) return;

    let raf = 0;
    let running = false;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      targetX = nx * 14;
      targetY = ny * 10;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(${curX.toFixed(
          2
        )}px, ${curY.toFixed(2)}px, 0) scale(1.08)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      window.addEventListener("mousemove", onMove, { passive: true });
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { threshold: 0 }
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [reduced, isDesktop]);

  // As the hero scrolls out: the headline fades all the way out, and the
  // whole framed photo shrinks gently toward the centre and dissolves —
  // a soft, cinematic exit rather than an abrupt cut. Fully reversible
  // since it's driven continuously by scroll position either way.
  const onProgress = useCallback((progress: number) => {
    const headline = headlineRef.current;
    const frame = frameRef.current;
    // A full-viewport hero starts already "half through" this generic
    // 0→1 scroll range (it never enters from below the fold) — so treat
    // 0.5 as the resting, fully-visible baseline and only animate from
    // there as the section actually scrolls away.
    const fade = Math.max(0, Math.min(1, (progress - 0.5) / 0.5));

    if (headline) {
      const scale = 1 - fade * 0.35;
      headline.style.opacity = `${Math.max(0, 1 - fade * 1.4)}`;
      headline.style.transform = `translate3d(0, ${(fade * 32).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }
    if (frame) {
      const scale = 1 - fade * 0.22;
      frame.style.transform = `scale(${scale.toFixed(3)})`;
      frame.style.opacity = `${Math.max(0, 1 - fade * 1.15)}`;
    }
  }, []);

  const sectionRef = useScrollProgress<HTMLElement>({
    onProgress,
    disabled: reduced,
  });

  return (
    <section
      ref={(el) => {
        sectionRef.current = el;
        sectionEl.current = el;
      }}
      className="relative h-svh min-h-[640px] w-full overflow-hidden bg-white"
    >
      <div
        ref={frameRef}
        className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] md:rounded-[2.5rem] md:p-5"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Static clipping window: fixed size and position, defines the
            visible frame. Never transforms, so the white border it sits
            inside stays put no matter what the layer below is doing. */}
        <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] md:rounded-[1.75rem]">
          <div ref={parallaxRef} className="absolute inset-0">
            <Image
              src="/images/interior-side-v2.jpg"
              alt="Pitiusa Art Station installée dans un séjour, écran affichant le logo Pitiusa"
              fill
              priority
              sizes="100vw"
              className={`object-cover object-[65%_center] transition-opacity duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-oak/10 blur-[140px]" />

      <div className="relative z-10 flex h-full flex-col items-start justify-start px-6 pt-32 text-left md:px-12 md:pt-40">
        <h1
          ref={headlineRef}
          className={`max-w-2xl font-display text-4xl leading-[1.05] md:text-6xl ${
            introDone ? "" : "transition-all duration-700 ease-out"
          } ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{
            transitionDelay: introDone ? "0ms" : "600ms",
            fontVariationSettings: "'wght' 380",
            color: "#3d2410",
            textShadow: "0 2px 28px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.25)",
            transformOrigin: "left top",
          }}
        >
          Discover Pitiusa Art Station
        </h1>
      </div>
    </section>
  );
}
