import { Resend } from "resend";

// Never prerendered, never cached: this only ever handles POSTs.
export const dynamic = "force-dynamic";

// The inbox the form delivers to, unless CONTACT_TO_EMAIL says otherwise.
const INBOX = "sofiane.pro2004@gmail.com";

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;

const MAX = { name: 120, email: 200, message: 4000 };
// Deliberately loose. Anything stricter starts rejecting addresses that are
// perfectly valid, and the only real proof an address works is a reply.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best-effort throttle: one module-level map, so it resets whenever the
// process does. That is enough to stop someone hammering the form from a
// browser tab; a serious defence would need shared storage, which this site
// has no reason to run.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function validate(body: Record<string, unknown>) {
  const errors: Errors = {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(body.name);
  const email = str(body.email);
  const message = str(body.message);
  const phone = str(body.phone);

  if (name.length < 2) errors.name = "Merci d'indiquer votre nom.";
  else if (name.length > MAX.name) errors.name = "Ce nom est trop long.";

  if (!EMAIL.test(email)) errors.email = "Cette adresse e-mail semble incorrecte.";
  else if (email.length > MAX.email) errors.email = "Cette adresse est trop longue.";

  if (message.length < 10) errors.message = "Dites-nous en un peu plus (10 caractères minimum).";
  else if (message.length > MAX.message) errors.message = "Ce message est trop long.";

  return { errors, values: { name, email, message, phone: phone.slice(0, 40) } };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // Honeypot: a real person never sees this field, so anything in it is a
  // bot. Answer 200 — telling it that it failed only teaches it to retry.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return Response.json({ ok: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { ok: false, error: "Trop de messages envoyés. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const { errors, values } = validate(body);
  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  // Where the messages land. Deliberately not `contact.email`: that one is
  // printed on the page for visitors to write to, and the inbox that
  // actually receives the form is a separate decision. `CONTACT_TO_EMAIL`
  // overrides it without touching the code.
  const to = process.env.CONTACT_TO_EMAIL || INBOX;
  // Resend only accepts a `from` on a domain you have verified with them.
  // Their sandbox address works out of the box for testing.
  const from = process.env.CONTACT_FROM_EMAIL || "Pitiusa Art Station <onboarding@resend.dev>";

  if (!apiKey) {
    // Loud rather than silent: a form that reports success while sending
    // nothing is the worst possible failure here.
    console.error("[contact] RESEND_API_KEY is not set — message not sent.");
    return Response.json(
      { ok: false, error: "L'envoi n'est pas configuré sur ce serveur." },
      { status: 503 }
    );
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: [to],
      replyTo: values.email,
      subject: `Nouveau message — ${values.name}`,
      text: [
        `Nom     : ${values.name}`,
        `E-mail  : ${values.email}`,
        values.phone ? `Tél.    : ${values.phone}` : null,
        "",
        values.message,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (error) {
      console.error("[contact] Resend refused the message:", error);
      return Response.json(
        { ok: false, error: "L'envoi a échoué. Réessayez ou écrivez-nous directement." },
        { status: 502 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[contact] Unexpected failure:", err);
    return Response.json(
      { ok: false, error: "L'envoi a échoué. Réessayez ou écrivez-nous directement." },
      { status: 500 }
    );
  }
}
