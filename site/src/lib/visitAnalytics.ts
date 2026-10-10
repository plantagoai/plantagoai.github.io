/**
 * Pure aggregation for Admin → Visitors, ported from limorgilat.com's
 * src/admin/analytics/analyticsData.ts (visits half; PlantagoAI has no
 * orders). No Firebase imports, so it runs under vitest. Events come from
 * `analyticsEvents`, written by POST /api/track (functions/analytics.js).
 *
 * Adjusted for these sites: both are single-page, so "how far a visit
 * got" is measured by sections reached, outbound clicks (project demos,
 * docs, source), chat/games on dagangilat.com, and contact/subscribe —
 * where the shop counted product views, add-to-cart and purchases.
 */

// ─── Time ranges and buckets ─────────────────────────────────────────

export type RangePreset = "1h" | "1d" | "7d" | "30d" | "90d" | "custom";
export const RANGE_PRESETS: RangePreset[] = ["1h", "1d", "7d", "30d", "90d", "custom"];
export type Range = { from: Date; to: Date };

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const PRESET_MS: Record<Exclude<RangePreset, "custom">, number> = {
  "1h": HOUR, "1d": DAY, "7d": 7 * DAY, "30d": 30 * DAY, "90d": 90 * DAY,
};

/** The window a preset covers, ending now. "custom" uses the given dates. */
export function rangeFor(preset: RangePreset, now: Date, custom?: Range): Range {
  if (preset === "custom") {
    if (custom && custom.to > custom.from) return custom;
    return { from: new Date(now.getTime() - 7 * DAY), to: now };
  }
  return { from: new Date(now.getTime() - PRESET_MS[preset]), to: now };
}

export type BucketUnit = "5m" | "1h" | "1d" | "1w";

/** Bucket size that gives a readable number of bars for the range. */
export function bucketUnit(range: Range): BucketUnit {
  const span = range.to.getTime() - range.from.getTime();
  if (span <= 3 * HOUR) return "5m";
  if (span <= 2 * DAY) return "1h";
  if (span <= 120 * DAY) return "1d";
  return "1w";
}

/** Start of the bucket holding `d`, in the browser's local time. */
export function bucketStart(d: Date, unit: BucketUnit): Date {
  const x = new Date(d.getTime());
  if (unit === "5m") {
    x.setSeconds(0, 0);
    x.setMinutes(x.getMinutes() - (x.getMinutes() % 5));
  } else if (unit === "1h") {
    x.setMinutes(0, 0, 0);
  } else {
    x.setHours(0, 0, 0, 0);
    if (unit === "1w") x.setDate(x.getDate() - x.getDay());
  }
  return x;
}

function nextBucket(d: Date, unit: BucketUnit): Date {
  const x = new Date(d.getTime());
  if (unit === "5m") x.setMinutes(x.getMinutes() + 5);
  else if (unit === "1h") x.setHours(x.getHours() + 1);
  else x.setDate(x.getDate() + (unit === "1w" ? 7 : 1));
  return x;
}

/** Bucket start times covering the range (local-time aligned). */
export function buckets(range: Range, unit = bucketUnit(range)): Date[] {
  const out: Date[] = [];
  for (let b = bucketStart(range.from, unit); b < range.to && out.length < 2000; b = nextBucket(b, unit)) out.push(b);
  return out;
}

/** Index of the bucket a time falls in, or -1 outside the range. */
function bucketIndexer(list: Date[], range: Range) {
  const starts = list.map((b) => b.getTime());
  return (t: Date) => {
    const ms = t.getTime();
    if (ms < range.from.getTime() || ms >= range.to.getTime()) return -1;
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= ms) lo = mid; else hi = mid - 1;
    }
    return starts[lo] <= ms ? lo : -1;
  };
}

// ─── Visits ──────────────────────────────────────────────────────────

export type VisitSite = "plantagoai" | "dagangilat";
export type VisitType = "page" | "section" | "outbound" | "chat" | "game" | "contact" | "subscribe";

export type VisitEvent = {
  site: VisitSite | null;
  type: VisitType;
  path: string;
  ts: Date;
  vid: string;
  sid: string;
  newVisitor?: boolean;
  admin?: boolean;
  country?: string | null;
  city?: string | null;
  device?: string | null;
  lang?: string | null;
  ref?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  slug?: string;
};

export type Count = { key: string; value: number };

/** Hosts that count as "direct" when they show up as a referrer. */
export const OWN_HOSTS = [
  "plantagoai.com", "plantagoai.web.app", "plantagoai.firebaseapp.com", "plantagoai.github.io",
  "dagangilat.com", "dagangilat-personal.web.app",
];

