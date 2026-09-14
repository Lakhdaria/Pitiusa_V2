import Image from "next/image";
import Reveal from "./Reveal";
import Parallax from "./Parallax";
import { uses } from "@/content/pitiusa";

const images = [
  { src: "/images/interior-side-v2.jpg", alt: "Vue de profil de la Pitiusa Art Station dans un séjour" },
  { src: "/images/cockpit-top-v2.jpg", alt: "Vue de dessus du poste de pilotage, volant et écran incurvé" },
  { src: "/images/chassis-top.jpg", alt: "Structure interne modulaire de la Pitiusa Art Station" },
  { src: "/images/loft-aerial-v2.jpg", alt: "La Pitiusa Art Station vue de haut dans un loft baigné de lumière" },
];

export default function UsesSection() {
  return (
    <section className="relative bg-ink px-6 py-28 md:px-12 md:py-40">
      <Reveal>
        <h2 className="mx-auto max-w-2xl text-center font-display text-4xl leading-tight text-bone md:text-6xl">
          Une expérience, quatre visages.
        </h2>
      </Reveal>

      <div className="relative mx-auto mt-24 flex max-w-5xl flex-col gap-24 md:gap-32">
        {uses.map((use, i) => (
          <Reveal key={use.title} variant={i % 2 === 1 ? "right" : "left"}>
            <div
              className={`flex flex-col gap-8 md:gap-16 items-center ${
                i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              <Parallax
                strength={22}
                className="group relative aspect-[4/3] w-full overflow-hidden rounded-sm md:w-1/2"
              >
                <Image
                  src={images[i].src}
                  alt={images[i].alt}
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-brass-dim/0 transition-all duration-500 group-hover:ring-oak/40" />
              </Parallax>
              <div className="w-full md:w-1/2">
                <h3 className="font-display text-3xl text-bone md:text-4xl">{use.title}</h3>
                <p className="mt-4 max-w-md text-lg text-bone-dim">{use.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
