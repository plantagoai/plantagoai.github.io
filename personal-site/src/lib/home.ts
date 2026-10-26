import { useEffect, useState } from "react";
import { mergePersonalHome, type PersonalHome } from "../data/homeContent";

/* Reads siteSettings/personalHome through Firestore's REST API: the document
   is public-read, and the REST call keeps the Firebase SDK out of this
   bundle. Edits are made in plantagoai.com/admin → dagangilat.com Sections. */
const DOC_URL =
  "https://firestore.googleapis.com/v1/projects/plantagoai/databases/(default)/documents/siteSettings/personalHome";

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  timestampValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
};

/** Firestore's typed REST JSON → plain values. */
export function fromFirestore(v: FirestoreValue): unknown {
  if (v.mapValue) {
    const out: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(v.mapValue.fields ?? {})) out[k] = fromFirestore(f);
    return out;
  }
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(fromFirestore);
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.timestampValue !== undefined) return v.timestampValue;
  return null;
}

export function useHome(): { home: PersonalHome; loading: boolean } {
  const [stored, setStored] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    const finish = (data?: Record<string, unknown>) => {
      if (done) return;
      done = true;
      setStored(data);
      setLoading(false);
    };
    // The page waits for this document so hidden sections don't flash; if
    // it is slow or unreachable, show the defaults rather than nothing.
    const fallback = setTimeout(() => finish(), 3000);
    fetch(DOC_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: { fields?: Record<string, FirestoreValue> } | null) =>
        finish(doc?.fields ? (fromFirestore({ mapValue: { fields: doc.fields } }) as Record<string, unknown>) : undefined),
      )
      .catch(() => finish());
    return () => clearTimeout(fallback);
  }, []);

  return { home: mergePersonalHome(stored), loading };
}

/** Renders [text](url) links inside admin-edited copy. */
export function splitLinks(text: string): ({ text: string } | { text: string; href: string })[] {
  const parts: ({ text: string } | { text: string; href: string })[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[^)\s]*|mailto:[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
