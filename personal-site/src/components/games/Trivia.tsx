import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shuffle } from "lucide-react";
import { funFacts, factCategories, categoryColorVar } from "../../data/funFacts";

export default function Trivia() {
  const [cat, setCat] = useState<(typeof factCategories)[number]>("All");
  const [idx, setIdx] = useState(0);

  const filtered = useMemo(
    () => (cat === "All" ? funFacts : funFacts.filter((f) => f.category === cat)),
    [cat],
  );
  const fact = filtered[Math.min(idx, filtered.length - 1)];

  function shuffle() {
    if (filtered.length === 0) return;
    setIdx((prev) => {
      if (filtered.length === 1) return 0;
      let next: number;
      do {
        next = Math.floor(Math.random() * filtered.length);
      } while (next === prev);
      return next;
    });
  }

  function pickCategory(c: (typeof factCategories)[number]) {
    setCat(c);
    const pool = c === "All" ? funFacts.length : funFacts.filter((f) => f.category === c).length;
    setIdx(Math.floor(Math.random() * pool));
  }

  const colorVar = categoryColorVar[fact.category] ?? "--pillar-voice";

  return (
    <div>
      <div className="rounded-xl border border-border bg-bg/60 p-4 text-sm text-ink/85">
        <p className="font-semibold text-ink">Things I find delightful.</p>
        <p className="mt-1.5 leading-relaxed">
          Surprising, funny, or strange facts from across distributed systems, AI, software,
          cloud, blockchain, and crypto. Pick a topic — or hit shuffle and let it roam.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {factCategories.map((c) => (
          <button
            key={c}
            onClick={() => pickCategory(c)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              cat === c
                ? "border-ink bg-ink text-bg"
                : "border-border text-ink/80 hover:border-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="relative mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${cat}-${idx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl border bg-bg p-6 sm:p-8"
            style={{
              borderColor: `hsl(var(${colorVar}) / 0.35)`,
              boxShadow: `0 1px 0 hsl(var(${colorVar}) / 0.2)`,
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: `hsl(var(${colorVar}))` }} />
              <span
                className="font-mono text-[11px] uppercase tracking-[0.18em]"
                style={{ color: `hsl(var(${colorVar}))` }}
              >
                {fact.category}
              </span>
            </div>
            <p className="mt-4 text-lg leading-relaxed text-ink sm:text-xl">{fact.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/80">
        <span className="font-mono">
          {filtered.length > 0
            ? `${Math.min(idx, filtered.length - 1) + 1} of ${filtered.length}`
            : "no facts in this category"}
        </span>
        <button onClick={shuffle} className="btn-primary">
          <Shuffle size={14} />
          Another fact
        </button>
      </div>
    </div>
  );
}
