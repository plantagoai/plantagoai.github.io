import { motion } from "framer-motion";
import type { PersonalContent } from "../data/homeContent";
import { ICONS } from "./Icon";
import { toneColor } from "./RichText";

/* The Foundation "Your Voice. Share. Market." card that used to sit beside
   the hero. Hidden by default since the hero was shortened; shown and
   placed from Admin. */
export default function FoundationCard({ content }: { content: PersonalContent["foundationCard"] }) {
  return (
    <section className="pb-12 pt-4">
      <div className="container-wide">
        <motion.a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${content.url.replace(/^https?:\/\//, "")}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ y: -2 }}
          className="group relative mx-auto block w-full max-w-[420px]"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, hsl(var(--pillar-voice) / 0.22), transparent 55%),radial-gradient(circle at 70% 60%, hsl(var(--pillar-share) / 0.18), transparent 55%),radial-gradient(circle at 30% 80%, hsl(var(--pillar-market) / 0.18), transparent 55%)",
            }}
          />
          <div className="relative rounded-3xl border border-border bg-surface/80 p-7 shadow-xl backdrop-blur-sm transition-shadow group-hover:shadow-2xl sm:p-8">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: "hsl(var(--pillar-share))" }} />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{content.eyebrow}</p>
            </div>
            {content.lead && <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{content.lead}</p>}
            <div className="mt-2 space-y-3">
              {content.words.map((w, i) => {
                const Icon = ICONS[w.icon] ?? ICONS.sparkles;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{ borderColor: toneColor(w.tone, 0.35), background: toneColor(w.tone, 0.1) }}
                    >
                      <Icon size={26} strokeWidth={2.6} style={{ color: toneColor(w.tone) }} />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: toneColor(w.tone) }}>
                      {w.text}
                    </span>
                  </div>
                );
              })}
            </div>
            {(content.footerLeft || content.footerRight) && (
              <div className="mt-7 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted">
                <span className="font-mono uppercase tracking-[0.16em]">{content.footerLeft}</span>
                <span className="font-mono">{content.footerRight}</span>
              </div>
            )}
          </div>
        </motion.a>
      </div>
    </section>
  );
}
