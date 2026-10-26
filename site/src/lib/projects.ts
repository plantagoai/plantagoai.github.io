import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Landmark,
  Heart,
  ShoppingCart,
  Building2,
  Compass,
  Rocket,
  Sparkles,
  Briefcase,
  Globe,
  Zap,
  Shield,
  Brain,
  Clapperboard,
  DatabaseBackup,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const ICON_KEYS = [
  "landmark",
  "heart",
  "shopping-cart",
  "building",
  "compass",
  "rocket",
  "sparkles",
  "briefcase",
  "globe",
  "zap",
  "shield",
  "brain",
  "clapperboard",
  "database-backup",
  "trending-up",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

export const ICON_MAP: Record<IconKey, LucideIcon> = {
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

export function getIconComponent(key: IconKey): LucideIcon {
  return ICON_MAP[key] ?? Landmark;
}

export const COLOR_KEYS = [
  "violet",
  "emerald",
  "amber",
  "cyan",
  "sky",
  "rose",
  "indigo",
  "pink",
  "teal",
  "orange",
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];

export interface ColorPalette {
  gradient: string;
  borderColor: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  dotColor: string;
  checkColor: string;
}

/* Light-edition palettes. Fills stay at the 500/600 level (they carry white
   glyphs); everything that renders as text or a hairline on the #fff card is
   at 700/200, which clears 4.5:1 on the card and on its own -50 wash. The
   previous -400 text / -500/10 washes were tuned for a near-black canvas and
   landed around 2:1 once the ground flipped. `violet` resolves to indigo so
   no purple survives — the key stays because it is persisted per project in
   Firestore. */
export const COLORS: Record<ColorKey, ColorPalette> = {
  violet: {
    gradient: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-200",
    accentColor: "text-indigo-700",
    accentBg: "bg-indigo-50",
    accentBorder: "border-indigo-200",
    dotColor: "bg-indigo-500",
    checkColor: "text-indigo-600",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-200",
    accentColor: "text-emerald-700",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    dotColor: "bg-emerald-500",
    checkColor: "text-emerald-600",
  },
  amber: {
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-200",
    accentColor: "text-amber-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    dotColor: "bg-amber-500",
    checkColor: "text-amber-600",
  },
  cyan: {
    gradient: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-200",
    accentColor: "text-cyan-700",
    accentBg: "bg-cyan-50",
    accentBorder: "border-cyan-200",
    dotColor: "bg-cyan-500",
    checkColor: "text-cyan-600",
  },
  sky: {
    gradient: "from-sky-500 to-cyan-500",
    borderColor: "border-sky-200",
    accentColor: "text-sky-700",
    accentBg: "bg-sky-50",
    accentBorder: "border-sky-200",
    dotColor: "bg-sky-500",
    checkColor: "text-sky-600",
  },
  rose: {
    gradient: "from-rose-500 to-pink-500",
    borderColor: "border-rose-200",
    accentColor: "text-rose-700",
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    dotColor: "bg-rose-500",
    checkColor: "text-rose-600",
  },
  indigo: {
    gradient: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-200",
    accentColor: "text-indigo-700",
    accentBg: "bg-indigo-50",
    accentBorder: "border-indigo-200",
    dotColor: "bg-indigo-500",
    checkColor: "text-indigo-600",
  },
  pink: {
    gradient: "from-pink-500 to-rose-500",
    borderColor: "border-pink-200",
    accentColor: "text-pink-700",
    accentBg: "bg-pink-50",
    accentBorder: "border-pink-200",
    dotColor: "bg-pink-500",
    checkColor: "text-pink-600",
  },
  teal: {
    gradient: "from-teal-500 to-emerald-500",
    borderColor: "border-teal-200",
    accentColor: "text-teal-700",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-200",
    dotColor: "bg-teal-500",
    checkColor: "text-teal-600",
  },
  orange: {
    gradient: "from-orange-500 to-red-500",
    borderColor: "border-orange-200",
    accentColor: "text-orange-700",
    accentBg: "bg-orange-50",
    accentBorder: "border-orange-200",
    dotColor: "bg-orange-500",
    checkColor: "text-orange-600",
  },
};

export const STATUS_KINDS = [
  "inprogress",
  "alpha",
  "beta",
  "invitation",
  "production",
] as const;

export type StatusKind = (typeof STATUS_KINDS)[number];

export const STATUS_LABELS: Record<StatusKind, string> = {
  inprogress: "In Development",
  alpha: "Alpha",
  beta: "Beta",
  invitation: "By Invitation",
  production: "Production",
};

export const STATUS_BADGE_CLASSES: Record<StatusKind, string> = {
  inprogress: "bg-secondary text-secondary-foreground border-border",
  alpha: "bg-amber-50 text-amber-800 border-amber-200",
  beta: "bg-sky-50 text-sky-800 border-sky-200",
  invitation: "bg-indigo-50 text-indigo-800 border-indigo-200",
  production: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export interface Project {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  iconKey: IconKey;
  colorKey: ColorKey;
  stack: string[];
  highlights: string[];
  packages: string[];
  landingUrl: string | null;
  liveUrl: string | null;
  liveLabel: string | null;
  docsUrl?: string | null;
  repoUrl?: string | null;
  statusKind: StatusKind;
  statusText: string;
  enabled: boolean;
  order: number;
  version: string | null;
  lastReleaseDate: string | null;
  releaseNotes: string | null;
}

export const DEFAULT_PROJECTS: Project[] = [
  {
    slug: "nomadex",
    name: "Nomadex",
    subtitle: "Compare Cities. Live Smarter.",
    description:
      "iOS app that helps digital nomads, relocating families, and travelers find the best places to live, work, and travel. 1,280 cities across 128 countries ranked on 18 quality-of-life dimensions, powered by 16 verified public data sources (World Bank, UN, UNESCO, OpenStreetMap).",
    iconKey: "compass",
    colorKey: "sky",
    stack: ["Swift", "SwiftUI", "iOS 17.6+", "iPadOS", "macOS", "visionOS"],
    highlights: [
      "Compare 1,280 cities across 18 quality-of-life categories",
      "Personalized top-10 rankings for nomads, families, couples, solo travelers",
      "Side-by-side city comparisons with radar charts and score tables",
      "AI City Explorer — natural language queries about ideal locations",
      "Transparent data sourcing with links to original organizations",
      "Nomadex Pro subscription for unlimited comparisons and AI chat",
    ],
    packages: ["ai", "firebase-core", "auth"],
    landingUrl: "https://apps.apple.com/il/app/nomadex-live-smarter/id6761225030",
    liveUrl: "https://apps.apple.com/il/app/nomadex-live-smarter/id6761225030",
    liveLabel: "View on App Store",
    statusKind: "production",
    statusText: "Live on the App Store",
    enabled: true,
    order: 0,
    version: "1.0",
    lastReleaseDate: "2025-11-15",
    releaseNotes: "Initial launch — 1,280 cities, AI City Explorer, Nomadex Pro.",
  },
  {
    slug: "foundation",
    name: "Foundation",
    subtitle: "Verified Human Governance",
    description:
      "Decentralized e-voting on Solana blockchain. Passport scanning with OCR, WebAuthn biometric authentication, privacy-preserving identity verification, and on-chain governance with AI constitutional review.",
    iconKey: "landmark",
    colorKey: "violet",
    stack: ["React", "TypeScript", "Rust/Anchor", "Solana", "Firebase", "WebAuthn"],
    highlights: [
      "Passport scan with OCR + MRZ identity verification",
      "SHA-256 hashed identity — zero PII stored on-chain",
      "WebAuthn biometric login (fingerprint/face)",
      "On-chain proposals, voting, and verifiable results",
      "AI constitutional review of governance proposals",
      "Multi-tenant governance state machine (XState v5)",
    ],
    packages: ["ai", "auth", "legal", "messaging", "firebase-core", "e2e"],
    landingUrl: "https://solanavote-devnet.web.app",
    liveUrl: "https://solanavote-devnet.web.app",
    liveLabel: "Try Live Demo",
    statusKind: "beta",
    statusText: "Live on Solana Devnet",
    enabled: true,
    order: 1,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "herbpulse",
    name: "HerbPulse",
    subtitle: "Clinical Herbalism Platform",
    description:
      "A comprehensive platform for healthcare practitioners to manage herbal medicine practices. Features a rich herb database, patient management, custom formula building, and drug-herb interaction checking.",
    iconKey: "heart",
    colorKey: "emerald",
    stack: ["React 19", "TypeScript", "Firebase", "i18next", "Vite"],
    highlights: [
      "Comprehensive herb, essential oil & terpene database",
      "Patient management with clinical tracking",
      "Custom formula builder with dosage calculations",
      "Drug-herb interaction safety checking",
      "AI-powered clinical chat assistance",
      "Multi-language support with role-based access",
    ],
    packages: ["firebase-core", "auth", "ai", "legal", "seeders", "e2e"],
    landingUrl: null,
    liveUrl: null,
    liveLabel: null,
    statusKind: "inprogress",
    statusText: "In Development",
    enabled: true,
    order: 2,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "markethub",
    name: "MarketHub",
    subtitle: "AI-Powered Global Marketplace",
    description:
      "Multi-store e-commerce marketplace with AI-powered translations across 9 languages, multi-currency support, and modern discovery-driven shopping experience.",
    iconKey: "shopping-cart",
    colorKey: "amber",
    stack: ["React 18", "TypeScript", "Tailwind CSS", "Firebase", "Braintree", "Vite"],
    highlights: [
      "Multi-store marketplace with vendor dashboards",
      "AI-powered translations across 9 languages",
      "8 currencies (USD, EUR, GBP, JPY, KRW, CNY, ILS, SAR)",
      "Product discovery with wishlists and reviews",
      "Complete checkout flow with payment processing",
      "Admin panels for store and catalog management",
    ],
    packages: ["firebase-core", "auth", "ai", "i18n", "flows", "legal", "seeders", "payments", "e2e"],
    landingUrl: null,
    liveUrl: null,
    liveLabel: null,
    statusKind: "inprogress",
    statusText: "Frontend Complete",
    enabled: true,
    order: 3,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "soho",
    name: "SOHO",
    subtitle: "All-in-One Small Office Platform",
    description:
      "Open-source platform for small offices combining AI-powered reception, voice mail, email/fax, WhatsApp messaging, multi-language e-commerce, and online scheduling.",
    iconKey: "building",
    colorKey: "cyan",
    stack: ["Next.js", "Node.js", "PostgreSQL", "Redis", "Twilio", "OpenAI"],
    highlights: [
      "AI-powered reception with chat & appointments",
      "Voice mail and fax integration",
      "WhatsApp Business API messaging",
      "Multi-language e-commerce storefront",
      "Online scheduling and calendar management",
      "Monorepo architecture with 7 packages",
    ],
    packages: ["firebase-core", "auth", "ai", "messaging", "legal", "payments"],
    landingUrl: null,
    liveUrl: null,
    liveLabel: null,
    statusKind: "inprogress",
    statusText: "In Development",
    enabled: true,
    order: 4,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "yoursimulation",
    name: "YourSimulation",
    subtitle: "Discrete-Event Simulation & Optimization",
    description:
      "Model any service, queue, or network system — airports, hospitals, data networks, logistics, call centers, factories — then estimate waits, utilization, and throughput, and let the optimizer find the cheapest design that meets your service target. Build it visually, drive it with an AI companion, or script it from the open-source CLI.",
    iconKey: "zap",
    colorKey: "teal",
    stack: ["TypeScript", "React", "React Flow", "Web Workers", "Firebase", "Vite"],
    highlights: [
      "Drag-and-drop editor for queues, resources, and networks",
      "KPIs with 95% confidence intervals — waits, utilization, throughput",
      "Cross-entropy optimizer finds the cheapest design meeting a service target",
      "Watch-mode animation + templates (airport, hospital, logistics, network)",
      "AI companion builds, runs, and optimizes models from plain language",
      "Open-source MIT engine + CLI + Claude Code skill",
    ],
    packages: ["ai", "auth", "firebase-core"],
    landingUrl: "https://yoursimulation-app.web.app",
    liveUrl: "https://yoursimulation-app.web.app",
    liveLabel: "Launch the App",
    docsUrl: "https://yoursimulation-app.web.app/docs/",
    repoUrl: null,
    statusKind: "beta",
    statusText: "Live — free to use",
    enabled: true,
    order: 5,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "yourcontentcreator",
    name: "YourContentCreator",
    subtitle: "MicroMedia.ai Studio — AI Series & Campaigns",
    description:
      "An agentic content studio that writes, animates, voices, publishes and measures a daily AI-animated Short, with a person approving every episode. Its first series, Dreamless: The Hush, launched on 20 October 2026. The Studio admin runs review, scheduling, brand campaigns and the weekly analyst that turns metrics into playbook rules.",
    iconKey: "clapperboard",
    colorKey: "rose",
    stack: ["TypeScript", "Remotion", "Claude", "Gemini", "Kling", "Firebase"],
    highlights: [
      "Daily loop: scout → ideate → write → produce → QA gate → review → publish",
      "Frames, voices and music by AI, rendered with Remotion and mastered to -14 LUFS",
      "Human review on every video — approve or reject with a reason the analyst learns from",
      "Direct publishing to YouTube, TikTok and Instagram at scheduled slots",
      "Metrics snapshots and Thompson-sampled experiments that write playbook rules",
      "Studio admin for brands, campaigns, review queue and budget caps",
    ],
    packages: [],
    landingUrl: "https://micromedia-ai.com",
    liveUrl: "https://micromedia-ai.com",
    liveLabel: "Visit the Studio",
    docsUrl: null,
    repoUrl: null,
    statusKind: "production",
    statusText: "Live — Dreamless: The Hush airing daily",
    enabled: true,
    order: 6,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "yourbackupagent",
    name: "YourBackupAgent",
    subtitle: "Proven Backups for Firebase Projects",
    description:
      "Backs up every Firebase project each night — Firestore, Storage, Auth users and config — into the project's own bucket with an off-site vault copy, then proves the backup by restoring it into a drill project. A manager app shows health, sets, drills and a log of every action, and an MCP server lets an AI agent run it.",
    iconKey: "database-backup",
    colorKey: "emerald",
    stack: ["Bash", "gcloud", "GitHub Actions", "React", "Cloud Functions", "Cloud Run"],
    highlights: [
      "Nightly backup of Firestore, Storage, Auth users and deployed config",
      "Off-site vault copy and change-only media storage",
      "Weekly restore drills and full rebuild drills prove every backup",
      "Never prunes below each project's minimum of good sets",
      "Manager app: overview, sets, drills, log, reports and \"protect a repository\"",
      "Remote MCP server so an AI agent can check and run backups",
    ],
    packages: [],
    landingUrl: "https://yourbackupagent-app.web.app",
    liveUrl: "https://yourbackupagent-app.web.app",
    liveLabel: "Open the Manager",
    docsUrl: null,
    repoUrl: null,
    statusKind: "invitation",
    statusText: "Protecting PlantagoAI projects",
    enabled: true,
    order: 7,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
  {
    slug: "yourtradeagent",
    name: "YourTradeAgent",
    subtitle: "AI-Assisted Paper Trading for US Tech",
    description:
      "AI-assisted paper trading for US tech stocks across the S&P 500, NASDAQ and Dow, with focus areas such as AI and datacenters, quantum and software. Every idea passes a rules gate before a paper fill, and every weekday the agent marks the book against the indexes and reports what changed. Paper money only — not financial advice.",
    iconKey: "trending-up",
    colorKey: "orange",
    stack: ["TypeScript", "React 19", "MUI", "Firebase", "Python", "FastAPI"],
    highlights: [
      "Portfolio vs. the S&P 500, NASDAQ and Dow by week, month, YTD and five years",
      "Volatility, Sharpe, beta, drawdown, RSI and valuation for every holding",
      "Rules gate: position caps, stop-loss, take-profit and a drawdown brake",
      "Backtests and 1,000-path Monte Carlo projections",
      "Daily agent review every weekday after the New York close",
      "Every figure is a setting — capital, risk level, targets and focus areas",
    ],
    packages: ["auth"],
    landingUrl: "https://yourtradeagent-874a7.web.app",
    liveUrl: "https://yourtradeagent-874a7.web.app",
    liveLabel: "Request an Invite",
    docsUrl: null,
    repoUrl: null,
    statusKind: "invitation",
    statusText: "Private beta — paper money only",
    enabled: true,
    order: 8,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  },
];

const PROJECTS_COLLECTION = "projects";

export async function seedDefaultsIfEmpty(): Promise<void> {
  const snap = await getDocs(collection(db, PROJECTS_COLLECTION));
  const existingBySlug = new Map<string, Record<string, unknown>>();
  snap.docs.forEach((d) => existingBySlug.set(d.id, d.data()));

  const batch = writeBatch(db);
  let writes = 0;

  for (const project of DEFAULT_PROJECTS) {
    const ref = doc(db, PROJECTS_COLLECTION, project.slug);
    const existing = existingBySlug.get(project.slug);

    if (!existing) {
      batch.set(ref, {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      writes++;
      continue;
    }

    const missing: Record<string, unknown> = {};
    for (const [key, defaultValue] of Object.entries(project)) {
      if (!(key in existing)) missing[key] = defaultValue;
    }
    if (Object.keys(missing).length > 0) {
      batch.set(ref, { ...missing, updatedAt: serverTimestamp() }, { merge: true });
      writes++;
    }
  }

  if (writes > 0) await batch.commit();
}

export async function saveProject(project: Project): Promise<void> {
  const ref = doc(db, PROJECTS_COLLECTION, project.slug);
  await setDoc(
    ref,
    {
      ...project,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteProject(slug: string): Promise<void> {
  await deleteDoc(doc(db, PROJECTS_COLLECTION, slug));
}

export async function reorderProjects(orderedSlugs: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedSlugs.forEach((slug, index) => {
    const ref = doc(db, PROJECTS_COLLECTION, slug);
    batch.update(ref, { order: index, updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

export function useProjects(): { projects: Project[]; loading: boolean } {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, PROJECTS_COLLECTION), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Project);
        setProjects(list.length > 0 ? list : DEFAULT_PROJECTS);
        setLoading(false);
      },
      () => {
        setProjects(DEFAULT_PROJECTS);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { projects, loading };
}
