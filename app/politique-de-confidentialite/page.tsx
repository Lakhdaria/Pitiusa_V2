import type { Metadata } from "next";
import LegalPage, { Field, Section } from "@/components/LegalPage";
import { contact, legal } from "@/content/pitiusa";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Pitiusa Art Station",
  description:
    "Quelles données le site pitiusa.art collecte, pourquoi, combien de temps, et comment exercer vos droits.",
  alternates: { canonical: "/politique-de-confidentialite" },
};

// Kept next to the text it describes: change the retention here and the
// sentence follows. Three years from the last contact is the period the
// CNIL retains for commercial prospecting; shorten it if you prefer.
const RETENTION = "trois ans à compter du dernier échange";

export default function Confidentialite() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Ce site collecte le strict nécessaire pour répondre à vos demandes : ce que vous écrivez dans le formulaire de contact, et rien d'autre."
      updated="18 septembre 2026"
    >
      <Section title="En résumé">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Aucun cookie n&apos;est déposé, aucun traceur n&apos;est utilisé.</li>
          <li>Aucun outil de mesure d&apos;audience n&apos;est installé.</li>
          <li>
            Les polices de caractères sont servies depuis ce site, et non depuis un service tiers :
            afficher une page n&apos;envoie votre adresse IP à personne.
          </li>
          <li>
            Les seules données personnelles traitées sont celles que vous saisissez vous-même dans
            le formulaire de contact.
          </li>
        </ul>
      </Section>

      <Section title="Responsable du traitement">
        <dl className="mt-1">
          <Field label="Responsable" value={legal.publisher.legalName} />
          <Field label="Adresse" value={legal.publisher.address} />
          <Field label="Contact" value={legal.dpoEmail} />
        </dl>
      </Section>

      <Section title="Données collectées">
        <p>
          Le formulaire de contact recueille votre <strong className="text-bone">nom</strong>, votre{" "}
          <strong className="text-bone">adresse e-mail</strong>, votre{" "}
          <strong className="text-bone">numéro de téléphone</strong> si vous choisissez de le
          renseigner — ce champ est facultatif — et le{" "}
          <strong className="text-bone">contenu de votre message</strong>.
        </p>
        <p>
          Aucune autre donnée n&apos;est demandée, et aucune n&apos;est collectée à votre insu en
          naviguant sur le site.
        </p>
      </Section>

      <Section title="Finalité et base légale">
        <p>
          Ces données servent uniquement à traiter votre demande et à y répondre : organiser une
          visite privée, répondre à une sollicitation presse, ou toute autre question que vous nous
          adressez.
        </p>
        <p>
          La base légale est l&apos;exécution de mesures précontractuelles prises à votre demande
          (article 6.1.b du RGPD) et, pour les demandes qui n&apos;ont pas d&apos;objet contractuel,
          notre intérêt légitime à répondre aux personnes qui nous écrivent (article 6.1.f).
        </p>
      </Section>

      <Section title="Destinataires">
        <p>
          Vos messages sont reçus par l&apos;éditeur du site et ne sont transmis à aucun tiers à des
          fins commerciales. Ils ne sont ni vendus, ni loués, ni échangés.
        </p>
        <p>
          L&apos;acheminement des e-mails est confié à <strong className="text-bone">Resend</strong>,
          prestataire technique agissant en qualité de sous-traitant au sens du RGPD. L&apos;
          hébergement du site est assuré par {legal.host.name}.
        </p>
      </Section>

      <Section title="Durée de conservation">
        <p>
          Les messages reçus et les coordonnées qui les accompagnent sont conservés {RETENTION}, puis
          supprimés. Si un échange aboutit à une commande, les documents correspondants sont
          conservés pendant les durées légales applicables en matière comptable et commerciale.
        </p>
      </Section>

      <Section title="Protection contre les envois abusifs">
        <p>
          Pour empêcher l&apos;envoi automatisé de messages en masse, le serveur retient brièvement
          l&apos;adresse IP à l&apos;origine de chaque envoi. Cette information reste en mémoire vive
          une dizaine de minutes, le temps de compter les envois récents ; elle n&apos;est écrite sur
          aucun disque, n&apos;est jamais associée au contenu des messages et disparaît au
          redémarrage du serveur.
        </p>
        <p>
          Le formulaire comporte également un champ invisible que seuls les robots remplissent. Il ne
          collecte rien vous concernant.
        </p>
      </Section>

      <Section title="Cookies et mesure d'audience">
        <p>
          Ce site ne dépose aucun cookie, n&apos;utilise ni pixel de suivi, ni service de statistiques,
          et ne conserve rien dans le stockage local de votre navigateur. Aucune bannière de
          consentement n&apos;est donc nécessaire : il n&apos;y a rien à accepter ou à refuser.
        </p>
      </Section>

      <Section title="Transferts hors de l'Union européenne">
        <p>
          Les prestataires techniques mentionnés ci-dessus peuvent traiter des données depuis des
          pays situés hors de l&apos;Union européenne. Ces transferts sont encadrés par les clauses
          contractuelles types de la Commission européenne.
        </p>
      </Section>

      <Section title="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          limitation et d&apos;opposition au traitement de vos données, ainsi que d&apos;un droit à
          la portabilité. Vous pouvez aussi définir des directives relatives à leur sort après votre
          décès.
        </p>
        <p>
          Pour exercer ces droits, écrivez à{" "}
          <a
            href={`mailto:${legal.dpoEmail}`}
            className="text-oak underline-offset-4 hover:underline"
          >
            {legal.dpoEmail}
          </a>
          . Nous répondons dans un délai d&apos;un mois.
        </p>
        <p>
          Si la réponse ne vous satisfait pas, vous pouvez introduire une réclamation auprès de la
          Commission nationale de l&apos;informatique et des libertés (CNIL),{" "}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-oak underline-offset-4 hover:underline"
          >
            cnil.fr
          </a>
          .
        </p>
      </Section>

      <Section title="Modifications">
        <p>
          Cette politique peut être mise à jour pour refléter une évolution du site ou de la
          réglementation. La date de dernière mise à jour figure en haut de cette page. Pour toute
          question, écrivez-nous à{" "}
          <a
            href={`mailto:${contact.email}`}
            className="text-oak underline-offset-4 hover:underline"
          >
            {contact.email}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
