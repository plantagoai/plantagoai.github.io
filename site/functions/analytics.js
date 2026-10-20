// Server-side admin-login / guest-visit logging + analytics read.
//
// Pattern lifted from foundation/functions/user-management.js's
// logSession/getLoginAnalytics — same reasoning applies here: raw IP is
// captured server-side (request.rawRequest.ip / req.ip, never trusts a
// client-supplied value) and stored, but NEVER returned to any client.
// Country/city are resolved from the stored IP on READ, via geoip-lite
// (self-contained npm package, bundles its own offline DB — no license
// key, no external API call, unlike MaxMind's licensed GeoLite2). Only
// the derived country/city ever crosses the wire to the admin dashboard.
//
// Firestore rules for admin_logins/guest_visits are `allow read, write:
// if false` — ALL access goes through these callables now. That's a
// deliberate tightening from the original client-direct-write design:
// once writes route through a Cloud Function anyway (required to capture
// real IP, which client JS can't reliably self-report), there's no
// reason to also allow direct client reads/writes for these collections.

import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { eventRow, eventsFromBatch, MAX_EVENTS, parseRange } from "./analyticsTrack.js";
import { isDailyJobDue, jobSettings, SETTINGS_PATH } from "./scheduledJobs.js";

const ADMIN_EMAILS = ["feedmyinfo@gmail.com", "dagan.gilat@gmail.com"];

