"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Trimmed to what the page still contains. #anatomie is deliberately absent:
// on desktop that content lives inside the pinned sequence and has no
// scrollable anchor of its own, so the link would go nowhere.
// Rooted at `/`, not bare hashes: the header is on the legal pages too, and
// there a bare `#contact` points at an anchor that isn't on the document.
// With the leading slash the browser still treats it as an in-page scroll
// when the visitor is already on the home page.
const links = [
  { href: "/", label: "HOME" },
  { href: "/#art-station", label: "Features" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [past, setPast] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Once the header has been put away, scrolling back up no longer brings
  // it back on its own — the page stays clear and the bar only returns
  // when the tab below is tapped.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 24);
        if (!menuOpen) {
          setPast(y > 120);
        }
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Any downward move re-hides a header that was pulled open by the tab.
  useEffect(() => {
    if (!revealed) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY + 4) setRevealed(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealed]);

  const hidden = past && !revealed && !menuOpen;

  // Lock background scroll while the full-screen menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-1.5 z-50 flex justify-center px-4 transition-transform duration-500 ease-out md:top-2 ${
          hidden ? "-translate-y-[150%]" : "translate-y-0"
        }`}
      >
        <div
          className={`flex w-full max-w-3xl items-center justify-between rounded-2xl border px-4 py-1.5 backdrop-blur-xl transition-all duration-500 md:px-6 ${
            scrolled
              ? "border-brass-dim/50 bg-surface/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              : "border-brass-dim/25 bg-surface/35"
          }`}
        >
          <a href="/" className="relative block h-8 w-8 shrink-0 md:h-10 md:w-10">
            <Image
              src="/logo/PITUSA Art  Station_logo Circular C (2).png"
              alt="Pitiusa Art Station"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </a>

          <nav className="hidden md:flex gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-base text-bone-dim transition-colors hover:text-bone"
              >
                {link.label}
                <span className="absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-oak transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <button
            type="button"
            aria-label={menuOpen ? "Close the menu" : "Open the menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
          >
            <span
              className={`h-px w-5 bg-bone transition-transform duration-300 ${
                menuOpen ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-bone transition-opacity duration-300 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-px w-5 bg-bone transition-transform duration-300 ${
                menuOpen ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* The handle. Sibling of <header> for the same reason as the menu
          overlay below: the header carries a transform, which would make it
          the containing block for anything fixed inside it. */}
      <button
        type="button"
        aria-label="Show the menu"
        onClick={() => setRevealed(true)}
        className={`fixed left-1/2 top-0 z-50 flex h-6 w-14 -translate-x-1/2 items-end justify-center rounded-b-xl before:absolute before:-inset-x-3 before:top-0 before:h-11 before:content-[''] border border-t-0 border-brass-dim/40 bg-surface/70 pb-1 backdrop-blur-xl transition-all duration-300 ease-out ${
          hidden ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
          <path
            d="M1 1.5 7 6.5 13 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-bone-dim"
          />
        </svg>
      </button>

      {/* Rendered as a sibling of <header>, not a child: a transform on an
          ancestor (our hide/show translate) would otherwise turn it into
          the containing block for this fixed-position overlay, breaking
          full-viewport coverage. */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-center bg-ink/98 backdrop-blur-2xl transition-opacity duration-500 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col px-8">
          {links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`group flex items-baseline gap-4 border-b border-brass-dim/25 py-5 transition-all duration-500 ease-out ${
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: menuOpen ? `${150 + i * 90}ms` : "0ms" }}
            >
              <span className="font-display text-sm text-brass-dim">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-4xl text-bone transition-all duration-300 ease-out group-hover:translate-x-3 group-hover:text-oak group-active:translate-x-3 group-active:text-oak">
                {link.label}
              </span>
            </a>
          ))}
        </nav>

        <div
          className={`mt-16 px-8 transition-all duration-500 ease-out ${
            menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: menuOpen ? `${150 + links.length * 90 + 100}ms` : "0ms" }}
        >
          <p className="font-display text-lg text-bone">Pitiusa Art Station</p>
          <p className="mt-1 text-sm text-bone-dim">Made in France</p>
        </div>
      </div>
    </>
  );
}
