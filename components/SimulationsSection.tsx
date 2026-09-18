"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { Plane, Helicopter, Car, Drone, type LucideIcon } from "lucide-react";
import SimulationCard from "./SimulationCard";
import { simulations } from "@/content/simulations";
import { usePinnedProgress } from "@/lib/usePinnedProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import SnapMarks from "./SnapMarks";

const icons: Record<string, LucideIcon> = {
  plane: Plane,
  helicopter: Helicopter,
  car: Car,
  drone: Drone,
};

const CARD_COUNT = simulations.length;
const BADGE = 88;
const DOT = 34;
const TITLE = "Where design, technology and luxury converge to shape excellence";

// Two kinds. The ones that name a part of the machine are pinned to it —
// as a fraction of the subject itself, not of the file, which carries wide
// transparent margins — so the screen's marker stays on the curved screen
// however large the machine is drawn. The ones that describe what it does
// rather than what it is have nothing to point at, so they sit out in the
// margin beside it, placed as a fraction of the viewport.
type Hotspot = {
  title: string;
  text: string;
  fx: number;
  fy: number;
  /** false → fx/fy are viewport fractions, and the marker ignores the machine. */
  pinned: boolean;
};
const HOTSPOTS: Hotspot[] = [
  {
    title: "Curved wraparound screen",
    text: "An unbroken field of view, free of glare and visible edges.",
    // Off-centre on purpose: dead centre puts the marker on the wordmark.
    fx: 0.29,
    fy: 0.225,
    pinned: true,
  },
  {
    title: "Intuitive touchscreen control",
    text: "Effortless navigation for every member of the family.",
    fx: 0.735,
    fy: 0.405,
    pinned: true,
  },
  {
    title: "Multisensory modes",
    text: "Optional massage, meditation and aromatherapy, combined at will.",
    fx: 0.5,
    fy: 0.585,
    pinned: true,
  },
  {
    title: "Oak and ash",
    text: "300-year-old oak wood and century-old ash, worked by hand.",
    fx: 0.2,
    fy: 0.68,
    pinned: true,
  },
  {
    title: "Ultra-realistic simulations",
    text: "Aircraft, drone and racing, set in iconic landscapes from around the world.",
    fx: 0.11,
    fy: 0.32,
    pinned: false,
  },
  {
    title: "Predefined routes",
    text: "Curated routes and experiences designed for younger users.",
    fx: 0.89,
    fy: 0.62,
    pinned: false,
  },
];

// The closing statement, revealed one line at a time, centred. Split into
// lines on purpose: the reveal is meant to read line by line, which a
// paragraph that rewraps with the viewport cannot do.
const CLOSING_LINES: Array<{ text: string; heading?: boolean; gap?: boolean }> = [
  { text: "Where Art and Technology Meet", heading: true },
  { text: "Pitiusa showcases the pinnacle of French craftsmanship, blending the artistry", gap: true },
  { text: "of master cabinetmakers with cutting-edge technologies." },
  { text: "Pitiusa redefines aesthetics in a living room and ensures next-level", gap: true },
  { text: "immersion within a single bespoke installation." },
];

// Measured from the PNG's alpha channel: the machine occupies only this
// slice of the canvas, the rest is transparent padding.
const MACHINE_RATIO = 1800 / 1013;
const SUB_L = 624 / 1800;
const SUB_W = (1176 - 624) / 1800;
const SUB_T = 60 / 1013;
const SUB_H = (963 - 60) / 1013;

