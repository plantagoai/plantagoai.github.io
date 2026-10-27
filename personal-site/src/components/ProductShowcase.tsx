/* The product carousel both sites show, so the two always look the same:
   plantagoai.com → "Current Products" and dagangilat.com → "What I'm
   building" (site/src/App.tsx imports it from here). Products come from the
   Firestore `projects` collection, edited in plantagoai.com/admin → Products.

   One card at a time (who it is and the links on the left, key features on
   the right), advancing on a timer that pauses on hover or focus. */
import { useEffect, useState, type CSSProperties } from "react";
import {
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  DatabaseBackup,
  ExternalLink,
  Github,
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
import "./ProductShowcase.css";

/** The fields of a plantagoai.com project the card shows. */
export interface ShowcaseProduct {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  iconKey: string;
  colorKey: string;
  highlights: string[];
  statusKind: string;
  statusText: string;
  version: string | null;
  liveUrl: string | null;
  liveLabel: string | null;
  docsUrl?: string | null;
  repoUrl?: string | null;
}

/* Same keys as site/src/lib/projects.ts. */
const ICONS: Record<string, LucideIcon> = {
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

/* plantagoai.com's palettes (site/src/lib/projects.ts COLORS) as values:
   icon gradient, check, link text, link wash and its hairline, progress bar. */
type Palette = { from: string; to: string; check: string; text: string; wash: string; line: string; dot: string };
const indigo: Palette = { from: "#6366f1", to: "#3b82f6", check: "#4f46e5", text: "#4338ca", wash: "#eef2ff", line: "#c7d2fe", dot: "#6366f1" };
const PALETTES: Record<string, Palette> = {
  violet: indigo,
  indigo,
  emerald: { from: "#10b981", to: "#14b8a6", check: "#059669", text: "#047857", wash: "#ecfdf5", line: "#a7f3d0", dot: "#10b981" },
  amber: { from: "#f59e0b", to: "#f97316", check: "#d97706", text: "#b45309", wash: "#fffbeb", line: "#fde68a", dot: "#f59e0b" },
  cyan: { from: "#06b6d4", to: "#3b82f6", check: "#0891b2", text: "#0e7490", wash: "#ecfeff", line: "#a5f3fc", dot: "#06b6d4" },
  sky: { from: "#0ea5e9", to: "#06b6d4", check: "#0284c7", text: "#0369a1", wash: "#f0f9ff", line: "#bae6fd", dot: "#0ea5e9" },
  rose: { from: "#f43f5e", to: "#ec4899", check: "#e11d48", text: "#be123c", wash: "#fff1f2", line: "#fecdd3", dot: "#f43f5e" },
  pink: { from: "#ec4899", to: "#f43f5e", check: "#db2777", text: "#be185d", wash: "#fdf2f8", line: "#fbcfe8", dot: "#ec4899" },
  teal: { from: "#14b8a6", to: "#10b981", check: "#0d9488", text: "#0f766e", wash: "#f0fdfa", line: "#99f6e4", dot: "#14b8a6" },
  orange: { from: "#f97316", to: "#ef4444", check: "#ea580c", text: "#c2410c", wash: "#fff7ed", line: "#fed7aa", dot: "#f97316" },
};

/* Stage badge colours (site/src/lib/projects.ts STATUS_BADGE_CLASSES). */
const BADGES: Record<string, CSSProperties> = {
  inprogress: { background: "#f1f1f3", color: "#1d1d1f", borderColor: "#e5e5e7" },
  alpha: { background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" },
  beta: { background: "#f0f9ff", color: "#075985", borderColor: "#bae6fd" },
  invitation: { background: "#eef2ff", color: "#3730a3", borderColor: "#c7d2fe" },
  production: { background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" },
};

const MAX_FEATURES = 4;

function paletteVars(colorKey: string): CSSProperties {
  const p = PALETTES[colorKey] ?? indigo;
  return {
    "--ps-from": p.from,
    "--ps-to": p.to,
    "--ps-check": p.check,
    "--ps-text": p.text,
    "--ps-wash": p.wash,
    "--ps-wash-line": p.line,
    "--ps-dot": p.dot,
  } as CSSProperties;
}

/** "PORTFOLIO / Current Products": the heading above the carousel.
 *  `align` is the section's default; an Admin alignment overrides it. */
export function ProductShowcaseHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center" | "right";
}) {
  if (!eyebrow && !title) return null;
  return (
    <div className="ps ps-heading" style={{ "--ps-align": align } as CSSProperties}>
      {eyebrow && <p className="ps-eyebrow">{eyebrow}</p>}
      {title && <h2 className="ps-title">{title}</h2>}
    </div>
  );
}

export function ProductShowcaseCard({ product: p }: { product: ShowcaseProduct }) {
  const Icon = ICONS[p.iconKey] ?? Landmark;
  return (
    <div data-align-skip className="ps-card" style={paletteVars(p.colorKey)}>
      <div className="ps-main">
        <div className="ps-who">
          <div className="ps-icon">
            <Icon size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 className="ps-name">{p.name}</h3>
            {p.subtitle && <p className="ps-subtitle">{p.subtitle}</p>}
          </div>
        </div>
        {p.statusText && (
          <span className="ps-badge" style={BADGES[p.statusKind] ?? BADGES.inprogress}>
            {p.statusText}
            {p.version && <span className="ps-badge-version"> · v{p.version}</span>}
          </span>
        )}
        {p.description && <p className="ps-description">{p.description}</p>}
        <div className="ps-links">
          {p.liveUrl && (
            <a href={p.liveUrl} data-track={p.slug} target="_blank" rel="noopener noreferrer" className="ps-link ps-link-live">
              <ExternalLink size={16} />
              {p.liveLabel || "Try Live Demo"}
            </a>
          )}
          {p.docsUrl && (
            <a href={p.docsUrl} data-track={`${p.slug}-docs`} target="_blank" rel="noopener noreferrer" className="ps-link">
              <BookOpen size={16} />
              Docs
            </a>
          )}
          {p.repoUrl && (
            <a href={p.repoUrl} data-track={`${p.slug}-source`} target="_blank" rel="noopener noreferrer" className="ps-link">
              <Github size={16} />
              Source
            </a>
          )}
        </div>
      </div>
      {p.highlights.length > 0 && (
        <div>
          <h4 className="ps-features-label">Key Features</h4>
          <ul className="ps-features">
            {p.highlights.slice(0, MAX_FEATURES).map((item, i) => (
              <li key={i}>
                <CheckCircle2 className="ps-check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function ProductShowcase({ products, seconds }: { products: ShowcaseProduct[]; seconds: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion] = useState(prefersReducedMotion);
  const count = products.length;
  const current = Math.min(index, count - 1);
  const go = (i: number) => setIndex(((i % count) + count) % count);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), seconds * 1000);
    return () => clearTimeout(t);
  }, [index, paused, count, seconds]);

  if (count === 0) return null;

  return (
    <div
      className="ps"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="ps-stage">
        {products.map((p, i) => (
          <div
            key={p.slug || i}
            className="ps-slide"
            aria-hidden={i !== current}
            aria-label={`${i + 1} of ${count}: ${p.name}`}
          >
            <ProductShowcaseCard product={p} />
          </div>
        ))}
        {count > 1 && !paused && !reduceMotion && (
          <div className="ps-progress" style={paletteVars(products[current].colorKey)}>
            <div key={current} style={{ animationDuration: `${seconds}s` }} />
          </div>
        )}
      </div>
      {count > 1 && (
        <div className="ps-controls">
          <div className="ps-dots">
            {products.map((p, i) => (
              <button
                key={p.slug || i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${p.name}`}
                aria-current={i === current}
                className="ps-dot"
              />
            ))}
          </div>
          <div className="ps-arrows">
            <button type="button" onClick={() => go(current - 1)} aria-label="Previous product" className="ps-arrow">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => go(current + 1)} aria-label="Next product" className="ps-arrow">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
