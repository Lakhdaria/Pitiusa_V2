export const product = {
  editionSize: "cinq exemplaires",
  buildTime: "environ six mois",
  materials: "chêne français tricentenaire et frêne centenaire",
  // The same three facts for the English chrome — the footer and anything
  // else written in English. Kept beside the French so the two can't drift.
  editionSizeEn: "five pieces",
  buildTimeEn: "About six months",
  materialsEn: "Three-hundred-year-old French oak and century-old ash",
};

export const uses = [
  {
    title: "Aviation",
    text: "Des premiers commandes d'un petit monomoteur jusqu'au pilotage d'un long-courrier, une progression construite sur les mêmes bases théoriques qu'une formation de pilote : conditions météorologiques dégradées, panne moteur, missions de sécurité en montagne ou en mer.",
  },
  {
    title: "Automobile",
    text: "Le retour de force reproduit le mouvement, les g et les conditions de piste en temps réel, validé par des pilotes professionnels. L'ensemble des circuits et championnats du monde automobile sont accessibles, sans exclusive.",
  },
  {
    title: "Configuration modulaire",
    text: "Le poste de pilotage se transforme : la configuration course s'efface pour laisser place à un poste aviation complet, manche, palonniers et collectif compris.",
  },
  {
    title: "Vie à bord",
    text: "Un film, un livre audio, une séance de méditation, ou un catalogue de jeux éducatifs pour les plus jeunes — l'Art Station reste un lieu que l'on habite au-delà du pilotage.",
  },
];

export const founder = {
  name: "Vincent Marre",
  quote:
    "Pendant des décennies, le piano à queue a représenté le sommet de la présence à bord. Il était beau, il marquait les esprits, il rassemblait. Pitiusa est cet objet pour une nouvelle génération — mais au lieu d'écouter, on y participe, et on y apprend.",
  bio: [
    "Ancien actuaire, Vincent Marre a conçu et développé Pitiusa seul, sans financement extérieur, à partir du printemps 2020, avant de s'y consacrer pleinement.",
    "Chaque Art Station est construite intégralement sur commande par un réseau d'artisans et d'ingénieurs français, sans les économies d'échelle de la production de série. Le choix des bois, les finitions et la configuration intérieure sont propres à chaque exemplaire.",
    "« Nous aurions pu aller plus vite et produire davantage. Mais Pitiusa n'est pas un produit. C'est un objet qui a sa propre vie. »",
  ],
};

export const press = {
  outlet: "Robb Report",
  mention: "Best of the Best 2025",
  quote: "une véritable œuvre d'art",
};

export const contact = {
  email: "contact@pitiusa.art",
  cta: "Demander une visite privée",
  location: "Monaco",
};

export const social = {
  instagram: {
    handle: "@pitiusa.art",
    url: "https://www.instagram.com/pitiusa.art/",
  },
};

/**
 * The publisher's identity, as it has to appear in the legal notice and the
 * privacy policy.
 *
 * ⚠️ The values marked `TO COMPLETE` are the only information nobody but you
 * can supply. While they are here the legal pages print them as they are —
 * visibly unfinished rather than plausibly wrong. Search this file for
 * `TO COMPLETE` before going live; nothing else needs touching.
 */
export const legal = {
  siteName: "Pitiusa Art Station",
  domain: "pitiusa.art",
  url: "https://pitiusa.art",
  // The year the © runs from.
  since: 2020,

  publisher: {
    legalName: "TO COMPLETE — registered company name",
    legalForm: "TO COMPLETE — legal form (SAS, SARL, SAM…)",
    capital: "TO COMPLETE — share capital",
    registration: "TO COMPLETE — company number and registry (RCS / RCI)",
    vat: "TO COMPLETE — EU VAT number",
    address: "TO COMPLETE — registered office address",
    phone: "TO COMPLETE — telephone (or delete this line)",
    // The publication director: a named individual, not the company.
    publicationDirector: "TO COMPLETE — name of the publication director",
  },

  // The site's host, which French law (LCEN, art. 6) requires to be named.
  host: {
    name: "TO COMPLETE — hosting provider (Vercel, OVH, Scaleway…)",
    address: "TO COMPLETE — hosting provider's address",
    url: "",
  },

  // Where data-protection requests are answered. The site's contact address
  // will do until there is a reason for a separate one.
  dpoEmail: "contact@pitiusa.art",
};
