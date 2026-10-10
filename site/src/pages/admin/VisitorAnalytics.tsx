import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Users as UsersIcon } from "lucide-react";
import { fetchVisitEvents } from "../../lib/analytics";
import { isoCountryToFlag } from "../../lib/analyticsSummary";
import {
  bucketUnit, RANGE_PRESETS, rangeFor, summarizeVisits,
  type BucketUnit, type FunnelStep, type Range, type RangePreset, type VisitEvent, type VisitSite,
} from "../../lib/visitAnalytics";
import { Funnel, Heatmap, Legend, RankList, SERIES_COLORS, TimeBars } from "./visitorCharts";

type Loaded = { events: VisitEvent[]; capped: boolean; at: Date };

const PRESET_LABELS: Record<RangePreset, string> = {
  "1h": "1 hour", "1d": "24 hours", "7d": "7 days", "30d": "30 days", "90d": "90 days", custom: "Custom",
};
const SITE_LABELS: Record<VisitSite, string> = { plantagoai: "plantagoai.com", dagangilat: "dagangilat.com" };
const STEP_LABELS: Record<FunnelStep, string> = {
  sessions: "Visits", engaged: "Engaged", outbound: "Clicked out", contact: "Got in touch",
};
const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct", linkedin: "LinkedIn", github: "GitHub", facebook: "Facebook", instagram: "Instagram",
  google: "Google", search: "Other search", x: "X / Twitter", hackernews: "Hacker News", reddit: "Reddit",
  whatsapp: "WhatsApp", email: "Email", ai: "AI assistants",
};
const DEVICE_LABELS: Record<string, string> = { desktop: "Desktop", mobile: "Mobile", tablet: "Tablet" };
const PAGE_VIEW_COLOR = "#b9d8fb";

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDuration(sec: number): string {
  if (!sec) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Admin → Visitors: who visits plantagoai.com and dagangilat.com, where
 * from, when, what they look at and how far they get (engaged → clicked
 * out → got in touch). Ported from limorgilat.com's Admin → Analytics,
 * visits half; reads analyticsEvents via the getAnalyticsEvents callable.
 */
export function VisitorAnalytics() {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [custom, setCustom] = useState<Range>(() => rangeFor("7d", new Date()));
  const [reloadKey, setReloadKey] = useState(0);
  const range = useMemo(
    () => rangeFor(preset, new Date(), custom),
    // reloadKey moves "now" forward on refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, custom, reloadKey],
  );
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeAdmins, setIncludeAdmins] = useState(false);
  const [site, setSite] = useState<VisitSite | "all">("all");
  const [showAllVisits, setShowAllVisits] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchVisitEvents(range.from, range.to)
      .then((loaded) => {
        if (cancelled) return;
        setData({ ...loaded, at: new Date() });
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[admin/visitors] load failed", err);
        setError(`Couldn't load visitor data (${err instanceof Error ? err.message : String(err)})`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  // ─── Formatting ────────────────────────────────────────────────────
  const lang = "en-US";
  const num = useMemo(() => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }), []);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const regionNames = useMemo(() => { try { return new Intl.DisplayNames([lang], { type: "region" }); } catch { return null; } }, []);
  const langNames = useMemo(() => { try { return new Intl.DisplayNames([lang], { type: "language" }); } catch { return null; } }, []);
  const unit: BucketUnit = bucketUnit(range);
  const bucketFmt = useMemo(() => new Intl.DateTimeFormat(lang, unit === "5m" || unit === "1h"
    ? { hour: "2-digit", minute: "2-digit", hour12: false }
    : { day: "numeric", month: "short" }), [unit]);
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }), []);
  const dayLabels = useMemo(() => {
    const f = new Intl.DateTimeFormat(lang, { weekday: "short" });
    return Array.from({ length: 7 }, (_, d) => f.format(new Date(2026, 9, 4 + d))); // 4 Oct 2026 is a Sunday
  }, []);

  const country = (code: string | null) => {
    if (!code || code === "unknown") return "Unknown";
    return `${isoCountryToFlag(code)} ${regionNames?.of(code) ?? code}`.trim();
  };
  const language = (code: string) => (code === "unknown" ? "Unknown" : langNames?.of(code) ?? code);
  const source = (key: string) => SOURCE_LABELS[key] ?? key;
  const device = (key: string | null) => (key && DEVICE_LABELS[key]) || "Unknown";
  const siteLabel = (key: string | null) => (key && SITE_LABELS[key as VisitSite]) || "Unknown";
  const interaction = (key: string) => {
    if (key === "chat") return "Chat messages";
    if (key === "contact") return "Contact form sent";
    if (key === "subscribe") return "Newsletter sign-ups";
    if (key.startsWith("game:")) return `Game · ${key.slice(5)}`;
    return key;
  };

  const visits = useMemo(
    () => (data ? summarizeVisits(data.events, range, { includeAdmins, site }) : null),
    [data, range, includeAdmins, site],
  );

  function choosePreset(p: RangePreset) {
    setLoading(true);
    if (p === "custom" && preset !== "custom") setCustom(range);
    setPreset(p);
  }

  function setCustomEdge(edge: "from" | "to", value: string) {
    const d = new Date(value);
    if (!value || Number.isNaN(d.getTime())) return;
    setLoading(true);
    setCustom((c) => ({ ...c, [edge]: d }));
  }

  const pill = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
      active ? "border-primary text-primary bg-accent" : "border-border text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Visitors</h2>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Range">
          {RANGE_PRESETS.map((p) => (
            <button key={p} type="button" className={pill(p === preset)} aria-pressed={p === preset} onClick={() => choosePreset(p)}>
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Site">
          {(["all", "plantagoai", "dagangilat"] as const).map((s) => (
            <button key={s} type="button" className={pill(s === site)} aria-pressed={s === site} onClick={() => setSite(s)}>
              {s === "all" ? "Both sites" : SITE_LABELS[s]}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={includeAdmins} onChange={(e) => setIncludeAdmins(e.target.checked)} />
          Include admins
        </label>
        <div className="ml-auto flex items-center gap-2">
          {data && <span className="text-xs text-muted-foreground">Updated {timeFmt.format(data.at)}</span>}
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {preset === "custom" && (
        <div className="px-4 pt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-1.5">From
            <input type="datetime-local" className="border border-border rounded-md px-2 py-1 bg-background text-foreground" value={toLocalInput(custom.from)} onChange={(e) => setCustomEdge("from", e.target.value)} />
          </label>
          <label className="inline-flex items-center gap-1.5">To
            <input type="datetime-local" className="border border-border rounded-md px-2 py-1 bg-background text-foreground" value={toLocalInput(custom.to)} onChange={(e) => setCustomEdge("to", e.target.value)} />
          </label>
        </div>
      )}

      <div className="p-4 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {data?.capped && <p className="text-sm text-amber-700">Showing the most recent 20,000 events only. Pick a shorter range for exact numbers.</p>}
        {visits && visits.sessions === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No visits in this range yet.</p>
        )}

        {visits && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Tile label="Visitors" value={num.format(visits.visitors)} sub={`${visits.newVisitors} new`} />
              <Tile label="Visits" value={num.format(visits.sessions)} />
              <Tile label="Page views" value={num.format(visits.pageViews)} />
              <Tile label="Got in touch" value={visits.sessions ? pct(visits.contacts / visits.sessions) : "–"} sub={`${visits.contacts} visits`} />
              <Tile label="Bounce rate" value={visits.sessions ? pct(visits.bounceRate) : "–"} />
              <Tile label="Visit length" value={formatDuration(visits.medianSessionSec)} sub="median" />
            </div>

            <Card title="Over time">
              <TimeBars
                buckets={visits.series.map((s) => s.bucket)}
                series={[{ key: "pv", label: "Page views", values: visits.series.map((s) => s.pageViews), color: PAGE_VIEW_COLOR }]}
                line={{ key: "v", label: "Visitors", values: visits.series.map((s) => s.visitors), color: SERIES_COLORS[0] }}
                formatBucket={(d) => bucketFmt.format(d)}
                formatValue={(n) => num.format(n)}
              />
              <Legend items={[{ label: "Visitors", color: SERIES_COLORS[0], line: true }, { label: "Page views", color: PAGE_VIEW_COLOR }]} />
            </Card>

            <div className="grid md:grid-cols-3 gap-3">
              <Card title="How far visits got">
                <Funnel steps={visits.funnel.map((f) => ({ label: STEP_LABELS[f.step], value: f.sessions }))} />
                <p className="mt-3 text-[11px] text-muted-foreground">Engaged: reached a second section, or clicked, chatted, played or got in touch.</p>
              </Card>
              <Card title="Where they are">
                <RankList rows={visits.countries.map((c) => ({ key: c.key, label: country(c.key), value: c.value }))} empty="Nothing yet" />
              </Card>
              <Card title="Where they came from">
                <RankList rows={visits.sources.map((c) => ({ key: c.key, label: source(c.key), value: c.value }))} empty="Nothing yet" />
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-3">
              <Card title="When they visit">
                <Heatmap grid={visits.heatmap} dayLabels={dayLabels} title={(d, h, v) => `${dayLabels[d]} ${String(h).padStart(2, "0")}:00 · Page views: ${v}`} />
              </Card>
              <Card title="Devices">
                <RankList rows={visits.devices.map((c) => ({ key: c.key, label: device(c.key), value: c.value }))} empty="Nothing yet" />
                <h3 className="text-xs font-semibold mt-4 mb-2.5">Languages</h3>
                <RankList rows={visits.languages.map((c) => ({ key: c.key, label: language(c.key), value: c.value }))} empty="Nothing yet" />
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-3">
              <Card title="Sections reached">
                <RankList rows={visits.sections.map((c) => ({ key: c.key, label: titleCase(c.key), value: c.value }))} empty="Nothing yet" />
                {site === "all" && visits.sites.length > 1 && (
                  <>
                    <h3 className="text-xs font-semibold mt-4 mb-2.5">Visits by site</h3>
                    <RankList rows={visits.sites.map((c) => ({ key: c.key, label: siteLabel(c.key), value: c.value }))} empty="Nothing yet" />
                  </>
                )}
              </Card>
              <Card title="Outbound clicks">
                {visits.outbound.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-muted-foreground">
                      <th className="font-medium py-1.5 pr-2">Link</th>
                      <th className="font-medium py-1.5 pr-2 text-right">Clicks</th>
                      <th className="font-medium py-1.5 text-right">Visitors</th>
                    </tr></thead>
                    <tbody>
                      {visits.outbound.slice(0, 12).map((o) => (
                        <tr key={o.slug} className="border-t border-border/60">
                          <td className="py-1.5 pr-2 font-mono text-xs">{o.slug}</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums">{o.clicks}</td>
                          <td className="py-1.5 text-right tabular-nums">{o.visitors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {visits.interactions.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold mt-4 mb-2.5">Interactions</h3>
                    <RankList rows={visits.interactions.map((c) => ({ key: c.key, label: interaction(c.key), value: c.value }))} empty="Nothing yet" />
                  </>
                )}
              </Card>
            </div>

            <Card title="Recent visits">
              {visits.sessionsList.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[40rem]">
                    <thead><tr className="text-left text-xs text-muted-foreground">
                      <th className="font-medium py-1.5 pr-3">When</th>
                      <th className="font-medium py-1.5 pr-3">Where</th>
                      <th className="font-medium py-1.5 pr-3">From</th>
                      <th className="font-medium py-1.5 pr-3">Who</th>
                      <th className="font-medium py-1.5 pr-3">What</th>
                      <th className="font-medium py-1.5">Reached</th>
                    </tr></thead>
                    <tbody>
                      {visits.sessionsList.slice(0, showAllVisits ? 50 : 12).map((s) => (
                        <tr key={s.sid} className="border-t border-border/60 align-top">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {timeFmt.format(s.start)}
                            {site === "all" && <div className="text-xs text-muted-foreground">{siteLabel(s.site)}</div>}
                          </td>
                          <td className="py-2 pr-3">
                            {country(s.country)}{s.city ? `, ${s.city}` : ""}
                            <div className="text-xs text-muted-foreground">{device(s.device)}</div>
                          </td>
                          <td className="py-2 pr-3">{source(s.source)}</td>
                          <td className="py-2 pr-3">{s.newVisitor ? "New visitor" : "Returning"}</td>
                          <td className="py-2 pr-3 text-xs">
                            {s.sections.length ? s.sections.map(titleCase).join(" › ") : <span className="text-muted-foreground">{s.pages} page{s.pages === 1 ? "" : "s"}</span>}
                            {s.outbound.length > 0 && <div className="text-muted-foreground">→ {s.outbound.join(", ")}</div>}
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            {s.contacted ? <Badge tone="ok">Got in touch</Badge>
                              : s.clickedOut ? <Badge tone="blue">Clicked out</Badge>
                                : s.engaged ? <Badge tone="muted">Engaged</Badge>
                                  : <span className="text-xs text-muted-foreground">Bounced</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!showAllVisits && visits.sessionsList.length > 12 && (
                    <button type="button" className="mt-2 text-xs text-primary hover:underline" onClick={() => setShowAllVisits(true)}>Show more</button>
                  )}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-lg p-4 min-w-0">
      <h3 className="text-xs font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-border rounded-lg px-3.5 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "blue" | "muted"; children: React.ReactNode }) {
  const cls = tone === "ok"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : tone === "blue" ? "bg-accent text-accent-foreground border-primary/30" : "bg-muted text-muted-foreground border-border";
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md border ${cls}`}>{children}</span>;
}
