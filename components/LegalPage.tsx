import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

/**
 * The shell every text-only page sits in: the legal pages and the 404.
 *
 * Deliberately without `SnapScroll`. That component is mounted by the home
 * page alone, and it should stay that way — a page of running text wants
 * ordinary scrolling, and a stop every viewport would make it unreadable.
 */
export default function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="bg-white px-5 pb-16 pt-28 md:px-12 md:pb-24 md:pt-40">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-sm text-bone-dim transition-colors hover:text-oak"
          >
            ← Back to home
          </Link>

          <h1 className="mt-8 font-display text-[1.75rem] leading-tight text-bone sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-6 text-lg leading-relaxed text-bone-dim">{intro}</p>
          )}
          {updated && <p className="mt-4 text-sm text-bone-dim">Last updated: {updated}</p>}

          <div className="mt-10 flex flex-col gap-10 md:mt-14 md:gap-12">{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}

/** One numbered-feeling block of the document: a heading and its body. */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-snug text-bone md:text-3xl">{title}</h2>
      <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-bone-dim">
        {children}
      </div>
    </section>
  );
}

/**
 * A field of the publisher's identity. Anything still carrying the
 * `TO COMPLETE` marker from content/pitiusa.ts is shown in the accent
 * colour rather than quietly printed as if it were real: an unfinished
 * legal notice should look unfinished.
 */
export function Field({ label, value }: { label: string; value: string }) {
  const pending = value.startsWith("TO COMPLETE");
  return (
    <div className="flex flex-col gap-1 border-b border-brass-dim/60 py-3 sm:flex-row sm:gap-6">
      <dt className="shrink-0 text-sm uppercase tracking-[0.12em] text-bone sm:w-56">{label}</dt>
      <dd className={pending ? "text-oak" : "text-bone-dim"}>{value}</dd>
    </div>
  );
}
