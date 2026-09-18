import { Plane, Helicopter, Car, Drone } from "lucide-react";
import type { Simulation } from "@/content/simulations";

const icons = {
  plane: Plane,
  helicopter: Helicopter,
  car: Car,
  drone: Drone,
};

export default function SimulationCard({ simulation }: { simulation: Simulation }) {
  const Icon = icons[simulation.icon];

  return (
    <div className="card-root flex h-full w-full items-center justify-center rounded-2xl border-2 border-brass-dim/70 bg-ink px-6 py-8 text-center sm:px-7 sm:py-10 transition-all duration-300 hover:border-oak hover:shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
      <div className="card-inner flex flex-col items-center justify-center gap-2 sm:gap-4">
        <Icon className="card-icon h-7 w-7 shrink-0 text-oak sm:h-10 sm:w-10" strokeWidth={1.25} />
        <h3 className="card-title font-display text-[0.7rem] uppercase tracking-[0.12em] text-bone sm:text-base sm:tracking-[0.18em]">
          {simulation.title}
        </h3>
        <p className="card-summary max-w-xs text-[0.72rem] leading-snug text-bone-dim sm:text-base sm:leading-relaxed">
          {simulation.summary}
        </p>
      </div>
    </div>
  );
}
