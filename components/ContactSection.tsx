"use client";

import { useRef, useState } from "react";
import Reveal from "./Reveal";
import { contact, product } from "@/content/pitiusa";

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full border-b border-brass-dim bg-transparent py-3 text-bone outline-none transition-colors duration-300 placeholder:text-bone-dim/60 focus:border-oak";

export default function ContactSection() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
    };

    setStatus("sending");
    setErrors({});
    setFailure("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errors?: Errors;
        error?: string;
      };

      if (res.ok && body.ok) {
        setStatus("sent");
        formRef.current?.reset();
        return;
      }
      // Field-level problems go back on the fields; anything else is a
      // single message under the button, so the reader is never left with a
      // form that simply refused without saying why.
      const fieldErrors = body.errors ?? {};
      const hasFieldErrors = Object.keys(fieldErrors).length > 0;
      setErrors(fieldErrors);
      // A generic line under the button on top of per-field messages just
      // repeats what the fields already say.
      setFailure(hasFieldErrors ? "" : body.error ?? "Une erreur est survenue. Réessayez.");
      setStatus("error");
    } catch {
      setFailure("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setStatus("error");
    }
  }

  return (
    <section id="contact" data-snap className="relative overflow-hidden bg-surface px-5 py-16 md:px-12 md:py-36">
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-oak/10 blur-[140px]" />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-24">
        <Reveal>
          <div>
            <h2 className="font-display text-[1.75rem] leading-tight text-bone sm:text-4xl md:text-5xl">
              Private viewings in {contact.location}.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-bone-dim">
              Every Pitiusa is built entirely to order, over {product.buildTimeEn.toLowerCase()}. The
              first edition is limited to {product.editionSizeEn}.
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-bone-dim">
              For a private viewing, a press enquiry or any other question, write to us — we reply
              within two working days.
            </p>
            <a
              href={`mailto:${contact.email}`}
              className="mt-8 inline-block py-1.5 font-display text-lg text-oak transition-colors hover:text-bone"
            >
              {contact.email}
            </a>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
            {/* Honeypot. Hidden from sight and from screen readers, and
                skipped by the tab key: nothing but a bot can fill it in. */}
            <div className="absolute left-[-9999px]" aria-hidden="true">
              <label>
                Société
                <input type="text" name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-bone-dim">Nom</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={Boolean(errors.name)}
                className={field}
              />
              {errors.name && <span className="text-sm text-oak">{errors.name}</span>}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-bone-dim">E-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(errors.email)}
                className={field}
              />
              {errors.email && <span className="text-sm text-oak">{errors.email}</span>}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-bone-dim">
                Téléphone <span className="text-bone-dim/60">(facultatif)</span>
              </span>
              <input name="phone" type="tel" autoComplete="tel" className={field} />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-bone-dim">Message</span>
              <textarea
                name="message"
                rows={4}
                required
                aria-invalid={Boolean(errors.message)}
                className={`${field} resize-none`}
              />
              {errors.message && <span className="text-sm text-oak">{errors.message}</span>}
            </label>

            <div className="mt-2 flex flex-wrap items-center gap-5">
              <button
                type="submit"
                disabled={status === "sending"}
                className="group relative overflow-hidden border border-oak px-8 py-3 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                <span className="absolute inset-0 -translate-x-full bg-oak transition-transform duration-500 ease-out group-hover:translate-x-0" />
                <span className="relative z-10 font-medium text-oak transition-colors duration-500 group-hover:text-ink">
                  {status === "sending" ? "Envoi en cours…" : contact.cta}
                </span>
              </button>

              {/* One live region for every outcome, so a screen reader hears
                  the result without the focus having to move. */}
              <p aria-live="polite" className="text-sm">
                {status === "sent" && (
                  <span className="text-oak">Message envoyé. Merci, nous revenons vers vous.</span>
                )}
                {status === "error" && failure && <span className="text-bone-dim">{failure}</span>}
              </p>
            </div>

            {/* Said where the data is handed over, not buried in the footer:
                the GDPR asks for the information at the point of collection. */}
            <p className="text-sm leading-relaxed text-bone-dim">
              Your details are used only to answer your enquiry —{" "}
              <a href="/privacy-policy" className="text-oak underline-offset-4 hover:underline">
                privacy policy
              </a>
              .
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
