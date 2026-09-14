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
    <div className="card-root flex h-full w-full items-center justify-center rounded-2xl border-2 border-brass-dim/70 bg-ink px-6 py-8 text-center transition-all duration-300 hover:border-oak hover:shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
      <div className="card-inner flex flex-col items-center justify-center gap-3">
        <Icon className="card-icon h-8 w-8 shrink-0 text-oak" strokeWidth={1.25} />
        <h3 className="card-title font-display text-sm uppercase tracking-[0.18em] text-bone transition-opacity duration-300">
          {simulation.title}
        </h3>
        <p className="card-summary max-w-xs text-sm leading-relaxed text-bone-dim transition-opacity duration-300">
          {simulation.summary}
        </p>
      </div>
    </div>
  );
}
