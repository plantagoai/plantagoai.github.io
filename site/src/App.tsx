import {
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Github,
  BookOpen,
  Mail,
  Menu,
  X,
  Send,
  Loader2,
  CheckCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Fragment, useState, useEffect, type FormEvent } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";
import {
  useProjects,
  getIconComponent,
  COLORS,
  STATUS_BADGE_CLASSES,
  type Project,
} from "./lib/projects";
import {
  useHomepage,
  defaultAlign,
  SECTION_ANCHORS,
  TONE_TEXT,
  CARD_COLORS,
  WORD_ICONS,
  type SectionId,
  type SectionEntry,
  type HeroContent,
  type DreamlessContent,
  type AboutContent,
  type HeadingContent,
  type ProductsContent,
  type PlatformContent,
  type FounderContent,
  type PhotoContent,
  type StatementContent,
  type NewsletterContent,
  type FooterContent,
  type SharedPackage,
} from "./lib/homeSections";
import { outboundSlug, track, trackSections } from "./lib/track";
import { groupRows, rotationSeconds, rowColumns } from "../../personal-site/src/data/homeContent";
// The same carousel dagangilat.com shows, so the two sites stay identical.
import ProductShowcase from "../../personal-site/src/components/ProductShowcase";

type NavLink = { label: string; href: string };

