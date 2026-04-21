import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface SiteSettings {
  releasesEnabled: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  releasesEnabled: false,
};

const SETTINGS_DOC = doc(db, "siteSettings", "main");

export function useSiteSettings(): { settings: SiteSettings; loading: boolean } {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<SiteSettings>) });
        setLoading(false);
      },
      () => {
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { settings, loading };
}

export async function saveSiteSettings(partial: Partial<SiteSettings>): Promise<void> {
  await setDoc(
    SETTINGS_DOC,
    { ...partial, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
