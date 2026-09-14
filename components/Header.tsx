"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const links = [
  { href: "#art-station", label: "L'Art Station" },
  { href: "#histoire", label: "Histoire" },
  { href: "#presse", label: "Presse" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          setScrolled(y > 24);
          if (!menuOpen) {
            if (y > lastY && y > 120) {
              setHidden(true);
            } else if (y < lastY) {
              setHidden(false);
            }
          }
          lastY = y;
          ticking = false;
        });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

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
        className={`fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-transform duration-500 ease-out md:top-6 ${
          hidden ? "-translate-y-[150%]" : "translate-y-0"
        }`}
      >
        <div
          className={`flex w-full max-w-3xl items-center justify-between rounded-2xl border px-5 py-3 backdrop-blur-xl transition-all duration-500 md:px-7 ${
            scrolled
              ? "border-brass-dim/50 bg-surface/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              : "border-brass-dim/25 bg-surface/35"
          }`}
        >
          <a href="#" className="relative block h-8 w-[124px] overflow-hidden rounded-md md:h-9 md:w-[140px]">
            <Image
              src="/logo/pitiusa-box-white.png"
              alt="Pitiusa Art Station"
              fill
              sizes="140px"
              className="object-contain object-left"
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
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
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
          <p className="mt-1 text-sm text-bone-dim">Fabriqué en France</p>
        </div>
      </div>
    </>
  );
}