const ALLOWED_ORIGINS = new Set([
  "https://plantagoai.com",
  "https://www.plantagoai.com",
  "https://plantagoai.web.app",
  "https://dagangilat.com",
  "https://www.dagangilat.com",
  "https://dagangilat-personal.web.app",
  "http://localhost:5173",
  "http://localhost:5182",
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

function requireAdmin(request) {
  const email = request.auth?.token?.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
  return email;
}

// ─── logAdminLoginFn — records an admin panel sign-in ──────────────────
// Called client-side once per sign-in (see useAdmin() in AdminDashboard.tsx).
// onCall (not onRequest) since the caller is always an authenticated
// Firebase user at this point — the callable gives us request.auth for
// free instead of re-verifying an ID token manually.

export const logAdminLoginFn = onCall(
  { region: "us-east1" },
  async (request) => {
    const email = request.auth?.token?.email;
    const uid = request.auth?.uid;
    if (!email || !uid) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const db = getFirestore();
    await db.collection("admin_logins").add({
      email,
      uid,
      loggedInAt: FieldValue.serverTimestamp(),
      ip: request.rawRequest?.ip || null,
      userAgent: request.rawRequest?.headers?.["user-agent"] || null,
    });
    return { status: "logged" };
  },
);

// ─── logGuestVisitFn — anonymous pageview counter ──────────────────────
// onRequest, not onCall — visitors are never signed in. Rewritten as
// /api/logGuestVisit on both the plantagoai and personal hosting
// targets (see firebase.json).

export const logGuestVisitFn = onRequest(
  { region: "us-east1", cors: false, timeoutSeconds: 10, memory: "256MiB" },
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

    const { site, path } = req.body || {};
    if (site !== "plantagoai" && site !== "dagangilat") {
      res.status(400).json({ error: "Invalid site" });
      return;
    }
    if (typeof path !== "string" || path.length > 500) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    try {
      const db = getFirestore();
      await db.collection("guest_visits").add({
        site,
        path,
        visitedAt: FieldValue.serverTimestamp(),
        ip: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      // Analytics must never be loud about failure to a real visitor.
      console.error("logGuestVisitFn error:", err);
      res.status(200).json({ ok: false });
    }
  },
);

// ─── getAnalyticsSessions — admin-only read, geo-resolved server-side ──
// Returns admin_logins and/or guest_visits rows in [from, to], each
// enriched with country/city derived from the stored IP. Raw IP is
// deliberately never included in the response.

export const getAnalyticsSessions = onCall(
  { region: "us-east1", timeoutSeconds: 60, memory: "512MiB" },
  async (request) => {
    requireAdmin(request);

    const { kind, from, to } = request.data || {};
    if (kind !== "admin_logins" && kind !== "guest_visits") {
      throw new HttpsError("invalid-argument", "kind must be admin_logins or guest_visits");
    }
    const fromMs = typeof from === "string" ? Date.parse(from) : null;
    const toMs = typeof to === "string" ? Date.parse(to) : Date.now();
    if (!fromMs || Number.isNaN(fromMs) || Number.isNaN(toMs) || fromMs >= toMs) {
      throw new HttpsError("invalid-argument", "from must be an ISO date before to");
    }
    const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;
    if (toMs - fromMs > MAX_RANGE_MS) {
      throw new HttpsError("invalid-argument", "range cannot exceed 366 days");
    }

    // Lazy-load — bundles its own offline IP database, cold-start cost
    // paid once per function instance, not per request.
    const geoip = (await import("geoip-lite")).default;
    const tsField = kind === "admin_logins" ? "loggedInAt" : "visitedAt";

    const HARD_LIMIT = 5000;
    const db = getFirestore();
    const snap = await db
      .collection(kind)
      .where(tsField, ">=", Timestamp.fromMillis(fromMs))
      .where(tsField, "<", Timestamp.fromMillis(toMs))
      .orderBy(tsField, "desc")
      .limit(HARD_LIMIT + 1)
      .get();

    const truncated = snap.size > HARD_LIMIT;
    const docs = truncated ? snap.docs.slice(0, HARD_LIMIT) : snap.docs;

    const rows = docs.map((d) => {
      const x = d.data();
      const ts = x[tsField]?.toMillis ? x[tsField].toMillis() : null;
      let geo = null;
      if (x.ip) {
        try {
          const g = geoip.lookup(x.ip);
          if (g) geo = { country: g.country || null, city: g.city || null };
        } catch {
          geo = null;
        }
      }
      const base = { id: d.id, ts, country: geo?.country || null, city: geo?.city || null };
      return kind === "admin_logins"
        ? { ...base, email: x.email || null, uid: x.uid || null }
        : { ...base, site: x.site || null, path: x.path || null };
    }).filter((r) => r.ts != null);

    return { rows, meta: { from: fromMs, to: toMs, total: rows.length, truncated, hardLimit: HARD_LIMIT } };
  },
);

// ─── First-party visit tracking (Admin → Visitors) ─────────────────────
// Ported from limorgilat.com's /api/track + /api/admin/analytics. Unlike
// guest_visits above (one row per page load, raw IP stored), this keeps
// per-visitor/per-session events — page views, sections reached, outbound
// clicks, chat, contact — and stores only the country/city derived from
// the IP, never the IP itself. guest_visits stays readable for history
// but nothing writes to it any more.

const TRACK_LIMIT_PER_10_MIN = 120;
const trackHits = new Map(); // per-instance: ipHash → { count, resetAt }

/** Best-effort per-instance rate limit, enough to blunt a script hammering
 *  the endpoint without a Firestore round trip per request. */
function allowTrack(ip) {
  const key = createHash("sha256").update(ip || "none").digest("hex").slice(0, 16);
  const now = Date.now();
  const hit = trackHits.get(key);
  if (!hit || hit.resetAt <= now) {
    if (trackHits.size > 5000) trackHits.clear();
    trackHits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  hit.count += 1;
  return hit.count <= TRACK_LIMIT_PER_10_MIN;
}

/** Firebase Hosting forwards the visitor's address in fastly-client-ip. */
function clientIp(req) {
  return String(req.headers["fastly-client-ip"] || req.ip || "").trim();
}

// POST /api/track — a batch of visit events from the browser (see
// src/lib/track.ts on both sites). Always answers 204 so a tracking hiccup
// never shows up for the visitor. Rewritten on both hosting targets.
export const trackFn = onRequest(
  { region: "us-east1", cors: false, timeoutSeconds: 10, memory: "512MiB" },
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
    // sendBeacon posts text/plain to skip the CORS preflight.
    let body = req.body;
    if (typeof body === "string" || Buffer.isBuffer(body)) {
      try { body = JSON.parse(String(body)); } catch { body = null; }
    }
    const ip = clientIp(req);
    if (!allowTrack(ip)) {
      res.status(204).send("");
      return;
    }
    try {
      let geo = null;
      if (ip) {
        const geoip = (await import("geoip-lite")).default;
        const g = geoip.lookup(ip);
        if (g) geo = { country: g.country || null, city: g.city || null };
      }
      const docs = eventsFromBatch(body, req.headers || {}, geo, new Date());
      if (docs.length) {
        const db = getFirestore();
        const batch = db.batch();
        for (const d of docs) {
          batch.set(db.collection("analyticsEvents").doc(), {
            ...d,
            ts: Timestamp.fromDate(d.ts),
            expireAt: Timestamp.fromDate(d.expireAt),
          });
        }
        await batch.commit();
      }
    } catch (err) {
      console.error("[track] write failed", err?.message || err);
    }
    res.status(204).send("");
  },
);

// getAnalyticsEvents — admin-only read of analyticsEvents in [from, to].
// Aggregation happens in the browser (src/lib/visitAnalytics.ts), same as
// limorgilat.com, so the dashboard can re-slice without another round trip.
export const getAnalyticsEvents = onCall(
  { region: "us-east1", timeoutSeconds: 60, memory: "512MiB" },
  async (request) => {
    requireAdmin(request);
    const range = parseRange(request.data || {});
    if (!range) {
      throw new HttpsError("invalid-argument", "from/to must be ISO dates, at most 400 days apart");
    }
    const snap = await getFirestore()
      .collection("analyticsEvents")
      .where("ts", ">=", Timestamp.fromDate(range.from))
      .where("ts", "<", Timestamp.fromDate(range.to))
      .orderBy("ts", "desc")
      .limit(MAX_EVENTS)
      .get();
    return { events: snap.docs.map((d) => eventRow(d.data())), capped: snap.size >= MAX_EVENTS };
  },
);

/**
 * Deletes visit events past their keep-until date (RETENTION_DAYS).
 *
 * Ticks hourly at :30 UTC but only does work when Admin → Scheduled Jobs says
 * it is due (see scheduledJobs.js). Default: enabled, daily at 03:30 UTC —
 * the same as the old fixed "30 3 * * *" cron.
 */
export const pruneAnalyticsEvents = onSchedule(
  { schedule: "30 * * * *", timeZone: "Etc/UTC", region: "us-east1", timeoutSeconds: 300, memory: "256MiB" },
  async () => {
    const db = getFirestore();
    const jobId = "pruneAnalyticsEvents";
    const ref = db.collection(SETTINGS_PATH.collection).doc(SETTINGS_PATH.doc);
    const data = (await ref.get()).data() || {};
    const settings = jobSettings(jobId, data.jobs?.[jobId]);
    if (!isDailyJobDue(settings, new Date()).due) return;

    let deleted = 0;
    for (let round = 0; round < 40; round++) {
      const snap = await db.collection("analyticsEvents")
        .where("expireAt", "<=", Timestamp.now())
        .limit(400)
        .get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += snap.size;
    }
    console.info("[analytics] pruned", { deleted });
  },
);
