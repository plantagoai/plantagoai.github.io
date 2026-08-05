import { getFunctions, httpsCallable } from "firebase/functions";
import type { User } from "firebase/auth";
import { app } from "./firebase";
import {
  summarizeAdminLogins,
  summarizeGuestVisits,
  type AdminLoginRow,
  type AdminLoginSummary,
  type GuestSite,
  type GuestVisitRow,
  type GuestVisitSummary,
} from "./analyticsSummary";

export {
  summarizeAdminLogins,
  summarizeGuestVisits,
  type AdminLoginRow,
  type AdminLoginSummary,
  type GuestSite,
  type GuestVisitRow,
  type GuestVisitSummary,
};

// ---------------------------------------------------------------------------
// Admin panel login analytics + guest browsing analytics
//
// Both are logged and read exclusively through Cloud Functions now (see
// functions/analytics.js), not direct client Firestore calls — the real
// visitor IP can only be captured server-side (request.rawRequest.ip /
// req.ip), never trusted from client JS. Firestore rules for both
// collections are `allow read, write: if false` as a result: there is no
// direct-client path to either collection anymore.
// ---------------------------------------------------------------------------

const fns = getFunctions(app, "us-east1");

export async function logAdminLogin(_user: User): Promise<void> {
  // _user kept in the signature for callsite compatibility (useAdmin()
  // already has it on hand) even though the callable derives identity
  // from the caller's own ID token, not a client-supplied value.
  const fn = httpsCallable(fns, "logAdminLoginFn");
  await fn({});
}

export async function logGuestVisit(site: GuestSite, path: string = "/"): Promise<void> {
  try {
    await fetch("/api/logGuestVisit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site, path: path.slice(0, 500) }),
    });
  } catch {
    // Analytics must never break the site for a visitor — swallow silently.
  }
}

interface SessionRow {
  id: string;
  ts: number | null;
  country: string | null;
  city: string | null;
}
interface AdminLoginSessionRow extends SessionRow {
  email: string | null;
  uid: string | null;
}
interface GuestVisitSessionRow extends SessionRow {
  site: GuestSite | null;
  path: string | null;
}

interface SessionsResponse<T> {
  rows: T[];
  meta: { from: number; to: number; total: number; truncated: boolean; hardLimit: number };
}

const getAnalyticsSessionsFn = httpsCallable<
  { kind: "admin_logins" | "guest_visits"; from: string; to: string }
>(fns, "getAnalyticsSessions");

export async function fetchAdminLoginRows(fromMs: number, toMs: number): Promise<{ rows: AdminLoginRow[]; truncated: boolean }> {
  const { data } = await getAnalyticsSessionsFn({
    kind: "admin_logins",
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  });
  const { rows, meta } = data as SessionsResponse<AdminLoginSessionRow>;
  return {
    rows: rows
      .filter((r): r is AdminLoginSessionRow & { ts: number } => r.ts != null)
      .map((r) => ({
        email: r.email || "",
        uid: r.uid || "",
        loggedInAt: new Date(r.ts).toISOString(),
        country: r.country,
        city: r.city,
      })),
    truncated: meta.truncated,
  };
}

export async function fetchGuestVisitRows(fromMs: number, toMs: number): Promise<{ rows: GuestVisitRow[]; truncated: boolean }> {
  const { data } = await getAnalyticsSessionsFn({
    kind: "guest_visits",
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  });
  const { rows, meta } = data as SessionsResponse<GuestVisitSessionRow>;
  return {
    rows: rows
      .filter((r): r is GuestVisitSessionRow & { ts: number; site: GuestSite } =>
        r.ts != null && (r.site === "plantagoai" || r.site === "dagangilat"),
      )
      .map((r) => ({
        site: r.site,
        path: r.path || "",
        visitedAt: new Date(r.ts).toISOString(),
        country: r.country,
        city: r.city,
      })),
    truncated: meta.truncated,
  };
}
