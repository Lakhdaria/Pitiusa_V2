import Link from "next/link";
import { company, social } from "@/content/pitiusa";

// Instagram dropped out of lucide with the rest of its brand icons. Drawn
// here rather than imported: the glyph is a rounded square, a circle and a
// dot, and it is the one mark the footer is asked for by name.
function InstagramMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-surface px-5 pb-10 pt-12 md:px-12 md:pt-16">
      <div className="mx-auto max-w-5xl border-t border-brass-dim pt-10 text-center">
        <a
          href={social.instagram.url}
          target="_blank"
          // noopener because the new tab would otherwise get a handle on this
          // window; noreferrer keeps the referrer off.
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-2 text-bone transition-colors hover:text-oak"
        >
          <InstagramMark className="h-6 w-6" />
          <span className="sr-only">Instagram {social.instagram.handle} (opens in a new tab)</span>
        </a>

        <address className="mt-7 not-italic leading-relaxed text-bone-dim">
          <span className="block font-display tracking-[0.12em] text-bone">{company.name}</span>
          {company.addressLines.map((line) => (
            <span key={line} className="block text-sm">
              {line}
            </span>
          ))}
          <a
            href={`tel:${company.phoneHref}`}
            className="mt-1 inline-block py-1 text-sm transition-colors hover:text-oak"
          >
            {company.phone}
          </a>
        </address>

        <p className="mt-7">
          <Link
            href="/privacy-policy"
            className="inline-block py-1 text-sm text-bone-dim transition-colors hover:text-oak"
          >
            Privacy Policy
          </Link>
        </p>

        <p className="mt-6 text-sm leading-relaxed text-bone-dim">
          © All rights reserved.
          <span className="block">Reproduction in whole or in part is prohibited.</span>
        </p>
      </div>
    </footer>
  );
}
