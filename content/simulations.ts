export type SimulationIcon = "plane" | "helicopter" | "car" | "drone";

export type Simulation = {
  slug: string;
  title: string;
  icon: SimulationIcon;
  summary: string;
};

const LOREM_SHORT =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis.";

export const simulations: Simulation[] = [
  {
    slug: "pilotage-avion",
    title: "Pilotage d'avion",
    icon: "plane",
    summary: LOREM_SHORT,
  },
  {
    slug: "pilotage-helicoptere",
    title: "Pilotage d'hélicoptère",
    icon: "helicopter",
    summary: LOREM_SHORT,
  },
  {
    slug: "course-automobile",
    title: "Course automobile",
    icon: "car",
    summary: LOREM_SHORT,
  },
  {
    slug: "vol-de-drone",
    title: "Vol de drone",
    icon: "drone",
    summary: LOREM_SHORT,
  },
];
