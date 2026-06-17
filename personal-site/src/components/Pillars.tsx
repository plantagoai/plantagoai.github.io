import { motion } from "framer-motion";
import { Shield, ArrowUpRight } from "lucide-react";
import { pillars } from "../data/cv";
import PillarIcon from "./PillarIcon";

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

export default function Pillars() {
  return (
    <section id="pillars" className="border-t border-border bg-surface/30 py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">What I'm building</p>
        <div className="mt-2 flex items-start gap-3">
          <FoundationBadge size={28} className="mt-2 shrink-0" />
          <h2 className="heading-section max-w-3xl">
            Three pillars —{" "}
            <span style={{ color: "hsl(var(--pillar-voice))" }}>Voice.</span>{" "}
            <span style={{ color: "hsl(var(--pillar-share))" }}>Share.</span>{" "}
            <span style={{ color: "hsl(var(--pillar-market))" }}>Market.</span>{" "}
            <span className="text-muted">— on shared infrastructure, on Solana.</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.a
              key={p.key}
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
                <PillarIcon pillar={p.key} size={28} />
                <h3
                  className="mt-4 text-xl font-semibold"
                  style={{ color: `hsl(var(--pillar-${p.key}))` }}
                >
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
          ))}
        </div>
        <p className="mt-10 max-w-2xl text-sm text-ink/85">
          The infrastructure layer is{" "}
          <a
            href="https://plantagoai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-primary decoration-2 underline-offset-4"
          >
            PlantagoAI
          </a>{" "}
          — shared identity, AI (with prompt caching), payments, messaging, and 12+ packages
          reused across all three pillars.
        </p>
      </div>
    </section>
  );
}
