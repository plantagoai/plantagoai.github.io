// Admin-controlled settings for the site's scheduled Cloud Functions.
//
// Firebase onSchedule crons are fixed at deploy time. To let an admin turn a
// job off or move it without a redeploy (or any Cloud Scheduler IAM), each job
// runs on an hourly deploy-time "tick" and decides here, on every tick,
// whether it is actually due. Settings live in Firestore at
// admin/scheduledJobs (admin-only per firestore.rules), edited from
// Admin → Scheduled Jobs:
//
//   jobs.<jobId> = { enabled, hour, timeZone, updatedAt, updatedBy }
//
// A missing doc or field falls back to JOB_DEFAULTS, which equal what the job
// did before this existed, so nothing changes until an admin edits a setting.
//
// Pure helpers only (no firebase-admin import) so they unit-test under vitest.
// The browser copy of JOB_DEFAULTS / JOB_TIME_ZONES is src/lib/scheduledJobs.ts
// — keep the two in step.

export const SETTINGS_PATH = { collection: "admin", doc: "scheduledJobs" };

/** Time zones offered in the admin panel. */
export const JOB_TIME_ZONES = ["Etc/UTC", "Asia/Jerusalem"];

export const JOB_DEFAULTS = {
  // Was onSchedule("30 3 * * *", Etc/UTC): daily at 03:30 UTC.
  pruneAnalyticsEvents: { enabled: true, hour: 3, timeZone: "Etc/UTC" },
};

/** Merges stored settings over the defaults, dropping anything invalid. */
export function jobSettings(jobId, stored) {
  const base = JOB_DEFAULTS[jobId];
  if (!base) throw new Error(`unknown job ${jobId}`);
  const s = stored && typeof stored === "object" ? stored : {};
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : base.enabled,
    hour: Number.isInteger(s.hour) && s.hour >= 0 && s.hour <= 23 ? s.hour : base.hour,
    timeZone: JOB_TIME_ZONES.includes(s.timeZone) ? s.timeZone : base.timeZone,
  };
}

/** Local hour (0-23) of `now` in `timeZone`. */
export function localHour(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value);
}

/**
 * Should a daily job run on this hourly tick? Due when enabled and the local
 * hour in the job's time zone is the configured hour. The tick fires once an
 * hour, so a matching hour means exactly one run per day. (On the one
 * repeated hour of a DST fall-back day in a DST zone it can run twice, which
 * is harmless for an idempotent sweep.) Returns { due, reason }.
 */
export function isDailyJobDue(settings, now) {
  if (!settings.enabled) return { due: false, reason: "disabled" };
  if (localHour(now, settings.timeZone) !== settings.hour) return { due: false, reason: "not-this-hour" };
  return { due: true, reason: "due" };
}
