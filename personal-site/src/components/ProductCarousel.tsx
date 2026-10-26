import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Brain,
  Briefcase,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  DatabaseBackup,
  Globe,
  Heart,
  Landmark,
  Rocket,
  Shield,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Product } from "../lib/products";

/* Same icon and colour keys as plantagoai.com's products (site/src/lib/projects.ts). */
const PRODUCT_ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  heart: Heart,
  "shopping-cart": ShoppingCart,
  building: Building2,
  compass: Compass,
  rocket: Rocket,
  sparkles: Sparkles,
  briefcase: Briefcase,
  globe: Globe,
  zap: Zap,
  shield: Shield,
  brain: Brain,
  clapperboard: Clapperboard,
  "database-backup": DatabaseBackup,
  "trending-up": TrendingUp,
};

const PRODUCT_COLORS: Record<string, string> = {
  violet: "#4f46e5",
  indigo: "#4f46e5",
  emerald: "#059669",
  teal: "#0d9488",
  amber: "#d97706",
  orange: "#ea580c",
  cyan: "#0891b2",
  sky: "#0284c7",
  rose: "#e11d48",
  pink: "#db2777",
};

const MAX_FEATURES = 4;

export default function ProductCarousel({ products, seconds }: { products: Product[]; seconds: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const count = products.length;
  const go = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), seconds * 1000);
    return () => clearTimeout(t);
  }, [index, paused, count, seconds]);

  const p = products[Math.min(index, count - 1)];
  const Icon = PRODUCT_ICONS[p.iconKey] ?? Sparkles;
  const color = PRODUCT_COLORS[p.colorKey] ?? PRODUCT_COLORS.indigo;

  return (
    <div
      className="mt-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-bg">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={p.slug || index}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="grid gap-6 p-6 md:min-h-[20rem] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10 md:p-8"
            aria-label={`${index + 1} of ${count}: ${p.name}`}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: color }}
                >
                  <Icon size={24} strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold" style={{ color }}>
                    {p.name}
                  </h3>
                  {p.subtitle && <p className="text-sm text-muted">{p.subtitle}</p>}
                </div>
              </div>
              {p.stage && (
                <p className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-ink">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  {p.stage}
                  {p.version && <span className="text-muted">v{p.version}</span>}
                </p>
              )}
              {p.description && <p className="mt-4 text-sm leading-relaxed text-ink/80">{p.description}</p>}
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track={p.slug}
                  className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ background: color }}
                >
                  {p.urlLabel}
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            {p.highlights.length > 0 && (
              <div>
                <p className="text-meta uppercase tracking-[0.18em]">Main features</p>
                <ul className="mt-3 space-y-2.5">
                  {p.highlights.slice(0, MAX_FEATURES).map((h, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-ink/85">
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color }} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.article>
        </AnimatePresence>
        {count > 1 && !paused && !reduceMotion && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border/60">
            <motion.div
              key={index}
              className="h-full"
              style={{ background: color }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: seconds, ease: "linear" }}
            />
          </div>
        )}
      </div>
      {count > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {products.map((q, i) => (
              <button
                key={q.slug || i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${q.name}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-ink" : "w-2 bg-border hover:bg-muted"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous product"
              className="rounded-full border border-border p-1.5 text-muted transition hover:border-ink hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next product"
              className="rounded-full border border-border p-1.5 text-muted transition hover:border-ink hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