// An element's layout position inside `root`, walking the offsetParent
// chain. Deliberately not getBoundingClientRect: offsetLeft/offsetTop
// ignore CSS transforms, so a card's resting box can be read at any moment
// — including while its own entrance transform is still applied, or when
// the page is loaded straight into the middle of the section and the
// entrance never ran at all.
const offsetIn = (el: HTMLElement, root: HTMLElement) => {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Each act is budgeted in svh — how much scrolling it should take — and the
// 0–1 boundaries are derived from those budgets, so the pace is one number
// per act rather than a set of fractions that have to stay consistent with
// the section's own height.
const PHASES = {
  entry: 116, // cards arrive one by one, right to left
  hold: 31, // …and hold, nothing moving
  approach: 129, // the machine rises from below toward them
  morph: 110, // they turn into bubbles; it keeps rising
  join: 120, // it comes up to full size, its markers fade in
  explore: 40, // a short run-up, not a crossing: the gesture stops at the
  // end of `join`, with the markers already there to be hovered
  rise: 150, // it carries on up and out of frame
  closing: 190, // the copy comes in, line by line, centred
  read: 90, // …and holds, so the block can actually be read
};
const TOTAL = Object.values(PHASES).reduce((a, b) => a + b, 0);
const cum = (...keys: Array<keyof typeof PHASES>) =>
  keys.reduce((sum, k) => sum + PHASES[k], 0) / TOTAL;
const AT = {
  entry: cum("entry"),
  hold: cum("entry", "hold"),
  approach: cum("entry", "hold", "approach"),
  morph: cum("entry", "hold", "approach", "morph"),
  join: cum("entry", "hold", "approach", "morph", "join"),
  explore: cum("entry", "hold", "approach", "morph", "join", "explore"),
  rise: cum("entry", "hold", "approach", "morph", "join", "explore", "rise"),
};
// How much of the final span is spent writing the copy rather than holding it.
const WRITE = PHASES.closing / (PHASES.closing + PHASES.read);

// Where a wheel gesture is allowed to stop inside this section. One beat per
// gesture: the machine arriving, the cards turning and the markers landing
// used to share a single one, which is what made the middle of the section a
// blur. Summed from the budgets above so they can never drift apart.
const S = (...keys: Array<keyof typeof PHASES>) => keys.reduce((n, k) => n + PHASES[k], 0);
const SNAP_AT = [
  S("entry", "hold"), // the cards settled
  S("entry", "hold", "approach"), // the machine up under them
  S("entry", "hold", "approach", "morph"), // …and they have turned into bubbles
  S("entry", "hold", "approach", "morph", "join"), // full size, markers in — hover here
  TOTAL - PHASES.closing - PHASES.read, // the machine gone
  TOTAL - PHASES.read, // the copy written out in full
];

export default function SimulationsSection() {
  const reduced = useReducedMotion();
  const stickyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const badgeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const machineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  // Each card's resting box, in sticky-container coordinates: where its
  // bubble starts from.
  const boxes = useRef<Array<{ x: number; y: number; w: number; h: number } | null>>([]);

  const onProgress = useCallback((p: number) => {
    const sticky = stickyRef.current;
    if (!sticky) return;
    const sw = sticky.offsetWidth;
    const sh = sticky.offsetHeight;

    const uEntry = span(p, 0, AT.entry);
    const uApproach = span(p, AT.hold, AT.approach);
    const uMorph = span(p, AT.approach, AT.morph);
    const uJoin = span(p, AT.morph, AT.join);
    const uRise = span(p, AT.explore, AT.rise);
    // Smoothstep, not the shared ease-out: an ease-out starts at full speed,
    // so the machine jerked a hundred pixels upward on the first frame of
    // the rise instead of pulling away from a standstill.
    const riseT = uRise * uRise * (3 - 2 * uRise);
    // The last stretch is two acts sharing one span: the copy is written
    // over `closing`, then `read` holds it still. `uWrite` re-normalises to
    // the writing alone, so the lines land exactly when the writing budget
    // runs out however that budget is changed.
    const uClosing = span(p, AT.rise, 1);
    const uWrite = clamp(uClosing / WRITE);
    // Everything clears over the last stretch, so the section that overlaps
    // this one's tail — and the photo that opens the next one — finds an
    // empty screen. It waits for the read: the copy used to start fading
    // before the gesture carrying it had come to rest, so the block was
    // never on screen complete and still.
    const out = ease(clamp((uClosing - 0.93) / 0.07));

    // --- Act I: the cards arrive, then hold ---------------------------
    simulations.forEach((_, i) => {
      const card = cardRefs.current[i];
      if (!card) return;
      // First card first, travelling the furthest left, each later one
      // filling in behind it. The offset is a whole number of slots, so the
      // travel distances differ and the order reads; the window is shorter
      // than the gap between two starts for the same reason.
      const slotW = card.offsetWidth + 28;
      const t = ease(clamp((uEntry - i * 0.2) / 0.4));
      card.style.transform = `translate3d(${((1 - t) * (CARD_COUNT - i) * slotW).toFixed(1)}px, 0, 0)`;

      const off = offsetIn(card, sticky);
      boxes.current[i] = {
        x: off.x + card.offsetWidth / 2,
        y: off.y + card.offsetHeight / 2,
        w: card.offsetWidth,
        h: card.offsetHeight,
      };
      // Cut the moment its bubble takes over: a slow crossfade would show
      // two copies of the same object sliding apart.
      card.style.opacity = `${t * (1 - clamp((uMorph - i * 0.09) / 0.07))}`;
    });

    // --- The machine: giant, rising the whole way ----------------------
    const box0 = boxes.current[0];
    const rowBottom = box0 ? box0.y + box0.h / 2 : sh * 0.55;

    // Getting on for twice the height of the screen: it is meant to overrun
    // the frame rather than sit inside it, so the machine reads as full
    // scale rather than as a picture of one.
    const mh = sh * 1.75;
    const mw = mh * MACHINE_RATIO;
    // The milestones are set on the subject's own top edge rather than on
    // the box's, because the file's transparent header is ~90px at this
    // size — aim the box at the row and the machine stops a long way short
    // of it.
    const pad = SUB_T * mh;
    let top = mix(sh, rowBottom + 120 - pad, ease(uApproach));
    top = mix(top, rowBottom + 25 - pad, ease(uMorph));
    top = mix(top, -sh * 0.24, ease(uJoin));
    top -= riseT * (sh * 1.7);
    const left = sw / 2 - mw / 2;
    // Where the machine actually begins on screen: what the bubbles and the
    // title get out of the way of.
    const subjectTop = top + pad;

    if (titleRef.current) {
      // Fixed through the approach — the machine is the only thing moving —
      // and then it too clears as the machine's edge arrives under it.
      const t = titleRef.current;
      const titleBottom = offsetIn(t, sticky).y + t.offsetHeight;
      const contact = clamp((titleBottom + 20 - subjectTop) / 110);
      t.style.opacity = `${ease(clamp(uEntry / 0.25)) * (1 - contact)}`;
      t.style.transform = `translate3d(0, ${(-contact * sh * 0.12).toFixed(1)}px, 0)`;
    }

    if (machineRef.current) {
      const m = machineRef.current;
      m.style.width = `${mw.toFixed(1)}px`;
      m.style.height = `${mh.toFixed(1)}px`;
      m.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      m.style.opacity = `${ease(clamp(uApproach / 0.12)) * (1 - out)}`;
    }

    // --- The card bubbles: in place, gone the moment it reaches them ----
    // Driven by the machine's own edge rather than by a phase boundary, so
    // "as it touches them" stays true whatever the machine's size or the
    // pace of the rise.

    simulations.forEach((_, i) => {
      const el = badgeRefs.current[i];
      const box = boxes.current[i];
      if (!el || !box) return;

      // Rectangle → circle, in place, staggered so they turn one after
      // another as the machine comes up under them. The bubble holds the
      // card's own box for the first instant so it lands exactly on top of
      // it — start shrinking straight away and you see a smaller rounded
      // box appear inside the card it is supposed to be replacing.
      const m = ease(clamp((uMorph - 0.07 - i * 0.09) / 0.43));
      const w = mix(box.w, BADGE, m);
      const h = mix(box.h, BADGE, m);

      // Fades out over the 70px in which the machine's top edge crosses it.
      const contact = clamp((box.y + h / 2 + 10 - subjectTop) / 70);
      const alive = uMorph > i * 0.09 ? (1 - contact) * (1 - out) : 0;
      el.style.opacity = `${alive}`;
      el.style.width = `${w.toFixed(1)}px`;
      el.style.height = `${h.toFixed(1)}px`;
      el.style.borderRadius = `${mix(16, BADGE / 2, m).toFixed(1)}px`;
      el.style.transform = `translate3d(${(box.x - w / 2).toFixed(1)}px, ${(box.y - h / 2).toFixed(
        1
      )}px, 0)`;
      // Hoverable only once it is a bubble and its text is hidden — that's
      // the whole point of the popup.
      el.style.pointerEvents = m > 0.9 && alive > 0.8 ? "auto" : "none";
    });

    // --- The markers on the machine ------------------------------------
    const dotsIn = ease(clamp((uJoin - 0.55) / 0.45)) * (1 - clamp(riseT / 0.25));
    HOTSPOTS.forEach((hs, i) => {
      const el = dotRefs.current[i];
      if (!el) return;
      const x = hs.pinned ? left + (SUB_L + hs.fx * SUB_W) * mw : sw * hs.fx;
      const y = hs.pinned ? top + (SUB_T + hs.fy * SUB_H) * mh : sh * hs.fy;
      const a = dotsIn * clamp((dotsIn - i * 0.04) * 6);
      el.style.opacity = `${a * (1 - out)}`;
      el.style.transform = `translate3d(${(x - DOT / 2).toFixed(1)}px, ${(y - DOT / 2).toFixed(1)}px, 0)`;
      el.style.pointerEvents = a > 0.85 ? "auto" : "none";
    });

    // --- The closing copy, centred, one line at a time -----------------
    CLOSING_LINES.forEach((_, i) => {
      const el = lineRefs.current[i];
      if (!el) return;
      const a = ease(clamp((uWrite - 0.1 - i * 0.16) / 0.22));
      el.style.opacity = `${a * (1 - out)}`;
      el.style.transform = `translate3d(0, ${((1 - a) * 18).toFixed(1)}px, 0)`;
    });
  }, []);

  const wrapperRef = usePinnedProgress<HTMLElement>({ onProgress, disabled: reduced });

  const staticBlock = (
    <>
      <h2 className="mx-auto max-w-3xl text-center font-display text-4xl leading-tight text-bone md:text-6xl">
        {TITLE}
      </h2>
      <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 md:grid-cols-4">
        {simulations.map((simulation) => (
          <div key={simulation.slug} className="h-full">
            <SimulationCard simulation={simulation} />
          </div>
        ))}
      </div>
      <div className="relative mx-auto mt-16 aspect-[1800/1013] w-full max-w-4xl">
        <Image
          src="/images/front-detail-transp-v2.png"
          alt="Vue de face du poste de pilotage de la Pitiusa Art Station"
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>
      <ul className="mx-auto mt-12 grid max-w-5xl gap-x-12 gap-y-4 sm:grid-cols-2">
        {HOTSPOTS.map((hs) => (
          <li key={hs.title}>
            <p className="font-display text-lg text-bone">{hs.title}</p>
            <p className="mt-1 text-sm text-bone-dim">{hs.text}</p>
          </li>
        ))}
      </ul>
      <div className="mx-auto mt-20 max-w-3xl text-center">
        {CLOSING_LINES.map((line, i) => (
          <p
            key={i}
            className={
              line.heading
                ? "font-display text-2xl leading-tight text-bone md:text-3xl"
                : `text-base leading-relaxed text-bone-dim ${line.gap ? "mt-5" : ""}`
            }
          >
            {line.text}
          </p>
        ))}
      </div>
    </>
  );

  if (reduced) {
    return (
      <section id="art-station" className="relative px-6 py-24 md:px-12 md:py-32">
        {staticBlock}
      </section>
    );
  }

  return (
    <>
      <section
        id="art-station"
        ref={wrapperRef}
        data-snap
        className="relative hidden md:block"
        style={{ height: `${TOTAL + 100}svh` }}
      >
        <SnapMarks at={SNAP_AT} />
        <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden">
          <h2
            ref={titleRef}
            className="pointer-events-none absolute inset-x-0 top-[12svh] z-20 mx-auto max-w-4xl px-6 text-center font-display text-3xl leading-tight text-bone md:px-12 lg:text-4xl"
            style={{ opacity: 0 }}
          >
            {TITLE}
          </h2>

          <div
            ref={machineRef}
            className="pointer-events-none absolute left-0 top-0 z-10"
            style={{ opacity: 0 }}
          >
            <Image
              src="/images/front-detail-transp-v2.png"
              alt="Vue de face du poste de pilotage de la Pitiusa Art Station"
              fill
              sizes="180vw"
              className="object-contain"
              priority
            />
          </div>

          {/* The cards, in the flow so the browser lays the row out and the
              bubbles have a real box to start from. */}
          <div className="pointer-events-none absolute inset-x-0 top-[30svh] z-20 px-6 md:px-12">
            <div className="mx-auto grid max-w-[86rem] grid-cols-4 gap-7">
              {simulations.map((simulation, i) => (
                <div
                  key={simulation.slug}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  style={{ opacity: 0 }}
                >
                  <SimulationCard simulation={simulation} />
                </div>
              ))}
            </div>
          </div>

          {/* The bubbles the cards turn into, and the markers pinned to the
              machine. Both are placed from JS in the sticky container's own
              coordinates, so they share one positioning system. */}
          <div className="pointer-events-none absolute inset-0 z-30">
            {simulations.map((simulation, i) => {
              const Icon = icons[simulation.icon];
              return (
                <div
                  key={simulation.slug}
                  ref={(el) => {
                    badgeRefs.current[i] = el;
                  }}
                  className="sim-badge popup-below absolute left-0 top-0 flex items-center justify-center border-2 border-brass-dim/70 bg-ink transition-colors duration-300 hover:border-oak"
                  style={{ opacity: 0, width: BADGE, height: BADGE }}
                >
                  <Icon className="h-8 w-8 shrink-0 text-oak" strokeWidth={1.25} />
                  <div className="sim-popup absolute z-40 w-64 rounded-2xl border border-brass-dim/60 bg-ink px-5 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                    <p className="font-display text-xs uppercase tracking-[0.18em] text-bone">
                      {simulation.title}
                    </p>
                    <p className="mt-2 text-sm leading-snug text-bone-dim">{simulation.summary}</p>
                  </div>
                </div>
              );
            })}

            {HOTSPOTS.map((hs, i) => (
              <div
                key={hs.title}
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                // A marker on the machine opens outward, into the empty
                // space beside it. One already out in the margin has to open
                // the other way — inward — or its popup would run off the
                // edge of the screen.
                className={`sim-badge sim-dot ${
                  (hs.fx <= 0.5) === hs.pinned ? "popup-left" : "popup-right"
                } absolute left-0 top-0 flex items-center justify-center rounded-full border-2 border-oak/60 bg-ink/90 backdrop-blur-sm`}
                style={{ opacity: 0, width: DOT, height: DOT }}
              >
                <span className="h-2 w-2 rounded-full bg-oak" />
                <div className="sim-popup absolute z-40 w-64 rounded-2xl border border-brass-dim/60 bg-ink px-5 py-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <p className="font-display text-sm text-bone">{hs.title}</p>
                  <p className="mt-1.5 text-sm leading-snug text-bone-dim">{hs.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Closing copy: centred, and revealed line by line. */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 px-6 md:px-12">
            <div className="mx-auto max-w-4xl text-center">
              {CLOSING_LINES.map((line, i) => (
                <p
                  key={i}
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  className={
                    line.heading
                      ? "font-display text-4xl leading-tight text-bone lg:text-5xl"
                      : `text-xl leading-relaxed text-bone-dim lg:text-2xl ${
                          line.gap ? "mt-8" : ""
                        }`
                  }
                  style={{ opacity: 0 }}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: no pinning, the same content stacked. */}
      <section className="relative px-6 py-20 md:hidden">{staticBlock}</section>
    </>
  );
}
