#!/usr/bin/env node
// One-off backfill: turns the legacy guest_visits log (one row per page
// load, raw IP kept) into analyticsEvents "page" events, so Admin → Visitors
// shows history from before /api/track existed.
//
// Each IP + user agent pair becomes one visitor; its loads split into
// sessions on a 30-minute gap, the same rule track.ts uses. The visitor and
// session ids are salted hashes, and only the country/city resolved from the
// IP is written, never the IP. Bots, /admin pages, rows older than the
// retention window, and IPs that ever signed in to /admin are skipped.
// Every doc id is "gv_<guest_visits id>", so re-running overwrites rather
// than duplicates, and `--undo` deletes exactly what this wrote.
//
// Usage (from site/, signed in with `gcloud auth application-default login`
// as a project owner):
//   node scripts/backfill-analytics.mjs           # dry run: prints a summary
//   node scripts/backfill-analytics.mjs --write   # writes the events
//   node scripts/backfill-analytics.mjs --undo    # deletes backfilled events

import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { deviceFromUserAgent, isBotUserAgent, RETENTION_DAYS } from "../functions/analyticsTrack.js";

const SESSION_GAP_MS = 30 * 60 * 1000;
const DAY_MS = 86400000;

const hashId = (prefix, salt, ...parts) =>
  prefix + createHash("sha256").update([salt, ...parts].join("|")).digest("base64url").slice(0, 20);

/**
 * guest_visits rows → analyticsEvents docs. `rows` are
 * { id, site, path, visitedAt: Date, ip, userAgent }; `lookup(ip)` returns
 * { country, city } or null. Pure apart from what `lookup` does.
 */
export function eventsFromGuestVisits(rows, { adminIps = new Set(), lookup = () => null, salt, now = new Date() }) {
  const oldest = now.getTime() - RETENTION_DAYS * DAY_MS;
  const kept = rows
    .filter((r) => r.visitedAt instanceof Date && r.visitedAt.getTime() > oldest)
    .filter((r) => r.site === "plantagoai" || r.site === "dagangilat")
    .filter((r) => typeof r.path === "string" && r.path.startsWith("/") && !r.path.startsWith("/admin"))
    .filter((r) => !isBotUserAgent(r.userAgent || ""))
    .filter((r) => !(r.ip && adminIps.has(r.ip)))
    .sort((a, b) => a.visitedAt - b.visitedAt);

  const visitors = new Map(); // vid → { lastMs, sid }
  const geoCache = new Map();
  const out = [];
  for (const r of kept) {
    const ua = r.userAgent || "";
    const vid = hashId("v", salt, r.ip || r.id, ua);
    const t = r.visitedAt.getTime();
    const prev = visitors.get(vid);
    const newVisitor = !prev;
    let sid = prev?.sid;
    if (!prev || t - prev.lastMs > SESSION_GAP_MS) sid = hashId("s", salt, vid, t);
    visitors.set(vid, { lastMs: t, sid });

    if (r.ip && !geoCache.has(r.ip)) geoCache.set(r.ip, lookup(r.ip));
    const geo = r.ip ? geoCache.get(r.ip) : null;
    out.push({
      id: `gv_${r.id}`,
      doc: {
        site: r.site, vid, sid, newVisitor, admin: false,
        country: geo?.country || null, city: geo?.city || null,
        tz: null, lang: null, device: deviceFromUserAgent(ua),
        ref: null, utmSource: null, utmMedium: null, utmCampaign: null,
        type: "page", path: r.path.split(/[?#]/)[0].slice(0, 200),
        ts: r.visitedAt, expireAt: new Date(t + RETENTION_DAYS * DAY_MS),
        backfilled: true,
      },
    });
  }
  return { events: out, skipped: rows.length - kept.length, visitors: visitors.size };
}

async function main() {
  const mode = process.argv.includes("--undo") ? "undo" : process.argv.includes("--write") ? "write" : "dry";
  const require = createRequire(new URL("../functions/package.json", import.meta.url));
  const { initializeApp, applicationDefault } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  initializeApp({ credential: applicationDefault(), projectId: "plantagoai" });
  const db = getFirestore();

  if (mode === "undo") {
    let deleted = 0;
    for (;;) {
      const snap = await db.collection("analyticsEvents").where("backfilled", "==", true).limit(400).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += snap.size;
    }
    console.log(`Deleted ${deleted} backfilled events.`);
    return;
  }

  const geoip = require("geoip-lite");
  const [visits, logins] = await Promise.all([
    db.collection("guest_visits").get(),
    db.collection("admin_logins").get(),
  ]);
  const adminIps = new Set(logins.docs.map((d) => d.get("ip")).filter(Boolean));
  const rows = visits.docs.map((d) => ({
    id: d.id,
    site: d.get("site"),
    path: d.get("path"),
    visitedAt: d.get("visitedAt")?.toDate?.() ?? null,
    ip: d.get("ip") || null,
    userAgent: d.get("userAgent") || null,
  }));
  const lookup = (ip) => {
    const g = geoip.lookup(ip);
    return g ? { country: g.country || null, city: g.city || null } : null;
  };
  // A fresh salt per run: the hashed ids can't be tied back to an IP later.
  // Re-running reassigns ids but overwrites the same docs, so counts hold.
  const { events, skipped, visitors } = eventsFromGuestVisits(rows, {
    adminIps, lookup, salt: randomBytes(16).toString("hex"),
  });

  const bySite = {};
  for (const { doc } of events) bySite[doc.site] = (bySite[doc.site] || 0) + 1;
  const first = events[0]?.doc.ts.toISOString().slice(0, 10);
  const last = events.at(-1)?.doc.ts.toISOString().slice(0, 10);
  console.log(`guest_visits rows: ${rows.length}, skipped: ${skipped} (bots, /admin, admin IPs, too old)`);
  console.log(`page events: ${events.length} from ${visitors} visitors, ${first} → ${last}`);
  console.log(`by site: ${JSON.stringify(bySite)}`);

  if (mode === "dry") {
    console.log("Dry run, nothing written. Re-run with --write to backfill.");
    return;
  }
  for (let i = 0; i < events.length; i += 400) {
    const batch = db.batch();
    for (const { id, doc } of events.slice(i, i + 400)) {
      batch.set(db.collection("analyticsEvents").doc(id), {
        ...doc, ts: Timestamp.fromDate(doc.ts), expireAt: Timestamp.fromDate(doc.expireAt),
      });
    }
    await batch.commit();
  }
  console.log(`Wrote ${events.length} events. Undo with --undo.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => { console.error(err.message || err); process.exit(1); });
}
