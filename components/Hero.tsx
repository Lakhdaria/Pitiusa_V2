"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useIsDesktop } from "@/lib/useIsDesktop";


// Every photograph and the film are 16:9. The mount is given that shape too,
// so `object-cover` has nothing left to crop: the picture fills the rounded
// window edge to edge — keeping the rounded corners the design relies on —
// and none of it is hidden. On a 16:9 screen this is the full-bleed frame the
// section always had; on a phone it becomes a centred plate rather than a
// vertical slice of a landscape photograph.
const PHOTO_RATIO = 16 / 9;
// The white mount's own padding, p-3 below md and p-5 from md up.
const framePad = (w: number) => (w < 768 ? 12 : 20);
// The largest mount whose inner window is exactly 16:9 and that still fits
// the space it is given. Width first; if that makes it taller than the space,
// the width comes back down instead of the picture being cropped.
const fitFrame = (availW: number, availH: number) => {
  const pad = framePad(availW);
  let w = availW;
  let h = (w - 2 * pad) / PHOTO_RATIO + 2 * pad;
  if (h > availH) {
    h = availH;
    w = (h - 2 * pad) * PHOTO_RATIO + 2 * pad;
  }
  return { w, h };
};

export default function Hero() {
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const sectionEl = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  // Written by the scroll handler, read by the parallax loop: both want the
  // same element's transform, so the loop composes them instead of the two
  // overwriting each other frame by frame.
  const photoScale = useRef(1.08);

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
        )}px, ${curY.toFixed(2)}px, 0) scale(${photoScale.current.toFixed(3)})`;
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

  // As the hero scrolls out, the same two-stage exit the intuition section
  // uses: the headline goes first, then the framed photo pulls back from
  // full-bleed into a smaller plate — the mount closing in while the photo
  // itself scales down inside it, which is what reads as a pull-back rather
  // than a crop — and finally rides up and out of the viewport.
  const onProgress = useCallback((progress: number) => {
    const headline = headlineRef.current;
    const frame = frameRef.current;
    // A full-viewport hero starts already "half through" this generic
    // 0→1 scroll range (it never enters from below the fold) — so treat
    // 0.5 as the resting, fully-visible baseline and only animate from
    // there as the section actually scrolls away.
    const fade = Math.max(0, Math.min(1, (progress - 0.5) / 0.5));
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const zoom = ease(Math.min(1, fade / 0.55));
    const exit = ease(Math.max(0, Math.min(1, (fade - 0.45) / 0.55)));

    if (headline) {
      // Driven by the pull-back curve itself, not by a separate rate. The
      // two used to run on unrelated timings — the text was long gone
      // while the photo had barely started moving — so the exit read as
      // two unrelated events instead of one. Now the headline is exactly
      // as faded as the plate is pulled back, and it's gone the moment the
      // pull-back completes, leaving the rise to play on its own.
      headline.style.opacity = `${1 - zoom}`;
      // …and slides out to the right as it goes, on the same curve. The
      // entrance translate is class-driven and has long finished by the
      // time this runs, so writing transform here can't fight it.
      headline.style.transform = `translate3d(${(zoom * 140).toFixed(1)}px, 0, 0)`;
    }
    if (frame) {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // The pull-back is driven from the width now; the height follows from
      // it, so the mount keeps the photograph's shape throughout.
      const { w, h } = fitFrame(vw * (1 - zoom * 0.2), vh);
      const frameH = h;
      const topInset = (vh - h) / 2;
      const sideInset = (vw - w) / 2;
      frame.style.top = `${topInset.toFixed(1)}px`;
      frame.style.bottom = `${topInset.toFixed(1)}px`;
      frame.style.left = `${sideInset.toFixed(1)}px`;
      frame.style.right = `${sideInset.toFixed(1)}px`;
      frame.style.transform = `translate3d(0, ${(-exit * (frameH + topInset + 24)).toFixed(
        1
      )}px, 0)`;
      frame.style.opacity = `${1 - exit}`;
    }
    // 1.08 is the photo's resting scale (it's oversized so the cursor
    // parallax has room to drift without exposing an edge). It must never
    // go below 1: the photo would then be smaller than its rounded
    // window, and you'd see its own square corners with white around them
    // — which is what made the frame look like it lost its rounding on
    // the way out. The pull-back comes from the frame shrinking anyway;
    // with object-cover the photo scales down with it.
    // Never above 1. Over 1 the photo is larger than its window and the
    // window shows a crop of it — which is exactly the hidden content this
    // used to cause. The pull-back is the frame's job, not the photo's.
    // Fixed at 1. The window is the photograph's own shape, so the picture
    // covers it exactly; anything above 1 would start hiding its edges again.
    photoScale.current = 1;
    if (parallaxRef.current && (reduced || !isDesktop)) {
      parallaxRef.current.style.transform = `scale(${photoScale.current.toFixed(3)})`;
    }
  }, [reduced, isDesktop]);

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
        <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-white md:rounded-[1.75rem]">
          <div ref={parallaxRef} className="absolute inset-0">
            <Image
              src="/images/interior-side-v2.jpg"
              alt="Pitiusa Art Station installée dans un séjour, écran affichant le logo Pitiusa"
              fill
              priority
              sizes="100vw"
              quality={100}
              className={`object-cover transition-opacity duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
          className={`max-w-3xl font-display leading-[0.95] ${
            introDone ? "" : "transition-all duration-700 ease-out"
          } ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{
            transitionDelay: introDone ? "0ms" : "600ms",
            fontVariationSettings: "'wght' 380",
            color: "#3d2410",
            textShadow: "0 2px 28px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.25)",
          }}
        >
          <span className="block text-[3rem] sm:text-6xl md:text-8xl">Discover</span>
          <span className="mt-2 block text-2xl sm:text-3xl md:text-5xl" style={{ fontVariationSettings: "'wght' 340" }}>
            Pitiusa Art Station
          </span>
        </h1>
      </div>
    </section>
  );
}