/** Where a visit came from: the UTM source, else the referring site,
 *  folded so a network's many hosts count as one; "direct" otherwise. */
export function sourceOf(utmSource?: string | null, ref?: string | null, ownHosts: string[] = OWN_HOSTS): string {
  if (utmSource) return utmSource.toLowerCase();
  if (!ref) return "direct";
  const host = ref.toLowerCase().replace(/^www\./, "");
  if (ownHosts.some((h) => host === h || host.endsWith(`.${h}`))) return "direct";
  if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(host)) return "linkedin";
  if (/(^|\.)github\.com$/.test(host)) return "github";
  if (/(^|\.)facebook\.com$|^fb\.me$/.test(host)) return "facebook";
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  if (/(^|\.)(bing\.com|duckduckgo\.com)$/.test(host)) return "search";
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return "x";
  if (/(^|\.)news\.ycombinator\.com$/.test(host)) return "hackernews";
  if (/(^|\.)reddit\.com$/.test(host)) return "reddit";
  if (/(^|\.)whatsapp\.(com|net)$/.test(host)) return "whatsapp";
  if (/(^|\.)(mail\.google\.com|outlook\.live\.com)$/.test(host)) return "email";
  if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com)$/.test(host)) return "ai";
  return host;
}

function topCounts(map: Map<string, number>, max = 10): Count[] {
  return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value || a.key.localeCompare(b.key)).slice(0, max);
}

function distinctBy<T>(items: T[], key: (t: T) => string | null | undefined, id: (t: T) => string): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const it of items) {
    const k = key(it) || "unknown";
    if (!sets.has(k)) sets.set(k, new Set());
    sets.get(k)!.add(id(it));
  }
  return new Map([...sets.entries()].map(([k, s]) => [k, s.size]));
}

export type SessionRow = {
  sid: string;
  vid: string;
  site: VisitSite | null;
  start: Date;
  end: Date;
  country: string | null;
  city: string | null;
  device: string | null;
  lang: string | null;
  source: string;
  newVisitor: boolean;
  pages: number;
  sections: string[];
  outbound: string[];
  interactions: number;
  engaged: boolean;
  clickedOut: boolean;
  contacted: boolean;
};

export type OutboundRow = { slug: string; clicks: number; visitors: number };

export type FunnelStep = "sessions" | "engaged" | "outbound" | "contact";

export type VisitSummary = {
  visitors: number;
  newVisitors: number;
  sessions: number;
  pageViews: number;
  /** Median session length in seconds (first to last event). */
  medianSessionSec: number;
  bounceRate: number;
  contacts: number;
  funnel: { step: FunnelStep; sessions: number }[];
  series: { bucket: Date; visitors: number; pageViews: number }[];
  sites: Count[];
  countries: Count[];
  sources: Count[];
  sections: Count[];
  interactions: Count[];
  outbound: OutboundRow[];
  devices: Count[];
  languages: Count[];
  /** Page views by local [weekday 0-6][hour 0-23]. */
  heatmap: number[][];
  sessionsList: SessionRow[];
};

/** A session counts as engaged once it reaches a second section, or
 *  does anything beyond looking: click out, chat, play, get in touch. */
function isEngaged(sections: number, list: VisitEvent[]): boolean {
  return sections >= 2 || list.some((e) => e.type !== "page" && e.type !== "section");
}

