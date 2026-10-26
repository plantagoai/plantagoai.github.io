/* dagangilat.com sections as content, edited from plantagoai.com/admin →
   dagangilat.com Sections and stored in Firestore siteSettings/personalHome
   (project plantagoai: public read, admin write).

   This file is plain data with no imports, because two packages use it: this
   site renders from it, and site/ (plantagoai.com) imports it for the Admin
   editor. The defaults are the copy the page shipped with, so an empty or
   missing document renders exactly the old page. */

export const PERSONAL_SECTION_IDS = [
  "dreamlessBanner",
  "hero",
  "photo",
  "statement",
  "foundationCard",
  "dreamless",
  "pillars",
  "timeline",
  "games",
  "chat",
  "contact",
  "footer",
  "floatingChat",
] as const;

export type PersonalSectionId = (typeof PERSONAL_SECTION_IDS)[number];

export const PERSONAL_SECTION_LABELS: Record<PersonalSectionId, string> = {
  dreamlessBanner: "Dreamless banner",
  hero: "Hero",
  photo: "Photo of Dagan",
  statement: "Director's statement (Dreamless)",
  foundationCard: "Foundation card (Your Voice. Share. Market.)",
  dreamless: "Dreamless intro (older wide banner)",
  pillars: "Three pillars",
  timeline: "Career timeline",
  games: "Games",
  chat: "Chat with my AI",
  contact: "Contact form",
  footer: "Footer",
  floatingChat: "Floating chat button",
};

export const PERSONAL_SECTION_NOTES: Partial<Record<PersonalSectionId, string>> = {
  floatingChat: "The round button in the bottom-right corner. Its place in the list doesn't matter.",
  dreamless: "The section that was on the page before the banner. Hidden by default.",
  foundationCard: "Hidden since the hero was shortened; show it to bring the card back.",
  statement: "From the Dreamless press kit. Leave the photo empty to sign without one.",
  photo:
    "Right after the Hero, it sits beside the headline (under it on phones); anywhere else it is its own section. Upload a new photo to replace it; it is resized in the browser and saved with the section.",
};

/** Colours from the site's palette. */
export const PERSONAL_TONES = ["voice", "share", "market", "ink", "muted"] as const;
export type PersonalTone = (typeof PERSONAL_TONES)[number];

export const PERSONAL_ICONS = [
  "audio-lines",
  "wallet",
  "shopping-cart",
  "shield",
  "sparkles",
  "rocket",
  "globe",
  "users",
] as const;
export type PersonalIcon = (typeof PERSONAL_ICONS)[number];

export const TIMELINE_TAGS = ["current", "founder", "research", "industry"] as const;
export const GAME_IDS = ["trivia", "sybil", "pack", "arch"] as const;

export interface ColoredWord { text: string; tone: PersonalTone }

export interface PersonalContent {
  dreamlessBanner: {
    eyebrow: string;
    title: string;
    tagline: string;
    body: string;
    buttonLabel: string;
    url: string;
    image: string;
    imageAlt: string;
  };
  hero: {
    eyebrow: string;
    titleWords: string[];
    description: string;
    highlights: ColoredWord[];
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  photo: {
    image: string;
    imageAlt: string;
    caption: string;
  };
  statement: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    signature: string;
    signatureRole: string;
    image: string;
    linkLabel: string;
    url: string;
  };
  foundationCard: {
    eyebrow: string;
    lead: string;
    words: { text: string; icon: PersonalIcon; tone: PersonalTone }[];
    footerLeft: string;
    footerRight: string;
    url: string;
  };
  dreamless: {
    eyebrow: string;
    title: string;
    image: string;
    imageAlt: string;
    url: string;
    paragraphs: string[];
    primaryLabel: string;
    secondaryLabel: string;
    secondaryUrl: string;
  };
  pillars: {
    eyebrow: string;
    titleLead: string;
    titleWords: ColoredWord[];
    titleTail: string;
    cards: { name: string; tone: PersonalTone; icon: PersonalIcon; blurb: string; handle: string; href: string }[];
    footnote: string;
  };
  timeline: {
    eyebrow: string;
    title: string;
    entries: { org: string; role: string; period: string; blurb: string; bullets: string[]; tag: string }[];
  };
  games: {
    eyebrow: string;
    title: string;
    tabs: { game: string; name: string; subtitle: string }[];
  };
  chat: {
    eyebrow: string;
    title: string;
    body: string;
    suggestions: string[];
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
  };
  footer: {
    name: string;
    tagline: string;
    email: string;
    linkedin: string;
    github: string;
    stats: { value: string; label: string }[];
    badgeLead: string;
    badgeName: string;
    badgeUrl: string;
  };
  floatingChat: {
    eyebrow: string;
    body: string;
    linkLabel: string;
  };
}

