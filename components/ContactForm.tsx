"use client";

import { useState } from "react";
import { contact } from "@/content/pitiusa";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const subject = encodeURIComponent("Demande de visite privée — Pitiusa Art Station");
  const body = encodeURIComponent(
    `Nom : ${name}\nEmail : ${email}\n\n${message}`
  );
  const mailtoHref = `mailto:${contact.email}?subject=${subject}&body=${body}`;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = mailtoHref;
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm text-bone-dim">Nom</span>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border-b border-brass-dim py-2 text-bone outline-none transition-all duration-300 focus:border-oak focus:shadow-[0_1px_0_0_var(--color-oak)]"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-bone-dim">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-transparent border-b border-brass-dim py-2 text-bone outline-none transition-all duration-300 focus:border-oak focus:shadow-[0_1px_0_0_var(--color-oak)]"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-bone-dim">Message</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-transparent border-b border-brass-dim py-2 text-bone outline-none transition-all duration-300 resize-none focus:border-oak focus:shadow-[0_1px_0_0_var(--color-oak)]"
        />
      </label>
      <button
        type="submit"
        className="group relative self-start mt-2 overflow-hidden border border-oak px-8 py-3 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="absolute inset-0 -translate-x-full bg-oak transition-transform duration-500 ease-out group-hover:translate-x-0" />
        <span className="relative z-10 font-medium text-oak transition-colors duration-500 group-hover:text-ink">
          {contact.cta}
        </span>
      </button>
    </form>
  );
}
