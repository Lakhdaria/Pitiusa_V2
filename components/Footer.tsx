import Image from "next/image";
import Link from "next/link";
// No Instagram glyph: lucide dropped its brand icons, and redrawing someone
// else's logo to fill the gap is not something to do casually. The word and
// an outbound arrow say the same thing and suit the page's typography better.
import { ArrowUpRight, Mail } from "lucide-react";
import { contact, legal, press, product, social } from "@/content/pitiusa";

// Anchors that exist on the page as it is actually assembled in app/page.tsx.
// #presse and #histoire are deliberately absent: those sections are written
// but not mounted, and a footer link into nothing is worse than no link.
const discover = [
  { href: "/#art-station", label: "The Art Station" },
  { href: "/#intuition", label: "The intuition" },
  { href: "/#contact", label: "Private viewing" },
];

const informations = [
  { href: "/legal-notice", label: "Legal notice" },
  { href: "/privacy-policy", label: "Privacy policy" },
];

// The house column is facts, not links. `product` is written in French for
// the page's own copy, so the figures are pulled out of it rather than the
// sentences: a translated footer must not drift from the source of truth.
const house = [
  "Handmade in France",
  `Limited to ${product.editionSizeEn}`,
  `${product.buildTimeEn} to build`,
  product.materialsEn,
];

const heading = "font-display text-sm uppercase tracking-[0.18em] text-bone";
// `block py-2` below md is the touch target, not decoration: 17px of text
// with a 12px gap is well under what a thumb can hit reliably.
const item =
  "block py-2 text-sm leading-relaxed text-bone-dim transition-colors hover:text-oak md:py-0";

export default function Footer() {
  // Baked in at build time: this page is static, so the year advances the
  // next time the site is deployed.
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface px-5 pb-10 pt-12 md:px-12 md:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 border-t border-brass-dim pt-10 md:grid-cols-2 md:gap-12 md:pt-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="relative block h-9 w-[132px] overflow-hidden rounded-md">
              <Image
                src="/logo/pitiusa-box-white.png"
                alt="Pitiusa Art Station"
                fill
                sizes="132px"
                className="object-contain object-left"
              />
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-bone-dim">
              An Art Station shaped by hand in France. Between sculpture and experience — a category
              of object in its own right.
            </p>

            <div className="mt-7 flex flex-col gap-1 md:gap-3">
              <a
                href={`mailto:${contact.email}`}
                className="group inline-flex items-center gap-2.5 py-2 text-sm text-bone-dim transition-colors hover:text-oak md:py-0"
              >
                <Mail className="h-4 w-4 shrink-0 text-oak" strokeWidth={1.5} aria-hidden="true" />
                {contact.email}
              </a>
              <a
                href={social.instagram.url}
                target="_blank"
                // noopener because the new tab would otherwise get a handle
                // on this window; noreferrer keeps the referrer off.
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 py-2 text-sm text-bone-dim transition-colors hover:text-oak md:py-0"
              >
                <span>
                  Instagram <span className="text-bone-dim/80">{social.instagram.handle}</span>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-oak transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>

          {/* Discover */}
          <nav className="lg:col-span-3" aria-label="Site sections">
            <h2 className={heading}>Discover</h2>
            <ul className="mt-4 flex flex-col gap-0 md:mt-5 md:gap-3">
              {discover.map((link) => (
                <li key={link.href}>
                  {/* Plain anchors, not next/link: these carry a hash, and
                      letting the browser own them keeps the in-page scroll
                      working when the visitor is already on the home page. */}
                  <a href={link.href} className={item}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* The house */}
          <div className="lg:col-span-3">
            <h2 className={heading}>The house</h2>
            <ul className="mt-4 flex flex-col gap-0 md:mt-5 md:gap-3">
              {house.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-bone-dim">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-bone-dim">
              <span className="text-bone">{press.outlet}</span> — {press.mention}
            </p>
          </div>

          {/* Information */}
          <nav className="lg:col-span-2" aria-label="Legal information">
            <h2 className={heading}>Information</h2>
            <ul className="mt-4 flex flex-col gap-0 md:mt-5 md:gap-3">
              {informations.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={item}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${contact.email}`} className={item}>
                  Press
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-brass-dim pt-7 text-sm text-bone-dim md:flex-row md:items-center md:justify-between">
          <p>
            © {legal.since}–{year} {legal.siteName}. All rights reserved.
          </p>
          <p>
            Private viewings in {contact.location} · Made in France
          </p>
        </div>
      </div>
    </footer>
  );
}
