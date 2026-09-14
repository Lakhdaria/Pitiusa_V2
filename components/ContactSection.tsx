import Reveal from "./Reveal";
import { contact, product } from "@/content/pitiusa";

export default function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-surface px-6 py-28 md:px-12 md:py-40">
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-oak/10 blur-[140px]" />

      <Reveal>
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-display text-4xl leading-tight text-bone md:text-6xl">
            Visites privées à {contact.location}.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-bone-dim">
            Chaque Pitiusa est construite intégralement sur commande, en
            {" "}{product.buildTime}. La première édition est limitée à{" "}
            {product.editionSize}.
          </p>
          <p className="mt-6 max-w-xl text-lg text-bone-dim">
            Pour une visite privée, une demande presse ou toute autre
            question, écrivez-nous à{" "}
            <a
              href={`mailto:${contact.email}`}
              className="text-oak hover:text-bone transition-colors"
            >
              {contact.email}
            </a>
            .
          </p>
        </div>
      </Reveal>
    </section>
  );
}
