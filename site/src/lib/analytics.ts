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
import type { VisitEvent } from "./visitAnalytics";

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
// Admin panel login analytics + legacy guest browsing analytics
//
// Visitor tracking itself moved to src/lib/track.ts → POST /api/track
// (analyticsEvents); guest_visits is no longer written and is read only
// for its history. fetchVisitEvents below feeds Admin → Visitors.
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

// ---------------------------------------------------------------------------
// Admin → Visitors: raw analyticsEvents for a range (see functions/analytics.js
// getAnalyticsEvents). Aggregated client-side by src/lib/visitAnalytics.ts.
// ---------------------------------------------------------------------------

type WireVisitEvent = Omit<VisitEvent, "ts"> & { ts: string | null };

const getAnalyticsEventsFn = httpsCallable<
  { from: string; to: string },
  { events: WireVisitEvent[]; capped: boolean }
>(fns, "getAnalyticsEvents");

export async function fetchVisitEvents(from: Date, to: Date): Promise<{ events: VisitEvent[]; capped: boolean }> {
  const { data } = await getAnalyticsEventsFn({ from: from.toISOString(), to: to.toISOString() });
  return {
    events: data.events
      .filter((e): e is WireVisitEvent & { ts: string } => e.ts != null)
      .map((e) => ({ ...e, ts: new Date(e.ts) })),
    capped: data.capped,
  };
}
