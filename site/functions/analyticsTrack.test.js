// Runs under vitest with the site tests (npm test, from site/).
import { test } from "vitest";
import assert from "node:assert/strict";
import {
  countryFromHeaders, countryFromTimeZone, deviceFromUserAgent, eventRow, eventsFromBatch, isBotUserAgent,
  MAX_EVENTS_PER_BATCH, parseRange,
} from "./analyticsTrack.js";

const UA_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const UA_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/128.0 Safari/537.36";
const NOW = new Date("2026-10-10T10:00:00Z");
const batch = (events, extra = {}) => ({
  site: "plantagoai", vid: "v_abc12345", sid: "s_abc12345", tz: "Asia/Jerusalem", lang: "en", events, ...extra,
});

test("a page view becomes one event with site, country, device and session fields", () => {
  const [doc, ...rest] = eventsFromBatch(
    batch([{ type: "page", path: "/?utm_source=x" }], { ref: "linkedin.com", newVisitor: true }),
    { "user-agent": UA_IPHONE }, null, NOW,
  );
  assert.equal(rest.length, 0);
  assert.equal(doc.site, "plantagoai");
  assert.equal(doc.type, "page");
  assert.equal(doc.path, "/");
  assert.equal(doc.country, "IL");
  assert.equal(doc.device, "mobile");
  assert.equal(doc.ref, "linkedin.com");
  assert.equal(doc.newVisitor, true);
  assert.equal(doc.ts.getTime(), NOW.getTime());
  assert.ok(doc.expireAt > doc.ts);
  assert.equal("ip" in doc, false);
});

test("geo: header beats IP lookup, IP lookup beats time zone", () => {
  const ev = batch([{ type: "page", path: "/" }]);
  const [h] = eventsFromBatch(ev, { "user-agent": UA_MAC, "x-appengine-country": "us" }, { country: "DE", city: "Berlin" }, NOW);
  assert.equal(h.country, "US");
  assert.equal(h.city, null);
  const [g] = eventsFromBatch(ev, { "user-agent": UA_MAC }, { country: "DE", city: "Berlin" }, NOW);
  assert.equal(g.country, "DE");
  assert.equal(g.city, "Berlin");
  const [t] = eventsFromBatch(ev, { "user-agent": UA_MAC }, null, NOW);
  assert.equal(t.country, "IL");
  assert.equal(t.city, null);
});

test("bots, unknown sites, missing ids and unknown event types are dropped", () => {
  assert.deepEqual(eventsFromBatch(batch([{ type: "page", path: "/" }]), { "user-agent": "Googlebot/2.1" }, null, NOW), []);
  assert.deepEqual(eventsFromBatch(batch([{ type: "page", path: "/" }], { site: "evil" }), { "user-agent": UA_MAC }, null, NOW), []);
  assert.deepEqual(eventsFromBatch({ site: "plantagoai", events: [{ type: "page", path: "/" }] }, { "user-agent": UA_MAC }, null, NOW), []);
  assert.deepEqual(
    eventsFromBatch(batch([{ type: "hack", path: "/" }, { type: "page", path: "no-slash" }]), { "user-agent": UA_MAC }, null, NOW),
    [],
  );
});

test("section, outbound and game events need a valid slug", () => {
  const docs = eventsFromBatch(batch([
    { type: "section", path: "/" },
    { type: "outbound", path: "/", slug: "BAD SLUG" },
    { type: "section", path: "/", slug: "products" },
    { type: "outbound", path: "/", slug: "foundation" },
    { type: "contact", path: "/" },
  ]), { "user-agent": UA_MAC }, null, NOW);
  assert.deepEqual(docs.map((d) => [d.type, d.slug]), [["section", "products"], ["outbound", "foundation"], ["contact", undefined]]);
});

test("client \"ago\" only moves an event back up to ten minutes", () => {
  const [a, b] = eventsFromBatch(
    batch([{ type: "page", path: "/", ago: 5000 }, { type: "page", path: "/", ago: 99999999 }]),
    { "user-agent": UA_MAC }, null, NOW,
  );
  assert.equal(NOW - a.ts, 5000);
  assert.equal(NOW - b.ts, 10 * 60 * 1000);
});

test("a batch is capped", () => {
  const many = Array.from({ length: 60 }, () => ({ type: "page", path: "/" }));
  assert.equal(eventsFromBatch(batch(many), { "user-agent": UA_MAC }, null, NOW).length, MAX_EVENTS_PER_BATCH);
});

test("helpers: time zones, headers, devices, bots", () => {
  assert.equal(countryFromTimeZone("America/New_York"), "US");
  assert.equal(countryFromTimeZone("Mars/Base"), null);
  assert.equal(countryFromHeaders({ "cf-ipcountry": "XX" }), null);
  assert.equal(countryFromHeaders({ "x-country-code": "gb" }), "GB");
  assert.equal(deviceFromUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0)"), "tablet");
  assert.equal(isBotUserAgent(""), true);
  assert.equal(isBotUserAgent(UA_MAC), false);
});

test("parseRange and eventRow", () => {
  assert.equal(parseRange({ from: "nope" }), null);
  assert.equal(parseRange({ from: "2026-10-02T00:00:00Z", to: "2026-10-01T00:00:00Z" }), null);
  assert.equal(parseRange({ from: "2020-01-01T00:00:00Z", to: "2026-01-01T00:00:00Z" }), null);
  const r = parseRange({ from: "2026-10-01T00:00:00Z", to: "2026-10-02T00:00:00Z" });
  assert.equal(r.to - r.from, 86400000);
  const row = eventRow({ site: "dagangilat", type: "game", slug: "trivia", ts: NOW, vid: "v1", sid: "s1", ip: "1.2.3.4" });
  assert.equal(row.ts, NOW.toISOString());
  assert.equal(row.slug, "trivia");
  assert.equal("ip" in row, false);
});