export const PERSONAL_DEFAULTS: PersonalContent = {
  dreamlessBanner: {
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
  hero: {
    eyebrow: "Dagan Gilat",
    titleWords: ["Founder", "Architect", "Researcher"],
    description:
      "Distributed systems, applied AI, and a current verified-human governance stack on Solana. Three pillars on shared infrastructure:",
    highlights: [
      { text: "Voice.", tone: "voice" },
      { text: "Share.", tone: "share" },
      { text: "Market.", tone: "market" },
    ],
    primaryLabel: "Chat with my AI",
    primaryHref: "#chat",
    secondaryLabel: "See the work",
    secondaryHref: "#timeline",
  },
  photo: {
    image: "/dagan-gilat.jpg",
    imageAlt: "Dagan Gilat",
    caption: "Dagan Gilat · Founder, architect, researcher",
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
  foundationCard: {
    eyebrow: "Foundation",
    lead: "Your",
    words: [
      { text: "Voice.", icon: "audio-lines", tone: "voice" },
      { text: "Share.", icon: "wallet", tone: "share" },
      { text: "Market.", icon: "shopping-cart", tone: "market" },
    ],
    footerLeft: "Three pillars",
    footerRight: "on Solana",
    url: "https://foundation-global.com",
  },
  dreamless: {
    eyebrow: "Now showing",
    title: "Dreamless: The Hush",
    image: "",
    imageAlt:
      "Dreamless: The Hush. Kai at his window at night with Tofu, his rice-cooker robot, over a quiet city.",
    url: "https://dreamless.micromedia-ai.com/",
    paragraphs: [
      "My new project is an anime series made entirely with AI. Everyone who dreams falls asleep smiling and never wakes; Kai hasn't dreamed in years, so he's one of the few still awake.",
      "I created the series idea, its bible and its style guide. Every episode is written, drawn, voiced, scored and edited by AI agents I built and direct through [MicroMedia.ai](https://micromedia-ai.com/), my one-person AI studio, and I review each one before it goes out. Season 1 is 28 one-minute episodes, a new one every day since 20 October 2026.",
    ],
    primaryLabel: "Watch the series",
    secondaryLabel: "Press kit",
    secondaryUrl: "https://dreamless.micromedia-ai.com/#press",
  },
  pillars: {
    eyebrow: "What I'm building",
    titleLead: "Three pillars —",
    titleWords: [
      { text: "Voice.", tone: "voice" },
      { text: "Share.", tone: "share" },
      { text: "Market.", tone: "market" },
    ],
    titleTail: "— on shared infrastructure, on Solana.",
    cards: [
      {
        name: "Your Voice",
        tone: "voice",
        icon: "audio-lines",
        blurb: "Verified-human governance. On-chain proposals; one verified human, one vote.",
        handle: "voice.foundation-global.com",
        href: "https://voice.foundation-global.com",
      },
      {
        name: "Your Share",
        tone: "share",
        icon: "wallet",
        blurb: "Cooperative ownership. Verified-human distributions and revenue share.",
        handle: "share.foundation-global.com",
        href: "https://share.foundation-global.com",
      },
      {
        name: "Your Market",
        tone: "market",
        icon: "shopping-cart",
        blurb: "Sybil-resistant marketplace. Real humans, real reputation, real exchange.",
        handle: "market.foundation-global.com",
        href: "https://market.foundation-global.com",
      },
    ],
    footnote:
      "The infrastructure layer is [PlantagoAI](https://plantagoai.com) — shared identity, AI (with prompt caching), payments, messaging, and 12+ packages reused across all three pillars.",
  },
  timeline: {
    eyebrow: "Career",
    title: "25 years. Six chapters.",
    entries: [
      {
        org: "Foundation",
        role: "Founder & Architect",
        period: "Mar 2026 – Present",
        blurb: "Verified-human governance ecosystem on Solana. Three core platforms: Voice · Share · Market.",
        bullets: [
          "Architected and shipped the core on-chain governance program (Anchor / Rust).",
          "Designed off-chain architecture and distributed backend tier on Cloud Functions and Firestore.",
          "Spearheading product strategy bridging decentralized primitives with consumer-facing market mechanics.",
          "Stack: Solana, Anchor, Rust, Google Cloud (Functions, Firestore), TypeScript.",
        ],
        tag: "current",
      },
      {
        org: "PlantagoAI",
        role: "Founder",
        period: "Aug 2025 – Present",
        blurb:
          "Core shared AI and identity layer that powers verified-human ecosystems and decentralized applications.",
        bullets: [
          "Designed and implemented shared-package architecture: authentication, messaging, payments, multi-tenant flows.",
          "Engineered the AI integration layer with advanced prompt caching for cost-efficient LLM workloads.",
          "Built scalable, reusable backend services bridging Web2 cloud infrastructure with Web3 protocols.",
          "Stack: AWS, Python, Go, Rust, Applied AI, Anthropic Claude, Microservices, IAM.",
        ],
        tag: "current",
      },
      {
        org: "Plantago",
        role: "Founder & Researcher",
        period: "Jan 2020 – Aug 2025",
        blurb:
          "Dedicated research and prototyping phase focused on blockchain protocols and distributed-microservices architectures. Incubation period whose primitives, trade-offs, and design patterns directly informed the architecture for both PlantagoAI and Foundation.",
        bullets: [
          "Protocol-level research and competitive analysis across Ethereum and Solana.",
          "Prototype implementations and smart contracts in Rust and Go.",
          "Microservices and serverless experiments (gRPC, AWS Lambda/S3) — lightweight, cost-aware backends.",
        ],
        tag: "research",
      },
      {
        org: "HyperMesh",
        role: "Co-Founder & Chief Architect",
        period: "Mar 2018 – Jan 2020",
        blurb: "Crowdsourced telecom infrastructure for decentralized cellular networks. Berlin, Germany.",
        bullets: [
          "Architected the backend, PKI, and core network functions (RADIUS, subscriber identity, billing).",
          "Stack: AWS Lambda, S3, Redis, RDS, Jupyter; Python, Elixir, Rust, Go.",
        ],
        tag: "founder",
      },
      {
        org: "Toga Networks",
        role: "CTO, Machine Learning",
        period: "Feb 2014 – Oct 2017",
        blurb: "Led machine learning and cloud research teams across Israel and China.",
        bullets: [
          "Built AutoScaler — RL- and DL-based auto-scaling for production cloud environments — productized into an enterprise cloud partner's product line.",
          "Designed and shipped scheduling solutions for cloud-based big-data workloads.",
          "Stack: Kubernetes, OpenStack, Spark, Keras, PyTorch, TensorFlow.",
        ],
        tag: "industry",
      },
      {
        org: "IBM",
        role: "Senior Manager, Cloud Platforms",
        period: "Jun 2009 – Jan 2016",
        blurb:
          "Led four R&D groups across virtualization, systems architecture, systems management, storage, and networking — driving global cloud strategy at IBM Research.",
        bullets: [
          "Contributions powered IBM Cloud Manager, IBM Cloud Orchestrator, IBM Cloud OpenStack Services, and IBM Real Time Compression — products generating $100M+ in revenue.",
          "2014 IBM Research Division Award for OpenStack contributions.",
        ],
        tag: "industry",
      },
      {
        org: "IBM",
        role: "Manager / Senior Manager, Business Optimization",
        period: "Jan 2001 – Jun 2009",
        blurb:
          "Built and shipped optimization products generating ~$60M in revenue, deployed at major enterprise customers.",
        bullets: [
          "SWOPS call-center scheduler — deployed across 7 contact centers.",
          "Airline Crew Pairing — deployed at El-Al Israel Airlines.",
          "Massive Collection System (MCS) for telco revenue assurance — Airtel and IDEA.",
          "Container Logistics Optimization — Zim, Hanjin, Hapag-Lloyd, Maersk.",
        ],
        tag: "industry",
      },
    ],
  },
  games: {
    eyebrow: "Play with my work",
    title: "Three small toys. Each one is a chapter of the CV in playable form.",
    tabs: [
      { game: "trivia", name: "Trivia", subtitle: "Things I find delightful" },
      { game: "sybil", name: "Sybil hunt", subtitle: "Foundation · Verified Human" },
      { game: "pack", name: "Container packing", subtitle: "IBM · Logistics Optimization" },
      { game: "arch", name: "Cloud architect", subtitle: "IBM · OpenStack era" },
    ],
  },
  chat: {
    eyebrow: "Chat with my AI",
    title: "Ask anything about my work.",
    body:
      "Powered by Claude. Trained on my CV and a short bio. Ranges over career, projects, and technical opinions on distributed systems, AI, and blockchain.",
    suggestions: [
      "What is Foundation?",
      "Tell me about your IBM years",
      "Why Rust over Go?",
      "What's the AutoScaler story?",
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Drop a note.",
    body:
      "Best for advisory, partnerships, or to talk about Foundation / PlantagoAI. For everything else there's email and LinkedIn in the footer.",
  },
  footer: {
    name: "Dagan Gilat",
    tagline: "Founder · Architect · Researcher · Distributed Systems & Applied AI",
    email: "dagan.gilat@gmail.com",
    linkedin: "https://www.linkedin.com/in/dagangilat/",
    github: "https://github.com/dagangilat",
    stats: [
      { value: "25+", label: "years" },
      { value: "15", label: "patents filed" },
      { value: "14", label: "publications" },
      { value: "180+", label: "citations" },
    ],
    badgeLead: "Built on",
    badgeName: "Foundation",
    badgeUrl: "https://foundation-global.com",
  },
  floatingChat: {
    eyebrow: "Chat with my AI",
    body: "Quick questions about my career or work? Ask here, or scroll to the full chat panel.",
    linkLabel: "Open the full chat →",
  },
};

/** The anchor each section scrolls to (null: none). */
export const PERSONAL_ANCHORS: Record<PersonalSectionId, string | null> = {
  dreamlessBanner: null,
  hero: null,
  photo: null,
  statement: "statement",
  foundationCard: null,
  dreamless: "dreamless",
  pillars: "pillars",
  timeline: "timeline",
  games: "games",
  chat: "chat",
  contact: "contact",
  footer: null,
  floatingChat: null,
};

const HIDDEN_BY_DEFAULT: PersonalSectionId[] = ["foundationCard", "dreamless"];

export interface PersonalSectionEntry { id: PersonalSectionId; visible: boolean }
export interface PersonalHome { sections: PersonalSectionEntry[]; content: PersonalContent }

function isId(v: unknown): v is PersonalSectionId {
  return typeof v === "string" && (PERSONAL_SECTION_IDS as readonly string[]).includes(v);
}

/** Stored data over the defaults: known sections in stored order, any the
 *  document doesn't mention yet slotted in after their default predecessor,
 *  and each section's copy merged field by field. */
export function mergePersonalHome(stored: Record<string, unknown> | undefined): PersonalHome {
  const defaults: PersonalSectionEntry[] = PERSONAL_SECTION_IDS.map((id) => ({
    id,
    visible: !HIDDEN_BY_DEFAULT.includes(id),
  }));
  const raw = Array.isArray(stored?.sections) ? (stored!.sections as unknown[]) : [];
  const seen = new Set<PersonalSectionId>();
  const sections: PersonalSectionEntry[] = [];
  for (const r of raw) {
    const s = r as { id?: unknown; visible?: unknown };
    if (!isId(s?.id) || seen.has(s.id)) continue;
    seen.add(s.id);
    sections.push({ id: s.id, visible: s.visible !== false });
  }
  defaults.forEach((d, i) => {
    if (seen.has(d.id)) return;
    const prev = defaults.slice(0, i).reverse().find((p) => seen.has(p.id));
    const at = prev ? sections.findIndex((s) => s.id === prev.id) + 1 : 0;
    sections.splice(at, 0, d);
    seen.add(d.id);
  });

  const storedContent = (stored?.content ?? {}) as Partial<Record<PersonalSectionId, Record<string, unknown>>>;
  const content = {} as Record<PersonalSectionId, unknown>;
  for (const id of PERSONAL_SECTION_IDS) {
    content[id] = { ...PERSONAL_DEFAULTS[id], ...(storedContent[id] ?? {}) };
  }
  return { sections, content: content as unknown as PersonalContent };
}

/* ---- Admin form schema (same shape as site/src/lib/homeSections.ts) ---- */

type Field =
  | { key: string; label: string; kind: "text" | "textarea" | "url" | "lines" | "paragraphs" | "image"; hint?: string }
  | { key: string; label: string; kind: "select"; options: readonly string[]; hint?: string }
  | { key: string; label: string; kind: "list"; itemLabel: string; fields: Field[]; blank: Record<string, unknown>; hint?: string };

const LINK_HINT = "Write links as [text](https://…).";
const coloredWords = (key: string, label: string): Field => ({
  key,
  label,
  kind: "list",
  itemLabel: "Word",
  blank: { text: "", tone: "voice" },
  fields: [
    { key: "text", label: "Word", kind: "text" },
    { key: "tone", label: "Colour", kind: "select", options: PERSONAL_TONES },
  ],
});

export const PERSONAL_FIELDS: Record<PersonalSectionId, Field[]> = {
  dreamlessBanner: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "tagline", label: "Tagline", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
    { key: "buttonLabel", label: "Button label", kind: "text" },
    { key: "url", label: "Link", kind: "url" },
    { key: "image", label: "Poster image URL", kind: "text" },
    { key: "imageAlt", label: "Poster description (alt text)", kind: "text" },
  ],
  hero: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "titleWords", label: "Title words (one per line; each lights up in turn, the first stays lit)", kind: "lines" },
    { key: "description", label: "Description", kind: "textarea" },
    coloredWords("highlights", "Coloured words after the description"),
    { key: "primaryLabel", label: "Main button label", kind: "text", hint: "Leave empty to hide the button." },
    { key: "primaryHref", label: "Main button link", kind: "text" },
    { key: "secondaryLabel", label: "Second button label", kind: "text", hint: "Leave empty to hide the button." },
    { key: "secondaryHref", label: "Second button link", kind: "text" },
  ],
  photo: [
    { key: "image", label: "Photo", kind: "image" },
    { key: "imageAlt", label: "Photo description (alt text)", kind: "text" },
    { key: "caption", label: "Caption", kind: "textarea", hint: "Leave empty for no caption." },
  ],
  statement: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "paragraphs", label: "Statement", kind: "paragraphs", hint: `Separate paragraphs with a blank line. ${LINK_HINT}` },
    { key: "signature", label: "Signed by", kind: "text" },
    { key: "signatureRole", label: "Role under the name", kind: "text" },
    { key: "image", label: "Photo next to the signature", kind: "image" },
    { key: "linkLabel", label: "Link label", kind: "text", hint: "Leave empty to hide the link." },
    { key: "url", label: "Link", kind: "url" },
  ],
  foundationCard: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "lead", label: "First line", kind: "text" },
    {
      key: "words",
      label: "Words",
      kind: "list",
      itemLabel: "Word",
      blank: { text: "", icon: "sparkles", tone: "voice" },
      fields: [
        { key: "text", label: "Word", kind: "text" },
        { key: "icon", label: "Icon", kind: "select", options: PERSONAL_ICONS },
        { key: "tone", label: "Colour", kind: "select", options: PERSONAL_TONES },
      ],
    },
    { key: "footerLeft", label: "Bottom left", kind: "text" },
    { key: "footerRight", label: "Bottom right", kind: "text" },
    { key: "url", label: "Link", kind: "url" },
  ],
  dreamless: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "image", label: "Banner image URL", kind: "text", hint: "Leave empty for the built-in wide banner." },
    { key: "imageAlt", label: "Banner description (alt text)", kind: "text" },
    { key: "url", label: "Series link", kind: "url" },
    { key: "paragraphs", label: "Text", kind: "paragraphs", hint: `Separate paragraphs with a blank line. ${LINK_HINT}` },
    { key: "primaryLabel", label: "Main button label", kind: "text" },
    { key: "secondaryLabel", label: "Second button label", kind: "text", hint: "Leave empty to hide the button." },
    { key: "secondaryUrl", label: "Second button link", kind: "url" },
  ],
  pillars: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "titleLead", label: "Title start", kind: "text" },
    coloredWords("titleWords", "Coloured title words"),
    { key: "titleTail", label: "Title end (grey)", kind: "text" },
    {
      key: "cards",
      label: "Cards",
      kind: "list",
      itemLabel: "Card",
      blank: { name: "", tone: "voice", icon: "sparkles", blurb: "", handle: "", href: "" },
      fields: [
        { key: "name", label: "Name", kind: "text" },
        { key: "tone", label: "Colour", kind: "select", options: PERSONAL_TONES },
        { key: "icon", label: "Icon", kind: "select", options: PERSONAL_ICONS },
        { key: "href", label: "Link", kind: "url" },
        { key: "handle", label: "Link text", kind: "text" },
        { key: "blurb", label: "Text", kind: "textarea" },
      ],
    },
    { key: "footnote", label: "Note under the cards", kind: "textarea", hint: LINK_HINT },
  ],
  timeline: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    {
      key: "entries",
      label: "Chapters (newest first)",
      kind: "list",
      itemLabel: "Chapter",
      blank: { org: "", role: "", period: "", blurb: "", bullets: [], tag: "industry" },
      fields: [
        { key: "org", label: "Organisation", kind: "text" },
        { key: "role", label: "Role", kind: "text" },
        { key: "period", label: "Period (e.g. Jan 2020 – Aug 2025)", kind: "text" },
        { key: "tag", label: "Dot colour", kind: "select", options: TIMELINE_TAGS },
        { key: "blurb", label: "Summary", kind: "textarea" },
        { key: "bullets", label: "Bullets (one per line)", kind: "lines" },
      ],
    },
  ],
  games: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    {
      key: "tabs",
      label: "Games",
      kind: "list",
      itemLabel: "Game",
      blank: { game: "trivia", name: "", subtitle: "" },
      fields: [
        { key: "game", label: "Game", kind: "select", options: GAME_IDS },
        { key: "name", label: "Tab name", kind: "text" },
        { key: "subtitle", label: "Tab subtitle", kind: "text" },
      ],
    },
  ],
  chat: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
    { key: "suggestions", label: "Suggested questions (one per line)", kind: "lines" },
  ],
  contact: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
  ],
  footer: [
    { key: "name", label: "Name", kind: "text" },
    { key: "tagline", label: "Tagline", kind: "text" },
    { key: "email", label: "Email", kind: "text", hint: "Leave a link empty to hide it." },
    { key: "linkedin", label: "LinkedIn URL", kind: "url" },
    { key: "github", label: "GitHub URL", kind: "url" },
    {
      key: "stats",
      label: "Stats",
      kind: "list",
      itemLabel: "Stat",
      blank: { value: "", label: "" },
      fields: [
        { key: "value", label: "Number", kind: "text" },
        { key: "label", label: "Label", kind: "text" },
      ],
    },
    { key: "badgeLead", label: "Badge text", kind: "text" },
    { key: "badgeName", label: "Badge name (bold)", kind: "text", hint: "Leave empty to hide the badge." },
    { key: "badgeUrl", label: "Badge link", kind: "url" },
  ],
  floatingChat: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "body", label: "Text", kind: "textarea" },
    { key: "linkLabel", label: "Link label", kind: "text" },
  ],
};
