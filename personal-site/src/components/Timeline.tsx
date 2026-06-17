import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { timeline } from "../data/cv";

const TAG_COLOR: Record<string, string> = {
  current: "hsl(var(--pillar-voice))",
  founder: "hsl(var(--pillar-share))",
  research: "hsl(var(--pillar-market))",
  industry: "hsl(var(--muted))",
};

export default function Timeline() {
  const [open, setOpen] = useState(0);
  return (
    <section id="timeline" className="border-t border-border py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">Career</p>
        <h2 className="heading-section mt-2">25 years. Six chapters.</h2>
        <div className="mt-10 grid gap-x-10 md:grid-cols-[200px_1fr]">
          <div className="hidden md:block">
            <div className="sticky top-24 text-xs text-muted">
              <p className="font-mono">{timeline[0].period.split(" – ")[0]} →</p>
              <p className="font-mono mt-1 opacity-60">
                {timeline[timeline.length - 1].period.split(" – ")[0]}
              </p>
            </div>
          </div>
          <div className="relative border-l border-border pl-6">
            {timeline.map((entry, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="relative pb-6">
                  <span
                    className="absolute -left-[31px] top-2 inline-block h-2.5 w-2.5 rounded-full ring-4 ring-bg"
                    style={{ background: TAG_COLOR[entry.tag ?? "industry"] }}
                  />
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="group flex w-full items-baseline justify-between gap-4 text-left"
                  >
                    <div>
                      <p className="font-mono text-xs text-muted">{entry.period}</p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {entry.org}
                        <span className="font-normal text-muted"> · {entry.role}</span>
                      </h3>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 max-w-2xl space-y-3 text-sm">
                          {entry.blurb && <p className="text-muted">{entry.blurb}</p>}
                          <ul className="space-y-1.5 pl-4 marker:text-muted">
                            {entry.bullets.map((b, j) => (
                              <li key={j} className="list-disc">
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
