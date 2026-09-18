import type { Metadata } from "next";
import LegalPage, { Field, Section } from "@/components/LegalPage";
import { contact, legal } from "@/content/pitiusa";

export const metadata: Metadata = {
  title: "Privacy policy — Pitiusa Art Station",
  description:
    "What pitiusa.art collects, why, for how long, and how to exercise your rights over it.",
  alternates: { canonical: "/privacy-policy" },
};

// Kept next to the text it describes: change the retention here and the
// sentence follows. Three years from the last exchange is the period the
// CNIL allows for commercial prospects; shorten it if you prefer.
const RETENTION = "three years from our last exchange";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This site collects the minimum needed to answer you: what you write in the contact form, and nothing else."
      updated="18 September 2026"
    >
      <Section title="In short">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>No cookies are set and no trackers are used.</li>
          <li>No audience-measurement or analytics tool is installed.</li>
          <li>
            Typefaces are served from this site rather than from a third party, so opening a page
            sends your IP address to no one.
          </li>
          <li>
            The only personal data processed is what you type into the contact form yourself.
          </li>
        </ul>
      </Section>

      <Section title="Data controller">
        <dl className="mt-1">
          <Field label="Controller" value={legal.publisher.legalName} />
          <Field label="Address" value={legal.publisher.address} />
          <Field label="Contact" value={legal.dpoEmail} />
        </dl>
      </Section>

      <Section title="What is collected">
        <p>
          The contact form asks for your <strong className="text-bone">name</strong>, your{" "}
          <strong className="text-bone">email address</strong>, your{" "}
          <strong className="text-bone">telephone number</strong> if you choose to give it — that
          field is optional — and the <strong className="text-bone">content of your message</strong>.
        </p>
        <p>
          Nothing else is asked for, and nothing is gathered about you in the background as you read
          the site.
        </p>
      </Section>

      <Section title="Purpose and legal basis">
        <p>
          This data is used solely to handle your enquiry and reply to it: arranging a private
          viewing, answering a press request, or any other question you put to us.
        </p>
        <p>
          The legal basis is the taking of steps at your request prior to entering into a contract
          (GDPR article 6(1)(b)) and, for enquiries with no contractual object, our legitimate
          interest in replying to people who write to us (article 6(1)(f)).
        </p>
      </Section>

      <Section title="Who receives it">
        <p>
          Your messages are read by the site&apos;s publisher and are passed to no third party for
          commercial purposes. They are not sold, rented or exchanged.
        </p>
        <p>
          Email delivery is handled by <strong className="text-bone">Resend</strong>, a technical
          provider acting as a processor within the meaning of the GDPR. The site is hosted by{" "}
          {legal.host.name}.
        </p>
      </Section>

      <Section title="How long it is kept">
        <p>
          Messages received and the contact details attached to them are kept for {RETENTION}, then
          deleted. Where an exchange leads to an order, the corresponding records are kept for the
          statutory accounting and commercial retention periods.
        </p>
      </Section>

      <Section title="Protection against abuse">
        <p>
          To stop automated bulk submissions, the server briefly notes the IP address each
          submission comes from. That figure stays in memory for about ten minutes, long enough to
          count recent submissions; it is never written to disk, never tied to the content of a
          message, and disappears when the server restarts.
        </p>
        <p>
          The form also carries a hidden field that only robots fill in. It collects nothing about
          you.
        </p>
      </Section>

      <Section title="Cookies and analytics">
        <p>
          This site sets no cookies, uses no tracking pixel and no statistics service, and stores
          nothing in your browser. There is therefore no consent banner: there is nothing to accept
          or refuse.
        </p>
      </Section>

      <Section title="Transfers outside the EU">
        <p>
          The technical providers named above may process data from countries outside the European
          Union. Such transfers are covered by the European Commission&apos;s standard contractual
          clauses.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You have the right to access, rectify, erase, restrict and object to the processing of
          your data, and the right to data portability. You may also give directions as to what
          becomes of it after your death.
        </p>
        <p>
          To exercise these rights, write to{" "}
          <a
            href={`mailto:${legal.dpoEmail}`}
            className="text-oak underline-offset-4 hover:underline"
          >
            {legal.dpoEmail}
          </a>
          . We reply within one month.
        </p>
        <p>
          If our answer does not satisfy you, you may lodge a complaint with the French data
          protection authority, the CNIL,{" "}
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

      <Section title="Changes">
        <p>
          This policy may be updated to reflect a change to the site or to the law. The date at the
          top of this page is the date it last changed. For any question, write to{" "}
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
