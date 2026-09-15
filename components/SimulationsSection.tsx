"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import SimulationCard from "./SimulationCard";
import { simulations } from "@/content/simulations";
import { useReducedMotion } from "@/lib/useReducedMotion";

const CARD_COUNT = simulations.length;

type Rect = { top: number; left: number; width: number; height: number };

type Annotation = {
  title: string;
  text: string;
};

const annotations: Annotation[] = [
  // Order matters: even indices land in the left column, odd ones in the
  // right, each side stacking top to bottom — this sequence reproduces the
  // layout of the reference slide.
  {
    title: "Ultra-realistic simulations",
    text: "Aircraft, drone and racing, set in iconic landscapes from around the world.",
  },
  {
    title: "Predefined routes",
    text: "Curated routes and experiences designed for younger users.",
  },
  {
    title: "Multisensory modes",
    text: "Optional massage, meditation and aromatherapy, combined at will.",
  },
  {
    title: "Intuitive touchscreen control",
    text: "Effortless navigation for every member of the family.",
  },
  {
    title: "Oak and ash",
    text: "300-year-old oak wood and century-old ash, worked by hand.",
  },
];

const ANN_COUNT = annotations.length;

// Alternating left/right placement: even index → left column, odd → right.
// Each side stacks its own items in the order they appear.
const SIDES: Array<"left" | "right"> = annotations.map((_, i) => (i % 2 === 0 ? "left" : "right"));
const SLOTS: number[] = (() => {
  const counts = { left: 0, right: 0 };
  return annotations.map((_, i) => {
    const s = SIDES[i];
    const slot = counts[s];
    counts[s] += 1;
    return slot;
  });
})();

// Measured directly from the PNG's alpha channel: the actual subject only
// spans this fraction of the canvas — generous transparent padding on
// both sides is where the left/right captions live, even with the image
// itself shown at 100% width.
const SUBJECT_LEFT = 34.7;
const SUBJECT_RIGHT = 65.3;

// Resets a card to its natural grid position in the flow. Used both before
// measuring and whenever the section isn't driving the animation, so a card
// can never be left stranded at a stale `position: fixed` coordinate.
const clearCardStyle = (el: HTMLElement) => {
  el.style.position = "";
  el.style.top = "";
  el.style.left = "";
  el.style.width = "";
  el.style.height = "";
  el.style.margin = "";
  el.style.zIndex = "";
  el.style.opacity = "";
  el.querySelector<HTMLElement>(".card-root")?.classList.remove("card-col-layout");
};

// Progress (0–1 across the whole pinned section, desktop only) boundaries
// between the two acts.
const COLUMN_END = 0.34; // cards have finished stacking into the column
const CARDS_END = 0.42; // …they hold a beat, then the cross-fade begins
const FADE_END = 0.48;
const IMAGE_HOLD_END = 0.58; // image shown alone, full-width, before captions begin

