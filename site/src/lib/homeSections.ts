import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { AudioLines, Wallet, Mic, Users, Layers, type LucideIcon } from "lucide-react";
import { db } from "./firebase";
import { ICON_MAP } from "./projects";
import { DEFAULT_SETTINGS, useSiteSettings, type SiteSettings } from "./siteSettings";

/* Homepage sections as content, so every block on plantagoai.com can be
   edited, reordered and hidden from Admin → Homepage sections.

   Everything lives in one document, siteSettings/homepage:
     sections: [{ id, visible }]   — page order, top to bottom
     content:  { [id]: {...} }     — the editable copy of each section
   The defaults below are the copy the page shipped with, so an empty or
   partial document renders exactly the old page. Reads merge field by field
   over the defaults, which also lets a later release add a field without a
   migration. */

export const SECTION_IDS = [
  "hero",
  "dreamless",
  "statement",
  "about",
  "products",
  "releases",
  "platform",
  "photo",
  "founder",
  "contact",
  "newsletter",
  "footer",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  dreamless: "Dreamless banner",
  statement: "Director's statement",
  about: "About",
  products: "Products",
  releases: "Releases",
  platform: "Platform",
  photo: "Photo of Dagan",
  founder: "Founder",
  contact: "Contact form",
  newsletter: "Newsletter",
  footer: "Footer",
};

export const SECTION_NOTES: Partial<Record<SectionId, string>> = {
  products: "The product cards themselves are edited in Products Configuration below.",
  releases: "Lists products that have a version set. Hidden by default.",
  contact: "The interest chips come from the visible products.",
  footer: "Sits under the page while it is last; moved up, it sits between sections.",
  statement: "From the Dreamless press kit. Leave the photo empty to sign without one.",
  photo: "Upload a new photo to replace it; it is resized in the browser and saved with the section.",
};

/* ---- Colour and icon choices -------------------------------------------
   Tailwind only ships classes it can see in the source, so every colour a
   section can use is spelled out in full here. */

export const TONE_KEYS = ["indigo", "teal", "cyan", "emerald", "sky", "amber", "rose", "foreground"] as const;
export type ToneKey = (typeof TONE_KEYS)[number];

export const TONE_TEXT: Record<ToneKey, string> = {
  indigo: "text-indigo-600",
  teal: "text-teal-700",
  cyan: "text-cyan-700",
  emerald: "text-emerald-700",
  sky: "text-sky-700",
  amber: "text-amber-700",
  rose: "text-rose-700",
  foreground: "text-foreground",
};

export const CARD_COLOR_KEYS = ["indigo", "emerald", "cyan", "amber", "teal", "sky", "rose"] as const;
export type CardColorKey = (typeof CARD_COLOR_KEYS)[number];

export const CARD_COLORS: Record<CardColorKey, { box: string; title: string }> = {
  indigo: { box: "bg-indigo-50 border-indigo-200", title: "text-indigo-700" },
  emerald: { box: "bg-emerald-50 border-emerald-200", title: "text-emerald-700" },
  cyan: { box: "bg-cyan-50 border-cyan-200", title: "text-cyan-700" },
  amber: { box: "bg-amber-50 border-amber-200", title: "text-amber-700" },
  teal: { box: "bg-teal-50 border-teal-200", title: "text-teal-700" },
  sky: { box: "bg-sky-50 border-sky-200", title: "text-sky-700" },
  rose: { box: "bg-rose-50 border-rose-200", title: "text-rose-700" },
};

export const WORD_ICONS: Record<string, LucideIcon> = {
  "audio-lines": AudioLines,
  wallet: Wallet,
  mic: Mic,
  users: Users,
  layers: Layers,
  ...ICON_MAP,
};

export const WORD_ICON_KEYS = Object.keys(WORD_ICONS);

/* ---- Section content ---------------------------------------------------- */

export interface HeroWord { text: string; icon: string; tone: ToneKey }
export interface HeroStat { value: string; label: string; note: string; tone: ToneKey }
export interface InfoCard { title: string; body: string; color: CardColorKey }
export interface SharedPackage { name: string; purpose: string; highlight: string }

