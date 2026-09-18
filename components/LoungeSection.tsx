"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { usePinnedProgress } from "@/lib/usePinnedProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";
import SnapMarks from "./SnapMarks";

// Two beats over the photo: the claim, then what it resolves into.
const LINES = ["Pitiusa reminds how great ideas are born", "How excellence is built"];

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

// Budgeted in svh, like the other pinned sections: the 0–1 boundaries are
// derived from these, so the pace is one number to change. The two lines get
// a budget each rather than sharing a `hold`: as one act they were crossed
// in a single gesture, and the first line was only ever seen in passing.
const PHASES = {
  appear: 20, // the photo takes over
  line1: 90, // the claim
  line2: 90, // …and what it resolves into
  zoom: 110, // pulls back, then rides up and out
};
const TOTAL = Object.values(PHASES).reduce((a, b) => a + b, 0);
const AT = {
  appear: PHASES.appear / TOTAL,
  line1: (PHASES.appear + PHASES.line1) / TOTAL,
  line2: (PHASES.appear + PHASES.line1 + PHASES.line2) / TOTAL,
};

// A stop per line, so each one is read standing still.
const SNAP_AT = [PHASES.appear + PHASES.line1, PHASES.appear + PHASES.line1 + PHASES.line2];

export default function LoungeSection() {
  const reduced = useReducedMotion();
  const stickyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const onProgress = useCallback((p: number) => {
    const sticky = stickyRef.current;
    if (!sticky) return;
    const sh = sticky.offsetHeight;

    // The second line replaces the first rather than joining it, and both
    // clear together once the photo starts pulling back. The swap happens at
    // the very start of `line2`, so the gesture that crosses into it lands
    // with the new line already up and held for the rest of its budget.
    const swapSpan = (AT.line2 - AT.line1) * 0.3;
    const lineOut = 1 - span(p, AT.line2, AT.line2 + 0.02);
    const secondIn = span(p, AT.line1, AT.line1 + swapSpan);
    [span(p, AT.appear * 0.4, AT.appear) * (1 - secondIn), secondIn].forEach((a, i) => {
      const el = lineRefs.current[i];
      if (el) el.style.opacity = `${a * lineOut}`;
    });

    // Same exit as the hero and the intuition photo: pull back into a
    // smaller plate, then ride up and out of the viewport.
    const u = span(p, AT.line2, 1);
    const zoom = ease(Math.min(1, u / 0.55));
    const exit = ease(clamp((u - 0.45) / 0.55));

    if (frameRef.current) {
      const f = frameRef.current;
      const topInset = zoom * 0.04 * sh;
      const bottomInset = zoom * 0.28 * sh;
      f.style.top = `${topInset.toFixed(1)}px`;
      f.style.bottom = `${bottomInset.toFixed(1)}px`;
      f.style.left = `${(zoom * 5).toFixed(2)}vw`;
      f.style.right = `${(zoom * 5).toFixed(2)}vw`;
      const frameH = sh - topInset - bottomInset;
      f.style.transform = `translate3d(0, ${(-exit * (frameH + topInset + 24)).toFixed(1)}px, 0)`;
      f.style.opacity = `${span(p, 0, AT.appear) * (1 - exit)}`;
      f.style.visibility = exit > 0.995 ? "hidden" : "visible";
    }
    if (imageRef.current) {
      // Never below 1: under that the photo stops covering its rounded
      // window and its own square corners show against the white mount.
      imageRef.current.style.transform = `scale(${Math.max(
        1,
        1.16 - zoom * 0.16 - exit * 0.1
      ).toFixed(3)})`;
    }
  }, []);

  const wrapperRef = usePinnedProgress<HTMLElement>({ onProgress, disabled: reduced });

  const photo = (
    <Image
      src="/images/lounge-side-v2.jpg"
      alt="Pitiusa Art Station dans un salon"
      fill
      sizes="100vw"
      className="object-cover"
    />
  );

  if (reduced) {
    return (
      <section className="relative px-6 py-24 md:px-12 md:py-32">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px]">{photo}</div>
        <p
          className="mt-10 font-display text-3xl leading-[1.05] md:text-5xl"
          style={{ fontVariationSettings: "'wght' 380", color: "#3d2410" }}
        >
          {/* Stacked, not joined with a comma: the second line opens with a
              capital, so run together they read as one broken sentence. */}
          {LINES.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </section>
    );
  }

  return (
    <>
      {/* Pulled up by one viewport, like the section before it: a pinned
          section releases the moment its progress hits 1, but the next one
          only pins once its own top edge reaches the top of the viewport —
          a full screen of scrolling later, with nothing on it. The tail it
          covers here has already faded out. */}
      <section
        ref={wrapperRef}
        data-snap
        className="relative hidden md:-mt-[100svh] md:block"
        style={{ height: `${TOTAL + 100}svh` }}
      >
        <SnapMarks at={SNAP_AT} />
        <div ref={stickyRef} className="sticky top-0 h-svh w-full overflow-hidden">
          <div
            ref={frameRef}
            className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] md:rounded-[2.5rem] md:p-5"
            style={{ opacity: 0 }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] md:rounded-[1.75rem]">
              <div ref={imageRef} className="absolute inset-0" style={{ transform: "scale(1.16)" }}>
                {photo}
              </div>
            </div>

            {/* An explicit width, not max-w: both lines are absolutely
                positioned now, so the heading has no in-flow content to
                size itself from — it collapsed to zero, and the text broke
                one word per line. */}
            <h2
              className="pointer-events-none absolute left-10 top-16 w-[min(40rem,72vw)] font-display text-4xl leading-[1.05] md:left-14 md:top-24 md:text-6xl"
              style={{
                fontVariationSettings: "'wght' 380",
                color: "#3d2410",
                textShadow: "0 2px 28px rgba(255,255,255,0.55), 0 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              {LINES.map((line, i) => (
                <span
                  key={line}
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0 w-full"
                  style={{ opacity: 0 }}
                >
                  {line}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </section>

      {/* Mobile: no pinning. */}
      <section className="relative px-6 py-20 md:hidden">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px]">{photo}</div>
        <p
          className="mt-8 font-display text-3xl leading-[1.05]"
          style={{ fontVariationSettings: "'wght' 380", color: "#3d2410" }}
        >
          {/* Stacked, not joined with a comma: the second line opens with a
              capital, so run together they read as one broken sentence. */}
          {LINES.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </section>
    </>
  );
}
