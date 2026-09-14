import Reveal from "./Reveal";
import ScrollColorText from "./ScrollColorText";
import { press } from "@/content/pitiusa";

export default function PressSection() {
  return (
    <section id="presse" className="relative bg-ink px-6 py-28 md:px-12 md:py-32">
      <Reveal variant="scale">
        <div className="relative mx-auto max-w-2xl border-t border-brass-dim/60 pt-12">
          <p className="text-base text-bone-dim">
            {press.outlet} — {press.mention}
          </p>
          <ScrollColorText
            text={`« ${press.quote} »`}
            className="quote mt-4 font-display text-3xl md:text-5xl"
          />
        </div>
      </Reveal>
    </section>
  );
}