export interface HeroContent {
  badge: string;
  lead: string;
  words: HeroWord[];
  description: string;
  stats: HeroStat[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface DreamlessContent {
  eyebrow: string;
  title: string;
  tagline: string;
  body: string;
  buttonLabel: string;
  url: string;
  image: string;
  imageAlt: string;
}

export interface AboutContent {
  navLabel: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  cards: InfoCard[];
}

export interface HeadingContent {
  navLabel: string;
  eyebrow: string;
  title: string;
}

export interface PlatformContent {
  navLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
  packagesEyebrow: string;
  packagesTitle: string;
  packages: SharedPackage[];
  reuseEyebrow: string;
  reuseTitle: string;
  reuseFootnote: string;
  repoTitle: string;
  repoBody: string;
}

export interface FounderContent {
  navLabel: string;
  eyebrow: string;
  name: string;
  bio: string;
  cards: InfoCard[];
}

export interface StatementContent {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  signature: string;
  signatureRole: string;
  image: string;
  linkLabel: string;
  url: string;
}

export interface PhotoContent {
  image: string;
  imageAlt: string;
  caption: string;
}

export interface NewsletterContent {
  title: string;
  body: string;
}

export interface FooterContent {
  brand: string;
  copyright: string;
}

export interface SectionContent {
  hero: HeroContent;
  dreamless: DreamlessContent;
  statement: StatementContent;
  about: AboutContent;
  products: HeadingContent;
  releases: HeadingContent;
  platform: PlatformContent;
  photo: PhotoContent;
  founder: FounderContent;
  contact: HeadingContent;
  newsletter: NewsletterContent;
  footer: FooterContent;
}

export const DEFAULT_CONTENT: SectionContent = {
  hero: {
    badge: "Shared AI and identity infrastructure",
    lead: "Your",
    words: [
      { text: "Voice.", icon: "audio-lines", tone: "indigo" },
      { text: "Share.", icon: "wallet", tone: "teal" },
      { text: "Market.", icon: "shopping-cart", tone: "cyan" },
    ],
    description:
      "The core shared AI and identity infrastructure for verified-human ecosystems — twelve TypeScript packages handling auth, payments, AI with prompt caching, i18n, compliance, and testing.",
    // {packages} and {products} are counted live from the Platform section
    // and the visible products, so the hero can't go stale.
    stats: [
      { value: "1", label: "Shared platform", note: "Built once, reused everywhere", tone: "emerald" },
      { value: "{packages}", label: "TypeScript packages", note: "Auth, payments, AI, compliance", tone: "teal" },
      { value: "{products}", label: "Products in parallel", note: "No corners cut on the basics", tone: "cyan" },
    ],
    primaryLabel: "View Products",
    primaryHref: "#products",
    secondaryLabel: "Get in Touch",
    secondaryHref: "#contact",
  },
  dreamless: {
    eyebrow: "New series · Now airing",
    title: "Dreamless: The Hush",
    tagline: "One in a million can't dream.",
    body:
      "When the world falls into the Hush, a sleep nobody wakes from, Kai and his robot Tofu keep watch over a city gone quiet. A 28-episode AI-animated anime series, about a minute an episode, made with YourContentCreator — every episode written, drawn, voiced and scored by AI agents and reviewed by a person.",
    buttonLabel: "Watch the series",
    url: "https://dreamless.micromedia-ai.com",
    image: "/dreamless-poster.webp",
    imageAlt:
      "Dreamless: The Hush poster — Kai and his robot Tofu on a balcony above a sleeping city at night",
  },
  statement: {
    eyebrow: "Director's statement",
    title: "Dreamless: The Hush",
    paragraphs: [
      "Kai carries something he doesn't talk about. He didn't choose it. What he chose was to stop dreaming, because in his dreams it was always waiting.",
      "When the world falls into the Hush, that choice leaves him awake, keeping watch over a city that sleeps. He brings food to sleeping neighbours, sits with them, and listens.",
      "Dreamless is about compassion as a quiet, daily act, and about healing that can't be skipped. Sooner or later, Kai has to go back to the place he fled and face what is there. I wanted to tell it slowly, one minute a day, each episode ending on a haiku.",
    ],
    signature: "Dagan Gilat",
    signatureRole: "Creator and director",
    image: "/dagan-gilat.jpg",
    linkLabel: "Watch the series",
    url: "https://dreamless.micromedia-ai.com",
  },
  about: {
    navLabel: "About",
    eyebrow: "About",
    title: "The shared AI and identity layer for verified-human ecosystems",
    paragraphs: [
      "PlantagoAI is the core shared AI and identity infrastructure that powers verified-human ecosystems and decentralized applications. A comprehensive shared-package architecture — authentication, payments, messaging, AI with prompt caching, multi-tenant flows — built once and reused across every product that needs it.",
      "Built to bridge Web2 cloud infrastructure with Web3 protocols. Powers Foundation (verified-human governance on Solana) and adjacent products that need the same identity, AI, and compliance primitives.",
    ],
    cards: [
      {
        title: "Verified-Human Identity",
        body: "ZK identity primitives via Self Protocol passport verification. Sybil-resistant attestation reused across downstream products.",
        color: "indigo",
      },
      {
        title: "AI Layer",
        body: "Anthropic Claude with prompt caching as shared infrastructure. Cost-efficient LLM workloads, usage tracking, multi-tenant.",
        color: "emerald",
      },
      {
        title: "Governance & Distribution",
        body: "On-chain governance and verified-human payouts on Solana via Anchor and Rust. Auditable, sybil-resistant, anonymous voting.",
        color: "cyan",
      },
      {
        title: "Web2 ↔ Web3 Bridge",
        body: "Scalable backend services bridging Cloud Functions and Firestore with Solana on-chain programs. Reusable across products.",
        color: "amber",
      },
    ],
  },
  products: { navLabel: "Products", eyebrow: "Portfolio", title: "Current Products" },
  releases: { navLabel: "Releases", eyebrow: "Releases", title: "Latest Releases" },
  platform: {
    navLabel: "Platform",
    eyebrow: "Platform",
    title: "@plantagoai — Shared Infrastructure",
    intro:
      "Twelve TypeScript packages, consumed by every product via workspace links. Build once, reuse everywhere — five products shipping in parallel without cutting corners on auth, compliance, or testing.",
    packagesEyebrow: "Packages",
    packagesTitle: "12 libraries, shared via workspace links",
    packages: [
      { name: "firebase-core", purpose: "Firebase init, Firestore CRUD helpers, tenant-scoped queries, admin SDK.", highlight: "" },
      { name: "auth", purpose: "Ring-based permissions (0–4), OAuth flows, multi-tenant middleware.", highlight: "" },
      { name: "payments", purpose: "Braintree gateway, Apple/Google Pay, subscription lifecycle.", highlight: "" },
      {
        name: "ai",
        purpose: "Claude with prompt caching + Gemini vision, usage tracking.",
        highlight: "Prompt caching as a shared primitive across products.",
      },
      { name: "messaging", purpose: "Email (Resend), push (FCM), in-app notifications.", highlight: "" },
      {
        name: "db",
        purpose: "Zod schema validation, referential integrity, auto-fix.",
        highlight: "Zod schemas compile to Firestore security rules.",
      },
      { name: "i18n", purpose: "i18next UI + Gemini AI content translation, lazy cached.", highlight: "" },
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
      { name: "seeders", purpose: "Data seeding from JSON/CSV/API with Zod validation.", highlight: "" },
      { name: "testing", purpose: "Vitest helpers, Firebase emulator mgmt, mock factories.", highlight: "" },
      { name: "e2e", purpose: "Playwright helpers, flow-driven test generation.", highlight: "" },
    ],
    reuseEyebrow: "Reuse",
    reuseTitle: "Which packages power which products",
    reuseFootnote:
      "`@plantagoai/testing` powers the tests of every package above — 11 internal consumers, intentionally hidden from the product graph.",
    repoTitle: "Currently a private monorepo",
    repoBody:
      "Select packages (`flows`, `legal`, `seeders`) are strong candidates for open-source release. Get in touch if interested.",
  },
  photo: {
    image: "/dagan-gilat.jpg",
    imageAlt: "Dagan Gilat",
    caption: "Dagan Gilat, founder of PlantagoAI",
  },
  founder: {
    navLabel: "Founder",
    eyebrow: "Founder",
    name: "Dagan Gilat",
    bio:
      "Hands-on founder, architect, and researcher with 25+ years building production systems at the intersection of distributed systems, cloud infrastructure, and applied AI. Track record of taking research from whiteboard to shipped product — IBM cloud platforms generating $100M+ in revenue, ML-driven cloud-AI products at Toga Networks, and a current verified-human governance stack on Solana. Deep expertise in Rust and Go; comfortable from kernel-adjacent code up to founder-level product strategy.",
    cards: [
      {
        title: "Distributed Systems & Cloud",
        body: "Senior Manager, Cloud Platforms at IBM Research (OpenStack, virtualization, storage, networking). CTO Machine Learning at Toga Networks. Microservices, gRPC, Kubernetes — Rust and Go.",
        color: "indigo",
      },
      {
        title: "Blockchain & Solana",
        body: "Verified-human governance and identity on Solana. On-chain programs in Anchor / Rust; off-chain in Cloud Functions and Firestore. Earlier: PKI and core network functions at HyperMesh.",
        color: "indigo",
      },
      {
        title: "Applied AI & ML",
        body: "Anthropic Claude with prompt caching as shared infrastructure across products. Earlier: reinforcement-learning and deep-learning auto-scaling productized at Toga Networks (PyTorch, TensorFlow, Keras, Spark).",
        color: "emerald",
      },
    ],
  },
  contact: { navLabel: "Contact", eyebrow: "Contact", title: "Get in Touch" },
  newsletter: {
    title: "Stay Updated",
    body: "Subscribe to the PlantagoAI newsletter for project updates, launches, and insights.",
  },
  footer: {
    brand: "PlantagoAI",
    copyright: "Copyright © {year} PlantagoAI — All Rights Reserved.",
  },
};

/** The anchor each section scrolls to from the nav (null: not in the nav). */
export const SECTION_ANCHORS: Record<SectionId, string | null> = {
  hero: null,
  dreamless: null,
  statement: null,
  about: "about",
  products: "products",
  releases: "releases",
  platform: "platform",
  photo: null,
  founder: "founder",
  contact: "contact",
  newsletter: null,
  footer: null,
};

export interface SectionEntry { id: SectionId; visible: boolean }

export interface Homepage {
  sections: SectionEntry[];
  content: SectionContent;
}

/** Visibility before the homepage document exists. Releases and the
 *  Dreamless banner used to be toggled in siteSettings/main, so their
 *  starting state comes from there. */
function defaultSections(legacy: SiteSettings): SectionEntry[] {
  return SECTION_IDS.map((id) => ({
    id,
    visible:
      id === "releases" ? legacy.releasesEnabled : id === "dreamless" ? legacy.dreamlessBannerEnabled : true,
  }));
}

function isSectionId(v: unknown): v is SectionId {
  return typeof v === "string" && (SECTION_IDS as readonly string[]).includes(v);
}

/** Stored data over the defaults: known sections in stored order, any
 *  section the document doesn't mention yet appended at its default spot,
 *  and each section's copy merged field by field. */
export function mergeHomepage(stored: Record<string, unknown> | undefined, legacy: SiteSettings): Homepage {
  const defaults = defaultSections(legacy);
  const rawSections = Array.isArray(stored?.sections) ? (stored!.sections as unknown[]) : [];
  const seen = new Set<SectionId>();
  const sections: SectionEntry[] = [];
  for (const raw of rawSections) {
    const s = raw as { id?: unknown; visible?: unknown };
    if (!isSectionId(s?.id) || seen.has(s.id)) continue;
    seen.add(s.id);
    sections.push({ id: s.id, visible: s.visible !== false });
  }
  defaults.forEach((d, i) => {
    if (seen.has(d.id)) return;
    // Put a newly added section after the section that precedes it by default.
    const prev = defaults.slice(0, i).reverse().find((p) => seen.has(p.id));
    const at = prev ? sections.findIndex((s) => s.id === prev.id) + 1 : 0;
    sections.splice(at, 0, d);
    seen.add(d.id);
  });

  const storedContent = (stored?.content ?? {}) as Partial<Record<SectionId, Record<string, unknown>>>;
  const content = {} as Record<SectionId, unknown>;
  for (const id of SECTION_IDS) {
    content[id] = { ...DEFAULT_CONTENT[id], ...(storedContent[id] ?? {}) };
  }

  return { sections, content: content as unknown as SectionContent };
}

const HOMEPAGE_DOC = doc(db, "siteSettings", "homepage");

export function useHomepage(): { homepage: Homepage; loading: boolean } {
  const { settings } = useSiteSettings();
  const [stored, setStored] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The page waits for this document so hidden sections don't flash; if
    // Firestore is slow or unreachable, show the defaults rather than nothing.
    const fallback = setTimeout(() => setLoading(false), 3000);
    const unsub = onSnapshot(
      HOMEPAGE_DOC,
      (snap) => {
        clearTimeout(fallback);
        setStored(snap.exists() ? snap.data() : undefined);
        setLoading(false);
      },
      () => {
        clearTimeout(fallback);
        setStored(undefined);
        setLoading(false);
      },
    );
    return () => {
      clearTimeout(fallback);
      unsub();
    };
  }, []);

