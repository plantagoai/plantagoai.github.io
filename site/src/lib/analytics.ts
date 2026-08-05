import {
  collection,
  addDoc,
  query,
  orderBy,
  limit as fsLimit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
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
// Admin panel login analytics
//
// Design mirrors foundation's sessions/getLoginAnalytics pattern (one row
// per login event, summarized client-side) but simplified for this app:
// no ring-based permissions, no geo lookup, no Cloud Function — plantagoai-
// site's admin gate is just an email allowlist and its Firestore rules are
// already isAdmin()-gated, so a direct client read is safe and consistent
// with how the rest of this dashboard (DBOverview, TestRunner) already
// reads Firestore directly.
// ---------------------------------------------------------------------------

export async function logAdminLogin(user: User): Promise<void> {
  await addDoc(collection(db, "admin_logins"), {
    email: user.email || "",
    uid: user.uid,
    loggedInAt: serverTimestamp(),
  });
}

export async function fetchRecentAdminLogins(max = 50): Promise<AdminLoginRow[]> {
  const q = query(collection(db, "admin_logins"), orderBy("loggedInAt", "desc"), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.loggedInAt as Timestamp | undefined;
    return {
      email: data.email || "",
      uid: data.uid || "",
      loggedInAt: ts ? ts.toDate().toISOString() : new Date(0).toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Guest browsing analytics — anonymous pageview counter for public sites
//
// Deliberately minimal: no PII, no fingerprinting, no cross-session
// identity. One doc per pageview: {site, path, visitedAt}. Writes are
// public (unauthenticated visitors), reads are admin-only — see
// firestore.rules for the shape validation that keeps this collection
// resistant to abuse despite the open write.
// ---------------------------------------------------------------------------

export async function logGuestVisit(site: GuestSite, path: string = "/"): Promise<void> {
  try {
    await addDoc(collection(db, "guest_visits"), {
      site,
      path: path.slice(0, 500),
      visitedAt: serverTimestamp(),
    });
  } catch {
    // Analytics must never break the site for a visitor — swallow silently.
  }
}

export async function fetchRecentGuestVisits(max = 200): Promise<GuestVisitRow[]> {
  const q = query(collection(db, "guest_visits"), orderBy("visitedAt", "desc"), fsLimit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.visitedAt as Timestamp | undefined;
    return {
      site: data.site,
      path: data.path || "",
      visitedAt: ts ? ts.toDate().toISOString() : new Date(0).toISOString(),
    };
  });
}
