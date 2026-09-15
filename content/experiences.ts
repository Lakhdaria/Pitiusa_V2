export type ExperienceIcon = "meditation" | "media" | "education" | "more";

export type Experience = {
  slug: string;
  title: string;
  icon: ExperienceIcon;
  summary: string;
};

export const experiences: Experience[] = [
  {
    slug: "meditation",
    title: "Meditation",
    icon: "meditation",
    summary: "Pilot a Cessna or a commercial aircraft across open skies, at your own pace.",
  },
  {
    slug: "media-content",
    title: "Media content",
    icon: "media",
    summary:
      "Fly across open skies — the Grand Canyon, Manhattan, the French Alps or any landscape worldwide.",
  },
  {
    slug: "educational-games",
    title: "Educational games",
    icon: "education",
    summary: "Learn to read a flight deck, a map and a horizon, one guided mission at a time.",
  },
  {
    slug: "and-more",
    title: "And more",
    icon: "more",
    summary: "Predefined routes and experiences designed for younger users.",
  },
];