  return {
    homepage: mergeHomepage(stored, settings),
    loading,
  };
}

/** Writes the current page as the homepage document the first time an
 *  admin signs in, so Admin edits start from exactly what visitors see. */
export async function seedHomepageIfMissing(): Promise<void> {
  const snap = await getDoc(HOMEPAGE_DOC);
  if (snap.exists()) return;
  const legacySnap = await getDoc(doc(db, "siteSettings", "main"));
  const legacy = { ...DEFAULT_SETTINGS, ...(legacySnap.data() as Partial<SiteSettings> | undefined) };
  const seeded = mergeHomepage(undefined, legacy);
  await setDoc(HOMEPAGE_DOC, { ...seeded, updatedAt: serverTimestamp() });
}

export async function saveSectionOrder(sections: SectionEntry[]): Promise<void> {
  await setDoc(HOMEPAGE_DOC, { sections, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveSectionContent<K extends SectionId>(
  id: K,
  value: SectionContent[K],
): Promise<void> {
  // Replace the whole section map (not a deep merge) so removed list items
  // and cleared fields stick.
  const snap = await getDoc(HOMEPAGE_DOC);
  const content = { ...((snap.data()?.content as Record<string, unknown> | undefined) ?? {}), [id]: value };
  await setDoc(HOMEPAGE_DOC, { content, updatedAt: serverTimestamp() }, { merge: true });
}

/* ---- Admin form schema --------------------------------------------------
   Drives the generic editor in Admin → Homepage sections. */

export type FieldDef =
  | { key: string; label: string; kind: "text" | "textarea" | "url" | "image"; hint?: string }
  | { key: string; label: string; kind: "paragraphs" | "lines"; hint?: string }
  | { key: string; label: string; kind: "select"; options: readonly string[]; hint?: string }
  | { key: string; label: string; kind: "list"; itemLabel: string; fields: FieldDef[]; blank: Record<string, unknown>; hint?: string };

const navField: FieldDef = {
  key: "navLabel",
  label: "Menu label",
  kind: "text",
  hint: "Shown in the top menu. Leave empty to keep this section out of the menu.",
};
const eyebrowField: FieldDef = { key: "eyebrow", label: "Eyebrow (small caps above the title)", kind: "text" };
const cardFields = (itemLabel: string): FieldDef => ({
  key: "cards",
  label: "Cards",
  kind: "list",
  itemLabel,
  blank: { title: "", body: "", color: "indigo" },
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
    { key: "color", label: "Colour", kind: "select", options: CARD_COLOR_KEYS },
  ],
});

export const SECTION_FIELDS: Record<SectionId, FieldDef[]> = {
  hero: [
    { key: "badge", label: "Badge", kind: "text" },
    { key: "lead", label: "Headline first line", kind: "text" },
    {
      key: "words",
      label: "Headline words",
      kind: "list",
      itemLabel: "Word",
      blank: { text: "", icon: "sparkles", tone: "indigo" },
      fields: [
        { key: "text", label: "Word", kind: "text" },
        { key: "icon", label: "Icon", kind: "select", options: WORD_ICON_KEYS },
        { key: "tone", label: "Colour", kind: "select", options: TONE_KEYS },
      ],
    },
    { key: "description", label: "Description", kind: "textarea" },
    {
      key: "stats",
      label: "Stat cards",
      kind: "list",
      itemLabel: "Stat",
      hint: "In the number, {packages} and {products} are counted live.",
      blank: { value: "", label: "", note: "", tone: "emerald" },
      fields: [
        { key: "value", label: "Number", kind: "text" },
        { key: "label", label: "Label", kind: "text" },
        { key: "note", label: "Note", kind: "text" },
        { key: "tone", label: "Colour", kind: "select", options: TONE_KEYS },
      ],
    },
    { key: "primaryLabel", label: "Main button label", kind: "text" },
    { key: "primaryHref", label: "Main button link", kind: "text" },
    { key: "secondaryLabel", label: "Second button label", kind: "text", hint: "Leave empty to hide the button." },
    { key: "secondaryHref", label: "Second button link", kind: "text" },
  ],
  dreamless: [
    eyebrowField,
    { key: "title", label: "Title", kind: "text" },
    { key: "tagline", label: "Tagline", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
    { key: "buttonLabel", label: "Button label", kind: "text" },
    { key: "url", label: "Link", kind: "url" },
    { key: "image", label: "Poster image URL", kind: "text" },
    { key: "imageAlt", label: "Poster description (alt text)", kind: "text" },
  ],
  statement: [
    eyebrowField,
    { key: "title", label: "Title", kind: "text" },
    { key: "paragraphs", label: "Statement", kind: "paragraphs", hint: "Separate paragraphs with a blank line." },
    { key: "signature", label: "Signed by", kind: "text" },
    { key: "signatureRole", label: "Role under the name", kind: "text" },
    { key: "image", label: "Photo next to the signature", kind: "image" },
    { key: "linkLabel", label: "Link label", kind: "text", hint: "Leave empty to hide the link." },
    { key: "url", label: "Link", kind: "url" },
  ],
  about: [
    navField,
    eyebrowField,
    { key: "title", label: "Title", kind: "text" },
    { key: "paragraphs", label: "Text", kind: "paragraphs", hint: "Separate paragraphs with a blank line." },
    cardFields("Card"),
  ],
  products: [navField, eyebrowField, { key: "title", label: "Title", kind: "text" }],
  releases: [navField, eyebrowField, { key: "title", label: "Title", kind: "text" }],
  platform: [
    navField,
    eyebrowField,
    { key: "title", label: "Title", kind: "text" },
    { key: "intro", label: "Intro", kind: "textarea" },
    { key: "packagesEyebrow", label: "Packages eyebrow", kind: "text" },
    { key: "packagesTitle", label: "Packages title", kind: "text" },
    {
      key: "packages",
      label: "Packages",
      kind: "list",
      itemLabel: "Package",
      blank: { name: "", purpose: "", highlight: "" },
      fields: [
        { key: "name", label: "Name (after @plantagoai/)", kind: "text" },
        { key: "purpose", label: "Purpose", kind: "text" },
        { key: "highlight", label: "Notable (optional)", kind: "text" },
      ],
    },
    { key: "reuseEyebrow", label: "Reuse table eyebrow", kind: "text" },
    { key: "reuseTitle", label: "Reuse table title", kind: "text" },
    { key: "reuseFootnote", label: "Reuse table footnote", kind: "textarea", hint: "Wrap code in `backticks`." },
    { key: "repoTitle", label: "Repository note title", kind: "text" },
    { key: "repoBody", label: "Repository note text", kind: "textarea", hint: "Wrap code in `backticks`." },
  ],
  photo: [
    { key: "image", label: "Photo", kind: "image" },
    { key: "imageAlt", label: "Photo description (alt text)", kind: "text" },
    { key: "caption", label: "Caption", kind: "textarea", hint: "Leave empty for no caption." },
  ],
  founder: [
    navField,
    eyebrowField,
    { key: "name", label: "Name", kind: "text" },
    { key: "bio", label: "Bio", kind: "textarea" },
    cardFields("Card"),
  ],
  contact: [navField, eyebrowField, { key: "title", label: "Title", kind: "text" }],
  newsletter: [
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
  ],
  footer: [
    { key: "brand", label: "Name next to the logo", kind: "text", hint: "Leave empty to hide the logo row." },
    { key: "copyright", label: "Copyright line", kind: "text", hint: "{year} becomes the current year." },
  ],
};
