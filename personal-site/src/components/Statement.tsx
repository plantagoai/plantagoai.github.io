import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { PersonalContent } from "../data/homeContent";
import RichText from "./RichText";

export default function Statement({ content }: { content: PersonalContent["statement"] }) {
  return (
    <section id="statement" className="border-t border-border py-16">
      <div className="container-wide">
        <motion.figure
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="relative max-w-3xl"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute right-0 -top-10 select-none font-serif text-[10rem] leading-none"
            style={{ color: "hsl(var(--pillar-voice) / 0.18)" }}
          >
            &ldquo;
          </span>
          {content.eyebrow && <p className="text-meta uppercase tracking-[0.18em]">{content.eyebrow}</p>}
          {content.title && <h2 className="heading-section mt-2">{content.title}</h2>}
          <blockquote
            className="mt-6 space-y-4 border-l-2 pl-5 text-lg italic leading-relaxed text-ink/85"
            style={{ borderColor: "hsl(var(--pillar-voice))" }}
          >
            {content.paragraphs.map((para, i) => (
              <p key={i}>
                <RichText text={para} />
              </p>
            ))}
          </blockquote>
          <figcaption className="mt-6 flex flex-wrap items-center gap-4">
            {content.image && (
              <img
                src={content.image}
                alt={content.signature}
                width={56}
                height={56}
                loading="lazy"
                className="h-14 w-14 rounded-full border border-border object-cover"
              />
            )}
            <div className="mr-auto">
              {content.signature && <p className="font-semibold">{content.signature}</p>}
              {content.signatureRole && <p className="text-meta">{content.signatureRole}</p>}
            </div>
            {content.linkLabel && content.url && (
              <a href={content.url} target="_blank" rel="noopener noreferrer" data-track="dreamless" className="btn-ghost">
                {content.linkLabel}
                <ArrowUpRight size={14} />
              </a>
            )}
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
