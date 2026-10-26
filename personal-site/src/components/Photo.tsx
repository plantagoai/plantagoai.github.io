import { motion } from "framer-motion";
import type { PersonalContent } from "../data/homeContent";

export default function Photo({ content }: { content: PersonalContent["photo"] }) {
  if (!content.image) return null;
  return (
    <section className="pb-12 pt-2">
      <div className="container-wide">
        <motion.figure
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8"
        >
          <img
            src={content.image}
            alt={content.imageAlt}
            width={460}
            height={460}
            loading="lazy"
            className="h-44 w-44 shrink-0 rounded-3xl border border-border object-cover shadow-xl sm:h-56 sm:w-56"
          />
          {content.caption && (
            <figcaption className="max-w-md whitespace-pre-line text-lg font-medium text-ink/85">
              {content.caption}
            </figcaption>
          )}
        </motion.figure>
      </div>
    </section>
  );
}
