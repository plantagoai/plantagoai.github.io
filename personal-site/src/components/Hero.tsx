import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowDown } from "lucide-react";
import type { PersonalContent } from "../data/homeContent";
import { toneColor } from "./RichText";

function AnimatedTitle({ words }: { words: string[] }) {
  // Each word lights up purple in turn, then the first one lights up again
  // and stays: step 0 = first, 1..n-1 = the others, n = first (final).
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= words.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step, words.length]);

  const purple = "hsl(var(--pillar-voice))";
  const ink = "hsl(var(--ink))";
  const lit = step >= words.length ? 0 : step;
  const tween = { duration: 0.4, ease: "easeOut" } as const;

  return (
    <h1 className="heading-display mt-3">
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && (i === words.length - 1 ? <br /> : " ")}
          <motion.span
            initial={{ color: i === 0 ? purple : ink }}
            animate={{ color: lit === i ? purple : ink }}
            transition={tween}
          >
            {word}
          </motion.span>
          {i === words.length - 1 ? "." : ","}
        </span>
      ))}
    </h1>
  );
}

export default function Hero({
  content,
  first,
  aside,
}: {
  content: PersonalContent["hero"];
  first: boolean;
  /** Shown beside the text on wide screens, under it on phones (the photo). */
  aside?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className={`container-wide flex flex-col justify-center pb-10 ${first ? "pt-20" : "pt-10"}`}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`grid items-center gap-12 ${aside ? "md:grid-cols-[minmax(0,1fr)_auto]" : ""}`}
        >
          <div>
            {content.eyebrow && (
              <p className="text-meta uppercase tracking-[0.18em]">{content.eyebrow}</p>
            )}
            {content.titleWords.length > 0 && <AnimatedTitle words={content.titleWords} />}
            {(content.description || content.highlights.length > 0) && (
              <p className="mt-6 max-w-xl text-lg text-ink/85">
                {content.description}
                {content.highlights.map((h, i) => (
                  <span key={i}>
                    {" "}
                    <span className="font-semibold" style={{ color: toneColor(h.tone) }}>
                      {h.text}
                    </span>
                  </span>
                ))}
              </p>
            )}
            {(content.primaryLabel || content.secondaryLabel) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {content.primaryLabel && (
                  <a href={content.primaryHref} className="btn-primary">
                    <MessageCircle size={16} />
                    {content.primaryLabel}
                  </a>
                )}
                {content.secondaryLabel && (
                  <a href={content.secondaryHref} className="btn-ghost">
                    <ArrowDown size={16} />
                    {content.secondaryLabel}
                  </a>
                )}
              </div>
            )}
          </div>
          {aside}
        </motion.div>
      </div>
    </section>
  );
}
