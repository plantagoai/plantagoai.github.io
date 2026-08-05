import { describe, it, expect } from "vitest";
import {
  summarizeAdminLogins,
  summarizeGuestVisits,
  isoCountryToFlag,
  bucketByHour,
  bucketByDow,
  bucketByMonth,
  bucketByCountry,
  bucketByDay,
  type AdminLoginRow,
  type GuestVisitRow,
} from "./analyticsSummary";

// Row literals need country/city now that geo is part of the shape (server-
// resolved from IP) — null is the common "not geolocated" case, exercised
// explicitly where it matters (bucketByCountry's "??" bucket).
function loginRow(over: Partial<AdminLoginRow> & Pick<AdminLoginRow, "email" | "uid" | "loggedInAt">): AdminLoginRow {
  return { country: null, city: null, ...over };
}
function visitRow(over: Partial<GuestVisitRow> & Pick<GuestVisitRow, "site" | "path" | "visitedAt">): GuestVisitRow {
  return { country: null, city: null, ...over };
}

describe("summarizeAdminLogins", () => {
  it("returns zeroed summary for no rows", () => {
    expect(summarizeAdminLogins([])).toEqual({ total: 0, byAdmin: {}, lastLogin: null });
  });

  it("counts logins per admin and finds the most recent", () => {
    const rows: AdminLoginRow[] = [
      loginRow({ email: "a@example.com", uid: "1", loggedInAt: "2026-08-01T00:00:00.000Z" }),
      loginRow({ email: "a@example.com", uid: "1", loggedInAt: "2026-08-03T00:00:00.000Z" }),
      loginRow({ email: "b@example.com", uid: "2", loggedInAt: "2026-08-02T00:00:00.000Z" }),
    ];

    const summary = summarizeAdminLogins(rows);

    expect(summary.total).toBe(3);
    expect(summary.byAdmin).toEqual({ "a@example.com": 2, "b@example.com": 1 });
    expect(summary.lastLogin).toBe("2026-08-03T00:00:00.000Z");
  });

  it("picks the correct lastLogin regardless of input order", () => {
    const rows: AdminLoginRow[] = [
      loginRow({ email: "a@example.com", uid: "1", loggedInAt: "2026-08-05T00:00:00.000Z" }),
      loginRow({ email: "a@example.com", uid: "1", loggedInAt: "2026-08-01T00:00:00.000Z" }),
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
      visitRow({ site: "plantagoai", path: "/", visitedAt: "2026-08-04T00:00:00.000Z" }),
      visitRow({ site: "plantagoai", path: "/#about", visitedAt: "2026-08-04T00:00:00.000Z" }),
      visitRow({ site: "dagangilat", path: "/", visitedAt: "2026-08-04T00:00:00.000Z" }),
    ];

    expect(summarizeGuestVisits(rows, NOW).bySite).toEqual({ plantagoai: 2, dagangilat: 1 });
  });

  it("counts only visits within the last 24h", () => {
    const rows: GuestVisitRow[] = [
      visitRow({ site: "plantagoai", path: "/", visitedAt: "2026-08-05T11:00:00.000Z" }), // 1h ago — in window
      visitRow({ site: "plantagoai", path: "/", visitedAt: "2026-08-04T00:00:00.000Z" }), // 36h ago — out
    ];

    expect(summarizeGuestVisits(rows, NOW).last24h).toBe(1);
  });

  it("treats a visit exactly 24h ago as still in-window (inclusive boundary)", () => {
    const rows: GuestVisitRow[] = [
      visitRow({ site: "plantagoai", path: "/", visitedAt: new Date(NOW - 24 * 60 * 60 * 1000).toISOString() }),
    ];

    expect(summarizeGuestVisits(rows, NOW).last24h).toBe(1);
  });
});

