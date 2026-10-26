import { ArrowRight } from "lucide-react";
import type { PersonalContent } from "../data/homeContent";

/* Series banner for Dreamless: The Hush, the same design as on
   plantagoai.com. Kept in the poster's own night palette rather than the
   site tokens, so it reads as the show's key art. */
export default function DreamlessBanner({ content }: { content: PersonalContent["dreamlessBanner"] }) {
  return (
    <section aria-label={content.title} className="pt-10 pb-4">
      <div className="container-wide">
        <a
          href={content.url}
          data-track="dreamless"
          target="_blank"
          rel="noopener noreferrer"
          className="group grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100 shadow-xl transition hover:shadow-2xl"
        >
          <img
            src={content.image}
            alt={content.imageAlt}
            width={600}
            height={840}
            className="w-full h-full max-h-96 sm:max-h-none object-cover object-top"
          />
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            {content.eyebrow && (
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-teal-300">
                {content.eyebrow}
              </p>
            )}
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-wide text-white">
                {content.title}
              </h2>
              {content.tagline && (
                <p className="mt-2 text-lg italic text-slate-300">{content.tagline}</p>
              )}
            </div>
            {content.body && (
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">{content.body}</p>
            )}
            {content.buttonLabel && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition-opacity group-hover:opacity-90">
                {content.buttonLabel}
                <ArrowRight size={16} />
              </span>
            )}
          </div>
        </a>
      </div>
    </section>
  );
}
