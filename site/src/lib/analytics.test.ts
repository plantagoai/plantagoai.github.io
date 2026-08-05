import { describe, it, expect } from "vitest";
import {
  summarizeAdminLogins,
  summarizeGuestVisits,
  type AdminLoginRow,
  type GuestVisitRow,
} from "./analyticsSummary";

describe("summarizeAdminLogins", () => {
  it("returns zeroed summary for no rows", () => {
    expect(summarizeAdminLogins([])).toEqual({ total: 0, byAdmin: {}, lastLogin: null });
  });

  it("counts logins per admin and finds the most recent", () => {
    const rows: AdminLoginRow[] = [
      { email: "a@example.com", uid: "1", loggedInAt: "2026-08-01T00:00:00.000Z" },
      { email: "a@example.com", uid: "1", loggedInAt: "2026-08-03T00:00:00.000Z" },
      { email: "b@example.com", uid: "2", loggedInAt: "2026-08-02T00:00:00.000Z" },
    ];

    const summary = summarizeAdminLogins(rows);

    expect(summary.total).toBe(3);
    expect(summary.byAdmin).toEqual({ "a@example.com": 2, "b@example.com": 1 });
    expect(summary.lastLogin).toBe("2026-08-03T00:00:00.000Z");
  });

  it("picks the correct lastLogin regardless of input order", () => {
    const rows: AdminLoginRow[] = [
      { email: "a@example.com", uid: "1", loggedInAt: "2026-08-05T00:00:00.000Z" },
      { email: "a@example.com", uid: "1", loggedInAt: "2026-08-01T00:00:00.000Z" },
    ];

    expect(summarizeAdminLogins(rows).lastLogin).toBe("2026-08-05T00:00:00.000Z");
  });
});

describe("summarizeGuestVisits", () => {
  const NOW = new Date("2026-08-05T12:00:00.000Z").getTime();

  it("returns zeroed summary for no rows", () => {
    expect(summarizeGuestVisits([], NOW)).toEqual({
      total: 0,
      bySite: { plantagoai: 0, dagangilat: 0 },
      last24h: 0,
    });
  });

  it("buckets visits by site", () => {
    const rows: GuestVisitRow[] = [
      { site: "plantagoai", path: "/", visitedAt: "2026-08-04T00:00:00.000Z" },
      { site: "plantagoai", path: "/#about", visitedAt: "2026-08-04T00:00:00.000Z" },
      { site: "dagangilat", path: "/", visitedAt: "2026-08-04T00:00:00.000Z" },
    ];

    expect(summarizeGuestVisits(rows, NOW).bySite).toEqual({ plantagoai: 2, dagangilat: 1 });
  });

  it("counts only visits within the last 24h", () => {
    const rows: GuestVisitRow[] = [
      { site: "plantagoai", path: "/", visitedAt: "2026-08-05T11:00:00.000Z" }, // 1h ago — in window
      { site: "plantagoai", path: "/", visitedAt: "2026-08-04T00:00:00.000Z" }, // 36h ago — out
    ];

    expect(summarizeGuestVisits(rows, NOW).last24h).toBe(1);
  });

  it("treats a visit exactly 24h ago as still in-window (inclusive boundary)", () => {
    const rows: GuestVisitRow[] = [
      { site: "plantagoai", path: "/", visitedAt: new Date(NOW - 24 * 60 * 60 * 1000).toISOString() },
    ];

    expect(summarizeGuestVisits(rows, NOW).last24h).toBe(1);
  });
});
