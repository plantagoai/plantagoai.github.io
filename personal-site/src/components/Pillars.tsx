import { motion } from "framer-motion";
import { Shield, ArrowUpRight } from "lucide-react";
import type { PersonalContent } from "../data/homeContent";
import { ICONS } from "./Icon";
import RichText, { toneColor } from "./RichText";

function FoundationBadge({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <Shield
      size={size}
      strokeWidth={2.4}
      className={className}
      style={{
        color: "hsl(var(--pillar-share))",
        fill: "hsl(var(--pillar-share) / 0.15)",
      }}
    />
  );
}

export default function Pillars({ content }: { content: PersonalContent["pillars"] }) {
  return (
    <section id="pillars" className="border-t border-border bg-surface/30 py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">{content.eyebrow}</p>
        <div className="mt-2 flex items-start gap-3">
          <FoundationBadge size={28} className="mt-2 shrink-0" />
          <h2 className="heading-section max-w-3xl">
            {content.titleLead}
            {content.titleWords.map((w, i) => (
              <span key={i}>
                {" "}
                <span style={{ color: toneColor(w.tone) }}>{w.text}</span>
              </span>
            ))}
            {content.titleTail && (
              <>
                {" "}
                <span className="text-muted">{content.titleTail}</span>
              </>
            )}
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {content.cards.map((p, i) => {
            const Icon = ICONS[p.icon] ?? ICONS.sparkles;
            return (
            <motion.a
              key={i}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-bg p-6 transition hover:border-ink"
            >
              <div>
                <Icon size={28} strokeWidth={2.2} style={{ color: toneColor(p.tone) }} />
                <h3 className="mt-4 text-xl font-semibold" style={{ color: toneColor(p.tone) }}>
                  {p.name}.
                </h3>
                <p className="mt-2 text-sm text-ink/80">{p.blurb}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs">
                <span className="font-mono text-muted">{p.handle}</span>
                <ArrowUpRight
                  size={16}
                  className="text-muted transition group-hover:text-ink"
                />
              </div>
            </motion.a>
            );
          })}
        </div>
        {content.footnote && (
          <p className="mt-10 max-w-2xl text-sm text-ink/85">
            <RichText text={content.footnote} />
          </p>
        )}
      </div>
    </section>
  );
}
