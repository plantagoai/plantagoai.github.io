// First-party visit tracking (POST /api/track), ported from limorgilat.com's
// functions/analyticsTrack.mjs. The browser sends a small batch of events
// (page views, sections reached, outbound clicks, chat, contact…); this
// module turns it into the `analyticsEvents` documents Admin → Visitors
// reads. Pure, so it runs under `node --test`.
//
// Nothing here identifies a person: a random visitor id kept in the
// browser, the country/city (from a geo header, else the caller's IP
// resolved by geoip-lite, else the browser's time zone) and the coarse
// device type. The IP itself is never stored — a deliberate change from
// guest_visits, which kept it and resolved geo on read.

export const SITES = ["plantagoai", "dagangilat"];
export const EVENT_TYPES = ["page", "section", "outbound", "chat", "game", "contact", "subscribe"];
/** Event types that only make sense with a slug (which section, project, game). */
const NEEDS_SLUG = new Set(["section", "outbound", "game"]);
export const MAX_EVENTS_PER_BATCH = 25;
/** How long an event is kept before the daily prune deletes it. */
export const RETENTION_DAYS = 400;

const ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
const SLUG_RE = /^[a-z0-9._-]{1,60}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

const str = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Time zone → country, used only when neither a geo header nor the IP
 *  gave one. */
const TZ_COUNTRY = {
  "Asia/Jerusalem": "IL", "Asia/Tel_Aviv": "IL", "Israel": "IL",
  "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Paris": "FR", "Europe/Berlin": "DE",
  "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE",
  "Europe/Zurich": "CH", "Europe/Vienna": "AT", "Europe/Stockholm": "SE", "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK", "Europe/Helsinki": "FI", "Europe/Warsaw": "PL", "Europe/Prague": "CZ",
  "Europe/Lisbon": "PT", "Europe/Kiev": "UA", "Europe/Kyiv": "UA", "Europe/Istanbul": "TR",
  "Asia/Nicosia": "CY", "Asia/Dubai": "AE", "Asia/Kolkata": "IN", "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP", "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK", "Asia/Seoul": "KR",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Pacific/Auckland": "NZ",
  "America/Sao_Paulo": "BR", "America/Mexico_City": "MX",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Montreal": "CA",
};

export function countryFromTimeZone(tz) {
  if (typeof tz !== "string") return null;
  if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Detroit|Anchorage|Boise|Indiana\/|Kentucky\/)/.test(tz)) return "US";
  if (tz === "Pacific/Honolulu") return "US";
  return null;
}

/** Country from whichever geo header the hosting edge set, if any. */
export function countryFromHeaders(headers = {}) {
  for (const name of ["x-country-code", "x-appengine-country", "cf-ipcountry", "x-client-geo-country"]) {
    const v = String(headers[name] || "").trim().toUpperCase();
    if (COUNTRY_RE.test(v) && v !== "ZZ" && v !== "XX") return v;
  }
  return null;
}

/** City from the geo header, when the edge sets one. */
export function cityFromHeaders(headers = {}) {
  const v = headers["x-appengine-city"] || headers["x-client-geo-city"];
  const city = str(typeof v === "string" ? v : "", 60);
  return city && city !== "?" ? city : null;
}

/** "mobile" | "tablet" | "desktop" from a user agent string. */
export function deviceFromUserAgent(ua = "") {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "mobile";
  return "desktop";
}

/** Crawlers and headless browsers, whose visits are not people. */
export function isBotUserAgent(ua = "") {
  return !ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch|go-http/i.test(ua);
}

/**
 * The documents to write for one POST body, or [] when there's nothing
 * valid to keep. `geo` is { country, city } from the caller's IP lookup
 * (or null); headers win over it, the time zone is the last resort.
 * `now` is a Date; the caller turns `ts`/`expireAt` into Timestamps.
 */
export function eventsFromBatch(body, headers = {}, geo = null, now = new Date()) {
  if (!body || typeof body !== "object") return [];
  const ua = String(headers["user-agent"] || "");
  if (isBotUserAgent(ua)) return [];
  if (!SITES.includes(body.site)) return [];
  const vid = typeof body.vid === "string" && ID_RE.test(body.vid) ? body.vid : null;
  const sid = typeof body.sid === "string" && ID_RE.test(body.sid) ? body.sid : null;
  if (!vid || !sid) return [];
  const list = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : [];

  const tz = str(body.tz, 60);
  const headerCountry = countryFromHeaders(headers);
  const geoCountry = typeof geo?.country === "string" && COUNTRY_RE.test(geo.country) ? geo.country : null;
  const shared = {
    site: body.site,
    vid,
    sid,
    newVisitor: body.newVisitor === true,
    admin: body.admin === true,
    country: headerCountry || geoCountry || countryFromTimeZone(tz),
    city: headerCountry ? cityFromHeaders(headers) : geoCountry ? str(geo.city, 60) : null,
    tz,
    lang: typeof body.lang === "string" && /^[a-z]{2}$/.test(body.lang) ? body.lang : null,
    device: deviceFromUserAgent(ua),
    ref: str(body.ref, 100),
    utmSource: str(body.utmSource, 100),
    utmMedium: str(body.utmMedium, 100),
    utmCampaign: str(body.utmCampaign, 100),
  };

  const out = [];
  const nowMs = now.getTime();
  for (const e of list) {
    if (!e || typeof e !== "object" || !EVENT_TYPES.includes(e.type)) continue;
    const path = typeof e.path === "string" && e.path.startsWith("/") ? e.path.split(/[?#]/)[0].slice(0, 200) : null;
    if (!path) continue;
    // Client clocks drift; trust them only for ordering within the
    // batch (a few minutes at most), never to backdate or future-date.
    const age = Number(e.ago);
    const ts = new Date(nowMs - (Number.isFinite(age) && age > 0 ? Math.min(age, 10 * 60 * 1000) : 0));
    const doc = { ...shared, type: e.type, path, ts, expireAt: new Date(ts.getTime() + RETENTION_DAYS * 86400000) };
    if (typeof e.slug === "string" && SLUG_RE.test(e.slug)) doc.slug = e.slug;
    if (NEEDS_SLUG.has(doc.type) && !doc.slug) continue;
    out.push(doc);
  }
  return out;
}

// ─── Admin read shaping ────────────────────────────────────────────────

export const MAX_EVENTS = 20000;
export const MAX_RANGE_DAYS = 400;

const iso = (v) => {
  if (!v) return null;
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const s = (v) => (typeof v === "string" && v ? v : null);

/** Parses { from, to } (ISO). Returns null when missing or out of bounds. */
export function parseRange(data = {}, now = new Date()) {
  const from = new Date(String(data.from || ""));
  const to = data.to ? new Date(String(data.to)) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) return null;
  if (to - from > MAX_RANGE_DAYS * 86400000) return null;
  return { from, to };
}

/** What the admin dashboard gets for one stored event. */
export function eventRow(x = {}) {
  return {
    site: s(x.site), type: s(x.type), path: s(x.path), ts: iso(x.ts), vid: s(x.vid), sid: s(x.sid),
    newVisitor: x.newVisitor === true, admin: x.admin === true,
    country: s(x.country), city: s(x.city), device: s(x.device), lang: s(x.lang),
    ref: s(x.ref), utmSource: s(x.utmSource), utmCampaign: s(x.utmCampaign),
    ...(s(x.slug) ? { slug: x.slug } : {}),
  };
}
