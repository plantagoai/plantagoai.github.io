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
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

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
