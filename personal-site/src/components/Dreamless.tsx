import { motion } from "framer-motion";
import { Play, Newspaper, ArrowUpRight } from "lucide-react";
import banner from "../assets/dreamless-banner.jpg";

const SERIES = "https://dreamless.micromedia-ai.com/";
const PRESS = "https://dreamless.micromedia-ai.com/#press";

export default function Dreamless() {
  return (
    <section id="dreamless" className="border-t border-border py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">Now showing</p>
        <motion.a
          href={SERIES}
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
            src={banner}
            alt="Dreamless: The Hush. Kai at his window at night with Tofu, his rice-cooker robot, over a quiet city."
            width={1500}
            height={500}
            loading="lazy"
            className="block h-auto w-full"
          />
        </motion.a>
        <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-start">
          <h2 className="heading-section">Dreamless: The Hush</h2>
          <div className="space-y-4 text-ink/85">
            <p>
              My new project is an anime series made entirely with AI. Everyone who dreams falls
              asleep smiling and never wakes; Kai hasn't dreamed in years, so he's one of the few
              still awake.
            </p>
            <p>
              I created the series idea, its bible and its style guide. Every episode is written,
              drawn, voiced, scored and edited by AI agents I built and direct through{" "}
              <a
                href="https://micromedia-ai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-primary decoration-2 underline-offset-4"
              >
                MicroMedia.ai
              </a>
              , my one-person AI studio, and I review each one before it goes out. Season 1 is 28
              one-minute episodes, a new one every day since 20 October 2026.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={SERIES} target="_blank" rel="noopener noreferrer" data-track="dreamless" className="btn-primary">
                <Play size={16} />
                Watch the series
              </a>
              <a href={PRESS} target="_blank" rel="noopener noreferrer" data-track="dreamless-press" className="btn-ghost">
                <Newspaper size={16} />
                Press kit
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
