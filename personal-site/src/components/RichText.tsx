import { splitLinks } from "../lib/home";
import type { PersonalTone } from "../data/homeContent";

/** Admin-edited copy with [text](url) links. */
export default function RichText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((p, i) =>
        "href" in p ? (
          <a
            key={i}
            href={p.href}
            {...(p.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-ink underline decoration-primary decoration-2 underline-offset-4"
          >
            {p.text}
          </a>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export function toneColor(tone: PersonalTone, alpha?: number): string {
  const v =
    tone === "ink" ? "--ink" : tone === "muted" ? "--muted" : `--pillar-${tone}`;
  return alpha === undefined ? `hsl(var(${v}))` : `hsl(var(${v}) / ${alpha})`;
}
