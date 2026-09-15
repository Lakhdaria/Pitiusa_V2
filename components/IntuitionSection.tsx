"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import {
  Car,
  Clapperboard,
  Drone,
  Flower2,
  GraduationCap,
  Helicopter,
  Plane,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { experiences, type Experience } from "@/content/experiences";
import { usePinnedProgress } from "@/lib/usePinnedProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

const icons: Record<string, LucideIcon> = {
  meditation: Flower2,
  media: Clapperboard,
  education: GraduationCap,
  more: Sparkles,
  plane: Plane,
  helicopter: Helicopter,
  car: Car,
  drone: Drone,
};

const INTRO = "Behind every innovation lies an intuition";
const HEADING = "Progress does not happen by chance. It is born from curiosity.";
const RING_HEADING = ["Combining hand made", "with high-end technology"];
const RING_TEXT =
  "Pitiusa offers the highest performing technological specificities to ensure a full immersive experience.";
const FINAL_TEXT =
  "Because true luxury does not lie in accessing what everyone desires. It lies in experiencing that exits only once. For you.";
const FINAL_WORDS = FINAL_TEXT.split(" ");

// Eight slots, 45° apart, offset by 22.5° so none sits dead centre at the
// top or bottom — that offset is what gives the arrangement its two-up,
// two-down, two-a-side reading. Screen angles: 0 is right, negative is up.
const RING_ANGLES: Record<string, number> = {
  plane: -157.5,
  more: -112.5,
  education: -67.5,
  media: -22.5,
  meditation: 22.5,
  drone: 67.5,
  car: 112.5,
  helicopter: 157.5,
};
// The four already waiting on the ring, for the cards to come down and join.
const JOINERS = ["plane", "helicopter", "car", "drone"] as const;
// Left-to-right order of the staging row. The four waiting icons take the
// even slots and the four falling cards the odd ones, so the cards land
// interleaved with them rather than in a block of their own.
const ROW_ORDER = ["plane", "meditation", "helicopter", "media", "car", "education", "drone", "more"];

const BADGE = 84;
// One entry per badge: amplitude, periods, phase, how fast it chases the
// cursor and how far it leans. Hand-written rather than random so the
// motion is the same on every load — and deliberately unrelated from one
// badge to the next.
const FLOAT = [
  { amp: 7, periodX: 2100, periodY: 1500, phase: 0.0, lag: 0.05, leanX: 16, leanY: 11 },
  { amp: 5, periodX: 1700, periodY: 2300, phase: 1.3, lag: 0.03, leanX: -11, leanY: 17 },
  { amp: 8, periodX: 2500, periodY: 1800, phase: 2.6, lag: 0.07, leanX: 21, leanY: -8 },
  { amp: 4, periodX: 1900, periodY: 2600, phase: 3.9, lag: 0.04, leanX: -17, leanY: -14 },
  { amp: 6, periodX: 2300, periodY: 1600, phase: 5.2, lag: 0.06, leanX: 9, leanY: 19 },
  { amp: 9, periodX: 1500, periodY: 2400, phase: 0.7, lag: 0.035, leanX: -20, leanY: 7 },
  { amp: 5, periodX: 2700, periodY: 1900, phase: 2.0, lag: 0.065, leanX: 13, leanY: -16 },
  { amp: 7, periodX: 2000, periodY: 2200, phase: 3.3, lag: 0.045, leanX: -8, leanY: 12 },
];
// The wheel has stopped by this point in the closing phase; whatever is
// left is spent floating.
const SPIN_END = 0.55;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
// Progress of `p` through the [a, b] window, clamped.
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

// Each act is budgeted in svh — how much scrolling it should take — and the
// 0–1 boundaries are derived from those budgets, so the pace is tuned by
// editing one number instead of re-deriving a set of fractions by hand.
const PHASES = {
  appear: 30, // photo takes over from the previous section
  hold: 70, // full-bleed, opening line
  zoom: 110, // pulls back, then rides up and out
  cards: 150, // heading and cards arrive
  read: 70, // held still, time to read them
  morph: 130, // cards become circles and drop into the row
  ring: 120, // the eight peel off one by one onto the circle
  spin: 150, // it turns, then floats; the closing copy appears
  reveal: 130, // copy out, cockpit in, the circle widens around it
  final: 170, // badges out, cockpit grows, closing line written
};
const TOTAL = Object.values(PHASES).reduce((a, b) => a + b, 0);
const cum = (...keys: Array<keyof typeof PHASES>) =>
  keys.reduce((sum, k) => sum + PHASES[k], 0) / TOTAL;
