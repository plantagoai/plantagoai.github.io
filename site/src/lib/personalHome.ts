import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import {
  mergePersonalHome,
  type PersonalHome,
  type PersonalSectionEntry,
  type PersonalSectionId,
} from "../../../personal-site/src/data/homeContent";

/* dagangilat.com sections, edited here because that site has no Admin of
   its own. The section list, defaults and form schema live with the site
   (personal-site/src/data/homeContent.ts), which reads the same document
   through Firestore's REST API. */

const PERSONAL_DOC = doc(db, "siteSettings", "personalHome");

export function usePersonalHome(): { home: PersonalHome; loading: boolean } {
  const [stored, setStored] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      PERSONAL_DOC,
      (snap) => {
        setStored(snap.exists() ? snap.data() : undefined);
        setLoading(false);
      },
      () => {
        setStored(undefined);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { home: mergePersonalHome(stored), loading };
}

/** Writes the current dagangilat.com page the first time an admin signs in. */
export async function seedPersonalHomeIfMissing(): Promise<void> {
  const snap = await getDoc(PERSONAL_DOC);
  if (snap.exists()) return;
  await setDoc(PERSONAL_DOC, { ...mergePersonalHome(undefined), updatedAt: serverTimestamp() });
}

export async function savePersonalOrder(sections: PersonalSectionEntry[]): Promise<void> {
  await setDoc(PERSONAL_DOC, { sections, updatedAt: serverTimestamp() }, { merge: true });
}

export async function savePersonalContent(id: PersonalSectionId, value: unknown): Promise<void> {
  // Replace the whole section map so removed list items and cleared fields stick.
  const snap = await getDoc(PERSONAL_DOC);
  const content = { ...((snap.data()?.content as Record<string, unknown> | undefined) ?? {}), [id]: value };
  await setDoc(PERSONAL_DOC, { content, updatedAt: serverTimestamp() }, { merge: true });
}
