import { motion } from "framer-motion";
import type { PersonalContent } from "../data/homeContent";

/** The photo with its caption. `inline` is the hero's version: no section of
 *  its own, the caption under the picture. */
export default function Photo({ content, inline = false }: { content: PersonalContent["photo"]; inline?: boolean }) {
  if (!content.image) return null;
  if (inline) {
    return (
      <figure className="flex flex-col items-start gap-4 md:items-center">
        <img
          src={content.image}
          alt={content.imageAlt}
          width={460}
          height={460}
          className="h-56 w-56 rounded-3xl border border-border object-cover shadow-xl md:h-72 md:w-72"
        />
        {content.caption && (
          <figcaption className="max-w-[18rem] whitespace-pre-line text-sm font-medium text-ink/75 md:text-center">
            {content.caption}
          </figcaption>
        )}
      </figure>
    );
  }
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