const AT = {
  appear: cum("appear"),
  hold: cum("appear", "hold"),
  zoom: cum("appear", "hold", "zoom"),
  cards: cum("appear", "hold", "zoom", "cards"),
  read: cum("appear", "hold", "zoom", "cards", "read"),
  morph: cum("appear", "hold", "zoom", "cards", "read", "morph"),
  ring: cum("appear", "hold", "zoom", "cards", "read", "morph", "ring"),
  spin: cum("appear", "hold", "zoom", "cards", "read", "morph", "ring", "spin"),
  reveal: cum("appear", "hold", "zoom", "cards", "read", "morph", "ring", "spin", "reveal"),
};

const INSET_SIDE = 5;
const INSET_TOP = 4;
const BOTTOM_GAP = 40;

function ExperienceCard({ experience }: { experience: Experience }) {
  const Icon = icons[experience.icon];
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-brass-dim/70 bg-ink px-4 py-5 text-center transition-colors duration-300 hover:border-oak">
      <div className="flex flex-col items-center justify-center gap-2">
        <Icon className="h-6 w-6 shrink-0 text-oak" strokeWidth={1.25} />
        <h3 className="font-display text-xs uppercase tracking-[0.18em] text-bone">
          {experience.title}
        </h3>
        <p className="text-sm leading-snug text-bone-dim">{experience.summary}</p>
      </div>
    </div>
  );
}

