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
  {
    title: "Curved wraparound screen",
    text: "An unbroken field of view, free of glare and visible edges.",
  },
];

const ANN_COUNT = annotations.length;

// Alternating left/right placement: even index → left column, odd → right.
// Each side stacks its own items in the order they appear.
const SIDES: Array<"left" | "right"> = annotations.map((_, i) => (i % 2 === 0 ? "left" : "right"));
// How many entries each column ends up holding — used to centre each
// column vertically against the machine rather than hanging both from a
// fixed offset near the top.
const PER_SIDE = {
  left: SIDES.filter((s) => s === "left").length,
  right: SIDES.filter((s) => s === "right").length,
};
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

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

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
  el.style.transform = "";
  el.querySelector<HTMLElement>(".card-root")?.classList.remove("card-col-layout");
};

// The closing statement, revealed one character at a time in act III.
// Kept as blocks rather than one string so the heading can be styled
// separately, and flattened into a single character sequence so the
// writing head can run straight through the whole thing.
const CLOSING_BLOCKS = [
  { heading: true, text: "Where Art and Technology Meet" },
  {
    heading: false,
    text: "Pitiusa showcases the pinnacle of French craftsmanship, blending the artistry of master cabinetmakers with cutting-edge technologies.",
  },
  {
    heading: false,
    text: "Pitiusa redefines aesthetics in a living room and ensures next-level immersion within a single bespoke installation.",
  },
];
// Index of each block's first character in the global sequence.
const CLOSING_OFFSETS = CLOSING_BLOCKS.reduce<number[]>((acc, b, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + Array.from(CLOSING_BLOCKS[i - 1].text).length);
  return acc;
}, []);
const CLOSING_LENGTH =
  CLOSING_OFFSETS[CLOSING_OFFSETS.length - 1] +
  Array.from(CLOSING_BLOCKS[CLOSING_BLOCKS.length - 1].text).length;

// Every phase is budgeted in svh — how much scrolling it should take —
// and the 0–1 progress boundaries are derived from those budgets. Tuning
// the pace is then a matter of editing one number here, instead of
// hand-recomputing a set of fractions that have to stay consistent with
// the section's own height.
const PHASES = {
  entry: 86, // cards arrive one by one, right to left
  cards: CARD_COUNT * 66, // cards stack into the column
  hold: 26, // …and hold a beat
  fade: 36, // cross-fade to the machine
  image: 36, // machine alone on screen
  captions: ANN_COUNT * 66, // captions come in one by one
  closing: 200, // act III: machine steps aside, text writes itself, all exits
};
const SCROLL_SVH = Object.values(PHASES).reduce((a, b) => a + b, 0);

