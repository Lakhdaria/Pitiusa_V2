import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/cormorant";
import "@fontsource-variable/cormorant/wght-italic.css";
import "./globals.css";
import ParticleField from "@/components/ParticleField";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  metadataBase: new URL("https://pitiusa.art"),
  title: "Pitiusa Art Station — L'objet qui redéfinit l'expérience à bord",
  description:
    "Pitiusa est une Art Station de luxe façonnée à la main en France, en chêne français tricentenaire et frêne centenaire. Une seule pièce, sur-mesure, pour résidences privées et superyachts.",
  openGraph: {
    title: "Pitiusa Art Station",
    description:
      "Une Art Station de luxe, façonnée à la main en France. Une nouvelle catégorie d'objet, entre sculpture et expérience.",
    url: "https://pitiusa.art",
    siteName: "Pitiusa Art Station",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitiusa Art Station",
    description:
      "Une Art Station de luxe, façonnée à la main en France. Une nouvelle catégorie d'objet, entre sculpture et expérience.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <ParticleField />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
