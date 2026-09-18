import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SimulationsSection from "@/components/SimulationsSection";
import IntuitionSection from "@/components/IntuitionSection";
import LoungeSection from "@/components/LoungeSection";
import EcologySection from "@/components/EcologySection";
import ContactSection from "@/components/ContactSection";
import SnapScroll from "@/components/SnapScroll";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

// Title and description come from the root layout; this only pins the
// canonical so the home page has one of its own, like the legal pages.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Header />
      <SnapScroll />
      <main>
        <Hero />
        <SimulationsSection />
        <IntuitionSection />
        <LoungeSection />
        <EcologySection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
