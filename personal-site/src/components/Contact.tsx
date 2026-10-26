import { useState } from "react";
import { Send, CircleCheck } from "lucide-react";
import { sendContact } from "../lib/api";
import { track } from "../lib/track";

import type { PersonalContent } from "../data/homeContent";

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact({ content }: { content: PersonalContent["contact"] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await sendContact({ name, email, message });
      track("contact");
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something broke. Try again.");
    }
  }

  return (
    <section id="contact" className="border-t border-border py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">{content.eyebrow}</p>
        <h2 className="heading-section mt-2">{content.title}</h2>
        {content.body && <p className="mt-3 max-w-2xl text-muted">{content.body}</p>}
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-ink"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-ink"
            />
          </div>
          <textarea
            required
            rows={5}
            placeholder="What's on your mind?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none transition focus:border-ink"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="btn-primary disabled:opacity-50"
            >
              {status === "sent" ? (
                <>
                  <CircleCheck size={16} /> Sent
                </>
              ) : status === "sending" ? (
                "Sending…"
              ) : (
                <>
                  <Send size={16} /> Send message
                </>
              )}
            </button>
            {status === "error" && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
