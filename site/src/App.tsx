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
  AudioLines,
  Wallet,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./lib/firebase";
import {
  useProjects,
  getIconComponent,
  COLORS,
  STATUS_BADGE_CLASSES,
  type Project,
} from "./lib/projects";
import { useSiteSettings } from "./lib/siteSettings";
import { outboundSlug, track, trackSections } from "./lib/track";

function useNavLinks(): { label: string; href: string }[] {
  const { settings } = useSiteSettings();
  return [
    { label: "About", href: "#about" },
    { label: "Products", href: "#products" },
    ...(settings.releasesEnabled ? [{ label: "Releases", href: "#releases" }] : []),
    { label: "Platform", href: "#platform" },
    { label: "Founder", href: "#founder" },
    { label: "Contact", href: "#contact" },
  ];
}

type SharedPackage = { name: string; purpose: string; highlight?: string };

const sharedPackages: SharedPackage[] = [
  {
    name: "firebase-core",
    purpose: "Firebase init, Firestore CRUD helpers, tenant-scoped queries, admin SDK.",
  },
  {
    name: "auth",
    purpose: "Ring-based permissions (0–4), OAuth flows, multi-tenant middleware.",
  },
  {
    name: "payments",
    purpose: "Braintree gateway, Apple/Google Pay, subscription lifecycle.",
  },
  {
    name: "ai",
    purpose: "Claude with prompt caching + Gemini vision, usage tracking.",
    highlight: "Prompt caching as a shared primitive across products.",
  },
  {
    name: "messaging",
    purpose: "Email (Resend), push (FCM), in-app notifications.",
  },
  {
    name: "db",
    purpose: "Zod schema validation, referential integrity, auto-fix.",
    highlight: "Zod schemas compile to Firestore security rules.",
  },
  {
    name: "i18n",
    purpose: "i18next UI + Gemini AI content translation, lazy cached.",
  },
  {
    name: "legal",
    purpose: "Privacy / ToS generation, acceptance tracking.",
    highlight: "Drop-in <TosGate> React component for compliance.",
  },
  {
    name: "flows",
    purpose: "XState v5 state-machine factory, Firestore persistence.",
    highlight: "State machines as durable, resumable Firestore documents.",
  },
  {
    name: "seeders",
    purpose: "Data seeding from JSON/CSV/API with Zod validation.",
  },
  {
    name: "testing",
    purpose: "Vitest helpers, Firebase emulator mgmt, mock factories.",
  },
  {
    name: "e2e",
    purpose: "Playwright helpers, flow-driven test generation.",
  },
];


function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navLinks = useNavLinks();

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

   Only "1 shared platform" is a constant — it is the claim itself, not a
   count. The other two are derived from the same data the rest of the page
   renders, so a package added to the Platform section or a product toggled
   in /admin can't leave a stale number in the hero. */
function useHeroStats(projects: Project[], loading: boolean) {
  // useProjects() starts at [] before the Firestore snapshot lands; counting
  // that would flash a confident "0". Show a placeholder until it resolves.
  const visibleProducts = projects.filter((p) => p.enabled).length;
  const pending = loading ? "—" : null;

  return [
    {
      value: "1",
      label: "Shared platform",
      note: "Built once, reused everywhere",
      tone: "text-emerald-700",
    },
    {
      value: String(sharedPackages.length),
      label: "TypeScript packages",
      note: "Auth, payments, AI, compliance",
      tone: "text-teal-700",
    },
    {
      value: pending ?? String(visibleProducts),
      label: visibleProducts === 1 && !pending ? "Product in parallel" : "Products in parallel",
      note: "No corners cut on the basics",
      tone: "text-cyan-700",
    },
  ];
}

