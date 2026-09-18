"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { usePinnedProgress } from "@/lib/usePinnedProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import SnapMarks from "./SnapMarks";

// Shown one at a time, in this order, each clearing before the next.
const BEATS = [
  "We are combining artistry, interactive entertainment and sustainability. Our commitment to high-end manufacturing goes hand in hand with our dedication to environmental stewardship.",
  "Through our reforestation efforts, we restore areas affected by natural disturbances, recognizing tree planting as a crucial measure to combat climate change.",
  "We optimized the woodcutting process to ensure minimal losses. Pitiusa is sourced from a 300-year-old oak tree that reached the end of its natural lifecycle.",
];

const BEAT_WORDS = BEATS.map((b) => b.split(" "));

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

// Budgeted in svh like the other pinned sections; the 0–1 boundaries below
// are derived from these, so the pace is one number per act.
const PHASES = {
  logo: 61, // the mark, centred and large
  swap: 54, // …turning green
  shrink: 82, // shrinking into the corner as the film comes up
  beat1: 88,
  beat2: 88,
  beat3: 88,
  outro: 102, // film pulls back and leaves, the aerial shot takes over
};
const TOTAL = Object.values(PHASES).reduce((a, b) => a + b, 0);
const cum = (...keys: Array<keyof typeof PHASES>) =>
  keys.reduce((sum, k) => sum + PHASES[k], 0) / TOTAL;
const AT = {
  logo: cum("logo"),
  swap: cum("logo", "swap"),
  shrink: cum("logo", "swap", "shrink"),
  beat1: cum("logo", "swap", "shrink", "beat1"),
  beat2: cum("logo", "swap", "shrink", "beat1", "beat2"),
  beat3: cum("logo", "swap", "shrink", "beat1", "beat2", "beat3"),
};

// Where a wheel gesture is allowed to stop inside this section: the mark
// turned green, the film in place, then each of the three beats read.
const E = (...keys: Array<keyof typeof PHASES>) => keys.reduce((n, k) => n + PHASES[k], 0);
// A beat is written over the first half of its budget and cleared over the
// last fifth, so its gesture rests in between — at the end of the budget the
// words have just been wiped, which is what made each beat something you
// only ever caught mid-glide.
const BEAT_REST = 0.7;
const SNAP_AT = [
  E("logo", "swap"),
  E("logo", "swap", "shrink"),
  E("logo", "swap", "shrink") + PHASES.beat1 * BEAT_REST,
  E("logo", "swap", "shrink", "beat1") + PHASES.beat2 * BEAT_REST,
  E("logo", "swap", "shrink", "beat1", "beat2") + PHASES.beat3 * BEAT_REST,
  // The aerial shot, once the film has left and it has the screen: without
  // this it arrived and the section ended in the same gesture.
  TOTAL - PHASES.outro * 0.15,
];

// The mark once it has parked, and how far in from the plate's corner it
// sits. Both shrink in portrait, where 84px in a 40px corner would take a
// quarter of the width.
const LOGO_SMALL = { wide: 84, portrait: 52 };
const CORNER = { wide: 40, portrait: 18 };

// How far the film sits in from the edges of the screen: a share of the
// height top and bottom, and vw either side. Raise them to shrink the plate.
// Portrait gets its own pair — 16vw of a phone is a third of the screen
// gone, and the copy has nowhere left to sit.
const FILM_INSET = {
  wide: { y: 0.12, x: 16 },
  portrait: { y: 0.07, x: 5 },
};


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

