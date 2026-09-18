"use client";

import { useEffect } from "react";

/**
 * One gesture, one section.
 *
 * The page is a stack of tall pinned sections whose animations are driven by
 * scroll position. Left alone that takes dozens of wheel notches to get
 * through, so this takes over the wheel: each gesture glides to the next
 * section's anchor, and because the animations read the scroll position they
 * play out during the glide rather than being skipped.
 *
 * Anchors are the elements carrying `data-snap` — nothing is hard-coded here,
 * so adding or reordering a section needs no change in this file.
 *
 * Deliberately desktop-only: the pinned sections don't exist below `md`, the
 * mobile layout is an ordinary stacked page, and hijacking touch scrolling on
 * a normal page is a good way to make it feel broken.
 */

// Glide speed, in viewport heights per second, and the bounds it is clamped
// between. The animations play out *during* the glide, so this number is the
// playback speed of the choreography, not just a scroll convenience: a stop
// four viewports away is four viewports of animation, and covering it in a
// few hundred milliseconds means nobody sees it. Paced so a long act reads in
// a couple of seconds; the floor stops a short hop from being an instant jump,
// the ceiling stops the longest one from feeling stuck.
const SPEED_VH_PER_S = 1.3;
// The floor is what most single acts actually get: now that each one has a
// stop of its own, most hops are a single act of 80–130svh and would
// otherwise be governed entirely by the speed above. A second and a half is
// roughly how long it takes to look at something arriving and read a line
// under it.
const MIN_MS = 1150;
const MAX_MS = 3000;
// One physical gesture is a burst of events, not one event: a wheel notch
// fires several, and a trackpad flick fires a long inertial tail. This is
// the quiet period that separates two gestures.
const GESTURE_END_MS = 140;
// While the burst is still running, another advance is allowed only this
// often — the cadence for someone who keeps scrolling rather than flicking.
const REPEAT_MS = 430;
// …and not before the glide in flight has nearly played out, or a sustained
// scroll would stack hops on top of each other and the pacing above would
// count for nothing. This is how early the next one may start, so a continuous
// scroll stays continuous instead of stalling between acts.
const REPEAT_LEAD_MS = 140;
// …and only while the deltas are still at full strength. Nothing here
// compares a delta against a fixed threshold, because that number is exactly
// what changes with the pointer's sensitivity: a brisk wheel would clear any
// threshold several times over in one notch and skip three stops. What is
// compared is each delta against the burst's own peak, which is the same
// shape at any sensitivity — flat while the finger is pushing, decaying as
// soon as it lets go.
const SUSTAIN = 0.85;
// Once the deltas have decayed, a rise of this much means a hand has started
// pushing again — a fresh flick landing on top of the previous one's inertia.
// Without it that flick is mistaken for more of the old tail and swallowed,
// which is the "I had to scroll twice" case: the tail keeps firing events, so
// the quiet period that would have ended the gesture never arrives.
const REPUSH = 2.5;
// Two anchors closer together than this are the same place as far as a
// gesture is concerned. Left in, the first gesture creeps a few dozen pixels
// and looks like nothing happened.
const MIN_GAP_VH = 0.3;

// A short hop wants a snap: quick off the mark, quick to settle. A long one
// is a scene playing, and the same curve would rush its middle at twice the
// average speed — exactly where the animation is. So the further the travel,
// the flatter the curve through the middle.
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeFor = (distanceVh: number) =>
  distanceVh > 1.5 ? easeInOutSine : easeInOutCubic;

