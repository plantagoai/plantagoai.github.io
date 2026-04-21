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

export const COLORS: Record<ColorKey, ColorPalette> = {
  violet: {
    gradient: "from-violet-500 to-indigo-500",
    borderColor: "border-violet-500/30",
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/20",
    dotColor: "bg-violet-500",
    checkColor: "text-violet-500",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/30",
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    dotColor: "bg-emerald-500",
    checkColor: "text-emerald-500",
  },
  amber: {
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/20",
    dotColor: "bg-amber-500",
    checkColor: "text-amber-500",
  },
  cyan: {
    gradient: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-500/30",
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/20",
    dotColor: "bg-cyan-500",
    checkColor: "text-cyan-500",
  },
  sky: {
    gradient: "from-sky-500 to-cyan-500",
    borderColor: "border-sky-500/30",
    accentColor: "text-sky-400",
    accentBg: "bg-sky-500/10",
    accentBorder: "border-sky-500/20",
    dotColor: "bg-sky-500",
    checkColor: "text-sky-500",
  },
  rose: {
    gradient: "from-rose-500 to-pink-500",
    borderColor: "border-rose-500/30",
    accentColor: "text-rose-400",
    accentBg: "bg-rose-500/10",
    accentBorder: "border-rose-500/20",
    dotColor: "bg-rose-500",
    checkColor: "text-rose-500",
  },
  indigo: {
    gradient: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-500/30",
    accentColor: "text-indigo-400",
    accentBg: "bg-indigo-500/10",
    accentBorder: "border-indigo-500/20",
    dotColor: "bg-indigo-500",
    checkColor: "text-indigo-500",
  },
  pink: {
    gradient: "from-pink-500 to-rose-500",
    borderColor: "border-pink-500/30",
    accentColor: "text-pink-400",
    accentBg: "bg-pink-500/10",
    accentBorder: "border-pink-500/20",
    dotColor: "bg-pink-500",
    checkColor: "text-pink-500",
  },
  teal: {
    gradient: "from-teal-500 to-emerald-500",
    borderColor: "border-teal-500/30",
    accentColor: "text-teal-400",
    accentBg: "bg-teal-500/10",
    accentBorder: "border-teal-500/20",
    dotColor: "bg-teal-500",
    checkColor: "text-teal-500",
  },
  orange: {
    gradient: "from-orange-500 to-red-500",
    borderColor: "border-orange-500/30",
    accentColor: "text-orange-400",
    accentBg: "bg-orange-500/10",
    accentBorder: "border-orange-500/20",
    dotColor: "bg-orange-500",
    checkColor: "text-orange-500",
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
  inprogress: "bg-white/15 text-white/80 border-white/20",
  alpha: "bg-amber-500/20 text-amber-50 border-amber-300/40",
  beta: "bg-sky-500/20 text-sky-50 border-sky-300/40",
  invitation: "bg-violet-500/20 text-violet-50 border-violet-300/40",
  production: "bg-emerald-500/25 text-emerald-50 border-emerald-300/40",
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