export default function EcologySection() {
  const reduced = useReducedMotion();
  const stickyRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoOrangeRef = useRef<HTMLDivElement>(null);
  const logoGreenRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const filmInnerRef = useRef<HTMLDivElement>(null);
  const beatWordRefs = useRef<Array<Array<HTMLSpanElement | null>>>([]);
  const loftRef = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((p: number) => {
    const sticky = stickyRef.current;
    if (!sticky) return;
    const sw = sticky.offsetWidth;
    const sh = sticky.offsetHeight;
    // Measured, not matched against a media query: this runs on resize too,
    // so a rotated phone picks up the other set on the next frame.
    const portrait = sw < 768;
    const inset = portrait ? FILM_INSET.portrait : FILM_INSET.wide;
    const logoSmall = portrait ? LOGO_SMALL.portrait : LOGO_SMALL.wide;
    const corner = portrait ? CORNER.portrait : CORNER.wide;

    // --- The mark: centred, then green, then away into the corner ---
    const appear = ease(span(p, 0, AT.logo * 0.12));
    // Gone before the film moves. The mark is a sibling of the frame, not a
    // child of it, so it never travelled with the film on the way out — it
    // stayed pinned in the corner while the video slid away underneath,
    // which is what read as a glitch. Clearing it at the end of the last
    // beat means there is nothing left to strand.
    const logoOut = ease(clamp((span(p, AT.beat2, AT.beat3) - 0.7) / 0.3));
    const green = ease(span(p, AT.logo, AT.swap));
    const travel = ease(span(p, AT.swap, AT.swap + (AT.shrink - AT.swap) * 0.75));

    if (logoRef.current) {
      const big = Math.min(sw, sh) * 0.34;
      const size = big + (logoSmall - big) * travel;
      // Centre of the mark, from the middle of the screen to the corner.
      const cxFrom = sw / 2;
      const cyFrom = sh / 2;
      // The corner it settles into is the film's, not the screen's — now
      // that the film is a plate, the screen's corner would strand the mark
      // on the page background instead of on the footage.
      const cxTo = (inset.x / 100) * sw + corner + logoSmall / 2;
      const cyTo = inset.y * sh + corner + logoSmall / 2;
      const x = cxFrom + (cxTo - cxFrom) * travel;
      const y = cyFrom + (cyTo - cyFrom) * travel;
      const l = logoRef.current;
      l.style.width = `${size.toFixed(1)}px`;
      l.style.height = `${size.toFixed(1)}px`;
      l.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(
        1
      )}px, 0)`;
      l.style.opacity = `${appear * (1 - logoOut)}`;
    }
    if (logoOrangeRef.current) logoOrangeRef.current.style.opacity = `${1 - green}`;
    if (logoGreenRef.current) logoGreenRef.current.style.opacity = `${green}`;

    // --- The film: arrives while the mark is still travelling ---------
    const filmIn = ease(span(p, AT.swap + (AT.shrink - AT.swap) * 0.15, AT.shrink));
    const u = span(p, AT.beat3, 1);
    const zoom = ease(Math.min(1, u / 0.5));
    const exit = ease(clamp((u - 0.4) / 0.6));

    if (filmRef.current) {
      const f = filmRef.current;
      // A plate from the outset rather than full-bleed. The photographs open
      // edge to edge because they are the subject; the film is the backdrop
      // the copy is read against, and at full size it was the page.
      // The film keeps its own inset on top of the fit: it is the backdrop
      // the copy is read against, not the subject, so it sits in from the
      // edges even where there is room for more.
      const { w, h } = fitFrame(sw * (1 - (inset.x * 2) / 100 - zoom * 0.08), sh);
      const frameH = h;
      const topInset = (sh - h) / 2;
      const sideInset = (sw - w) / 2;
      f.style.top = `${topInset.toFixed(1)}px`;
      f.style.bottom = `${topInset.toFixed(1)}px`;
      f.style.left = `${sideInset.toFixed(1)}px`;
      f.style.right = `${sideInset.toFixed(1)}px`;
      f.style.transform = `translate3d(0, ${(-exit * (frameH + topInset + 24)).toFixed(1)}px, 0)`;
      f.style.opacity = `${filmIn * (1 - exit)}`;
      f.style.visibility = filmIn < 0.01 || exit > 0.995 ? "hidden" : "visible";
    }
    if (filmInnerRef.current) {
      // Never below 1, or the film stops covering its rounded window and
      // its own square corners show against the white mount.
      // Capped at 1, like the photographs: above it the window shows only
      // a crop of the footage.
      // Fixed at 1: the window is the film's own shape, so it covers
      // exactly. Above 1 the edges start being hidden again.
      filmInnerRef.current.style.transform = "scale(1)";
    }

    // --- Three beats of copy, one at a time --------------------------
    const windows: Array<[number, number]> = [
      [AT.shrink, AT.beat1],
      [AT.beat1, AT.beat2],
      [AT.beat2, AT.beat3],
    ];
    windows.forEach(([from, to], i) => {
      const t = span(p, from, to);
      // Word by word on the way in, then the whole block clears together
      // over the last fifth — each beat is alone on screen, and no two
      // ever overlap.
      const out = ease(clamp((t - 0.8) / 0.2));
      const head = ((t - 0.05) / 0.5) * BEAT_WORDS[i].length;
      BEAT_WORDS[i].forEach((_, j) => {
        const el = beatWordRefs.current[i]?.[j];
        if (el) el.style.opacity = `${clamp(head - j) * (1 - out)}`;
      });
    });

    // --- The aerial shot takes the screen as the film leaves ----------
    if (loftRef.current) {
      // Fitted like the film: it was the one frame still left full-bleed, so
      // `object-cover` was showing a slice of a 16:9 photograph.
      const fit = fitFrame(sw * 0.9, sh);
      const l = loftRef.current;
      l.style.top = `${((sh - fit.h) / 2).toFixed(1)}px`;
      l.style.bottom = `${((sh - fit.h) / 2).toFixed(1)}px`;
      l.style.left = `${((sw - fit.w) / 2).toFixed(1)}px`;
      l.style.right = `${((sw - fit.w) / 2).toFixed(1)}px`;
      l.style.opacity = `${ease(clamp((u - 0.45) / 0.25))}`;
    }
  }, []);

  const wrapperRef = usePinnedProgress<HTMLElement>({ onProgress, disabled: reduced });

  if (reduced) {
    return (
      <section className="relative px-5 py-16 md:px-12 md:py-32">
        <Image
          src="/logo/pitiusa-logo-green.png"
          alt="Pitiusa Art Station"
          width={2000}
          height={2000}
          sizes="200px"
          className="mx-auto h-auto w-40"
        />
        <div className="mx-auto mt-10 max-w-2xl space-y-6 md:mt-14 md:space-y-8">
          {BEATS.map((beat) => (
            <p key={beat} className="text-lg leading-relaxed text-bone-dim">
              {beat}
            </p>
          ))}
        </div>
        <div className="relative mt-10 md:mt-14 aspect-[16/9] w-full overflow-hidden rounded-[28px]">
          <Image
            src="/images/loft-aerial-v2.jpg"
            alt="Pitiusa Art Station, vue aérienne"
            fill
            sizes="100vw"
            quality={100}
            className="object-cover"
          />
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Pulled up by one viewport, like the sections before it: a pinned
          section releases as soon as its progress hits 1, but the next only
          pins once its own top edge reaches the top of the viewport — a
          full screen of scrolling later, with nothing on it. */}
      <section
        ref={wrapperRef}
        data-snap
        className="relative -mt-[100svh]"
        style={{ height: `${TOTAL + 100}svh` }}
      >
        <SnapMarks at={SNAP_AT} />
        {/* Opaque: this section overlaps the one above by a screen and has to
            cover it, not let it show through. */}
        <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden bg-white">
          {/* The film, in the same white mount as the photographs. */}
          <div
            ref={filmRef}
            className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] md:rounded-[2.5rem] md:p-5"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-white md:rounded-[1.75rem]">
              <div ref={filmInnerRef} className="absolute inset-0" style={{ transform: "scale(1)" }}>
                <video
                  className="h-full w-full object-cover"
                  src="/video/forest.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                />
              </div>
            </div>
          </div>

          {/* The aerial shot, waiting behind the film. */}
          <div
            ref={loftRef}
            className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] md:rounded-[2.5rem] md:p-5"
            style={{ opacity: 0 }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-white md:rounded-[1.75rem]">
              <Image
                src="/images/loft-aerial-v2.jpg"
                alt="Pitiusa Art Station, vue aérienne"
                fill
                sizes="100vw"
                quality={100}
                className="object-cover"
              />
            </div>
          </div>

          {/* Copy, over the film. White rather than the brown used on the
              wood shots: on forest footage the brown disappears. */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 md:px-12">
            {/* Capped against the plate's width, not just the page's: the
                film no longer runs edge to edge, so a 48rem block would
                overhang it on a narrower desktop. */}
            <div className="relative mx-auto h-0 w-[82vw] sm:w-[min(48rem,58vw)]">
              {BEAT_WORDS.map((words, i) => (
                <p
                  key={i}
                  className="absolute left-0 top-1/2 w-full -translate-y-1/2 text-center font-display text-lg leading-snug sm:text-2xl lg:text-3xl"
                  style={{
                    color: "#ffffff",
                    textShadow: "0 2px 30px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)",
                  }}
                >
                  {words.map((word, j) => (
                    <span
                      key={`${word}-${j}`}
                      ref={(el) => {
                        if (!beatWordRefs.current[i]) beatWordRefs.current[i] = [];
                        beatWordRefs.current[i][j] = el;
                      }}
                      style={{ opacity: 0 }}
                    >
                      {word}
                      {j < words.length - 1 ? " " : ""}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </div>

          {/* The mark. Two copies stacked and cross-faded: swapping the src
              would flash while the second file decodes. */}
          <div
            ref={logoRef}
            className="pointer-events-none absolute left-0 top-0"
            style={{ opacity: 0, width: 200, height: 200 }}
          >
            <div ref={logoOrangeRef} className="absolute inset-0">
              <Image
                src="/logo/pitiusa-logo.png"
                alt="Pitiusa Art Station"
                fill
                sizes="400px"
                className="object-contain"
              />
            </div>
            <div ref={logoGreenRef} className="absolute inset-0" style={{ opacity: 0 }}>
              <Image
                src="/logo/pitiusa-logo-green.png"
                alt=""
                fill
                sizes="400px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
