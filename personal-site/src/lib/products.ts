import { useEffect, useState } from "react";
import { appCheckHeaders } from "./appCheck";
import { fromFirestore } from "./home";
import type { ShowcaseProduct } from "../components/ProductShowcase";

/* The products plantagoai.com lists (Firestore `projects`, edited in
   plantagoai.com/admin → Products). Only enabled ones, in their Admin order. */
const LIST_URL =
  "https://firestore.googleapis.com/v1/projects/plantagoai/databases/(default)/documents/projects?pageSize=100";

export type Product = ShowcaseProduct;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown) => str(v) || null;

export function toProducts(docs: Record<string, unknown>[]): Product[] {
  return docs
    .filter((d) => d.enabled === true && str(d.name))
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((d) => ({
      slug: str(d.slug),
      name: str(d.name),
      subtitle: str(d.subtitle),
      description: str(d.description),
      iconKey: str(d.iconKey),
      colorKey: str(d.colorKey),
      highlights: Array.isArray(d.highlights) ? d.highlights.filter((h): h is string => typeof h === "string" && !!h) : [],
      statusKind: str(d.statusKind),
      statusText: str(d.statusText),
      version: strOrNull(d.version),
      liveUrl: strOrNull(d.liveUrl),
      liveLabel: strOrNull(d.liveLabel),
      docsUrl: strOrNull(d.docsUrl),
      repoUrl: strOrNull(d.repoUrl),
    }));
}

/** Enabled products; null until loaded, [] if they couldn't be read. */
export function useProducts(enabled: boolean): Product[] | null {
  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    appCheckHeaders()
      .then((headers) => fetch(LIST_URL, { headers }))
      .then((r) => (r.ok ? r.json() : null))
      .then((res: { documents?: { fields?: Record<string, never> }[] } | null) => {
        const docs = (res?.documents ?? []).map(
          (d) => fromFirestore({ mapValue: { fields: d.fields ?? {} } }) as Record<string, unknown>,
        );
        if (!cancelled) setProducts(toProducts(docs));
      })
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return products;
}