export default function SimulationsSection() {
  const reduced = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // --- Act I: cards ---
  const actOneRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const startRects = useRef<Array<Rect | null>>([]);

  // --- Act II: image, captions alternate left/right ---
  const actTwoRef = useRef<HTMLDivElement>(null);
  const anatomyTitleRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Measures each card's resting (grid) position *relative to the sticky
  // container*, not to the viewport. Viewport coordinates captured on mount
  // describe where the cards sit while the section is still far down the
  // page, so replaying them as `fixed` coordinates once the section is
  // pinned drops the cards hundreds of pixels below the fold. The offset
  // inside the sticky container, on the other hand, is a layout fact: it
  // stays valid at any scroll position, and adding the container's live
  // top/left back in gives the correct fixed position on every frame —
  // i.e. exactly centred under the title while the section is pinned.
  const captureStartRects = useCallback(() => {
    const sticky = stickyRef.current;
    if (!sticky) return;

    // Two passes, and the order matters: every card has to be back in the
    // flow *before* the first one is measured. Clearing and measuring in a
    // single loop means card 0 is measured while cards 1-3 are still
    // `fixed`, so the grid row only contains one item and reports a
    // too-short height — which is why the cards came out different sizes.
    cardRefs.current.forEach((el) => el && clearCardStyle(el));

    const s = sticky.getBoundingClientRect();
    const rects: Array<Rect | null> = cardRefs.current.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top - s.top, left: r.left - s.left, width: r.width, height: r.height };
    });

    // Belt and braces: the grid already stretches every cell to the same
    // box, so force a single size rather than letting a sub-pixel
    // difference show up once the cards are absolutely positioned.
    const w = Math.max(...rects.map((r) => r?.width ?? 0));
    const h = Math.max(...rects.map((r) => r?.height ?? 0));
    startRects.current = rects.map((r) => (r ? { ...r, width: w, height: h } : null));
  }, []);

  useLayoutEffect(() => {
    const setup = () => {
      if (!wrapperRef.current) return;
      const desktop = window.innerWidth >= 768;
      const h = desktop ? CARD_COUNT * 120 + ANN_COUNT * 110 + 160 : CARD_COUNT * 140 + 60;
      wrapperRef.current.style.height = `${h}svh`;
      captureStartRects();
    };
    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, [captureStartRects]);

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
      const isDesktop = vw >= 768;
      const scrollable = wrapper.offsetHeight - vh;
      // Guard: if the wrapper's real (large) height hasn't been applied
      // yet, `scrollable` would be near zero and -rect.top/scrollable
      // could spike to an arbitrary value once clamped.
      const progress = scrollable > 50 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

      const sticky = stickyRef.current;
      if (!sticky) return;

      // While the section is still at rest, re-measure: fonts and images
      // finishing loading after mount move the grid, and a stale
      // measurement would make the cards jump on the first frame.
      if (progress <= 0.001) captureStartRects();
      const stickyRect = sticky.getBoundingClientRect();

      const cardsT = isDesktop ? Math.min(1, progress / COLUMN_END) : progress;

      const cardsFade = isDesktop
        ? 1 - Math.max(0, Math.min(1, (progress - CARDS_END) / (FADE_END - CARDS_END)))
        : 1;
      const imageFade = isDesktop
        ? Math.max(0, Math.min(1, (progress - CARDS_END) / (FADE_END - CARDS_END)))
        : 0;
      const annProgress = isDesktop
        ? Math.max(0, Math.min(1, (progress - IMAGE_HOLD_END) / (1 - IMAGE_HOLD_END)))
        : 0;

      // Explicit visibility toggling (not just opacity) so an inactive act
      // can never visually or structurally interfere with the active one.
      if (actOneRef.current) {
        actOneRef.current.style.visibility = cardsFade > 0.01 || !isDesktop ? "visible" : "hidden";
      }
      if (actTwoRef.current) {
        actTwoRef.current.style.visibility = isDesktop && imageFade > 0.01 ? "visible" : "hidden";
        actTwoRef.current.style.opacity = `${imageFade}`;
        actTwoRef.current.style.pointerEvents = imageFade > 0.5 ? "auto" : "none";
      }

      // --- Act I: cards → column ---
      if (titleRef.current) {
        titleRef.current.style.opacity = `${Math.max(0, 1 - cardsT * 3.2) * cardsFade}`;
      }

      const gap = 36;
      const badgeSize = isDesktop ? 84 : 72;
      const maxAvailable = vh * 0.85;
      const idealTotal = CARD_COUNT * badgeSize + (CARD_COUNT - 1) * gap;
      const colGap =
        idealTotal <= maxAvailable ? gap : Math.max(8, (maxAvailable - CARD_COUNT * badgeSize) / (CARD_COUNT - 1));
      const leftX = isDesktop ? Math.max(56, vw * 0.09) : (vw - badgeSize) / 2;
      const cardsTotalHeight = CARD_COUNT * badgeSize + (CARD_COUNT - 1) * colGap;
      const cardsTopStart = Math.max(24, (vh - cardsTotalHeight) / 2);

      simulations.forEach((_, i) => {
        const el = cardRefs.current[i];
        const start = startRects.current[i];
        if (!el || !start) return;

        const segment = 1 / CARD_COUNT;
        const t = Math.max(0, Math.min(1, (cardsT - i * segment * 0.82) / (segment * 1.2)));
        const eased = 1 - Math.pow(1 - t, 3);

        // start.top/left are offsets inside the sticky container; turn them
        // back into viewport coordinates for `position: fixed`.
        const startTop = stickyRect.top + start.top;
        const startLeft = stickyRect.left + start.left;

        const targetTop = cardsTopStart + i * (badgeSize + colGap);
        const top = startTop + (targetTop - startTop) * eased;
        const left = startLeft + (leftX - startLeft) * eased;
        const width = start.width + (badgeSize - start.width) * eased;
        const height = start.height + (badgeSize - start.height) * eased;

        el.style.position = "fixed";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.margin = "0";
        el.style.zIndex = `${50 - i}`;
        el.style.opacity = `${cardsFade}`;
        const inner = el.querySelector<HTMLElement>(".card-root");
        inner?.classList.toggle("card-col-layout", eased > 0.55);
      });

      if (!isDesktop) return;

      // --- Act II ---
      const imageHoldT = Math.max(0, Math.min(1, (progress - FADE_END) / (IMAGE_HOLD_END - FADE_END)));
      if (anatomyTitleRef.current) {
        const titleOut = Math.max(0, Math.min(1, (annProgress - 0.04) / 0.05));
        anatomyTitleRef.current.style.opacity = `${imageHoldT * (1 - titleOut)}`;
      }

      const stage = stageRef.current;
      const imageWrap = imageWrapRef.current;
      if (!stage || !imageWrap) return;

      const stageRect = stage.getBoundingClientRect();
      const imgRect = imageWrap.getBoundingClientRect();
      const imgLeft = imgRect.left - stageRect.left;
      const subjectLeftPx = imgLeft + (SUBJECT_LEFT / 100) * imgRect.width;
      const subjectRightPx = imgLeft + (SUBJECT_RIGHT / 100) * imgRect.width;

      const rowH = 108;
      const rowGap = 26;
      const colGapFromImage = 24;
      const topY = stageRect.height * 0.1;

      annotations.forEach((a, i) => {
        const entry = entryRefs.current[i];
        if (!entry) return;

        const side = SIDES[i];
        const slot = SLOTS[i];
        const segment = 1 / ANN_COUNT;
        const t = Math.max(0, Math.min(1, (annProgress - i * segment * 0.85) / (segment * 1.2)));
        const appear = Math.min(1, t / 0.5);
        const rise = (1 - appear) * 16;

        const x = side === "left" ? subjectLeftPx - colGapFromImage : subjectRightPx + colGapFromImage;
        const y = topY + slot * (rowH + rowGap) + rise;

        entry.style.opacity = `${appear}`;
        entry.style.transform =
          side === "left"
            ? `translate3d(${x}px, ${y}px, 0) translate(-100%, 0)`
            : `translate3d(${x}px, ${y}px, 0) translate(0, 0)`;
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    const onResize = () => {
      update();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries[0]?.isIntersecting ?? false;
        if (intersecting && !listening) {
          listening = true;
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onResize);
          update();
        } else if (!intersecting && listening) {
          listening = false;
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
          // No more frames will run, so hand the cards back to the normal
          // flow rather than leaving them frozen as fixed elements
          // floating over whatever section is now on screen.
          cardRefs.current.forEach((el) => el && clearCardStyle(el));
        }
      },
      { rootMargin: "0px", threshold: 0 }
    );
    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cardRefs.current.forEach((el) => el && clearCardStyle(el));
    };
  }, [reduced, captureStartRects]);

  if (reduced) {
    return (
      <>
        <section id="art-station" className="relative bg-white px-6 py-24 md:px-12 md:py-32">
          <h2 className="mx-auto max-w-3xl text-center font-display text-4xl leading-tight text-bone md:text-6xl">
            Where design, technology and luxury converge to shape excellence
          </h2>
          <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 md:mt-20 md:grid-cols-4 md:gap-6">
            {simulations.map((simulation) => (
              <div key={simulation.slug} className="h-full">
                <SimulationCard simulation={simulation} />
              </div>
            ))}
          </div>
        </section>
        <section id="anatomie" className="relative bg-surface px-6 py-32 md:px-12 md:py-44">
          <h2 className="mx-auto max-w-3xl text-center font-display text-4xl leading-tight text-bone md:text-6xl">
            Chaque détail a une raison d&rsquo;être.
          </h2>
          <div className="mx-auto mt-16 flex max-w-md flex-col gap-8">
            <div className="relative aspect-[1800/1013] w-full">
              <Image
                src="/images/front-detail-transp-v2.png"
                alt="Vue de face du poste de pilotage de la Pitiusa Art Station"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <ol className="flex flex-col gap-6">
              {annotations.map((a, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-oak text-xs text-oak">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display text-lg text-bone">{a.title}</p>
                    <p className="mt-1 text-sm text-bone-dim">{a.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section id="art-station" ref={wrapperRef} className="relative bg-white">
        <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden">
          {/* Act I: cards */}
          <div
            ref={actOneRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-start px-6 pt-[10vh] pb-8 md:px-12 md:pt-[11vh] md:pb-10"
          >
            <h2
              ref={titleRef}
              className="mx-auto max-w-3xl text-center font-display text-2xl leading-tight text-bone md:text-4xl"
            >
              Where design, technology and luxury converge to shape excellence
            </h2>
            <div className="mx-auto mt-6 grid max-w-6xl gap-6 sm:grid-cols-2 md:mt-8 md:grid-cols-4 md:gap-6">
              {simulations.map((simulation, i) => (
                <div
                  key={simulation.slug}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="h-full"
                >
                  <SimulationCard simulation={simulation} />
                </div>
              ))}
            </div>
          </div>

          {/* Act II (desktop only): image alone, full width, centred —
              then each caption fades in smoothly, one at a time,
              alternating a left column and a right column that flank the
              image (in the transparent margin either side of the actual
              subject, measured from the PNG itself). */}
          <div
            ref={actTwoRef}
            className="absolute inset-0 z-10 hidden items-center justify-center px-6 md:flex md:px-12"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <div ref={stageRef} className="relative mx-auto w-full max-w-4xl">
              <h2
                ref={anatomyTitleRef}
                className="pointer-events-none absolute -top-16 left-0 right-0 text-center font-display text-3xl leading-tight text-bone md:text-5xl"
                style={{ opacity: 0 }}
              >
                Chaque détail a une raison d&rsquo;être.
              </h2>

              <div ref={imageWrapRef} className="relative mx-auto aspect-[1800/1013] w-full">
                <Image
                  src="/images/front-detail-transp-v2.png"
                  alt="Vue de face du poste de pilotage de la Pitiusa Art Station"
                  fill
                  sizes="900px"
                  className="object-contain"
                />
              </div>

              {annotations.map((a, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    entryRefs.current[i] = el;
                  }}
                  className={`absolute left-0 top-0 w-60 ${SIDES[i] === "left" ? "text-right" : "text-left"}`}
                  style={{ opacity: 0 }}
                >
                  <p className="font-display text-lg text-bone">{a.title}</p>
                  <p className="mt-1.5 text-sm text-bone-dim">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Act II becomes a plain static section right after the
          cards, instead of joining the pinned sequence. */}
      <section id="anatomie" className="relative bg-surface px-6 py-24 md:hidden">
        <h2 className="mx-auto max-w-md text-center font-display text-3xl leading-tight text-bone">
          Chaque détail a une raison d&rsquo;être.
        </h2>
        <div className="mx-auto mt-10 flex max-w-md flex-col gap-8">
          <div className="relative aspect-[1800/1013] w-full">
            <Image
              src="/images/front-detail-transp-v2.png"
              alt="Vue de face du poste de pilotage de la Pitiusa Art Station"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <ol className="flex flex-col gap-6">
            {annotations.map((a, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-oak text-xs text-oak">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-lg text-bone">{a.title}</p>
                  <p className="mt-1 text-sm text-bone-dim">{a.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
