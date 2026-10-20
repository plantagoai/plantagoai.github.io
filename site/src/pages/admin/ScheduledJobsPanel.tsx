import { useState } from "react";
import { Loader2, Timer } from "lucide-react";
import { useScheduledJobs, saveJobSettings } from "../../lib/scheduledJobs";
import { JOBS, JOB_TIME_ZONES, describeSchedule, type JobSettings } from "../../lib/scheduledJobsConfig";

const TZ_LABEL: Record<string, string> = { "Etc/UTC": "UTC", "Asia/Jerusalem": "Israel time" };

// Admin → Scheduled Jobs: on/off and the daily hour for each scheduled Cloud
// Function. The functions read admin/scheduledJobs on their hourly tick, so a
// change applies from the next hour with no deploy (functions/scheduledJobs.js).
export function ScheduledJobsPanel() {
  const { settings, loading } = useScheduledJobs();
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (jobId: string, partial: Partial<JobSettings>) => {
    setSaving(jobId);
    try {
      await saveJobSettings(jobId, partial);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Timer className="w-4 h-4 text-emerald-700" />
        <h2 className="font-semibold text-sm">Scheduled Jobs</h2>
        <span className="text-xs text-muted-foreground">background work on a timer</span>
      </div>

      <div className="divide-y divide-border">
        {JOBS.map((job) => {
          const s = settings[job.id];
          const busy = saving === job.id;
          return (
            <div key={job.id} className="px-4 py-3 flex flex-wrap items-center gap-3" data-testid={`job-${job.id}`}>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{job.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      s.enabled
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {s.enabled ? "ON" : "OFF"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{job.description}</p>
                <p className="text-xs mt-0.5">{s.enabled ? describeSchedule(s) : "Off"}</p>
              </div>
              <select
                aria-label={`${job.label} hour`}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background"
                value={s.hour}
                disabled={loading || busy}
                onChange={(e) => save(job.id, { hour: Number(e.target.value) })}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{`${String(h).padStart(2, "0")}:30`}</option>
                ))}
              </select>
              <select
                aria-label={`${job.label} time zone`}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background"
                value={s.timeZone}
                disabled={loading || busy}
                onChange={(e) => save(job.id, { timeZone: e.target.value as JobSettings["timeZone"] })}
              >
                {JOB_TIME_ZONES.map((tz) => (
                  <option key={tz} value={tz}>{TZ_LABEL[tz] ?? tz}</option>
                ))}
              </select>
              <button
                onClick={() => save(job.id, { enabled: !s.enabled })}
                disabled={loading || busy}
                className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50 inline-flex items-center gap-1"
              >
                {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                {s.enabled ? "Turn off" : "Turn on"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
