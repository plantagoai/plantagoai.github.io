// dagangilat.com — public chat + contact endpoints.
//
// Both are unauthenticated `onRequest` (rewritten via firebase.json under the
// `personal` hosting target as `/api/personalChat` and `/api/personalContact`).
// They are isolated from any admin auth: no Firebase Admin reads beyond what's
// needed, no tenant scoping. Origin is enforced via the hosting rewrite
// (same-origin) and a soft Origin allowlist below.
//
// Migrated from foundation/functions/personal-site.js (2026-08-05) when
// dagangilat.com's hosting moved to the plantagoai project. Adapted from
// Secret Manager (defineSecret) to plain env vars via .env.plantagoai,
// matching this project's existing convention — Secret Manager isn't
// enabled here, and RESEND_API_KEY for onContactCreated/onSubscriberCreated
// already uses process.env directly (see index.js).
//
// Uses DAGANGILAT_RESEND_API_KEY, NOT the shared RESEND_API_KEY — different
// Resend accounts/domain verifications. RESEND_API_KEY's account is verified
// for plantagoai.com (used by onContactCreated/onSubscriberCreated); this
// account is verified for dagangilat.com. Confirmed by production failure:
// reusing RESEND_API_KEY here 403'd with "domain not verified" for
// dagangilat.com.
//
// AI: uses @anthropic-ai/sdk directly with `cache_control` on the system block
// so the bio / CV portion of the prompt is cached across turns. The repo
// convention is `claudeWithCache()` from @plantagoai/ai, but that helper
// only takes a single user-message string and we need true multi-turn
// chat history. When @plantagoai/ai grows a chat-history variant we can
// swap to it.

import { onRequest } from "firebase-functions/v2/https";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

// NOTE: these don't match the source's original defineString() defaults
// ("dagangilat.com" addresses) — that default was apparently never actually
// verified with Resend. The REAL deployed config in solanavote-devnet
// overrides to foundation-global.com, which is what the bound Resend key
// is actually verified for (confirmed via `gcloud functions describe`).
// Matching the proven-working values, not the aspirational source default.
const CONTACT_TO = "dagan.gilat@foundation-global.com";
const CONTACT_FROM = "Dagan Gilat <noreply@foundation-global.com>";

