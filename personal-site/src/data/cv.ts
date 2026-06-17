export type TimelineEntry = {
  org: string;
  role: string;
  period: string;
  blurb?: string;
  bullets: string[];
  tag?: "current" | "founder" | "research" | "industry";
};

export const timeline: TimelineEntry[] = [
  {
    org: "Foundation",
    role: "Founder & Architect",
    period: "Mar 2026 – Present",
    blurb:
      "Verified-human governance ecosystem on Solana. Three core platforms: Voice · Share · Market.",
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
];

export type PillarKey = "voice" | "share" | "market";

export const pillars: {
  key: PillarKey;
  name: string;
  handle: string;
  blurb: string;
  href: string;
}[] = [
  {
    key: "voice",
    name: "Your Voice",
    handle: "voice.foundation-global.com",
    blurb: "Verified-human governance. On-chain proposals; one verified human, one vote.",
    href: "https://voice.foundation-global.com",
  },
  {
    key: "share",
    name: "Your Share",
    handle: "share.foundation-global.com",
    blurb: "Cooperative ownership. Verified-human distributions and revenue share.",
    href: "https://share.foundation-global.com",
  },
  {
    key: "market",
    name: "Your Market",
    handle: "market.foundation-global.com",
    blurb: "Sybil-resistant marketplace. Real humans, real reputation, real exchange.",
    href: "https://market.foundation-global.com",
  },
];

export const stats = {
  patents: 15,
  publications: 14,
  citations: 180,
  yearsExperience: 25,
};

export const skills = {
  languages: ["Rust", "Go", "Python", "TypeScript", "Elixir"],
  systems: ["Microservices", "gRPC", "Event-driven", "PKI", "OpenStack", "Kubernetes"],
  blockchain: ["Solana", "Anchor", "Ethereum"],
  cloud: ["AWS", "Google Cloud", "Firebase"],
  ai: ["Anthropic Claude (prompt caching)", "Reinforcement learning", "Deep learning", "Spark", "Jupyter"],
};

export const contact = {
  email: "dagan.gilat@gmail.com",
  linkedin: "https://www.linkedin.com/in/dagangilat/",
  github: "https://github.com/dagangilat",
  plantagoai: "https://plantagoai.com",
  foundation: "https://foundation-global.com",
};
