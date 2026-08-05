import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Mirrors the shape written by site/src/lib/analytics.ts's logGuestVisit —
// same "guest_visits" collection, same {site, path, visitedAt} shape, so
// the admin dashboard's GuestAnalytics panel (in the site/ app) can read
// both sites' visits from one collection. Kept as a standalone duplicate
// rather than a shared import because site/ and personal-site/ are
// separate Vite apps with separate package.json — no workspace link
// between them today.
export async function logGuestVisit(path: string = "/"): Promise<void> {
  try {
    await addDoc(collection(db, "guest_visits"), {
      site: "dagangilat",
      path: path.slice(0, 500),
      visitedAt: serverTimestamp(),
    });
  } catch {
    // Analytics must never break the site for a visitor — swallow silently.
  }
}
