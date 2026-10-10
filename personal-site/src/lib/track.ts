/**
 * First-party visit tracking for Admin → Visitors, ported from
 * limorgilat.com's src/analytics/track.ts. Events are queued and sent in
 * small batches to POST /api/track (functions/analytics.js trackFn), which
 * adds the country and device and stores them in `analyticsEvents`.
 *
 * Ids are random and live only in this browser: a visitor id in
 * localStorage and a session id in sessionStorage that rolls over after
 * 30 idle minutes. No cookies, no third parties.
 *
 * Copy of site/src/lib/track.ts with SITE set to "dagangilat" — the two
 * packages share no code, so keep them in step. The endpoint is served by
 * the plantagoai project's trackFn via the /api/track rewrite in the root
 * firebase.json.
 */

export type TrackType = "page" | "section" | "outbound" | "chat" | "game" | "contact" | "subscribe";

const SITE = "dagangilat";
const VID_KEY = "dagangilat:vid:v1";
const SESSION_KEY = "dagangilat:session:v1";
const ATTRIBUTION_KEY = "dagangilat:attribution:v1";
/** Set by markAdminBrowser, so this browser's visits can be left out of
 *  the numbers. dagangilat.com has no admin page; plantagoai.com/admin
 *  sets its own flag on that origin. */
const ADMIN_KEY = "dagangilat:admin:v1";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const FLUSH_DELAY_MS = 2000;
const ENDPOINT = "/api/track";

type Queued = { type: TrackType; path: string; at: number; slug?: string };
type Attribution = { ref?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string };

const queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function randomId(prefix: string): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

function enabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;
  if (navigator.webdriver) return false;
  return true;
}

/** Visitor id, and whether it was created during this session. */
function visitor(): { vid: string; isNew: boolean } {
  try {
    const existing = localStorage.getItem(VID_KEY);
    if (existing) return { vid: existing, isNew: false };
    const vid = randomId("v");
    localStorage.setItem(VID_KEY, vid);
    return { vid, isNew: true };
  } catch {
    return { vid: randomId("v"), isNew: true };
  }
}

function session(): { sid: string; newVisitor: boolean } {
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const s = raw ? (JSON.parse(raw) as { sid: string; last: number; newVisitor: boolean }) : null;
    if (s && now - s.last < SESSION_IDLE_MS) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, last: now }));
      return s;
    }
    const next = { sid: randomId("s"), last: now, newVisitor: visitor().isNew };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next;
  } catch {
    return { sid: randomId("s"), newVisitor: false };
  }
}

/** First-touch attribution for this session: UTM params, else the
 *  referring host (never the full referrer URL, which can leak the
 *  referring page's own query string). */
function attribution(): Attribution {
  try {
    const existing = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (existing) return JSON.parse(existing) as Attribution;
    const params = new URLSearchParams(window.location.search);
    let ref: string | undefined;
    try { ref = document.referrer ? new URL(document.referrer).hostname : undefined; } catch { ref = undefined; }
    const a: Attribution = {
      ref,
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(a));
    return a;
  } catch {
    return {};
  }
}

function isAdminBrowser(): boolean {
  try { return localStorage.getItem(ADMIN_KEY) === "1"; } catch { return false; }
}

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, 25);
  const now = Date.now();
  const { sid, newVisitor } = session();
  const body = JSON.stringify({
    site: SITE,
    vid: visitor().vid,
    sid,
    newVisitor,
    admin: isAdminBrowser(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: (navigator.language || "").slice(0, 2).toLowerCase() || undefined,
    ...attribution(),
    events: events.map(({ at, ...e }) => ({ ...e, ago: now - at })),
  });
  try {
    // text/plain keeps sendBeacon a "simple" request (no preflight).
    const blob = new Blob([body], { type: "text/plain" });
    if (!navigator.sendBeacon?.(ENDPOINT, blob)) {
      void fetch(ENDPOINT, { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* tracking is best-effort */
  }
  if (queue.length) flush();
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/** Queue one event. Admin pages are never tracked. */
export function track(type: TrackType, slug?: string) {
  if (!enabled()) return;
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return;
  attribution(); // capture on landing, before any in-page navigation
  listen();
  queue.push({ type, path, at: Date.now(), ...(slug ? { slug } : {}) });
  // Conversions go out at once: the visitor may leave right after.
  if (type === "contact" || type === "subscribe" || type === "outbound") { flush(); return; }
  if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
}

/** Once per session per section, when at least a third of it is on screen. */
export function trackSections(ids: string[]): () => void {
  if (!enabled() || typeof IntersectionObserver === "undefined") return () => {};
  const seen = new Set<string>();
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY}:sections`);
    if (raw) for (const id of JSON.parse(raw) as string[]) seen.add(id);
  } catch { /* best-effort */ }
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const id = (e.target as HTMLElement).id;
      if (!e.isIntersecting || seen.has(id)) continue;
      seen.add(id);
      try { sessionStorage.setItem(`${SESSION_KEY}:sections`, JSON.stringify([...seen])); } catch { /* best-effort */ }
      track("section", id);
    }
  }, { threshold: 0.33 });
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
  return () => observer.disconnect();
}

/** Turns an outbound link into a short slug: a known project id when the
 *  caller has one, else the link's hostname. */
export function outboundSlug(href: string, projectId?: string): string | undefined {
  const raw = projectId || (() => { try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const slug = raw.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 60);
  return slug || undefined;
}

/** Called by /admin when an admin signs in: this browser's own visits are
 *  flagged so Admin → Visitors can leave them out. */
export function markAdminBrowser() {
  try { localStorage.setItem(ADMIN_KEY, "1"); } catch { /* best-effort */ }
}
