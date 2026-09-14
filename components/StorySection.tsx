import Image from "next/image";
import Reveal from "./Reveal";
import Parallax from "./Parallax";
import ScrollColorText from "./ScrollColorText";
import { founder } from "@/content/pitiusa";

export default function StorySection() {
  return (
    <section
      id="histoire"
      className="relative overflow-hidden bg-surface px-6 py-28 md:px-12 md:py-40"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-16 md:flex-row md:gap-20">
        <Reveal variant="left" className="w-full md:w-2/5">
          <Parallax strength={20} className="relative aspect-[3/4] w-full overflow-hidden">
            <Image
              src="/images/lounge-wood.jpg"
              alt="La Pitiusa Art Station dans le hall d'une résidence, sol en bois sombre"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </Parallax>
        </Reveal>

        <div className="w-full md:w-3/5">
          <Reveal variant="right">
            <ScrollColorText
              text={founder.quote}
              className="quote font-display text-3xl italic leading-snug md:text-5xl"
            />
            <p className="mt-5 text-base text-bone-dim">{founder.name}, fondateur</p>
          </Reveal>

          <div className="mt-12 flex flex-col gap-5">
            {founder.bio.map((paragraph, i) => (
              <Reveal key={i} delayMs={i * 80}>
                <p className="max-w-xl text-lg text-bone-dim">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
