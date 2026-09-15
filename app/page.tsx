import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SimulationsSection from "@/components/SimulationsSection";
import IntuitionSection from "@/components/IntuitionSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SimulationsSection />
        <IntuitionSection />
      </main>
      <Footer />
    </>
  );
}
