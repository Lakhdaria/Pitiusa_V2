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

// Over the full-bleed photo…
const IMAGE_LINE = "Progress does not happen by chance. It is born from curiosity.";
// …and above the cards once it has pulled back.
const CARDS_HEADING = "Behind every innovation lies an intuition";
const RING_HEADING = ["Combining hand made", "with high-end technology"];
const RING_TEXT =
  "Pitiusa offers the highest performing technological specificities to ensure a full immersive experience.";
const FINAL_TEXT =
  "Because true luxury does not lie in accessing what everyone desires. It lies in experiencing that exits only once. For you.";
const FINAL_WORDS = FINAL_TEXT.split(" ");

// The four icons carried over from the previous section: these are the
// ones that fall from the sky.
const JOINERS = ["plane", "helicopter", "car", "drone"] as const;
// Top-to-bottom order of the staging column, and therefore the order of
// the train that runs out of it. The four older icons drop in from above
// first, the four cards fold in underneath them.
// Release order: the four older icons first, the four cards after.
const COLUMN_ORDER = ["plane", "helicopter", "car", "drone", "meditation", "media", "education", "more"];
// Where the train joins the circle, and how far each badge rides before
// stopping. The leader goes all the way round, each following one stops a
// slot earlier — which is what fills the circle evenly from a single
// entry point. Final angles fall back out of this: -90 + arc.
// Enters on the left, mid-height: far enough below the top edge that the
// drop onto it is a real fall on screen, unlike an entry at the top of the
// ellipse where there is barely any distance to cover.
const ENTRY_ANGLE = 180;
const ARCS = [337.5, 292.5, 247.5, 202.5, 157.5, 112.5, 67.5, 22.5];

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
  zoom: 108, // pulls back, then rides up and out
  cards: 146, // heading and cards arrive
  read: 70, // held still, time to read them
  morph: 130, // the older icons fall in, the cards fold into the column
  ring: 120, // the column runs out onto the circle like a train
  spin: 146, // the circle holds and floats; the closing copy appears
  reveal: 130, // copy out, cockpit in, the circle widens around it
  final: 168, // badges out, cockpit grows, closing line written
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

    // --- The circuit --------------------------------------------------
    // No global rotation: once the circuit has filled the circle, the
    // badges hold their places. From there they only drift and lean to
    // the cursor.
    const spin = 0;
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
    // One badge at a time, each doing the full circuit: it drops in at the
    // entry point on the left, rides round the ellipse, and parks. The
    // staging column is gone — with eight slots spread over the viewport
    // height, most badges had almost no distance to fall and the drop
    // never read as one.
    const U = span(p, AT.read, AT.ring);
    const SLOT_W = 0.115; // one badge's whole sequence
    const SLOT_GAP = 0.105; // …and the wait before the next is released

    const next: Base[] = [];

    experiences.forEach((experience, i) => {
      const card = cardRefs.current[i];
      if (!card) return;
      // Mirror of the first set: these come in from off the left-hand end
      // of the row, the rightmost card released first and crossing the
      // whole row, each later one stopping short of it. The offset is a
      // whole number of slots so the travel distances differ and the order
      // reads; a fixed nudge would look like four cards twitching.
      const slotW = (card.offsetWidth || 0) + 16;
      const enter = ease(clamp((u2 - 0.3 - (experiences.length - 1 - i) * 0.16) / 0.15));
      card.style.transform = `translate3d(${(-(1 - enter) * (i + 1) * slotW).toFixed(1)}px, 0, 0)`;
      // Cut as its own badge is released — the icon reads as having left
      // the card. The cards go after the four older icons, so their
      // release slots are 4 to 7.
      const st = (i + 4) * SLOT_GAP;
      card.style.opacity = `${enter * (1 - clamp((U - st) / 0.05))}`;
    });

    COLUMN_ORDER.forEach((key, k) => {
      const cardIndex = experiences.findIndex((e) => e.icon === key);
      const isCard = cardIndex !== -1;
      const el = isCard
        ? movingRefs.current[cardIndex]
        : joinerRefs.current[JOINERS.indexOf(key as (typeof JOINERS)[number])];
      if (!el) return;

      const t = clamp((U - k * SLOT_GAP) / SLOT_W);
      const entry = ringPos(ENTRY_ANGLE);

      // Falls onto the entry point: accelerating, then eased over the last
      // stretch with a short damped rebound, so it settles rather than
      // stopping dead at full speed.
      const f = clamp(t / 0.34);
      const fall = f < 0.8 ? f * f : 0.64 + 0.36 * (1 - Math.pow(1 - (f - 0.8) / 0.2, 2));
      const rebound = f > 0.84 && f < 1 ? -12 * Math.sin(((f - 0.84) / 0.16) * Math.PI) : 0;

      // Then rides the circuit. The leader goes furthest round and each
      // follower stops a slot earlier, so the circle fills from a single
      // entry point — and since the next badge is only released once this
      // one has parked, they never share the track.
      const ride = ease(clamp((t - 0.34) / 0.66));
      const travelled = ARCS[k] * ride;
      const onPath = ringPos(ENTRY_ANGLE + travelled);

      const x = ride > 0 ? onPath.x : entry.x;
      const y = ride > 0 ? onPath.y : -BADGE + (entry.y + BADGE) * fall + rebound;

      el.style.opacity = `${t > 0 ? 1 - badgesOut : 0}`;
      next.push({
        el,
        x: x - BADGE / 2,
        y: y - BADGE / 2,
        w: BADGE,
        h: BADGE,
        r: BADGE / 2,
        // Turns as it travels, so the circuit reads as rolling rather than
        // sliding, then straightens up over the last stretch so it parks
        // upright instead of keeping the angle it arrived at.
        rot: travelled * (1 - clamp((ride - 0.8) / 0.2)) + spin,
      });
    });

    bases.current = next;
    // Only once the wheel has come to rest does the idle motion take over.
    // The idle drift takes over as soon as the last badge has parked.
    floatAmount.current = ease(clamp(u5 / 0.15));

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
        {CARDS_HEADING}
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
        className="relative hidden h-[1218svh] md:-mt-[100svh] md:block"
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
              {IMAGE_LINE}
            </h2>
          </div>

          <div ref={bottomRef} className="absolute inset-x-0 bottom-[4svh] px-6 md:px-12">
            <h2
              ref={headingRef}
              className="mx-auto max-w-4xl text-center font-display text-3xl leading-tight text-bone lg:text-5xl"
              style={{ opacity: 0 }}
            >
              {CARDS_HEADING}
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
          {IMAGE_LINE}
        </p>
        {staticBlock}
      </section>
    </>
  );
}
