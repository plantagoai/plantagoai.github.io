// Guest-visit logging via a plain server-side call — no Firebase SDK needed
// here at all anymore. The write (with real IP capture, which client JS
// can never reliably self-report) happens entirely in
// site/functions/analytics.js's logGuestVisitFn; this site just POSTs to
// it. Rewritten as /api/logGuestVisit on the "personal" hosting target
// (see ../../site/firebase.json), which lives in the same plantagoai
// project as that function.
export async function logGuestVisit(path: string = "/"): Promise<void> {
  try {
    await fetch("/api/logGuestVisit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site: "dagangilat", path: path.slice(0, 500) }),
    });
  } catch {
    // Analytics must never break the site for a visitor — swallow silently.
  }
}
