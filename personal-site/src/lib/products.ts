import { useEffect, useState } from "react";
import { appCheckHeaders } from "./appCheck";
import { fromFirestore } from "./home";

/* The products plantagoai.com lists (Firestore `projects`, edited in
   plantagoai.com/admin → Products). Only enabled ones, in their Admin order. */
const LIST_URL =
  "https://firestore.googleapis.com/v1/projects/plantagoai/databases/(default)/documents/projects?pageSize=100";

export interface Product {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  iconKey: string;
  colorKey: string;
  highlights: string[];
  stage: string;
  version: string | null;
  url: string | null;
  urlLabel: string;
}

const STATUS_LABELS: Record<string, string> = {
  inprogress: "In Development",
  alpha: "Alpha",
  beta: "Beta",
  invitation: "By Invitation",
  production: "Production",
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function toProducts(docs: Record<string, unknown>[]): Product[] {
  return docs
    .filter((d) => d.enabled === true && str(d.name))
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    .map((d) => {
      const url = str(d.liveUrl) || str(d.landingUrl) || null;
      return {
        slug: str(d.slug),
        name: str(d.name),
        subtitle: str(d.subtitle),
        description: str(d.description),
        iconKey: str(d.iconKey),
        colorKey: str(d.colorKey),
        highlights: Array.isArray(d.highlights) ? d.highlights.filter((h): h is string => typeof h === "string" && !!h) : [],
        stage: str(d.statusText) || STATUS_LABELS[str(d.statusKind)] || "",
        version: str(d.version) || null,
        url,
        urlLabel: str(d.liveLabel) || "Visit",
      };
    });
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
