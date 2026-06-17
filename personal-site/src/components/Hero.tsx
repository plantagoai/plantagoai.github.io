import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AudioLines, Wallet, ShoppingCart, MessageCircle, ArrowDown } from "lucide-react";

const PILLARS = [
  { key: "voice", label: "Voice.", Icon: AudioLines, varName: "--pillar-voice", delay: 0 },
  { key: "share", label: "Share.", Icon: Wallet, varName: "--pillar-share", delay: 0.08 },
  { key: "market", label: "Market.", Icon: ShoppingCart, varName: "--pillar-market", delay: 0.16 },
] as const;

function PillarsCard({ className }: { className?: string }) {
  return (
    <motion.a
      href="https://foundation-global.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit foundation-global.com"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={`group relative block ${className ?? ""}`}
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
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "hsl(var(--pillar-share))" }}
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Foundation
          </p>
        </div>
        <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Your</p>
        <div className="mt-2 space-y-3">
          {PILLARS.map(({ key, label, Icon, varName, delay }) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.25 + delay }}
              className="flex items-center gap-4"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  borderColor: `hsl(var(${varName}) / 0.35)`,
                  background: `hsl(var(${varName}) / 0.10)`,
                }}
              >
                <Icon size={26} strokeWidth={2.6} style={{ color: `hsl(var(${varName}))` }} />
              </div>
              <span
                className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: `hsl(var(${varName}))` }}
              >
                {label}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted">
          <span className="font-mono uppercase tracking-[0.16em]">Three pillars</span>
          <span className="font-mono">on Solana</span>
        </div>
      </div>
    </motion.a>
  );
}

function AnimatedTitle() {
  // step 0 = Founder purple (initial), 1 = Architect purple, 2 = Researcher purple,
  // step 3 = Founder purple (final, stays).
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= 3) return;
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step]);

  const purple = "hsl(var(--pillar-voice))";
  const ink = "hsl(var(--ink))";
  const founder = step === 0 || step === 3 ? purple : ink;
  const architect = step === 1 ? purple : ink;
  const researcher = step === 2 ? purple : ink;
  const tween = { duration: 0.4, ease: "easeOut" } as const;

  return (
    <h1 className="heading-display mt-3">
      <motion.span initial={{ color: purple }} animate={{ color: founder }} transition={tween}>
        Founder
      </motion.span>
      ,{" "}
      <motion.span initial={{ color: ink }} animate={{ color: architect }} transition={tween}>
        Architect
      </motion.span>
      ,
      <br />
      <motion.span initial={{ color: ink }} animate={{ color: researcher }} transition={tween}>
        Researcher
      </motion.span>
      .
    </h1>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="container-wide flex min-h-[88vh] flex-col justify-center pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid items-center gap-12 md:grid-cols-[1.2fr_1fr]"
        >
          <div>
            <p className="text-meta uppercase tracking-[0.18em]">Dagan Gilat</p>
            <AnimatedTitle />
            <p className="mt-6 max-w-xl text-lg text-ink/85">
              Distributed systems, applied AI, and a current verified-human governance stack
              on Solana. Three pillars on shared infrastructure:{" "}
              <span className="font-semibold" style={{ color: "hsl(var(--pillar-voice))" }}>
                Voice.
              </span>{" "}
              <span className="font-semibold" style={{ color: "hsl(var(--pillar-share))" }}>
                Share.
              </span>{" "}
              <span className="font-semibold" style={{ color: "hsl(var(--pillar-market))" }}>
                Market.
              </span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#chat" className="btn-primary">
                <MessageCircle size={16} />
                Chat with my AI
              </a>
              <a href="#timeline" className="btn-ghost">
                <ArrowDown size={16} />
                See the work
              </a>
            </div>
          </div>
          <PillarsCard className="mx-auto w-full max-w-[420px]" />
        </motion.div>
      </div>
    </section>
  );
}