function Hero({ projects, loading }: { projects: Project[]; loading: boolean }) {
  const heroStats = useHeroStats(projects, loading);

  return (
    <section className="pt-10 pb-14 md:pt-16 md:pb-20">
      <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur px-3.5 py-1.5 text-sm font-medium text-foreground/80">
        <Sparkles className="w-4 h-4 text-primary" />
        Shared AI and identity infrastructure
      </p>

      <h1 className="mt-6 text-5xl md:text-7xl font-semibold leading-[1.05]">
        <span className="block text-foreground">Your</span>
        <span className="flex items-center gap-3 text-indigo-600">
          <AudioLines className="w-9 h-9 md:w-12 md:h-12 shrink-0" />
          Voice.
        </span>
        <span className="flex items-center gap-3 text-teal-700">
          <Wallet className="w-9 h-9 md:w-12 md:h-12 shrink-0" />
          Share.
        </span>
        <span className="flex items-center gap-3 text-cyan-700">
          <ShoppingCart className="w-9 h-9 md:w-12 md:h-12 shrink-0" />
          Market.
        </span>
      </h1>

      <p className="mt-7 text-lg text-muted-foreground max-w-2xl leading-relaxed">
        The core shared AI and identity infrastructure for verified-human ecosystems —
        twelve TypeScript packages handling auth, payments, AI with prompt caching,
        i18n, compliance, and testing.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
        {heroStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card px-4 py-3.5 shadow-elevation-1"
          >
            <p className={`text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{stat.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-8">
        <a
          href="#products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:opacity-90 transition-opacity"
        >
          View Products
          <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-base font-medium hover:bg-muted transition-colors"
        >
          Get in Touch
        </a>
      </div>
    </section>
  );
}

const DREAMLESS_URL = "https://dreamless.micromedia-ai.com";

/* Series banner for Dreamless: The Hush, made with YourContentCreator. Kept
   in the poster's own night palette rather than the site tokens, so it reads
   as the show's key art. Toggled in Admin → Site settings. */
function DreamlessBanner() {
  return (
    <section aria-label="Dreamless: The Hush" className="scroll-mt-20">
      <a
        href={DREAMLESS_URL}
        data-track="dreamless"
        target="_blank"
        rel="noopener noreferrer"
        className="group grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100 shadow-elevation-1"
      >
        <img
          src="/dreamless-poster.webp"
          alt="Dreamless: The Hush poster — Kai and his robot Tofu on a balcony above a sleeping city at night"
          width={600}
          height={840}
          loading="lazy"
          className="w-full h-full max-h-96 sm:max-h-none object-cover object-top"
        />
        <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-teal-300">
            New series · Now airing
          </p>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-wide text-white">
              Dreamless: The Hush
            </h2>
            <p className="mt-2 text-lg italic text-slate-300">One in a million can't dream.</p>
          </div>
          <p className="text-base text-slate-300 leading-relaxed max-w-xl">
            When the world falls into the Hush, a sleep nobody wakes from, Kai and his robot
            Tofu keep watch over a city gone quiet. A 28-episode AI-animated anime series,
            about a minute an episode, made with YourContentCreator — every episode written,
            drawn, voiced and scored by AI agents and reviewed by a person.
          </p>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-teal-400 px-4 py-2.5 text-base font-medium text-slate-950 transition-opacity group-hover:opacity-90">
            Watch the series
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </a>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">
            About
          </p>
          <h2 className="font-semibold text-lg text-foreground">
            The shared AI and identity layer for verified-human ecosystems
          </h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-base text-muted-foreground leading-relaxed">
            PlantagoAI is the core shared AI and identity infrastructure that powers
            verified-human ecosystems and decentralized applications. A comprehensive
            shared-package architecture — authentication, payments, messaging, AI with
            prompt caching, multi-tenant flows — built once and reused across every product
            that needs it.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            Built to bridge Web2 cloud infrastructure with Web3 protocols. Powers Foundation
            (verified-human governance on Solana) and adjacent products that need the same
            identity, AI, and compliance primitives.
          </p>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="p-4 rounded-md bg-indigo-50 border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">Verified-Human Identity</p>
              <p className="text-sm text-muted-foreground">
                ZK identity primitives via Self Protocol passport verification.
                Sybil-resistant attestation reused across downstream products.
              </p>
            </div>
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-700 mb-1">AI Layer</p>
              <p className="text-sm text-muted-foreground">
                Anthropic Claude with prompt caching as shared infrastructure.
                Cost-efficient LLM workloads, usage tracking, multi-tenant.
              </p>
            </div>
            <div className="p-4 rounded-md bg-cyan-50 border border-cyan-200">
              <p className="text-sm font-semibold text-cyan-700 mb-1">Governance & Distribution</p>
              <p className="text-sm text-muted-foreground">
                On-chain governance and verified-human payouts on Solana via
                Anchor and Rust. Auditable, sybil-resistant, anonymous voting.
              </p>
            </div>
            <div className="p-4 rounded-md bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-amber-700 mb-1">Web2 ↔ Web3 Bridge</p>
              <p className="text-sm text-muted-foreground">
                Scalable backend services bridging Cloud Functions and Firestore
                with Solana on-chain programs. Reusable across products.
              </p>
            </div>
          </div>
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
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-elevation-1">
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

function Projects({ projects }: { projects: Project[] }) {
  const visible = projects.filter((p) => p.enabled);
  return (
    <section id="products" className="space-y-6 scroll-mt-20">
      <div className="text-center">
        <p className="eyebrow mb-2">
          Portfolio
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Current Products
        </h2>
      </div>

      <div className="space-y-6">
        {visible.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
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

function Releases({ projects }: { projects: Project[] }) {
  const shipped = projects.filter((p) => p.enabled && p.version);
  if (shipped.length === 0) return null;

  return (
    <section id="releases" className="scroll-mt-20 space-y-6">
      <div className="text-center">
        <p className="eyebrow mb-2">
          Releases
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Latest Releases
        </h2>
      </div>

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

function Platform({ projects }: { projects: Project[] }) {
  const projectsWithPackages = projects.filter((p) => p.enabled && p.packages.length > 0);

  return (
    <section id="platform" className="scroll-mt-20 space-y-6">
      <div className="text-center">
        <p className="eyebrow mb-2">
          Platform
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          @plantagoai — Shared Infrastructure
        </h2>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
          Twelve TypeScript packages, consumed by every product via workspace links.
          Build once, reuse everywhere — five products shipping in parallel without
          cutting corners on auth, compliance, or testing.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">
            Packages
          </p>
          <h3 className="font-semibold text-lg text-foreground">
            12 libraries, shared via workspace links
          </h3>
        </div>
        <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
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
          <p className="eyebrow mb-2">
            Reuse
          </p>
          <h3 className="font-semibold text-lg text-foreground">
            Which packages power which products
          </h3>
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

          <p className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground leading-relaxed">
            <code className="font-mono text-foreground/80">@plantagoai/testing</code>{" "}
            powers the tests of every package above — 11 internal consumers, intentionally hidden from the product graph.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 shadow-elevation-1">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-emerald-600 shrink-0" />
            <h3 className="font-semibold text-base text-foreground">
              Currently a private monorepo
            </h3>
          </div>
          <p className="text-sm text-muted-foreground md:flex-1">
            Select packages (<code className="font-mono text-foreground/80">flows</code>,{" "}
            <code className="font-mono text-foreground/80">legal</code>,{" "}
            <code className="font-mono text-foreground/80">seeders</code>) are strong
            candidates for open-source release. Get in touch if interested.
          </p>
        </div>
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section id="founder" className="scroll-mt-20">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/70 p-5 border-b border-border">
          <p className="eyebrow mb-2">
            Founder
          </p>
          <h2 className="font-semibold text-lg text-foreground">Dagan Gilat</h2>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-base text-muted-foreground leading-relaxed">
            Hands-on founder, architect, and researcher with 25+ years building production
            systems at the intersection of distributed systems, cloud infrastructure, and
            applied AI. Track record of taking research from whiteboard to shipped product —
            IBM cloud platforms generating $100M+ in revenue, ML-driven cloud-AI products at
            Toga Networks, and a current verified-human governance stack on Solana. Deep
            expertise in Rust and Go; comfortable from kernel-adjacent code up to founder-level
            product strategy.
          </p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-4 rounded-md bg-indigo-50 border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">Distributed Systems & Cloud</p>
              <p className="text-sm text-muted-foreground">
                Senior Manager, Cloud Platforms at IBM Research (OpenStack, virtualization,
                storage, networking). CTO Machine Learning at Toga Networks. Microservices,
                gRPC, Kubernetes — Rust and Go.
              </p>
            </div>
            <div className="p-4 rounded-md bg-indigo-50 border border-indigo-200">
              <p className="text-sm font-semibold text-indigo-700 mb-1">Blockchain & Solana</p>
              <p className="text-sm text-muted-foreground">
                Verified-human governance and identity on Solana. On-chain programs in
                Anchor / Rust; off-chain in Cloud Functions and Firestore. Earlier: PKI and
                core network functions at HyperMesh.
              </p>
            </div>
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-700 mb-1">Applied AI & ML</p>
              <p className="text-sm text-muted-foreground">
                Anthropic Claude with prompt caching as shared infrastructure across products.
                Earlier: reinforcement-learning and deep-learning auto-scaling productized at
                Toga Networks (PyTorch, TensorFlow, Keras, Spark).
              </p>
            </div>
          </div>
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

function ContactForm({ projects }: { projects: Project[] }) {
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
          <p className="eyebrow mb-2">
            Contact
          </p>
          <h2 className="font-semibold text-lg text-foreground">Get in Touch</h2>
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

function Newsletter() {
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
              <h3 className="font-semibold text-base text-foreground">Stay Updated</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Subscribe to the PlantagoAI newsletter for project updates, launches, and insights.
            </p>
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

function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <img
              src="/plantago-logo.png"
              alt="PlantagoAI"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-base tracking-wide">PlantagoAI</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Copyright &copy; {new Date().getFullYear()} PlantagoAI &mdash; All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function App() {
  const { projects, loading } = useProjects();
  const { settings } = useSiteSettings();

  useEffect(() => {
    track("page");
  }, []);

  // Sections reached, once per session each. Re-run as optional sections
  // (Releases) appear once settings load.
  useEffect(
    () => trackSections(["about", "products", "releases", "platform", "founder", "contact"]),
    [settings.releasesEnabled, loading],
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

  return (
    <div className="min-h-screen bg-background mesh-hero">
      {/* Foundation's signature hero band: a clipped pastel field with four
          drifting blurred blobs. Sits behind the nav and hero, ends on the
          diagonal. Honours prefers-reduced-motion (see index.css). */}
      <div className="mesh-field" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
        <div className="mesh-blob mesh-blob-4" />
      </div>
      <Nav />
      <main className="p-6 lg:p-8 max-w-5xl mx-auto space-y-10 animate-fade-in">
        <Hero projects={projects} loading={loading} />
        {settings.dreamlessBannerEnabled && <DreamlessBanner />}
        <About />
        <Projects projects={projects} />
        {settings.releasesEnabled && <Releases projects={projects} />}
        <Platform projects={projects} />
        <Founder />
        <ContactForm projects={projects} />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
