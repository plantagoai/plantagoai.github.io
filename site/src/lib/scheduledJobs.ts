import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { JOBS, resolveJobSettings, type JobSettings } from "./scheduledJobsConfig";

// Admin → Scheduled Jobs. The scheduled Cloud Functions read
// admin/scheduledJobs on every hourly tick (functions/scheduledJobs.js).
// The doc is admin-only in firestore.rules.

const SETTINGS_DOC = doc(db, "admin", "scheduledJobs");

const DEFAULTS: Record<string, JobSettings> = Object.fromEntries(JOBS.map((j) => [j.id, j.defaults]));

export function useScheduledJobs(): { settings: Record<string, JobSettings>; loading: boolean } {
  const [settings, setSettings] = useState<Record<string, JobSettings>>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        const jobs = (snap.data()?.jobs ?? {}) as Record<string, unknown>;
        setSettings(Object.fromEntries(JOBS.map((j) => [j.id, resolveJobSettings(j, jobs[j.id])])));
        setLoading(false);
      },
      () => {
        setSettings(DEFAULTS);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { settings, loading };
}

/** Merges one job's changed fields, stamping who changed it and when. */
export async function saveJobSettings(jobId: string, partial: Partial<JobSettings>): Promise<void> {
  await setDoc(
    SETTINGS_DOC,
    {
      jobs: {
        [jobId]: { ...partial, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email ?? null },
      },
    },
    { merge: true },
  );
}
