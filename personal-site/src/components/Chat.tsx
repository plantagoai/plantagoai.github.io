import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { sendChat, type ChatMessage } from "../lib/api";

const SUGGESTIONS = [
  "What is Foundation?",
  "Tell me about your IBM years",
  "Why Rust over Go?",
  "What's the AutoScaler story?",
];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const reply = await sendChat(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Hit a snag. Try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="chat" className="border-t border-border bg-surface/30 py-20">
      <div className="container-prose">
        <p className="text-meta uppercase tracking-[0.18em]">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Chat with my AI
          </span>
        </p>
        <h2 className="heading-section mt-2">Ask anything about my work.</h2>
        <p className="mt-3 text-muted">
          Powered by Claude. Trained on my CV and a short bio. Ranges over career, projects,
          and technical opinions on distributed systems, AI, and blockchain.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-bg">
          <div
            ref={scrollerRef}
            className="max-h-[400px] min-h-[200px] space-y-3 overflow-y-auto p-5"
          >
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-ink hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-ink text-bg"
                        : "border border-border bg-surface"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-muted">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              type="text"
              placeholder="Ask anything…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="btn-primary disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
