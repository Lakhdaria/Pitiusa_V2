import type { Metadata } from "next";
import LegalPage, { Field, Section } from "@/components/LegalPage";
import { contact, legal, press, social } from "@/content/pitiusa";

export const metadata: Metadata = {
  title: "Legal notice — Pitiusa Art Station",
  description:
    "Publisher, publication director, hosting provider and intellectual property for pitiusa.art.",
  alternates: { canonical: "/legal-notice" },
};

export default function LegalNotice() {
  const { publisher, host } = legal;

  return (
    <LegalPage
      title="Legal notice"
      intro={`Legal information concerning ${legal.domain}, published pursuant to French law no. 2004-575 of 21 June 2004 on confidence in the digital economy.`}
    >
      <Section title="Publisher">
        <dl className="mt-1">
          <Field label="Company name" value={publisher.legalName} />
          <Field label="Legal form" value={publisher.legalForm} />
          <Field label="Share capital" value={publisher.capital} />
          <Field label="Company number" value={publisher.registration} />
          <Field label="VAT number" value={publisher.vat} />
          <Field label="Registered office" value={publisher.address} />
          <Field label="Telephone" value={publisher.phone} />
          <Field label="Email" value={contact.email} />
        </dl>
      </Section>

      <Section title="Publication director">
        <p>{publisher.publicationDirector}</p>
      </Section>

      <Section title="Hosting provider">
        <dl className="mt-1">
          <Field label="Host" value={host.name} />
          <Field label="Address" value={host.address} />
        </dl>
      </Section>

      <Section title="Intellectual property">
        <p>
          This site as a whole — its structure, texts, photographs, films, illustrations,
          animations, logos and visual identity — is protected by copyright and trade mark law. All
          rights reserved.
        </p>
        <p>
          No part of it may be reproduced, represented, adapted or exploited, in whole or in part,
          by any means and on any medium, without the publisher&apos;s prior written consent. The
          names &laquo;&nbsp;Pitiusa&nbsp;&raquo; and &laquo;&nbsp;Pitiusa Art Station&nbsp;&raquo;,
          together with the associated logo, may not be used without that consent.
        </p>
        <p>
          Third-party marks and distinctions mentioned on this site — in particular{" "}
          {press.outlet}&apos;s &laquo;&nbsp;{press.mention}&nbsp;&raquo; — remain the property of
          their respective holders and are reproduced for reference only.
        </p>
      </Section>

      <Section title="External links">
        <p>
          This site links to the Instagram account{" "}
          <a
            href={social.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-oak underline-offset-4 hover:underline"
          >
            {social.instagram.handle}
          </a>
          . The publisher has no control over the content of third-party sites reached through such
          links and accepts no responsibility for it.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          The information on this site is given for guidance. Each Art Station is built to order, so
          its specification, materials and build time vary from one piece to the next; nothing here
          forms a contractual commitment. Only a written proposal does.
        </p>
        <p>
          The publisher works to keep the site available and current, without warranting that it
          will be free of interruption or error.
        </p>
      </Section>

      <Section title="Personal data">
        <p>
          How the data you send through the contact form is handled is set out in the{" "}
          <a href="/privacy-policy" className="text-oak underline-offset-4 hover:underline">
            privacy policy
          </a>
          .
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          This site and this notice are governed by French law. Any dispute over their
          interpretation or performance falls to the competent courts.
        </p>
      </Section>
    </LegalPage>
  );
}
