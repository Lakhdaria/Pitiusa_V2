import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { contact } from "@/content/pitiusa";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[70svh] items-center bg-white px-5 pb-16 pt-28 md:px-12 md:pb-24 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-oak">Error 404</p>
          <h1 className="mt-6 font-display text-[1.75rem] leading-tight text-bone sm:text-4xl md:text-5xl">
            This page does not exist
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone-dim">
            The link may be an old one, or the address may carry a typo.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <Link
              href="/"
              className="font-display text-lg text-oak transition-colors hover:text-bone"
            >
              Back to home
            </Link>
            <a
              href={`mailto:${contact.email}`}
              className="text-base text-bone-dim transition-colors hover:text-oak"
            >
              Write to us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
