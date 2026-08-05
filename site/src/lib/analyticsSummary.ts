// Pure summary/bucketing functions, split out from analytics.ts so they're
// testable without pulling in firebase.ts's module-load-time
// initializeAppCheck() side effect (which requires a browser DOM and
// breaks under vitest/Node).

export interface AdminLoginRow {
  email: string;
  uid: string;
  loggedInAt: string; // ISO
  country: string | null; // ISO2, resolved server-side from IP
  city: string | null;
}

export interface AdminLoginSummary {
  total: number;
  byAdmin: Record<string, number>;
  lastLogin: string | null;
}

/** Pure — summarizes already-fetched login rows. */
export function summarizeAdminLogins(rows: AdminLoginRow[]): AdminLoginSummary {
  const byAdmin: Record<string, number> = {};
  let lastLogin: string | null = null;

  for (const row of rows) {
    byAdmin[row.email] = (byAdmin[row.email] || 0) + 1;
    if (!lastLogin || row.loggedInAt > lastLogin) lastLogin = row.loggedInAt;
  }

  return { total: rows.length, byAdmin, lastLogin };
}

export type GuestSite = "plantagoai" | "dagangilat";

export interface GuestVisitRow {
  site: GuestSite;
  path: string;
  visitedAt: string; // ISO
  country: string | null;
  city: string | null;
}

export interface GuestVisitSummary {
  total: number;
  bySite: Record<GuestSite, number>;
  last24h: number;
}

/** Pure — summarizes already-fetched visit rows. */
export function summarizeGuestVisits(rows: GuestVisitRow[], now: number = Date.now()): GuestVisitSummary {
  const bySite: Record<GuestSite, number> = { plantagoai: 0, dagangilat: 0 };
  let last24h = 0;
  const cutoff = now - 24 * 60 * 60 * 1000;

  for (const row of rows) {
    bySite[row.site] = (bySite[row.site] || 0) + 1;
    if (new Date(row.visitedAt).getTime() >= cutoff) last24h += 1;
  }

  return { total: rows.length, bySite, last24h };
}

// ---------------------------------------------------------------------------
// Drill-down bucketing — mirrors foundation's AdminLoginAnalyticsTab client-
// side bucketing (partsInTz + byHour/byDow/byMonth/byCountry/byDay), adapted
// to this repo's simpler row shape (no site/ring/demo distinctions needed
// for guest visits; admin logins have no country filter UI, just the list).
// ---------------------------------------------------------------------------

export interface TzParts {
  year: number;
  month: number; // 1..12
  day: number;
  hour: number; // 0..23
  dow: number; // 0=Sun..6=Sat
}

/** Decompose an epoch-ms timestamp under the given IANA TZ, avoiding manual TZ math. */
export function partsInTz(ms: number, tz: string): TzParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(ms)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24, // hour12:false sometimes returns "24"
    dow: dowMap[parts.weekday] ?? 0,
  };
}

/** ISO2 country code → flag emoji, via regional-indicator codepoint math. Empty string on invalid input. */
export function isoCountryToFlag(iso2: string | null): string {
  if (!iso2 || iso2.length !== 2) return "";
  const upper = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  const codePoints = upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - "A".charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "";
  }
}

export interface TimeRow {
  ts: string; // ISO
}

export const RANGE_OPTIONS = [
  { key: "7d", label: "7d", ms: 7 * 86400_000 },
  { key: "30d", label: "30d", ms: 30 * 86400_000 },
  { key: "90d", label: "90d", ms: 90 * 86400_000 },
  { key: "1y", label: "1y", ms: 365 * 86400_000 },
] as const;

export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function bucketByHour<T extends TimeRow>(rows: T[], tz: string): { hour: number; count: number }[] {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const r of rows) buckets[partsInTz(new Date(r.ts).getTime(), tz).hour].count += 1;
  return buckets;
}

export function bucketByDow<T extends TimeRow>(rows: T[], tz: string): { dow: number; label: string; count: number }[] {
  const buckets = DOW_LABELS.map((label, i) => ({ dow: i, label, count: 0 }));
  for (const r of rows) buckets[partsInTz(new Date(r.ts).getTime(), tz).dow].count += 1;
  return buckets;
}

export function bucketByMonth<T extends TimeRow>(rows: T[], tz: string): { month: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const p = partsInTz(new Date(r.ts).getTime(), tz);
    const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
}

export interface CountryRow extends TimeRow {
  country: string | null;
}

export function bucketByCountry<T extends CountryRow>(
  rows: T[],
  topN = 10,
): { country: string; count: number; flag: string }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r.country || "??";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([country, count]) => ({ country, count, flag: isoCountryToFlag(country === "??" ? null : country) }));
}

export function bucketByDay<T extends TimeRow>(
  rows: T[],
  tz: string,
): { date: string; total: number; rows: T[] }[] {
  const m = new Map<string, { date: string; total: number; rows: T[] }>();
  for (const r of rows) {
    const p = partsInTz(new Date(r.ts).getTime(), tz);
    const dateKey = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
    const entry = m.get(dateKey) ?? { date: dateKey, total: 0, rows: [] };
    entry.total += 1;
    entry.rows.push(r);
    m.set(dateKey, entry);
  }
  return [...m.values()].sort((a, b) => b.date.localeCompare(a.date));
}
