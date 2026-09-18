import type { Metadata } from "next";
import LegalPage, { Field, Section } from "@/components/LegalPage";
import { contact, legal, press, social } from "@/content/pitiusa";

export const metadata: Metadata = {
  title: "Mentions légales — Pitiusa Art Station",
  description:
    "Éditeur, directeur de la publication, hébergeur et propriété intellectuelle du site pitiusa.art.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegales() {
  const { publisher, host } = legal;

  return (
    <LegalPage
      title="Mentions légales"
      intro={`Informations légales relatives au site ${legal.domain}, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.`}
    >
      <Section title="Éditeur du site">
        <dl className="mt-1">
          <Field label="Dénomination" value={publisher.legalName} />
          <Field label="Forme juridique" value={publisher.legalForm} />
          <Field label="Capital social" value={publisher.capital} />
          <Field label="Immatriculation" value={publisher.registration} />
          <Field label="TVA intracommunautaire" value={publisher.vat} />
          <Field label="Siège social" value={publisher.address} />
          <Field label="Téléphone" value={publisher.phone} />
          <Field label="Courriel" value={contact.email} />
        </dl>
      </Section>

      <Section title="Directeur de la publication">
        <p>{publisher.publicationDirector}</p>
      </Section>

      <Section title="Hébergeur">
        <dl className="mt-1">
          <Field label="Hébergeur" value={host.name} />
          <Field label="Adresse" value={host.address} />
        </dl>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L&apos;ensemble du site — sa structure, ses textes, ses photographies, ses vidéos, ses
          illustrations, ses animations, ses logos et sa charte graphique — est protégé par le droit
          d&apos;auteur et le droit des marques. Tous droits réservés.
        </p>
        <p>
          Toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, par
          quelque procédé que ce soit et sur quelque support que ce soit, est interdite sans
          autorisation écrite préalable de l&apos;éditeur. Les dénominations « Pitiusa » et « Pitiusa
          Art Station », ainsi que le logo associé, ne peuvent être utilisés sans cette autorisation.
        </p>
        <p>
          Les marques et distinctions de tiers citées sur ce site — notamment «&nbsp;{press.mention}
          &nbsp;» de {press.outlet} — demeurent la propriété de leurs titulaires respectifs et ne
          sont reproduites qu&apos;à titre de référence.
        </p>
      </Section>

      <Section title="Liens">
        <p>
          Ce site renvoie vers le compte Instagram{" "}
          <a
            href={social.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-oak underline-offset-4 hover:underline"
          >
            {social.instagram.handle}
          </a>
          . L&apos;éditeur n&apos;exerce aucun contrôle sur le contenu des sites tiers vers lesquels
          des liens sont proposés et décline toute responsabilité quant à leur contenu.
        </p>
      </Section>

      <Section title="Responsabilité">
        <p>
          Les informations présentées sur ce site sont fournies à titre indicatif. Chaque Art Station
          étant construite sur commande, ses caractéristiques, ses matériaux et ses délais de
          fabrication sont susceptibles d&apos;évoluer d&apos;un exemplaire à l&apos;autre et ne
          constituent pas un engagement contractuel. Seule une proposition écrite fait foi.
        </p>
        <p>
          L&apos;éditeur s&apos;efforce de maintenir le site accessible et à jour, sans garantie
          d&apos;absence d&apos;interruption ou d&apos;erreur.
        </p>
      </Section>

      <Section title="Données personnelles">
        <p>
          Le traitement des données transmises via le formulaire de contact est décrit dans la{" "}
          <a
            href="/politique-de-confidentialite"
            className="text-oak underline-offset-4 hover:underline"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </Section>

      <Section title="Droit applicable">
        <p>
          Le présent site et les présentes mentions sont soumis au droit français. Tout litige
          relatif à leur interprétation ou à leur exécution relève des juridictions compétentes.
        </p>
      </Section>
    </LegalPage>
  );
}
