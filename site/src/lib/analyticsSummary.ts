// Pure summary functions, split out from analytics.ts so they're testable
// without pulling in firebase.ts's module-load-time initializeAppCheck()
// side effect (which requires a browser DOM and breaks under vitest/Node).

export interface AdminLoginRow {
  email: string;
  uid: string;
  loggedInAt: string; // ISO
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
