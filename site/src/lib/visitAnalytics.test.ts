import { describe, it, expect } from "vitest";
import { bucketUnit, buckets, rangeFor, sourceOf, summarizeVisits, type VisitEvent } from "./visitAnalytics";

const T0 = new Date("2026-10-10T10:00:00Z");
const at = (min: number) => new Date(T0.getTime() + min * 60_000);
const ev = (over: Partial<VisitEvent> & Pick<VisitEvent, "type" | "sid">): VisitEvent => ({
  site: "plantagoai", path: "/", ts: T0, vid: `v-${over.sid}`, country: "IL", device: "desktop", lang: "en", ...over,
});
const RANGE = { from: at(-60), to: at(60) };

describe("summarizeVisits", () => {
  const events: VisitEvent[] = [
    // s1: new visitor from LinkedIn, reads two sections, clicks a demo, contacts
    ev({ sid: "s1", type: "page", ts: at(0), newVisitor: true, ref: "www.linkedin.com" }),
    ev({ sid: "s1", type: "section", slug: "about", ts: at(1) }),
    ev({ sid: "s1", type: "section", slug: "products", ts: at(2) }),
    ev({ sid: "s1", type: "outbound", slug: "foundation", ts: at(3) }),
    ev({ sid: "s1", type: "contact", ts: at(5) }),
    // s2: bounces after one section
    ev({ sid: "s2", type: "page", ts: at(10), country: "US", device: "mobile" }),
    ev({ sid: "s2", type: "section", slug: "about", ts: at(10) }),
    // s3: dagangilat.com, plays a game
    ev({ sid: "s3", site: "dagangilat", type: "page", ts: at(20) }),
    ev({ sid: "s3", site: "dagangilat", type: "game", slug: "trivia", ts: at(22) }),
    // admin browsing and an out-of-range event are left out
    ev({ sid: "s4", type: "page", ts: at(30), admin: true }),
    ev({ sid: "s5", type: "page", ts: at(-120) }),
  ];

  it("counts visitors, sessions, bounce and the funnel", () => {
    const s = summarizeVisits(events, RANGE);
    expect(s.sessions).toBe(3);
    expect(s.visitors).toBe(3);
    expect(s.newVisitors).toBe(1);
    expect(s.pageViews).toBe(3);
    expect(s.contacts).toBe(1);
    expect(s.bounceRate).toBeCloseTo(1 / 3);
    expect(s.funnel.map((f) => f.sessions)).toEqual([3, 2, 1, 1]);
    expect(s.medianSessionSec).toBe(120);
  });

  it("breaks down by source, section, outbound, interaction and site", () => {
    const s = summarizeVisits(events, RANGE);
    expect(s.sources).toEqual([{ key: "direct", value: 2 }, { key: "linkedin", value: 1 }]);
    expect(s.sections[0]).toEqual({ key: "about", value: 2 });
    expect(s.outbound).toEqual([{ slug: "foundation", clicks: 1, visitors: 1 }]);
    expect(s.interactions).toEqual([{ key: "contact", value: 1 }, { key: "game:trivia", value: 1 }]);
    expect(s.sites).toEqual([{ key: "plantagoai", value: 2 }, { key: "dagangilat", value: 1 }]);
    expect(s.sessionsList[0].sid).toBe("s3");
  });

  it("filters by site and can include admins", () => {
    expect(summarizeVisits(events, RANGE, { site: "dagangilat" }).sessions).toBe(1);
    expect(summarizeVisits(events, RANGE, { includeAdmins: true }).sessions).toBe(4);
  });
});

describe("helpers", () => {
  it("folds referrers into sources", () => {
    expect(sourceOf(null, null)).toBe("direct");
    expect(sourceOf("Newsletter", "google.com")).toBe("newsletter");
    expect(sourceOf(null, "dagangilat.com")).toBe("direct");
    expect(sourceOf(null, "lnkd.in")).toBe("linkedin");
    expect(sourceOf(null, "news.ycombinator.com")).toBe("hackernews");
    expect(sourceOf(null, "example.org")).toBe("example.org");
  });

  it("picks bucket sizes and covers the range", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(bucketUnit(rangeFor("1h", now))).toBe("5m");
    expect(bucketUnit(rangeFor("1d", now))).toBe("1h");
    expect(bucketUnit(rangeFor("30d", now))).toBe("1d");
    expect(buckets(rangeFor("1d", now)).length).toBeGreaterThanOrEqual(24);
  });
});