export default function SnapScroll() {
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let animating = false;
    // Where the current glide is headed. Used to recognise a gesture that
    // asks for the stop already being flown to, so it can be dropped rather
    // than queued behind it.
    let targetY = 0;
    let lastWheel = 0;
    let lastAdvance = 0;
    // When the current glide is due to finish, so a sustained
    // scroll can wait for it rather than talk over it.
    let glideEnds = 0;
    // A single pending advance: -1, 0 or 1. One deep on purpose — see `go`.
    let queued: -1 | 0 | 1 = 0;
    let peak = 0;
    let trough = 0;
    let decaying = false;
    let detach: (() => void) | null = null;

    const stops = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const list = Array.from(document.querySelectorAll<HTMLElement>("[data-snap]")).map((el) =>
        Math.round(Math.min(max, Math.max(0, el.getBoundingClientRect().top + window.scrollY)))
      );
      // The very top and the very bottom are stops too, or the first gesture
      // from the hero and the last one into the footer have nowhere to go.
      const sorted = Array.from(new Set([0, ...list, max])).sort((a, b) => a - b);

      // Collapse anchors that sit almost on top of each other, keeping the
      // later one so the bottom of the page always stays reachable.
      const minGap = window.innerHeight * MIN_GAP_VH;
      return sorted.reduce<number[]>((acc, y) => {
        const last = acc[acc.length - 1];
        if (acc.length > 1 && y - last < minGap) acc[acc.length - 1] = y;
        else acc.push(y);
        return acc;
      }, []);
    };

    const glideTo = (target: number) => {
      const from = window.scrollY;
      const distance = target - from;
      targetY = target;
      if (Math.abs(distance) < 2) {
        glideEnds = performance.now();
        return;
      }
      cancelAnimationFrame(raf);
      // A gesture that reaches this point is being acted on now, so whatever
      // was waiting is stale.
      queued = 0;

      const travelled = Math.abs(distance) / window.innerHeight;
      const duration = Math.min(
        MAX_MS,
        Math.max(MIN_MS, (travelled / SPEED_VH_PER_S) * 1000)
      );
      const ease = easeFor(travelled);
      const started = performance.now();
      glideEnds = started + duration;

      // The stylesheet asks for smooth scrolling, which would fight a
      // frame-by-frame animation — every scrollTo would start its own
      // easing. Off for the duration, back on afterwards so anchor links
      // keep their smooth behaviour.
      const root = document.documentElement;
      const previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      animating = true;

      const step = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        window.scrollTo(0, from + distance * ease(t));
        if (t < 1) {
          raf = requestAnimationFrame(step);
          return;
        }
        animating = false;
        root.style.scrollBehavior = previous;
        // A gesture arrived while this one was playing. Answer it now, so
        // the acts run back to back instead of the visitor having to ask
        // twice.
        if (queued !== 0) {
          const direction = queued;
          queued = 0;
          go(direction);
        }
      };
      raf = requestAnimationFrame(step);
    };

    const go = (direction: 1 | -1) => {
      const all = stops();
      // Measured from where the page actually is, never from where the glide
      // in flight is headed. Measured from the destination, gestures stack:
      // the second one aims past the stop being flown to, the third past
      // that, and three notches of a wheel carry you three acts downrange
      // without ever landing. From the live position the next stop down is
      // the one already being flown to…
      const y = window.scrollY;
      const next =
        direction > 0
          ? all.find((s) => s > y + 4)
          : [...all].reverse().find((s) => s < y - 4);
      if (next === undefined) return;
      // …so the gesture is held rather than obeyed, in a queue one deep.
      // Dropping it outright is what made a trackpad feel dead: a trackpad
      // gives one long gesture where a wheel gives a burst per notch, so a
      // swipe landing inside a glide was the whole swipe, and the visitor
      // had to make it again. Holding it keeps the acts running back to
      // back, while the depth of one is what stops three gestures from
      // carrying anyone three acts downrange. Turning back is answered at
      // once, because that resolves to a different stop.
      if (animating && next === targetY) {
        queued = direction;
        return;
      }
      glideTo(next);
    };

    const onWheel = (e: WheelEvent) => {
      // Leave zooming, and any scrollable panel that wants the event, alone.
      if (e.ctrlKey || e.defaultPrevented) return;
      // The full-screen menu locks the body; don't fight it.
      if (document.body.style.overflow === "hidden") return;

      e.preventDefault();
      const now = performance.now();
      const delta = Math.abs(e.deltaY);
      const gap = now - lastWheel;
      lastWheel = now;

      const advance = () => {
        peak = delta;
        trough = delta;
        decaying = false;
        lastAdvance = now;
        go(e.deltaY > 0 ? 1 : -1);
      };

      // A quiet stretch means the previous gesture is over, inertia included.
      if (gap > GESTURE_END_MS || lastAdvance === 0) {
        advance();
        return;
      }

      if (decaying) {
        trough = Math.min(trough, delta);
        // Climbing back out of the tail: a new push, so answer it.
        if (delta > trough * REPUSH && now - lastAdvance > 220) advance();
        return;
      }

      peak = Math.max(peak, delta);
      if (delta < peak * SUSTAIN) {
        // The tail has begun. From here events are swallowed until either a
        // quiet stretch or a fresh push.
        decaying = true;
        trough = delta;
        return;
      }
      // Still at full strength → a finger is still pushing. Answer it once the
      // act in flight has had its time.
      if (now - lastAdvance > REPEAT_MS && now >= glideEnds - REPEAT_LEAD_MS) advance();
    };

    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      // Never while someone is typing in the contact form.
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      // A held key auto-repeats every few dozen milliseconds, which would chain
      // stops far faster than they can play. One press, one stop; a deliberate
      // second press still works.
      if (e.repeat) {
        if (["ArrowDown", "PageDown", " ", "Spacebar", "ArrowUp", "PageUp"].includes(e.key))
          e.preventDefault();
        return;
      }
      const down = ["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key);
      const up = ["ArrowUp", "PageUp"].includes(e.key);
      if (!down && !up) return;
      e.preventDefault();
      go(down ? 1 : -1);
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      if (Math.abs(dy) > 40) go(dy > 0 ? 1 : -1);
    };

    const attach = () => {
      if (detach) return;
      // Not passive: the whole point is to take the gesture over.
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKey);
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      detach = () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchend", onTouchEnd);
        cancelAnimationFrame(raf);
        animating = false;
        document.documentElement.style.scrollBehavior = "";
        detach = null;
      };
    };

    const sync = () => {
      if (desktop.matches && !calm.matches) attach();
      else detach?.();
    };
    sync();
    desktop.addEventListener("change", sync);
    calm.addEventListener("change", sync);

    return () => {
      desktop.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
      detach?.();
    };
  }, []);

  return null;
}