const ALLOWED_ORIGINS = new Set([
  "https://dagangilat.com",
  "https://www.dagangilat.com",
  "http://localhost:8082",
  "http://localhost:5000",
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
}

const SYSTEM_PROMPT = `You are an AI version of Dagan Gilat answering questions about his career and work on his personal site dagangilat.com. Respond in first person, conversationally, in 1–4 short paragraphs. Be specific and concrete. If asked about something not covered below, say so briefly and offer to forward the question via the contact form.

# Who I am
Founder, architect, and researcher. ~25 years across distributed systems, cloud, machine learning, and (currently) verified-human governance on Solana. Based in Israel.

# What I'm building now
- **Foundation** (Mar 2026 – present) — Founder & Architect. Verified-human governance ecosystem on Solana. Three pillars on shared infrastructure: Voice (on-chain proposals), Share (cooperative ownership / revenue share), Market (sybil-resistant marketplace). Core on-chain governance program in Anchor/Rust; off-chain backend on Cloud Functions + Firestore; consumer-facing strategy bridging decentralized primitives with market mechanics.
- **PlantagoAI** (Aug 2025 – present) — Founder. Shared AI + identity layer powering verified-human ecosystems and decentralized apps. Designed a 12-package shared-package architecture (auth, messaging, payments, multi-tenant flows). AI integration layer with prompt caching for cost-efficient LLM workloads. Bridges Web2 cloud infrastructure with Web3 protocols.

# Earlier
- **Plantago** (Jan 2020 – Aug 2025) — Founder & Researcher. Research and prototyping on blockchain protocols and distributed-microservices architectures. Ethereum vs Solana competitive analysis; smart-contract prototypes in Rust and Go; gRPC/Lambda/S3 microservices experiments. Incubation phase whose primitives directly informed PlantagoAI and Foundation.
- **HyperMesh** (Mar 2018 – Jan 2020) — Co-Founder & Chief Architect. Berlin. Crowdsourced telecom infrastructure for decentralized cellular networks. Backend, PKI, RADIUS, subscriber identity, billing. AWS Lambda/S3/Redis/RDS; Python, Elixir, Rust, Go.
- **Toga Networks** (Feb 2014 – Oct 2017) — CTO, Machine Learning. Led ML and cloud research teams across Israel and China. Built **AutoScaler** — RL/DL-based auto-scaling for production cloud — productized into an enterprise cloud partner's product line. Scheduling for big-data workloads. Stack: Kubernetes, OpenStack, Spark, Keras, PyTorch, TensorFlow.
- **IBM** (Jun 2009 – Jan 2016) — Senior Manager, Cloud Platforms. Four R&D groups: virtualization, systems architecture, systems management, storage, networking. Drove global cloud strategy at IBM Research. Contributions powered IBM Cloud Manager, IBM Cloud Orchestrator, IBM Cloud OpenStack Services, IBM Real Time Compression — products generating $100M+ in revenue. 2014 IBM Research Division Award for OpenStack contributions.
- **IBM** (Jan 2001 – Jun 2009) — Manager / Senior Manager, Business Optimization. Built and shipped optimization products generating ~$60M in revenue at major enterprise customers: SWOPS call-center scheduler (7 contact centers), Airline Crew Pairing (El-Al), Massive Collection System for telco revenue assurance (Airtel, IDEA), container logistics optimization (Zim, Hanjin, Hapag-Lloyd, Maersk).

# By the numbers
~25 years experience · 15 patents filed · 14 publications · 180+ citations.

# Skills
Languages: Rust, Go, Python, TypeScript, Elixir.
Systems: Microservices, gRPC, event-driven, PKI, OpenStack, Kubernetes.
Blockchain: Solana, Anchor, Ethereum.
Cloud: AWS, Google Cloud, Firebase.
AI: Anthropic Claude (with prompt caching), reinforcement learning, deep learning, Spark, Jupyter.

# Style
Direct, slightly dry, prefers concrete examples. Don't oversell. If a question is genuinely outside the above (e.g., personal life, opinions on politics), redirect.`;

export const personalChat = onRequest(
  {
    region: "us-east1",
    cors: false, // handled manually for explicit allowlist
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body ?? {};
    const messages = Array.isArray(body.messages) ? body.messages : null;
    if (!messages || messages.length === 0 || messages.length > 30) {
      res.status(400).json({ error: "Invalid messages array" });
      return;
    }
    for (const m of messages) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) {
        res.status(400).json({ error: "Invalid message role" });
        return;
      }
      if (typeof m.content !== "string" || m.content.length > 4000) {
        res.status(400).json({ error: "Invalid message content" });
        return;
      }
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const reply = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      res.status(200).json({ reply: reply || "(no reply)" });
    } catch (err) {
      console.error("personalChat error:", err);
      res.status(500).json({ error: "Chat failed" });
    }
  },
);

export const personalContact = onRequest(
  {
    region: "us-east1",
    cors: false,
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { name, email, message } = req.body ?? {};
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      name.trim().length === 0 ||
      name.length > 200 ||
      email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.trim().length === 0 ||
      message.length > 5000
    ) {
      res.status(400).json({ error: "Invalid fields" });
      return;
    }

    try {
      const resend = new Resend(process.env.DAGANGILAT_RESEND_API_KEY);
      const subject = `dagangilat.com — message from ${name}`;
      const text = `From: ${name} <${email}>\n\n${message}`;
      // Resend returns { data, error } and does NOT throw on send failures
      // (e.g. unverified FROM domain). Without inspecting `error` here, the
      // function would 200-OK with no email actually sent.
      const { error: sendError } = await resend.emails.send({
        from: CONTACT_FROM,
        to: CONTACT_TO,
        replyTo: email,
        subject,
        text,
      });
      if (sendError) {
        console.error("personalContact resend error:", sendError);
        res.status(500).json({ error: "Send failed" });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("personalContact error:", err);
      res.status(500).json({ error: "Send failed" });
    }
  },
);