const ENTRY_END = PHASES.entry / SCROLL_SVH;
const COLUMN_END = ENTRY_END + PHASES.cards / SCROLL_SVH;
const CARDS_END = COLUMN_END + PHASES.hold / SCROLL_SVH;
const FADE_END = CARDS_END + PHASES.fade / SCROLL_SVH;
const IMAGE_HOLD_END = FADE_END + PHASES.image / SCROLL_SVH;
const ANN_END = IMAGE_HOLD_END + PHASES.captions / SCROLL_SVH;

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
  const stageRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  // Last opacity written per character, so each frame only touches the few
  // glyphs around the writing head instead of restyling the whole block.
  const charState = useRef<number[]>([]);
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
      // The scrollable distance is the sum of the phase budgets; +100svh
      // because the first viewport-height of the wrapper is consumed by
      // pinning it, before progress starts counting.
      const h = desktop ? SCROLL_SVH + 100 : CARD_COUNT * 140 + 60;
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

      // The column only starts forming once the cards have finished
      // arriving, so the two movements never overlap.
      const cardsT = isDesktop
        ? Math.max(0, Math.min(1, (progress - ENTRY_END) / (COLUMN_END - ENTRY_END)))
        : progress;
      const entryT = isDesktop ? Math.max(0, Math.min(1, progress / ENTRY_END)) : 1;

      const cardsFade = isDesktop
        ? 1 - Math.max(0, Math.min(1, (progress - CARDS_END) / (FADE_END - CARDS_END)))
        : 1;
      const imageFade = isDesktop
        ? Math.max(0, Math.min(1, (progress - CARDS_END) / (FADE_END - CARDS_END)))
        : 0;
      const annProgress = isDesktop
        ? Math.max(0, Math.min(1, (progress - IMAGE_HOLD_END) / (ANN_END - IMAGE_HOLD_END)))
        : 0;
      // Act III progress, and the two things it drives in act I's layer:
      // the captions leaving, and the icons coming back once the machine
      // has finished stepping aside.
      const t3 = isDesktop ? Math.max(0, Math.min(1, (progress - ANN_END) / (1 - ANN_END))) : 0;
      const captionsOut = Math.max(0, Math.min(1, t3 / 0.18));
      const badgesBack = Math.max(0, Math.min(1, (t3 - 0.5) / 0.2));
      // Closing beat: once the text has finished writing, the icons, the
      // machine and the copy all go at once, on the same curve, so the
      // section hands over to the next one on a clean screen.
      const exit = Math.max(0, Math.min(1, (t3 - 0.9) / 0.1));

      // The section is tall enough that its top edge shows well before it
      // pins, which let act I sit on screen fully formed while the hero was
      // still being scrolled. Fading it in over the last half-viewport of
      // the approach means nothing is readable until the section is
      // actually arriving.
      const approach = Math.max(0, Math.min(1, 1 - rect.top / (vh * 0.5)));

      // Explicit visibility toggling (not just opacity) so an inactive act
      // can never visually or structurally interfere with the active one.
      if (actOneRef.current) {
        const actOneOn = (cardsFade > 0.01 || badgesBack > 0.01) && exit < 0.99;
        actOneRef.current.style.visibility = actOneOn || !isDesktop ? "visible" : "hidden";
      }
      if (actTwoRef.current) {
        const actTwoOpacity = imageFade * (1 - exit);
        actTwoRef.current.style.visibility = isDesktop && actTwoOpacity > 0.01 ? "visible" : "hidden";
        actTwoRef.current.style.opacity = `${actTwoOpacity}`;
        actTwoRef.current.style.pointerEvents = imageFade > 0.5 ? "auto" : "none";
      }

      // --- Act I: cards → column ---
      if (titleRef.current) {
        titleRef.current.style.opacity = `${Math.max(0, 1 - cardsT * 3.2) * cardsFade * approach}`;
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

        // The column position is expressed relative to the sticky container,
        // not to the viewport. While the section is pinned the two are the
        // same thing (its top sits at 0), but once progress hits 1 and the
        // container is released, the machine and the closing text scroll
        // away with it — and `fixed` icons anchored to viewport coordinates
        // would stay glued to the screen instead of leaving with them.
        const targetTop = stickyRect.top + cardsTopStart + i * (badgeSize + colGap);
        const targetLeft = stickyRect.left + leftX;
        const top = startTop + (targetTop - startTop) * eased;
        const left = startLeft + (targetLeft - startLeft) * eased;
        const width = start.width + (badgeSize - start.width) * eased;
        const height = start.height + (badgeSize - start.height) * eased;

        el.style.position = "fixed";
        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.margin = "0";
        el.style.zIndex = `${50 - i}`;
        // cardsFade takes the icons out for act II; badgesBack brings the
        // same elements straight back once the machine has moved left, so
        // the higher of the two wins.
        // Entrance: each card enters from off the right-hand end of the row
        // and slides left into its slot. The offset is a whole number of
        // slots, not a fixed nudge — so the first one released crosses the
        // full row to the far left and every later one stops short of it,
        // which is what makes the order readable. A constant 70px offset
        // looked like four cards twitching into place.
        const slotW =
          startRects.current[1] && startRects.current[0]
            ? startRects.current[1]!.left - startRects.current[0]!.left
            : start.width + 24;
        const entry = ease(Math.max(0, Math.min(1, (entryT - i * 0.2) / 0.4)));
        el.style.transform = `translate3d(${((1 - entry) * (CARD_COUNT - i) * slotW).toFixed(
          1
        )}px, 0, 0)`;
        el.style.opacity = `${Math.max(cardsFade * approach * entry, badgesBack) * (1 - exit)}`;
        const inner = el.querySelector<HTMLElement>(".card-root");
        // Flipped almost immediately rather than at the midpoint: the title
        // and summary have to be gone before the card visibly starts
        // shrinking, otherwise you watch the text squeeze for half the move.
        inner?.classList.toggle("card-col-layout", eased > 0.02);
      });

      if (!isDesktop) return;

      // --- Act II ---
      const stage = stageRef.current;
      const imageWrap = imageWrapRef.current;
      if (!stage || !imageWrap) return;

      const stageRect = stage.getBoundingClientRect();
      const imgRect = imageWrap.getBoundingClientRect();
      const imgLeft = imgRect.left - stageRect.left;
      const subjectLeftPx = imgLeft + (SUBJECT_LEFT / 100) * imgRect.width;
      const subjectRightPx = imgLeft + (SUBJECT_RIGHT / 100) * imgRect.width;

      // Bumped along with the type scale below: the reserved row box has
      // to stay taller than a two-line title + two-line body, or entries
      // start overlapping the one underneath.
      const rowH = 126;
      const rowGap = 22;
      const colGapFromImage = 24;

      annotations.forEach((a, i) => {
        const entry = entryRefs.current[i];
        if (!entry) return;

        const side = SIDES[i];
        const slot = SLOTS[i];
        const segment = 1 / ANN_COUNT;
        const t = Math.max(0, Math.min(1, (annProgress - i * segment * 0.85) / (segment * 1.2)));
        const appear = Math.min(1, t / 0.5);
        const rise = (1 - appear) * 16;

        // Each column is centred on the stage's vertical midline — i.e. on
        // the machine — so the captions read as one block flanking it
        // instead of a stack starting near the top. Computed per side, so
        // an odd number of entries still balances left against right.
        const colH = PER_SIDE[side] * (rowH + rowGap) - rowGap;
        const topY = (stageRect.height - colH) / 2;

        const x = side === "left" ? subjectLeftPx - colGapFromImage : subjectRightPx + colGapFromImage;
        const y = topY + slot * (rowH + rowGap) + rise;

        entry.style.opacity = `${appear * (1 - captionsOut)}`;
        entry.style.transform =
          side === "left"
            ? `translate3d(${x}px, ${y}px, 0) translate(-100%, 0)`
            : `translate3d(${x}px, ${y}px, 0) translate(0, 0)`;
      });

      // --- Act III: machine steps aside, closing text writes itself ---
      // The move only starts once the captions are fully gone (0.22 > 0.18):
      // the caption coordinates are derived from the image's live bounding
      // box, so anything that transforms the image would drag them with it.
      const moveT = ease(Math.max(0, Math.min(1, (t3 - 0.22) / 0.3)));
      imageWrap.style.transform = `translate3d(${(-moveT * window.innerWidth * 0.18).toFixed(
        1
      )}px, 0, 0) scale(${(1 - moveT * 0.18).toFixed(3)})`;

      const closing = closingRef.current;
      if (closing) {
        closing.style.opacity = `${Math.max(0, Math.min(1, (t3 - 0.3) / 0.12))}`;
        // One character per unit of scroll, with a short feather at the head
        // so glyphs bleed in rather than snapping on.
        const head = ((t3 - 0.34) / 0.56) * CLOSING_LENGTH;
        for (let i = 0; i < CLOSING_LENGTH; i += 1) {
          const v = Math.max(0, Math.min(1, (head - i) / 4));
          if (charState.current[i] === v) continue;
          charState.current[i] = v;
          const span = charRefs.current[i];
          if (span) span.style.opacity = `${v}`;
        }
      }
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
            {CLOSING_BLOCKS.map((block, i) => (
              <p
                key={i}
                className={
                  block.heading
                    ? "font-display text-2xl leading-tight text-bone"
                    : "text-base leading-relaxed text-bone-dim"
                }
              >
                {block.text}
              </p>
            ))}
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
            <div
              ref={stageRef}
              className="relative mx-auto flex w-full max-w-[min(72rem,125svh)] justify-center"
            >
              {/* Sized by HEIGHT, not by the stage width. The PNG carries ~35%
                  transparent padding on each side (see SUBJECT_LEFT/RIGHT), so
                  fitting the file to the stage only ever made the padding wide
                  and the actual machine small. Driving it off the viewport
                  height instead lets the subject fill the screen; the file
                  overflows the stage horizontally, but that overflow is pure
                  transparency — and it's the same padding the captions are
                  positioned into, so they still land on the subject's edges.
                  Centring is done by the flex parent, not `mx-auto`: auto
                  margins collapse to zero once the element is wider than its
                  container, so the whole overflow was landing on the right
                  and the machine sat visibly off-centre. */}
              <div
                ref={imageWrapRef}
                className="relative aspect-[1800/1013] h-[90svh] w-auto max-w-none shrink-0"
              >
                <Image
                  src="/images/front-detail-transp-v2.png"
                  alt="Vue de face du poste de pilotage de la Pitiusa Art Station"
                  fill
                  sizes="1700px"
                  className="object-contain"
                />
              </div>

              {annotations.map((a, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    entryRefs.current[i] = el;
                  }}
                  className={`absolute left-0 top-0 w-72 ${SIDES[i] === "left" ? "text-right" : "text-left"}`}
                  style={{ opacity: 0 }}
                >
                  <p className="font-display text-xl text-bone">{a.title}</p>
                  <p className="mt-2 text-base leading-snug text-bone-dim">{a.text}</p>
                </div>
              ))}
            </div>

            {/* Act III copy. Sits outside the stage so it can own the right
                half of the viewport regardless of how wide the (overflowing)
                image is. `whitespace-pre-wrap` keeps the spaces between the
                per-character spans from collapsing. */}
            <div
              ref={closingRef}
              className="pointer-events-none absolute right-[5vw] top-1/2 w-[42vw] max-w-[640px] -translate-y-1/2"
              style={{ opacity: 0 }}
            >
              {CLOSING_BLOCKS.map((block, bi) => (
                <p
                  key={bi}
                  className={
                    block.heading
                      ? "mb-8 whitespace-pre-wrap font-display text-4xl leading-tight text-bone lg:text-5xl"
                      : "mb-6 whitespace-pre-wrap text-xl leading-relaxed text-bone-dim lg:text-2xl"
                  }
                >
                  {Array.from(block.text).map((c, i) => {
                    const idx = CLOSING_OFFSETS[bi] + i;
                    return (
                      <span
                        key={i}
                        ref={(el) => {
                          charRefs.current[idx] = el;
                        }}
                        style={{ opacity: 0 }}
                      >
                        {c}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Act II becomes a plain static section right after the
          cards, instead of joining the pinned sequence. */}
      <section id="anatomie" className="relative bg-surface px-6 py-24 md:hidden">
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
          {CLOSING_BLOCKS.map((block, i) => (
            <p
              key={i}
              className={
                block.heading
                  ? "font-display text-2xl leading-tight text-bone"
                  : "text-base leading-relaxed text-bone-dim"
              }
            >
              {block.text}
            </p>
          ))}
        </div>
      </section>
    </>
  );
}