export function summarizeVisits(
  all: VisitEvent[],
  range: Range,
  opts: { includeAdmins?: boolean; site?: VisitSite | "all"; ownHosts?: string[] } = {},
): VisitSummary {
  const site = opts.site ?? "all";
  const events = all
    .filter((e) => e.ts >= range.from && e.ts < range.to && (opts.includeAdmins || !e.admin) && (site === "all" || e.site === site))
    .sort((a, b) => a.ts.getTime() - b.ts.getTime());
  const pageEvents = events.filter((e) => e.type === "page");

  // Sessions
  const bySession = new Map<string, VisitEvent[]>();
  for (const e of events) {
    if (!bySession.has(e.sid)) bySession.set(e.sid, []);
    bySession.get(e.sid)!.push(e);
  }
  const sessionsList: SessionRow[] = [...bySession.entries()].map(([sid, list]) => {
    const first = list[0];
    const sections = [...new Set(list.filter((e) => e.type === "section" && e.slug).map((e) => e.slug!))];
    const outbound = [...new Set(list.filter((e) => e.type === "outbound" && e.slug).map((e) => e.slug!))];
    return {
      sid,
      vid: first.vid,
      site: first.site,
      start: first.ts,
      end: list[list.length - 1].ts,
      country: first.country ?? null,
      city: first.city ?? null,
      device: first.device ?? null,
      lang: first.lang ?? null,
      source: sourceOf(first.utmSource, first.ref, opts.ownHosts),
      newVisitor: Boolean(first.newVisitor),
      pages: list.filter((e) => e.type === "page").length,
      sections,
      outbound,
      interactions: list.filter((e) => e.type === "chat" || e.type === "game").length,
      engaged: isEngaged(sections.length, list),
      clickedOut: outbound.length > 0,
      contacted: list.some((e) => e.type === "contact" || e.type === "subscribe"),
    };
  }).sort((a, b) => b.start.getTime() - a.start.getTime());

  const visitors = new Set(events.map((e) => e.vid)).size;
  const newVisitors = new Set(events.filter((e) => e.newVisitor).map((e) => e.vid)).size;
  const sessions = sessionsList.length;
  const durations = sessionsList.map((s) => (s.end.getTime() - s.start.getTime()) / 1000).sort((a, b) => a - b);
  const medianSessionSec = durations.length ? Math.round(durations[Math.floor(durations.length / 2)]) : 0;
  const contacted = sessionsList.filter((s) => s.contacted).length;

  const funnel: VisitSummary["funnel"] = [
    { step: "sessions", sessions },
    { step: "engaged", sessions: sessionsList.filter((s) => s.engaged).length },
    { step: "outbound", sessions: sessionsList.filter((s) => s.clickedOut).length },
    { step: "contact", sessions: contacted },
  ];

  // Over time
  const list = buckets(range);
  const index = bucketIndexer(list, range);
  const vids = list.map(() => new Set<string>());
  const views = list.map(() => 0);
  for (const e of events) {
    const i = index(e.ts);
    if (i < 0) continue;
    vids[i].add(e.vid);
    if (e.type === "page") views[i] += 1;
  }

  // Heat map of page views
  const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const e of pageEvents) heatmap[e.ts.getDay()][e.ts.getHours()] += 1;

  // Sections reached (sessions), interactions (events), outbound (clicks + visitors)
  const sectionMap = new Map<string, number>();
  for (const s of sessionsList) for (const sec of s.sections) sectionMap.set(sec, (sectionMap.get(sec) || 0) + 1);
  const interactionMap = new Map<string, number>();
  for (const e of events) {
    const key = e.type === "game" ? `game:${e.slug}` : e.type === "chat" || e.type === "contact" || e.type === "subscribe" ? e.type : null;
    if (key) interactionMap.set(key, (interactionMap.get(key) || 0) + 1);
  }
  const outMap = new Map<string, { clicks: number; viewers: Set<string> }>();
  for (const e of events) {
    if (e.type !== "outbound" || !e.slug) continue;
    if (!outMap.has(e.slug)) outMap.set(e.slug, { clicks: 0, viewers: new Set() });
    const r = outMap.get(e.slug)!;
    r.clicks += 1;
    r.viewers.add(e.vid);
  }

  const sessionFirst = sessionsList.map((s) => ({ ...s, id: s.sid }));

  return {
    visitors,
    newVisitors,
    sessions,
    pageViews: pageEvents.length,
    medianSessionSec,
    bounceRate: sessions ? sessionsList.filter((s) => !s.engaged).length / sessions : 0,
    contacts: contacted,
    funnel,
    series: list.map((bucket, i) => ({ bucket, visitors: vids[i].size, pageViews: views[i] })),
    sites: topCounts(distinctBy(sessionFirst, (s) => s.site, (s) => s.id)),
    countries: topCounts(distinctBy(sessionFirst, (s) => s.country, (s) => s.vid)),
    sources: topCounts(distinctBy(sessionFirst, (s) => s.source, (s) => s.id)),
    sections: topCounts(sectionMap, 12),
    interactions: topCounts(interactionMap, 12),
    outbound: [...outMap.entries()]
      .map(([slug, r]) => ({ slug, clicks: r.clicks, visitors: r.viewers.size }))
      .sort((a, b) => b.clicks - a.clicks || a.slug.localeCompare(b.slug)),
    devices: topCounts(distinctBy(sessionFirst, (s) => s.device, (s) => s.vid)),
    languages: topCounts(distinctBy(sessionFirst, (s) => s.lang, (s) => s.vid)),
    heatmap,
    sessionsList: sessionsList.slice(0, 50),
  };
}
