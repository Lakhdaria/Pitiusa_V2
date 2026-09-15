"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";
import { Flower2, Clapperboard, GraduationCap, Sparkles } from "lucide-react";
import { experiences, type Experience } from "@/content/experiences";
import { usePinnedProgress } from "@/lib/usePinnedProgress";
import { useReducedMotion } from "@/lib/useReducedMotion";

const icons = {
  meditation: Flower2,
  media: Clapperboard,
  education: GraduationCap,
  more: Sparkles,
};

const INTRO = "Behind every innovation lies an intuition";
const HEADING = "Progress does not happen by chance. It is born from curiosity.";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

// How far the image pulls back once fully zoomed out. Top and sides are
// fixed viewport units; the bottom inset is *measured* from the heading and
// cards that move into that space — a hard-coded value only holds until a
// caption wraps onto one more line, and then the text sits on the photo.
const INSET = { top: 4, side: 5 };
const BOTTOM_GAP = 40;

function ExperienceCard({ experience }: { experience: Experience }) {
  const Icon = icons[experience.icon];
  return (
    <div className="flex h-full flex-col items-center gap-2 rounded-2xl border-2 border-brass-dim/70 bg-ink px-4 py-5 text-center transition-colors duration-300 hover:border-oak">
      <Icon className="h-6 w-6 shrink-0 text-oak" strokeWidth={1.25} />
      <h3 className="font-display text-xs uppercase tracking-[0.18em] text-bone">{experience.title}</h3>
      <p className="text-sm leading-snug text-bone-dim">{experience.summary}</p>
    </div>
  );
}

export default function IntuitionSection() {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLHeadingElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const onProgress = useCallback((p: number) => {
    const vh = window.innerHeight;

    // The opening line goes first, well before the image has finished
    // pulling back — it belongs to the full-bleed shot, not to the layout
    // that replaces it.
    if (introRef.current) {
      introRef.current.style.opacity = `${clamp(1 - p / 0.1)}`;
    }

    // Two chained moves on the same photo: it first pulls back from
    // full-bleed into a framed plate (zoom), then keeps shrinking as it
    // rides up and out of the viewport (exit), handing the screen over to
    // the heading and the cards.
    const zoom = ease(clamp((p - 0.06) / 0.34));
    const exit = ease(clamp((p - 0.38) / 0.16));

    const blockH = bottomRef.current?.offsetHeight ?? 0;
    const bottomInset = zoom * (blockH + BOTTOM_GAP);
    const topInset = zoom * INSET.top * 0.01 * vh;

    if (frameRef.current) {
      const f = frameRef.current;
      f.style.top = `${topInset}px`;
      f.style.bottom = `${bottomInset}px`;
      f.style.left = `${zoom * INSET.side}vw`;
      f.style.right = `${zoom * INSET.side}vw`;
      f.style.borderRadius = `${zoom * 28}px`;
      // Travel far enough to clear its own height plus its top offset, so
      // nothing of it is left peeking at the top edge when exit hits 1.
      const frameH = vh - topInset - bottomInset;
      f.style.transform = `translate3d(0, ${(-exit * (frameH + topInset + 24)).toFixed(1)}px, 0)`;
      f.style.opacity = `${1 - exit}`;
      // Opacity alone leaves a fully transparent, full-width layer sitting
      // over the section; take it out of the compositor entirely once it's
      // done so nothing of it can show through or catch a pointer.
      f.style.visibility = exit > 0.995 ? "hidden" : "visible";
    }
    if (imageRef.current) {
      // The frame shrinking would crop the shot tighter on its own, which
      // reads as a zoom *in*. Scaling the photo down inside it at the same
      // time is what actually pulls the subject back — and it keeps going
      // through the exit, so the image is still receding as it leaves.
      imageRef.current.style.transform = `scale(${(1.18 - zoom * 0.18 - exit * 0.14).toFixed(3)})`;
    }

    // As the photo clears out, the heading and cards rise from the bottom
    // strip they were confined to and settle in the middle of the screen.
    if (bottomRef.current) {
      const shift = exit * Math.max(0, (vh - blockH) / 2 - 0.04 * vh);
      bottomRef.current.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
    }

    if (headingRef.current) {
      const a = ease(clamp((p - 0.46) / 0.1));
      headingRef.current.style.opacity = `${a}`;
      headingRef.current.style.transform = `translate3d(0, ${((1 - a) * 24).toFixed(1)}px, 0)`;
    }

    experiences.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      // Strictly sequential: each card's window is shorter than the gap
      // between two starts, which is what makes the four read as arriving
      // one after another from the left. A window wider than the stagger
      // would have them all fading up together.
      const a = ease(clamp((p - 0.6 - i * 0.09) / 0.09));
      el.style.opacity = `${a}`;
      el.style.transform = `translate3d(${((1 - a) * -60).toFixed(1)}px, 0, 0)`;
    });
  }, []);

  const wrapperRef = usePinnedProgress<HTMLElement>({ onProgress, disabled: reduced });

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
        <h2 className="mx-auto mt-16 max-w-4xl text-center font-display text-3xl leading-tight text-bone md:text-5xl">
          {HEADING}
        </h2>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 md:grid-cols-4">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.slug} experience={experience} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="intuition" ref={wrapperRef} className="relative hidden h-[320svh] bg-white md:block">
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          <div ref={frameRef} className="absolute inset-0 overflow-hidden">
            {/* The photo is a layer of its own inside the frame so the two
                can move independently: the frame defines the window, the
                layer inside it does the zooming. */}
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

            <h2
              ref={introRef}
              className="pointer-events-none absolute left-6 top-28 max-w-2xl font-display text-4xl leading-[1.05] md:left-12 md:top-40 md:text-6xl"
              style={{
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
        <h2 className="mt-14 font-display text-2xl leading-tight text-bone">{HEADING}</h2>
        <div className="mt-8 flex flex-col gap-5">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.slug} experience={experience} />
          ))}
        </div>
      </section>
    </>
  );
}
