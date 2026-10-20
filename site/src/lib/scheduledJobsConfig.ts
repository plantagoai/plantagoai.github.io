// Pure config + helpers for Admin → Scheduled Jobs (no Firebase import, so it
// unit-tests directly). The server copy of these defaults is
// functions/scheduledJobs.js — keep the two in step.

export const JOB_TIME_ZONES = ["Etc/UTC", "Asia/Jerusalem"] as const;
export type JobTimeZone = (typeof JOB_TIME_ZONES)[number];

export interface JobSettings {
  enabled: boolean;
  /** Local hour 0-23 in `timeZone`; the job runs at HH:30. */
  hour: number;
  timeZone: JobTimeZone;
}

export interface JobInfo {
  id: string;
  label: string;
  description: string;
  defaults: JobSettings;
}

export const JOBS: JobInfo[] = [
  {
    id: "pruneAnalyticsEvents",
    label: "Prune old visit events",
    description:
      "Deletes Visitors analytics events past their 400-day keep-until date. Firestore only, no external APIs. Off = old events pile up (small storage cost).",
    defaults: { enabled: true, hour: 3, timeZone: "Etc/UTC" },
  },
];

/** Stored values over defaults, dropping anything invalid (mirrors the server). */
export function resolveJobSettings(job: JobInfo, stored: unknown): JobSettings {
  const s = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  const d = job.defaults;
  const hour = s.hour;
  const tz = s.timeZone;
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : d.enabled,
    hour: typeof hour === "number" && Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : d.hour,
    timeZone: (JOB_TIME_ZONES as readonly unknown[]).includes(tz) ? (tz as JobTimeZone) : d.timeZone,
  };
}

/** e.g. "Daily at 03:30 UTC (06:30 Israel time today)". */
export function describeSchedule(s: JobSettings, now: Date = new Date()): string {
  const hh = String(s.hour).padStart(2, "0");
  if (s.timeZone !== "Etc/UTC") return `Daily at ${hh}:30 Israel time`;
  const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), s.hour, 30));
  const il = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(at);
  return `Daily at ${hh}:30 UTC (${il} Israel time today)`;
}
