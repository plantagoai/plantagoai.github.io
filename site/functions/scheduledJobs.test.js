// Runs under vitest with the site tests (npm test, from site/).
import { test } from "vitest";
import assert from "node:assert/strict";
import { isDailyJobDue, JOB_DEFAULTS, jobSettings, localHour } from "./scheduledJobs.js";

const JOB = "pruneAnalyticsEvents";

test("missing settings fall back to the old fixed cron (daily 03:30 UTC)", () => {
  assert.deepEqual(jobSettings(JOB, undefined), { enabled: true, hour: 3, timeZone: "Etc/UTC" });
  assert.deepEqual(jobSettings(JOB, {}), JOB_DEFAULTS[JOB]);
});

test("invalid stored values are ignored field by field", () => {
  assert.deepEqual(
    jobSettings(JOB, { enabled: "no", hour: 24, timeZone: "Mars/Olympus" }),
    JOB_DEFAULTS[JOB],
  );
  assert.deepEqual(
    jobSettings(JOB, { enabled: false, hour: 1.5 }),
    { enabled: false, hour: 3, timeZone: "Etc/UTC" },
  );
  assert.deepEqual(
    jobSettings(JOB, { hour: 0, timeZone: "Asia/Jerusalem" }),
    { enabled: true, hour: 0, timeZone: "Asia/Jerusalem" },
  );
});

test("unknown job id throws", () => {
  assert.throws(() => jobSettings("nope", {}), /unknown job/);
});

test("default settings are due only on the 03:xx UTC tick, i.e. once a day", () => {
  const s = jobSettings(JOB, undefined);
  const dueHours = [];
  for (let h = 0; h < 24; h++) {
    const tick = new Date(Date.UTC(2026, 9, 20, h, 30));
    if (isDailyJobDue(s, tick).due) dueHours.push(h);
  }
  assert.deepEqual(dueHours, [3]);
});

test("disabled is never due", () => {
  const s = jobSettings(JOB, { enabled: false });
  assert.deepEqual(isDailyJobDue(s, new Date(Date.UTC(2026, 9, 20, 3, 30))), { due: false, reason: "disabled" });
});

test("hour is read in the configured time zone (Israel summer UTC+3, winter UTC+2)", () => {
  assert.equal(localHour(new Date(Date.UTC(2026, 6, 1, 3, 30)), "Asia/Jerusalem"), 6);
  assert.equal(localHour(new Date(Date.UTC(2026, 11, 1, 3, 30)), "Asia/Jerusalem"), 5);
  const s = jobSettings(JOB, { hour: 4, timeZone: "Asia/Jerusalem" });
  assert.equal(isDailyJobDue(s, new Date(Date.UTC(2026, 6, 1, 1, 30))).due, true);
  assert.equal(isDailyJobDue(s, new Date(Date.UTC(2026, 6, 1, 3, 30))).due, false);
});