/* Turns `code` spans in admin-edited copy into <code> elements. */
function InlineCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
          <code key={i} className="font-mono text-foreground/80">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Nav({ navLinks }: { navLinks: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // At rest the bar is transparent so the mesh band reads as one surface
  // (as on foundation-global.com); it only picks up a canvas + hairline
  // once it detaches and starts overlapping content.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled || open
          ? "bg-background/85 backdrop-blur border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <a href="#" className="flex items-center gap-2.5">
          <img
            src="/plantago-logo.png"
            alt="PlantagoAI"
            className="h-8 w-auto"
          />
          <span className="font-semibold text-base tracking-wide">PlantagoAI</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium text-foreground/75 hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-md hover:bg-muted"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-border px-4 py-3 space-y-2 bg-background">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-foreground/75 hover:text-foreground py-1.5"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

/* Hero stats. Foundation's hero pairs the pillar headline with a row of
   white stat cards (ZK / 1:1 / 0.4s); these are the PlantagoAI equivalents,
   carrying the copy that used to sit in the mono one-liner underneath.

   The copy is edited in Admin → Homepage sections. A {packages} or
   {products} in a stat's number is counted from the same data the rest of
   the page renders, so a package added to the Platform section or a product
   toggled in /admin can't leave a stale number in the hero. */
function heroStatValue(value: string, counts: { packages: number; products: number | null }) {
  // useProjects() starts at [] before the Firestore snapshot lands; counting
  // that would flash a confident "0". Show a placeholder until it resolves.
  return value
    .replace(/\{packages\}/g, String(counts.packages))
    .replace(/\{products\}/g, counts.products === null ? "—" : String(counts.products));
}

function Hero({
  content,
  projects,
  loading,
  packageCount,
}: {
  content: HeroContent;
  projects: Project[];
  loading: boolean;
  packageCount: number;
}) {
  const counts = {
    packages: packageCount,
    products: loading ? null : projects.filter((p) => p.enabled).length,
  };

  return (
    <section className="pt-10 pb-14 md:pt-16 md:pb-20">
      {content.badge && (
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur px-3.5 py-1.5 text-sm font-medium text-foreground/80">
          <Sparkles className="w-4 h-4 text-primary" />
          {content.badge}
        </p>
      )}

      <h1 className="mt-6 text-5xl md:text-7xl font-semibold leading-[1.05]">
        {content.lead && <span className="block text-foreground">{content.lead}</span>}
        {content.words.map((word, i) => {
          const Icon = WORD_ICONS[word.icon];
          return (
            <span key={i} className={`flex items-center gap-3 ${TONE_TEXT[word.tone] ?? "text-foreground"}`}>
              {Icon && <Icon className="w-9 h-9 md:w-12 md:h-12 shrink-0" />}
              {word.text}
            </span>
          );
        })}
      </h1>

      {content.description && (
        <p className="mt-7 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {content.description}
        </p>
      )}

      {content.stats.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          {content.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-card px-4 py-3.5 shadow-elevation-1"
            >
              <p className={`text-2xl font-semibold ${TONE_TEXT[stat.tone] ?? "text-foreground"}`}>
                {heroStatValue(stat.value, counts)}
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.note}</p>
            </div>
          ))}
        </div>
      )}

      {(content.primaryLabel || content.secondaryLabel) && (
        <div className="flex flex-wrap items-center gap-3 pt-8">
          {content.primaryLabel && (
            <a
              href={content.primaryHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:opacity-90 transition-opacity"
            >
              {content.primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {content.secondaryLabel && (
            <a
              href={content.secondaryHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-base font-medium hover:bg-muted transition-colors"
            >
              {content.secondaryLabel}
            </a>
          )}
        </div>
      )}
    </section>
  );
}

/* Series banner for Dreamless: The Hush, made with YourContentCreator. Kept
   in the poster's own night palette rather than the site tokens, so it reads
   as the show's key art. */
function DreamlessBanner({ content }: { content: DreamlessContent }) {
  return (
    <section aria-label={content.title} className="scroll-mt-20">
      <a
        href={content.url}
        data-track="dreamless"
        target="_blank"
        rel="noopener noreferrer"
        className="group grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100 shadow-elevation-1"
      >
        <img
          src={content.image}
          alt={content.imageAlt}
          width={600}
          height={840}
          loading="lazy"
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
            <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-teal-400 px-4 py-2.5 text-base font-medium text-slate-950 transition-opacity group-hover:opacity-90">
              {content.buttonLabel}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </a>
    </section>
  );
}

function Statement({ content }: { content: StatementContent }) {
  return (
    <section aria-label={content.eyebrow || content.title} className="scroll-mt-20">
      <figure className="relative overflow-hidden rounded-xl border border-border bg-card p-6 md:p-10 shadow-elevation-1">
        <span
          aria-hidden
          className="align-flip pointer-events-none absolute right-6 -top-4 select-none font-serif text-[10rem] leading-none text-teal-100"
        >
          &ldquo;
        </span>
        <div className="relative">
          {content.eyebrow && <p className="eyebrow mb-2">{content.eyebrow}</p>}
          {content.title && (
            <h2 className="font-semibold text-2xl md:text-3xl text-foreground">{content.title}</h2>
          )}
          <blockquote className="mt-5 space-y-4 border-l-2 border-teal-300 pl-5 max-w-2xl">
            {content.paragraphs.map((p, i) => (
              <p key={i} className="text-base md:text-lg italic text-foreground/80 leading-relaxed">
                {p}
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
                className="h-14 w-14 rounded-full object-cover border border-border"
              />
            )}
            <div className="mr-auto">
              {content.signature && <p className="font-semibold text-foreground">{content.signature}</p>}
              {content.signatureRole && (
                <p className="text-sm text-muted-foreground">{content.signatureRole}</p>
              )}
            </div>
            {content.linkLabel && content.url && (
              <a
                href={content.url}
                data-track="dreamless"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-900"
              >
                {content.linkLabel}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </figcaption>
        </div>
      </figure>
    </section>
  );
}

/** A square portrait, shared by the Photo section and the Founder card. */
function Portrait({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={460}
      height={460}
      loading="lazy"
      className={`shrink-0 rounded-xl object-cover ${className}`}
    />
  );
}

function Photo({ content }: { content: PhotoContent }) {
  if (!content.image) return null;
  return (
    <section aria-label={content.imageAlt || "Photo"} className="scroll-mt-20">
      <figure className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8 rounded-xl border border-border bg-card p-5 md:p-6 shadow-elevation-1">
        <Portrait src={content.image} alt={content.imageAlt} className="h-48 w-48 md:h-56 md:w-56" />
        {content.caption && (
          <figcaption className="text-center sm:text-left text-lg md:text-xl font-medium text-foreground leading-snug whitespace-pre-line">
            {content.caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}

function InfoCards({ cards, columns }: { cards: AboutContent["cards"]; columns: string }) {
  if (cards.length === 0) return null;
  return (
    <div data-align-skip className={`grid ${columns} gap-3`}>
      {cards.map((card, i) => {
        const color = CARD_COLORS[card.color] ?? CARD_COLORS.indigo;
        return (
          <div key={i} className={`p-4 rounded-md border ${color.box}`}>
            <p className={`text-sm font-semibold mb-1 ${color.title}`}>{card.title}</p>
            <p className="text-sm text-muted-foreground">{card.body}</p>
          </div>
        );
      })}
    </div>
  );
}

/* The card grid keeps the page's original widths: four across for About,
   three for Founder. Static strings so Tailwind ships them. */
function cardColumns(count: number): string {
  if (count >= 4) return "md:grid-cols-4";
  if (count === 3) return "md:grid-cols-3";
  if (count === 2) return "md:grid-cols-2";
  return "";
}

function About({ content }: { content: AboutContent }) {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">{content.eyebrow}</p>
          <h2 className="font-semibold text-lg text-foreground">{content.title}</h2>
        </div>
        <div className="p-6 space-y-5">
          {content.paragraphs.map((para, i) => (
            <p key={i} className="text-base text-muted-foreground leading-relaxed">
              {para}
            </p>
          ))}
          <InfoCards cards={content.cards} columns={cardColumns(content.cards.length)} />
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const palette = COLORS[project.colorKey];
  const Icon = getIconComponent(project.iconKey);
  const badgeClass = STATUS_BADGE_CLASSES[project.statusKind];

  return (
    <div data-align-skip className="bg-card border border-border rounded-xl overflow-hidden shadow-elevation-1">
      {/* Header. The edition puts the accent on the icon tile and a hairline
          rule, not a full-bleed gradient band — a saturated band per card was
          the loudest thing separating this page from every other Foundation
          surface, and it forced white-on-colour text for the title and badge. */}
      <div className="p-6 flex items-center gap-4 border-b border-border">
        <div
          className={`w-12 h-12 shrink-0 bg-gradient-to-br ${palette.gradient} rounded-lg flex items-center justify-center shadow-elevation-1`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-foreground font-semibold text-xl">{project.name}</h3>
            {project.statusText && (
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
                {project.statusText}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-base mt-0.5">{project.subtitle}</p>
        </div>
      </div>

      <div className="p-6">
        <p className="text-base text-muted-foreground mb-5">{project.description}</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Highlights */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Key Features
            </h4>
            <div className="space-y-2.5">
              {project.highlights.map((item) => (
                <div key={item} className="flex items-start gap-2 text-base text-foreground/80">
                  <CheckCircle2
                    className={`w-4 h-4 ${palette.checkColor} mt-0.5 shrink-0`}
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stack + Link */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="text-xs font-mono px-2.5 py-1 rounded border bg-muted/50 text-muted-foreground border-border"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  data-track={project.slug}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${palette.accentBg} ${palette.accentColor} border ${palette.accentBorder} text-base hover:opacity-80 transition-opacity`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {project.liveLabel || "Try Live Demo"}
                </a>
              )}
              {project.docsUrl && (
                <a
                  href={project.docsUrl}
                  data-track={`${project.slug}-docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/40 text-foreground/80 border border-border text-base hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Docs
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  data-track={`${project.slug}-source`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/40 text-foreground/80 border border-border text-base hover:text-foreground hover:bg-muted/70 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Source
                </a>
              )}
            </div>
          </div>
        </div>

        {project.packages.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Built on
              </h4>
              <a
                href="#platform"
                className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                @plantagoai →
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.packages.map((pkg) => (
                <code
                  key={pkg}
                  className={`text-xs font-mono px-2 py-1 rounded border ${palette.accentBg} ${palette.accentColor} ${palette.accentBorder}`}
                >
                  @plantagoai/{pkg}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ content }: { content: HeadingContent }) {
  return (
    <div className="text-center">
      {content.eyebrow && <p className="eyebrow mb-2">{content.eyebrow}</p>}
      <h2 className="text-3xl md:text-4xl font-semibold text-foreground">{content.title}</h2>
    </div>
  );
}

function Projects({ content, projects }: { content: ProductsContent; projects: Project[] }) {
  const visible = projects.filter((p) => p.enabled);
  return (
    <section id="products" className="space-y-6 scroll-mt-20">
      <SectionHeading content={content} />

      {content.layout === "carousel" && visible.length > 1 ? (
        <ProductShowcase products={visible} seconds={rotationSeconds(content.rotateSeconds)} />
      ) : (
        <div className="space-y-6">
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}

function formatReleaseDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Releases({ content, projects }: { content: HeadingContent; projects: Project[] }) {
  const shipped = projects.filter((p) => p.enabled && p.version);
  if (shipped.length === 0) return null;

  return (
    <section id="releases" className="scroll-mt-20 space-y-6">
      <SectionHeading content={content} />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {shipped.map((p) => {
            const palette = COLORS[p.colorKey];
            const Icon = getIconComponent(p.iconKey);
            return (
              <div key={p.slug} className="px-5 py-4 flex items-center gap-4">
                <div
                  className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-r ${palette.gradient} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base text-foreground">{p.name}</span>
                    <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${palette.accentBg} ${palette.accentColor} border ${palette.accentBorder}`}>
                      v{p.version}
                    </code>
                    {p.lastReleaseDate && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatReleaseDate(p.lastReleaseDate)}
                      </span>
                    )}
                  </div>
                  {p.releaseNotes && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {p.releaseNotes}
                    </p>
                  )}
                </div>

                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    data-track={p.slug}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md ${palette.accentBg} ${palette.accentColor} border ${palette.accentBorder} hover:opacity-80 transition-opacity shrink-0`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Platform({ content, projects }: { content: PlatformContent; projects: Project[] }) {
  const projectsWithPackages = projects.filter((p) => p.enabled && p.packages.length > 0);
  const sharedPackages: SharedPackage[] = content.packages;

  return (
    <section id="platform" className="scroll-mt-20 space-y-6">
      <div className="text-center">
        {content.eyebrow && <p className="eyebrow mb-2">{content.eyebrow}</p>}
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">{content.title}</h2>
        {content.intro && (
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
            {content.intro}
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">{content.packagesEyebrow}</p>
          <h3 className="font-semibold text-lg text-foreground">{content.packagesTitle}</h3>
        </div>
        <div data-align-skip className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sharedPackages.map((pkg) => (
            <div
              key={pkg.name}
              className={`p-4 rounded-md border ${
                pkg.highlight
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <code className="text-sm font-mono text-foreground">
                  @plantagoai/{pkg.name}
                </code>
                {pkg.highlight && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 tracking-wider">
                    NOTABLE
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pkg.purpose}
              </p>
              {pkg.highlight && (
                <p className="text-xs text-emerald-700 mt-2 italic leading-relaxed">
                  {pkg.highlight}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">{content.reuseEyebrow}</p>
          <h3 className="font-semibold text-lg text-foreground">{content.reuseTitle}</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[32rem]">
            <thead>
              <tr>
                <th className="text-left font-mono text-xs uppercase tracking-wider text-muted-foreground pb-3 pr-4">
                  Package
                </th>
                {projectsWithPackages.map((p) => (
                  <th
                    key={p.slug}
                    className={`font-mono text-xs uppercase tracking-wider pb-3 px-2 text-center ${COLORS[p.colorKey].accentColor}`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sharedPackages
                .filter((pkg) =>
                  projectsWithPackages.some((p) => p.packages.includes(pkg.name)),
                )
                .map((pkg) => (
                  <tr key={pkg.name} className="border-t border-border">
                    <td className="py-2.5 pr-4 font-mono text-sm text-foreground/90">
                      {pkg.name}
                    </td>
                    {projectsWithPackages.map((p) => {
                      const used = p.packages.includes(pkg.name);
                      return (
                        <td key={p.slug} className="py-2.5 px-2 text-center">
                          {used ? (
                            <CheckCircle2
                              className={`w-4 h-4 inline ${COLORS[p.colorKey].checkColor}`}
                            />
                          ) : (
                            <span className="text-muted-foreground/70">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>

          {content.reuseFootnote && (
            <p className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground leading-relaxed">
              <InlineCode text={content.reuseFootnote} />
            </p>
          )}
        </div>
      </div>

      {(content.repoTitle || content.repoBody) && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-elevation-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="font-semibold text-base text-foreground">{content.repoTitle}</h3>
            </div>
            <p className="text-sm text-muted-foreground md:flex-1">
              <InlineCode text={content.repoBody} />
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function Founder({ content }: { content: FounderContent }) {
  return (
    <section id="founder" className="scroll-mt-20">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border flex items-center gap-5">
          {content.image && (
            <Portrait src={content.image} alt={content.imageAlt} className="h-24 w-24 md:h-28 md:w-28" />
          )}
          <div>
            <p className="eyebrow mb-2">{content.eyebrow}</p>
            <h2 className="font-semibold text-lg text-foreground">{content.name}</h2>
            {content.linkLabel && content.linkUrl && (
              <a
                href={content.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {content.linkLabel}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
        <div className="p-6 space-y-5">
          {content.bio && (
            <p className="text-base text-muted-foreground leading-relaxed">{content.bio}</p>
          )}
          <InfoCards cards={content.cards} columns={cardColumns(content.cards.length)} />
        </div>
      </div>
    </section>
  );
}

const OTHER_OPTION = {
  id: "other",
  label: "Other",
  color: "text-muted-foreground border-border bg-muted/50",
};

function ContactForm({ content, projects }: { content: HeadingContent; projects: Project[] }) {
  const projectOptions = [
    ...projects
      .filter((p) => p.enabled)
      .map((p) => {
        const c = COLORS[p.colorKey];
        return {
          id: p.slug,
          label: p.name,
          color: `${c.accentColor} ${c.borderColor} ${c.accentBg}`,
        };
      }),
    OTHER_OPTION,
  ];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || interests.length === 0) return;

    setStatus("sending");
    try {
      await addDoc(collection(db, "contacts"), {
        name: name.trim(),
        email: email.trim(),
        interests,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      track("contact");
      setStatus("sent");
      setName("");
      setEmail("");
      setInterests([]);
      setMessage("");
    } catch (err) {
      console.error("Contact form submit failed:", err);
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="scroll-mt-20">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">{content.eyebrow}</p>
          <h2 className="font-semibold text-lg text-foreground">{content.title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2.5">
              Interested in
            </label>
            <div className="flex flex-wrap gap-2">
              {projectOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleInterest(opt.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    interests.includes(opt.id)
                      ? `${opt.color} ring-1 ring-current`
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {interests.includes(opt.id) && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-muted-foreground mb-1.5">
              Message <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="contact-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors resize-none"
              placeholder="Tell us about your project or idea..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "sent" && <CheckCheck className="w-4 h-4" />}
              {status === "idle" && <Send className="w-4 h-4" />}
              {status === "error" && <AlertCircle className="w-4 h-4" />}
              {status === "sending" ? "Sending..." : status === "sent" ? "Sent!" : status === "error" ? "Try Again" : "Send Message"}
            </button>
            {status === "sent" && (
              <p className="text-sm text-emerald-700">Thank you! We'll get back to you soon.</p>
            )}
            {status === "error" && (
              <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function Newsletter({ content }: { content: NewsletterContent }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "subscribed" | "error">("idle");

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    try {
      await addDoc(collection(db, "subscribers"), {
        email: email.trim(),
        subscribedAt: serverTimestamp(),
        unsubscribeToken: crypto.randomUUID(),
      });
      track("subscribe");
      setStatus("subscribed");
      setEmail("");
    } catch (err) {
      console.error("Newsletter subscribe failed:", err);
      setStatus("error");
    }
  };

  return (
    <section className="scroll-mt-20">
      <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-1">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-base text-foreground">{content.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{content.body}</p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 min-w-0 md:w-auto w-full">
            {status === "subscribed" ? (
              <p className="text-sm text-emerald-700 flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4" />
                Subscribed! You'll hear from us soon.
              </p>
            ) : (
              <>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 md:w-60 px-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors text-sm"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {status === "sending" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Subscribe
                </button>
              </>
            )}
          </form>
        </div>
        {status === "error" && (
          <p className="text-sm text-destructive mt-2">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  );
}

function Footer({ content }: { content: FooterContent }) {
  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {content.brand && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2.5">
              <img
                src="/plantago-logo.png"
                alt="PlantagoAI"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-base tracking-wide">{content.brand}</span>
            </div>
          </div>
        )}

        {content.copyright && (
          <div className={content.brand ? "mt-6 pt-6 border-t border-border text-center" : "text-center"}>
            <p className="text-sm text-muted-foreground">
              {content.copyright.replace(/\{year\}/g, String(new Date().getFullYear()))}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}

/* Foundation's signature hero band: a clipped pastel field with four
   drifting blurred blobs, ending on the diagonal. Honours
   prefers-reduced-motion (see index.css). */
function MeshField({ bleed = false }: { bleed?: boolean }) {
  return (
    <div className={bleed ? "mesh-field mesh-field-bleed" : "mesh-field"} aria-hidden="true">
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="mesh-blob mesh-blob-3" />
      <div className="mesh-blob mesh-blob-4" />
    </div>
  );
}

export function App() {
  const { projects, loading } = useProjects();
  const { homepage, loading: homepageLoading } = useHomepage();
  const { sections, content } = homepage;
  const visible = sections.filter((s) => s.visible);

  // The menu follows the page: visible sections in page order, under the
  // label set in Admin. Releases only renders when a product has a version.
  const releasesShown = projects.some((p) => p.enabled && p.version);
  const navLinks: NavLink[] = visible.flatMap(({ id }) => {
    const anchor = SECTION_ANCHORS[id];
    const label = (content[id] as { navLabel?: string }).navLabel?.trim();
    if (!anchor || !label || (id === "releases" && !releasesShown)) return [];
    return [{ label, href: `#${anchor}` }];
  });
  const sectionKey = visible.map((s) => s.id).join(",");
  // The pastel band belongs to the hero: behind the nav while the hero leads
  // the page, behind the hero wherever it is moved, gone when it is hidden.
  const heroOnTop = homepageLoading || visible[0]?.id === "hero";
  // The footer stays full width under the page while it is last.
  const lastSection = visible[visible.length - 1];
  const footerLast = lastSection?.id === "footer" && !lastSection.sideBySide;
  const inMain = footerLast ? visible.slice(0, -1) : visible;
  // Sections marked "side by side" in Admin share a row with the one above.
  const rows = groupRows(inMain);

  useEffect(() => {
    track("page");
  }, []);

  // Sections reached, once per session each. Re-run as sections appear,
  // move or hide once the homepage settings load.
  useEffect(
    () =>
      trackSections(
        visible.map((s) => SECTION_ANCHORS[s.id]).filter((a): a is string => a !== null),
      ),
    [sectionKey, loading, homepageLoading],
  );

  // Clicks on links that leave the site (project demos, docs, source,
  // the founder's profiles). Project links carry data-track={slug}.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !/^https?:$/.test(a.protocol) || a.host === window.location.host) return;
      const slug = outboundSlug(a.href, a.dataset.track);
      if (slug) track("outbound", slug);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Alignment set in Admin; a section left at its own default keeps its
  // markup untouched.
  const alignOf = (s: SectionEntry) => (s.align === defaultAlign(s.id) ? undefined : s.align);
  const renderAligned = (s: SectionEntry) =>
    alignOf(s) ? <div data-align={alignOf(s)}>{renderSection(s.id)}</div> : renderSection(s.id);

  const renderSection = (id: SectionId) => {
    switch (id) {
      case "hero": {
        const hero = (
          <Hero
            content={content.hero}
            projects={projects}
            loading={loading}
            packageCount={content.platform.packages.length}
          />
        );
        if (heroOnTop) return hero;
        // Moved down the page: the band travels with the hero, full width.
        return (
          <div className="relative">
            <MeshField bleed />
            <div className="relative z-[1]">{hero}</div>
          </div>
        );
      }
      case "dreamless":
        return <DreamlessBanner content={content.dreamless} />;
      case "about":
        return <About content={content.about} />;
      case "products":
        return <Projects content={content.products} projects={projects} />;
      case "releases":
        return <Releases content={content.releases} projects={projects} />;
      case "platform":
        return <Platform content={content.platform} projects={projects} />;
      case "statement":
        return <Statement content={content.statement} />;
      case "photo":
        return <Photo content={content.photo} />;
      case "founder":
        return <Founder content={content.founder} />;
      case "contact":
        return <ContactForm content={content.contact} projects={projects} />;
      case "newsletter":
        return <Newsletter content={content.newsletter} />;
      case "footer":
        return <Footer content={content.footer} />;
    }
  };

  return (
    <div className="min-h-screen bg-background mesh-hero">
      {heroOnTop && <MeshField />}
      <Nav navLinks={navLinks} />
      <main className="p-6 lg:p-8 max-w-5xl mx-auto space-y-10 animate-fade-in">
        {/* Wait for the saved layout, so a section hidden or edited in Admin
            never flashes its default copy first. */}
        {!homepageLoading &&
          rows.map((row) =>
            row.length === 1 ? (
              <Fragment key={row[0].id}>{renderAligned(row[0])}</Fragment>
            ) : (
              <div
                key={row.map((s) => s.id).join("+")}
                className="grid grid-cols-1 items-start gap-10 md:gap-6 md:[grid-template-columns:var(--row-cols)]"
                style={{ "--row-cols": rowColumns(row.map((s) => s.id)) } as React.CSSProperties}
              >
                {row.map((s) => (
                  <div key={s.id} data-align={alignOf(s)} className="min-w-0">
                    {renderSection(s.id)}
                  </div>
                ))}
              </div>
            ),
          )}
      </main>
      {!homepageLoading && footerLast && renderAligned(lastSection)}
    </div>
  );
}
