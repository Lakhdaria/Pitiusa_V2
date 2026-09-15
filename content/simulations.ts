export type SimulationIcon = "plane" | "helicopter" | "car" | "drone";

export type Simulation = {
  slug: string;
  title: string;
  icon: SimulationIcon;
  summary: string;
};

export const simulations: Simulation[] = [
  {
    slug: "airplane",
    title: "Airplane",
    icon: "plane",
    summary: "Pilot a Cessna or a commercial aircraft across iconic landscapes from around the world.",
  },
  {
    slug: "helicopter",
    title: "Helicopter",
    icon: "helicopter",
    summary:
      "Fly across open skies — the Grand Canyon, Manhattan, the French Alps or any landscape worldwide.",
  },
  {
    slug: "race-cars",
    title: "Race Cars",
    icon: "car",
    summary: "Take the wheel on legendary circuits, with force feedback restoring every g in real time.",
  },
  {
    slug: "drone",
    title: "Drone",
    icon: "drone",
    summary:
      "Embark on 360° drone videography across the world, through virtual reality and eye tracking.",
  },
];
