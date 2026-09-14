"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const slides = [
  { src: "/images/interior-side-v2.jpg", caption: "Une silhouette sculptée dans la matière." },
  { src: "/images/cockpit-top-v2.jpg", caption: "Un poste de pilotage haute-fidélité." },
  { src: "/images/chassis-top.jpg", caption: "Une architecture entièrement modulable." },
  { src: "/images/front-detail-v2.jpg", caption: "Chaque écran porte la signature de la maison." },
  { src: "/images/rear-detail-v2.jpg", caption: "Une œuvre pensée sous tous les angles." },
  { src: "/images/loft-aerial-v2.jpg", caption: "Une présence qui redéfinit l'espace." },
];

const COUNT = slides.length;

export default function CarouselSection() {
  const reduced = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const captionRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const lastCardRect = useRef<{ top: number; left: number; width: number; height: number } | null>(null);
  const loadUpToRef = useRef(1);
  // Slide 0 loads eagerly (it's what's shown first); the rest are only
  // requested one slide ahead of where the user has actually scrolled to,
  // instead of every image firing off a network request on page load.
  const [loadUpTo, setLoadUpTo] = useState(1);

  useEffect(() => {
    if (reduced) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let ticking = false;
    let listening = false;

    const update = () => {
      ticking = false;
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const scrollable = wrapper.offsetHeight - vh;
      const raw = scrollable > 0 ? -rect.top / scrollable : 0;
      const progress = Math.min(1, Math.max(0, raw));

      const segment = 1 / COUNT;
      const continuous = progress / segment;
      const index = Math.min(COUNT - 1, Math.floor(continuous));
      const localT = continuous - index;
      const isDesktop = vw >= 768;
      const spacingVw = isDesktop ? 36 : 0;
      const spacingVh = isDesktop ? 0 : 34;

      const isLastFocused = index === COUNT - 1;

      const wantLoaded = Math.min(COUNT - 1, index + 1);
      if (wantLoaded > loadUpToRef.current) {
        loadUpToRef.current = wantLoaded;
        setLoadUpTo(wantLoaded);
      }

      slides.forEach((_, i) => {
        const card = cardRefs.current[i];
        const caption = captionRefs.current[i];
        if (!card) return;

        if (i === COUNT - 1 && isLastFocused) {
          if (!lastCardRect.current) {
            const r = card.getBoundingClientRect();
            lastCardRect.current = { top: r.top, left: r.left, width: r.width, height: r.height };
          }
          const start = lastCardRect.current;
          const growT = 1 - Math.pow(1 - Math.min(1, localT / 0.85), 3);
          const fadeT = Math.max(0, (localT - 0.86) / 0.14);

          const top = start.top * (1 - growT);
          const left = start.left * (1 - growT);
          const width = start.width + (vw - start.width) * growT;
          const height = start.height + (vh - start.height) * growT;

          card.style.position = "fixed";
          card.style.top = `${top}px`;
          card.style.left = `${left}px`;
          card.style.width = `${width}px`;
          card.style.height = `${height}px`;
          card.style.transform = "none";
          card.style.opacity = `${1 - fadeT}`;
          card.style.borderRadius = `${Math.max(0, 1.5 * (1 - growT)).toFixed(2)}rem`;
          card.style.zIndex = "40";
          card.style.filter = "none";
          if (caption) caption.style.opacity = `${1 - growT}`;
          return;
        }

        if (lastCardRect.current && i === COUNT - 1) {
          card.style.position = "";
          card.style.top = "";
          card.style.left = "";
          card.style.width = "";
          card.style.height = "";
          lastCardRect.current = null;
        }

        const offset = i - continuous;
        const absOffset = Math.abs(offset);
        const scale = Math.max(0.52, 1.1 - absOffset * 0.26);
        const opacity = Math.max(0, 1 - absOffset * 0.7);
        const brightness = Math.max(0.45, 1 - Math.min(absOffset, 1) * 0.5);

        card.style.position = "";
        card.style.top = "";
        card.style.left = "";
        card.style.width = "";
        card.style.height = "";
        card.style.zIndex = `${100 - Math.round(absOffset * 10)}`;
        card.style.borderRadius = "1.5rem";
        card.style.transform = isDesktop
          ? `translate3d(calc(-50% + ${(offset * spacingVw).toFixed(2)}vw), -50%, 0) scale(${scale.toFixed(3)})`
          : `translate3d(-50%, calc(-50% + ${(offset * spacingVh).toFixed(2)}vh), 0) scale(${scale.toFixed(3)})`;
        card.style.opacity = `${opacity.toFixed(3)}`;
        card.style.filter = `brightness(${brightness.toFixed(2)}) saturate(${brightness.toFixed(2)})`;
        if (caption) caption.style.opacity = `${Math.max(0, 1 - absOffset * 2.2).toFixed(2)}`;
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    // Only run the scroll math (and keep the listener attached at all)
    // while this ~500vh section is actually near the viewport — otherwise
    // every scroll anywhere on the page recomputes five card transforms
    // for a carousel that's nowhere near visible.
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries[0]?.isIntersecting ?? false;
        if (intersecting && !listening) {
          listening = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll);
          update();
        } else if (!intersecting && listening) {
          listening = false;
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      },
      { rootMargin: "40% 0px 40% 0px", threshold: 0 }
    );
    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section className="bg-ink px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 font-display text-4xl text-bone md:text-5xl">
            En images
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {slides.map((s) => (
              <div
                key={s.src}
                className="relative aspect-[4/3] w-[45%] min-w-[220px] flex-1 overflow-hidden rounded-2xl ring-4 ring-white"
              >
                <Image src={s.src} alt={s.caption} fill sizes="30vw" className="object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <p className="absolute bottom-4 left-4 font-display text-lg text-white">{s.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={wrapperRef}
      className="relative bg-ink"
      style={{ height: `${COUNT * 100}svh` }}
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={s.src}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2 aspect-[3/4] w-[58vw] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] ring-4 ring-white md:aspect-[4/3] md:w-[32vw]"
            style={{ borderRadius: "1.5rem", willChange: "transform, opacity" }}
          >
            {i <= loadUpTo ? (
              <Image
                src={s.src}
                alt={s.caption}
                fill
                sizes="(min-width: 768px) 32vw, 58vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface" aria-hidden="true" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span className="absolute left-6 top-6 font-display text-xs tracking-[0.2em] text-white/80 md:left-8 md:top-8">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className="absolute bottom-6 left-6 right-6 font-display text-2xl text-white md:bottom-10 md:left-10 md:text-4xl"
            >
              {s.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
