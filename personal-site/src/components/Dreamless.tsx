import { motion } from "framer-motion";
import { Play, Newspaper, ArrowUpRight } from "lucide-react";
import banner from "../assets/dreamless-banner.jpg";
import type { PersonalContent } from "../data/homeContent";
import RichText from "./RichText";

export default function Dreamless({ content }: { content: PersonalContent["dreamless"] }) {
  return (
    <section id="dreamless" className="border-t border-border pt-10 pb-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">{content.eyebrow}</p>
        <motion.a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          data-track="dreamless-banner"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-4 block overflow-hidden rounded-3xl border border-border shadow-xl transition hover:shadow-2xl"
        >
          <img
            src={content.image || banner}
            alt={content.imageAlt}
            width={1500}
            height={500}
            loading="lazy"
            className="block h-auto w-full"
          />
        </motion.a>
        <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-start">
          <h2 className="heading-section">{content.title}</h2>
          <div className="space-y-4 text-ink/85">
            {content.paragraphs.map((para, i) => (
              <p key={i}>
                <RichText text={para} />
              </p>
            ))}
            <div className="flex flex-wrap gap-3 pt-2">
              {content.primaryLabel && (
                <a href={content.url} target="_blank" rel="noopener noreferrer" data-track="dreamless" className="btn-primary">
                  <Play size={16} />
                  {content.primaryLabel}
                </a>
              )}
              {content.secondaryLabel && (
                <a href={content.secondaryUrl} target="_blank" rel="noopener noreferrer" data-track="dreamless-press" className="btn-ghost">
                  <Newspaper size={16} />
                  {content.secondaryLabel}
                  <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