describe("isoCountryToFlag", () => {
  it("converts a valid ISO2 code to the matching flag emoji", () => {
    expect(isoCountryToFlag("US")).toBe("🇺🇸");
    expect(isoCountryToFlag("il")).toBe("🇮🇱"); // lowercase input, still valid
  });

  it("returns empty string for null, wrong length, or non-letter input", () => {
    expect(isoCountryToFlag(null)).toBe("");
    expect(isoCountryToFlag("USA")).toBe("");
    expect(isoCountryToFlag("1A")).toBe("");
    expect(isoCountryToFlag("")).toBe("");
  });
});

describe("bucketByHour", () => {
  it("buckets timestamps into their UTC hour", () => {
    const rows = [
      { ts: "2026-08-05T03:00:00.000Z" },
      { ts: "2026-08-05T03:30:00.000Z" },
      { ts: "2026-08-05T14:00:00.000Z" },
    ];
    const buckets = bucketByHour(rows, "UTC");
    expect(buckets).toHaveLength(24);
    expect(buckets[3].count).toBe(2);
    expect(buckets[14].count).toBe(1);
    expect(buckets[0].count).toBe(0);
  });

  it("shifts the bucketed hour under a non-UTC timezone", () => {
    // 2026-08-05T03:00:00Z is 2026-08-04T20:00:00 in America/Los_Angeles (PDT, UTC-7 in August)
    const rows = [{ ts: "2026-08-05T03:00:00.000Z" }];
    const buckets = bucketByHour(rows, "America/Los_Angeles");
    expect(buckets[20].count).toBe(1);
    expect(buckets[3].count).toBe(0);
  });
});

describe("bucketByDow", () => {
  it("buckets by day of week with correct labels", () => {
    // 2026-08-05 is a Wednesday
    const rows = [{ ts: "2026-08-05T12:00:00.000Z" }];
    const buckets = bucketByDow(rows, "UTC");
    expect(buckets).toHaveLength(7);
    expect(buckets.find((b) => b.label === "Wed")?.count).toBe(1);
  });
});

describe("bucketByMonth", () => {
  it("groups by year-month and sorts ascending", () => {
    const rows = [
      { ts: "2026-08-05T00:00:00.000Z" },
      { ts: "2026-06-01T00:00:00.000Z" },
      { ts: "2026-08-20T00:00:00.000Z" },
    ];
    expect(bucketByMonth(rows, "UTC")).toEqual([
      { month: "2026-06", count: 1 },
      { month: "2026-08", count: 2 },
    ]);
  });
});

describe("bucketByCountry", () => {
  it("sorts by count descending and attaches a flag", () => {
    const rows = [
      { ts: "2026-08-01T00:00:00.000Z", country: "US" },
      { ts: "2026-08-01T00:00:00.000Z", country: "US" },
      { ts: "2026-08-01T00:00:00.000Z", country: "IL" },
    ];
    const result = bucketByCountry(rows);
    expect(result[0]).toEqual({ country: "US", count: 2, flag: "🇺🇸" });
    expect(result[1]).toEqual({ country: "IL", count: 1, flag: "🇮🇱" });
  });

  it("buckets null country under '??' with no flag", () => {
    const rows = [{ ts: "2026-08-01T00:00:00.000Z", country: null }];
    expect(bucketByCountry(rows)).toEqual([{ country: "??", count: 1, flag: "" }]);
  });

  it("respects the topN limit", () => {
    const rows = ["US", "IL", "DE", "JP"].map((country) => ({ ts: "2026-08-01T00:00:00.000Z", country }));
    expect(bucketByCountry(rows, 2)).toHaveLength(2);
  });
});

describe("bucketByDay", () => {
  it("groups rows by calendar day and sorts newest first", () => {
    const rows = [
      { ts: "2026-08-01T10:00:00.000Z" },
      { ts: "2026-08-01T14:00:00.000Z" },
      { ts: "2026-08-03T09:00:00.000Z" },
    ];
    const days = bucketByDay(rows, "UTC");
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe("2026-08-03");
    expect(days[0].total).toBe(1);
    expect(days[1].date).toBe("2026-08-01");
    expect(days[1].total).toBe(2);
    expect(days[1].rows).toHaveLength(2);
  });
});