export default function IntuitionSection() {
  const reduced = useReducedMotion();
  const stickyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLHeadingElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  // The travelling circles, one per card, plus the four already on the ring.
  const movingRefs = useRef<Array<HTMLDivElement | null>>([]);
  const joinerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ringTextRef = useRef<HTMLDivElement>(null);
  const cockpitRef = useRef<HTMLDivElement>(null);
  const finalTextRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  // Read off the file itself once it loads. The height cap depends on the
  // real ratio, and hard-coding one means the machine creeps back up into
  // the closing line the day the asset is swapped for another crop.
  const cockpitAspect = useRef(16 / 9);
  // Scroll decides where each badge belongs; a rAF loop then adds the idle
  // drift and the pointer lean on top. Keeping the two apart is what lets
  // the badges keep moving when the scroll is still.
  type Base = { el: HTMLDivElement; x: number; y: number; w: number; h: number; r: number; rot: number };
  const bases = useRef<Base[]>([]);
  const floatAmount = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const eased = useRef<Array<{ x: number; y: number }>>([]);

  const onProgress = useCallback((p: number) => {
    const sticky = stickyRef.current;
    if (!sticky) return;
    const sw = sticky.offsetWidth;
    const sh = sticky.offsetHeight;

    if (introRef.current) {
      introRef.current.style.opacity = `${
        span(p, AT.appear * 0.4, AT.appear) * (1 - span(p, AT.hold, AT.hold + 0.02))
      }`;
    }

    // Two chained moves on the same photo: it pulls back from full-bleed
    // into a framed plate, then keeps shrinking as it rides up and out of
    // the viewport, handing the screen over to the heading and cards.
    const u = span(p, AT.hold, AT.zoom);
    const zoom = ease(Math.min(1, u / 0.55));
    const exit = ease(clamp((u - 0.45) / 0.55));

    const blockH = bottomRef.current?.offsetHeight ?? 0;
    const bottomInset = zoom * (blockH + BOTTOM_GAP);
    const topInset = zoom * INSET_TOP * 0.01 * sh;

    if (frameRef.current) {
      const f = frameRef.current;
      f.style.top = `${topInset}px`;
      f.style.bottom = `${bottomInset}px`;
      f.style.left = `${zoom * INSET_SIDE}vw`;
      f.style.right = `${zoom * INSET_SIDE}vw`;
      const frameH = sh - topInset - bottomInset;
      f.style.transform = `translate3d(0, ${(-exit * (frameH + topInset + 24)).toFixed(1)}px, 0)`;
      f.style.opacity = `${span(p, 0, AT.appear) * (1 - exit)}`;
      f.style.visibility = exit > 0.995 ? "hidden" : "visible";
    }
    if (imageRef.current) {
      // The frame shrinking would crop the shot tighter on its own, which
      // reads as a zoom *in*. Scaling the photo down inside it at the same
      // time is what actually pulls the subject back.
      imageRef.current.style.transform = `scale(${(1.18 - zoom * 0.18 - exit * 0.14).toFixed(3)})`;
    }

    const u2 = span(p, AT.zoom, AT.cards);
    const u3 = span(p, AT.read, AT.morph);
    const u4 = span(p, AT.morph, AT.ring);
    const u5 = span(p, AT.ring, AT.spin);
    const u6 = span(p, AT.spin, AT.reveal);
    const u7 = span(p, AT.reveal, 1);
    const spread = ease(u6);
    // Badges leave first, so the cockpit is alone by the time it reaches
    // full size.
    const badgesOut = ease(clamp(u7 / 0.35));

    if (bottomRef.current) {
      const shift = exit * Math.max(0, (sh - blockH) / 2 - 0.04 * sh);
      bottomRef.current.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
    }

    if (headingRef.current) {
      const a = ease(Math.min(1, u2 / 0.22));
      headingRef.current.style.opacity = `${a * (1 - span(p, AT.read, AT.read + 0.015))}`;
      headingRef.current.style.transform = `translate3d(0, ${((1 - a) * 24).toFixed(1)}px, 0)`;
    }

    // --- Row, then ring ---------------------------------------------
    // Three staged moves: the four cards drop into the row the other four
    // icons already occupy, the eight then peel off one by one onto the
    // circle, and only then does the whole thing turn.
    const spin = 360 * ease(Math.min(1, u5 / SPIN_END));
    const cx = sw / 2;
    const cy = sh / 2;
    // The circle opens out as the cockpit takes the middle, so the badges
    // ring the machine instead of overlapping it.
    const rx = Math.min(sw * 0.34, 460) + spread * (sw * 0.46 - Math.min(sw * 0.34, 460));
    const ry = Math.min(sh * 0.34, 300) + spread * (sh * 0.41 - Math.min(sh * 0.34, 300));
    const ringPos = (angle: number) => {
      const a = ((angle + spin) * Math.PI) / 180;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    };
    // The row the cards come down to meet: eight evenly spaced slots,
    // centred, at the height the four waiting icons sit at.
    const step = BADGE + 24;
    const rowPos = (k: number) => ({ x: cx + (k - (ROW_ORDER.length - 1) / 2) * step, y: sh * 0.6 });

    const joinersIn = ease(Math.min(1, u3 / 0.2));
    const next: Base[] = [];

    // Card entrance, and the box each one morphs out of.
    const cardState: Array<{ raw: number } | null> = [];
    experiences.forEach((experience, i) => {
      const card = cardRefs.current[i];
      if (!card) {
        cardState.push(null);
        return;
      }
      // Entrance: staggered arrival, each card sliding in from its left.
      // The window is shorter than the gap between two starts, so the four
      // read as arriving one after another instead of fading up together.
      const enter = ease(clamp((u2 - 0.3 - i * 0.16) / 0.15));
      card.style.transform = `translate3d(${((1 - enter) * -60).toFixed(1)}px, 0, 0)`;

      // One at a time: the gap between two drops is wider than the fall
      // itself, so a badge has landed before the next one is released.
      const st = 0.08 + i * 0.17;
      const raw = clamp((u3 - st) / 0.26);
      cardState.push({ raw });

      // Its card goes as the badge is released — the icon reads as having
      // left the card and come back down from above.
      card.style.opacity = `${enter * (1 - clamp((u3 - st) / 0.06))}`;
    });

    ROW_ORDER.forEach((key, k) => {
      const cardIndex = experiences.findIndex((e) => e.icon === key);
      const isCard = cardIndex !== -1;
      const el = isCard
        ? movingRefs.current[cardIndex]
        : joinerRefs.current[JOINERS.indexOf(key as (typeof JOINERS)[number])];
      if (!el) return;

      const row = rowPos(k);
      const ring = ringPos(RING_ANGLES[key]);
      // Row → circle, one badge at a time, left to right.
      const tr = ease(clamp((u4 - k * 0.08) / 0.24));

      let x = row.x;
      let y = row.y;
      let w = BADGE;
      let h = BADGE;
      let r = BADGE / 2;

      if (isCard) {
        const st = cardState[cardIndex];
        if (!st) return;
        // Dropped in from above the viewport, straight down, on an
        // accelerating curve — gravity, not a tween — with a short damped
        // rebound at the end so it settles instead of sticking on impact.
        const fall = st.raw * st.raw;
        const rebound = st.raw > 0.82 ? -14 * Math.sin(((st.raw - 0.82) / 0.18) * Math.PI) : 0;
        x = row.x;
        y = -BADGE + (row.y + BADGE) * fall + rebound;
        el.style.opacity = `${st.raw > 0 ? 1 - badgesOut : 0}`;
      } else {
        el.style.opacity = `${joinersIn * (1 - badgesOut)}`;
      }

      // Whatever the badge's own state, the move onto the circle is the
      // same blend for all eight — so the four that came down and the four
      // that were waiting behave identically from here on.
      x += (ring.x - x) * tr;
      y += (ring.y - y) * tr;
      w += (BADGE - w) * tr;
      h += (BADGE - h) * tr;
      r += (BADGE / 2 - r) * tr;

      next.push({ el, x: x - w / 2, y: y - h / 2, w, h, r, rot: spin * tr });
    });

    bases.current = next;
    // Only once the wheel has come to rest does the idle motion take over.
    floatAmount.current = ease(clamp((u5 - SPIN_END) / 0.12));

    // The cockpit is centred on the screen while it's alone inside the
    // ring, then recentred into the band left free under the closing line
    // as that line comes in — and capped so it can never grow past it.
    // Sizing it on width alone is what put the machine behind the text.
    const textIn = ease(clamp((u7 - 0.15) / 0.15));
    const textH = finalTextRef.current?.offsetHeight ?? 0;
    const bandTop = sh * 0.03 + textH + 20;
    const bandH = Math.max(140, sh - bandTop - sh * 0.02);
    const availH = sh * 0.86 + (bandH - sh * 0.86) * textIn;
    const centerY = sh / 2 + (bandTop + bandH / 2 - sh / 2) * textIn;

    if (cockpitRef.current) {
      const c = cockpitRef.current;
      const grow = ease(clamp(u7 / 0.6));
      // Width asked for, then clamped by the free height and by the
      // viewport. On a typical screen it's the height that binds, which is
      // why the closing line is kept tight above — every line it saves is
      // width the machine gains.
      const w = Math.min(
        sw * (0.34 + 0.3 * spread + 0.4 * grow),
        availH * cockpitAspect.current,
        sw * 0.98
      );
      c.style.width = `${w.toFixed(1)}px`;
      c.style.top = `${centerY.toFixed(1)}px`;
      c.style.opacity = `${ease(clamp(u6 / 0.35))}`;
    }

    if (finalTextRef.current) {
      finalTextRef.current.style.opacity = `${textIn}`;
    }
    // Word by word rather than one block: "progressively" has to be legible
    // as an order, and a whole paragraph cross-fading reads as a single
    // switch.
    const head = ((u7 - 0.2) / 0.55) * FINAL_WORDS.length;
    FINAL_WORDS.forEach((_, i) => {
      const el = wordRefs.current[i];
      if (el) el.style.opacity = `${clamp(head - i)}`;
    });

    if (ringTextRef.current) {
      // Comes up while the circle is still assembling — by the time the
      // last badge lands, the copy is already there to be read, and the
      // turn happens around a finished composition.
      const w = AT.ring - AT.morph;
      const a = ease(span(p, AT.morph + w * 0.25, AT.morph + w * 0.6));
      // …and out again as the cockpit arrives to take its place.
      ringTextRef.current.style.opacity = `${a * (1 - ease(clamp(u6 / 0.25)))}`;
    }
  }, []);

  const wrapperRef = usePinnedProgress<HTMLElement>({ onProgress, disabled: reduced });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const list = bases.current;
      if (!list.length) return;

      const f = floatAmount.current;
      list.forEach((b, i) => {
        const q = FLOAT[i % FLOAT.length];
        // Each badge chases the cursor at its own rate, so they arrive at
        // their new offsets at different moments. A single shared eased
        // pointer would move all eight in lockstep — the whole ring
        // sliding as one object, which is exactly what it shouldn't do.
        const e = eased.current[i] ?? (eased.current[i] = { x: 0, y: 0 });
        e.x += (pointer.current.x - e.x) * q.lag;
        e.y += (pointer.current.y - e.y) * q.lag;

        // Own period and phase too: with a shared period they'd bob in
        // unison, which reads as one rigid object rather than eight
        // separate ones in suspension.
        const bob = f * q.amp * Math.sin(now / q.periodY + q.phase);
        const sway = f * q.amp * 0.7 * Math.cos(now / q.periodX + q.phase * 1.7);
        // Per-badge lean vector, signs included: some drift with the
        // cursor, some against it.
        const x = b.x + sway + e.x * q.leanX * f;
        const y = b.y + bob + e.y * q.leanY * f;
        b.el.style.width = `${b.w.toFixed(1)}px`;
        b.el.style.height = `${b.h.toFixed(1)}px`;
        b.el.style.borderRadius = `${b.r.toFixed(1)}px`;
        b.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${b.rot.toFixed(
          1
        )}deg)`;
      });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [reduced]);

  const staticBlock = (
    <>
      <h2 className="mx-auto mt-16 max-w-4xl text-center font-display text-3xl leading-tight text-bone md:text-5xl">
        {HEADING}
      </h2>
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 md:grid-cols-4">
        {experiences.map((experience) => (
          <ExperienceCard key={experience.slug} experience={experience} />
        ))}
      </div>
      <div className="mx-auto mt-20 max-w-xl text-center">
        <h2 className="font-display text-2xl leading-tight text-bone md:text-3xl">
          {RING_HEADING.join(" ")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">{RING_TEXT}</p>
      </div>
      <p className="mx-auto mt-20 max-w-3xl text-center font-display text-xl leading-snug text-bone md:text-3xl">
        {FINAL_TEXT}
      </p>
      <Image
        src="/images/Pitiusa_Photos_00005f_transp.png"
        alt="Pitiusa Art Station vue de dessus"
        width={2000}
        height={1125}
        sizes="100vw"
        className="mx-auto mt-10 h-auto w-full max-w-4xl"
      />
    </>
  );

  if (reduced) {
    return (
      <section id="intuition" className="relative bg-white px-6 py-24 md:px-12 md:py-32">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px]">
          <Image
            src="/images/rear-detail-v2.jpg"
            alt="Vue arrière de la Pitiusa Art Station"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {staticBlock}
      </section>
    );
  }

  return (
    <>
      {/* Pulled up by exactly one viewport. Without it there's a dead screen
          between the two pinned sections: the previous one releases as soon
          as its progress hits 1 — with its content already faded out — and
          this one only pins once its own top edge reaches the top of the
          viewport, a full screen of scrolling later. The overlap costs
          nothing because the tail it covers is empty. */}
      <section
        id="intuition"
        ref={wrapperRef}
        className="relative hidden h-[1230svh] md:-mt-[100svh] md:block"
      >
        <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden">
          {/* Same white mount and corner radii as the hero, so the photo
              lands in the frame the eye already knows from the top of the
              page. */}
          <div
            ref={frameRef}
            className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] md:rounded-[2.5rem] md:p-5"
            style={{ opacity: 0 }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] md:rounded-[1.75rem]">
              <div ref={imageRef} className="absolute inset-0" style={{ transform: "scale(1.18)" }}>
                <Image
                  src="/images/rear-detail-v2.jpg"
                  alt="Vue arrière de la Pitiusa Art Station"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <h2
              ref={introRef}
              className="pointer-events-none absolute left-9 top-28 max-w-2xl font-display text-4xl leading-[1.05] md:left-12 md:top-40 md:text-6xl"
              style={{
                opacity: 0,
                fontVariationSettings: "'wght' 380",
                color: "#3d2410",
                textShadow: "0 2px 28px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              {INTRO}
            </h2>
          </div>

          <div ref={bottomRef} className="absolute inset-x-0 bottom-[4svh] px-6 md:px-12">
            <h2
              ref={headingRef}
              className="mx-auto max-w-4xl text-center font-display text-3xl leading-tight text-bone lg:text-5xl"
              style={{ opacity: 0 }}
            >
              {HEADING}
            </h2>
            <div className="mx-auto mt-6 grid max-w-6xl grid-cols-4 gap-4">
              {experiences.map((experience, i) => (
                <div
                  key={experience.slug}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  style={{ opacity: 0 }}
                >
                  <ExperienceCard experience={experience} />
                </div>
              ))}
            </div>
          </div>

          {/* Closing copy, inside the ring. */}
          <div
            ref={ringTextRef}
            className="pointer-events-none absolute left-1/2 top-1/2 w-[34rem] max-w-[56vw] -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ opacity: 0 }}
          >
            <h2 className="font-display text-3xl leading-tight text-bone lg:text-4xl">
              {RING_HEADING.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-bone-dim lg:text-lg">
              {RING_TEXT}
            </p>
          </div>

          {/* The cockpit, cut out of its backdrop, sitting inside the ring.
              Width is driven from JS; height follows the aspect ratio. */}
          <div
            ref={cockpitRef}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ opacity: 0, width: "34%", top: "50%" }}
          >
            <Image
              src="/images/Pitiusa_Photos_00005f_transp.png"
              alt="Pitiusa Art Station vue de dessus"
              width={2000}
              height={1125}
              sizes="95vw"
              className="h-auto w-full"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  cockpitAspect.current = img.naturalWidth / img.naturalHeight;
                }
              }}
            />
          </div>

          {/* Closing line, written word by word above the machine. */}
          <div
            ref={finalTextRef}
            className="pointer-events-none absolute inset-x-0 top-[3svh] px-6 md:px-12"
            style={{ opacity: 0 }}
          >
            <p className="mx-auto max-w-5xl text-center font-display text-2xl leading-snug text-bone lg:text-[2rem]">
              {FINAL_WORDS.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                  style={{ opacity: 0 }}
                >
                  {word}
                  {i < FINAL_WORDS.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          </div>

          {/* The ring. Every badge is placed from JS in the sticky
              container's own coordinates — no nested rotating wrapper, so
              the travelling circles and the waiting ones share one and the
              same positioning maths. */}
          <div className="pointer-events-none absolute inset-0">
            {JOINERS.map((key, i) => {
              const Icon = icons[key];
              return (
                <div
                  key={key}
                  ref={(el) => {
                    joinerRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0 flex items-center justify-center rounded-full border-2 border-brass-dim/70 bg-ink"
                  style={{ opacity: 0, width: BADGE, height: BADGE }}
                >
                  <Icon className="h-7 w-7 shrink-0 text-oak" strokeWidth={1.25} />
                </div>
              );
            })}
            {experiences.map((experience, i) => {
              const Icon = icons[experience.icon];
              return (
                <div
                  key={experience.slug}
                  ref={(el) => {
                    movingRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0 flex items-center justify-center overflow-hidden border-2 border-brass-dim/70 bg-ink"
                  style={{ opacity: 0, width: BADGE, height: BADGE, borderRadius: BADGE / 2 }}
                >
                  <Icon className="h-7 w-7 shrink-0 text-oak" strokeWidth={1.25} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile: no pinning, the same content stacked. */}
      <section className="relative bg-white px-6 py-20 md:hidden">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px]">
          <Image
            src="/images/rear-detail-v2.jpg"
            alt="Vue arrière de la Pitiusa Art Station"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <p
          className="mt-8 font-display text-3xl leading-[1.05]"
          style={{ fontVariationSettings: "'wght' 380", color: "#3d2410" }}
        >
          {INTRO}
        </p>
        {staticBlock}
      </section>
    </>
  );
}
