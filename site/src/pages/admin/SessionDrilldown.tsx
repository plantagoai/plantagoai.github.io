import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  RefreshCw, Loader2, AlertCircle, Clock, Calendar, ChevronDown, ChevronRight, Users, Globe,
} from "lucide-react";
import {
  RANGE_OPTIONS,
  bucketByHour,
  bucketByDow,
  bucketByMonth,
  bucketByCountry,
  bucketByDay,
  isoCountryToFlag,
} from "../../lib/analyticsSummary";

function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso),
  );
}

const COMMON_TZS = [
  "UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin",
  "Asia/Jerusalem", "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
];

interface SessionDrilldownProps<T extends { ts: string; country: string | null; city: string | null }> {
  title: string;
  fetchRows: (fromMs: number, toMs: number) => Promise<{ rows: T[]; truncated: boolean }>;
  identityLabel: (row: T) => string;
  identityKey: (row: T) => string; // for unique-count
}

export function SessionDrilldown<T extends { ts: string; country: string | null; city: string | null }>({
  title,
  fetchRows,
  identityLabel,
  identityKey,
}: SessionDrilldownProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [rangeKey, setRangeKey] = useState<string>("30d");
  const [tz, setTz] = useState<string>(browserTz());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const range = useMemo(() => {
    const opt = RANGE_OPTIONS.find((o) => o.key === rangeKey) ?? RANGE_OPTIONS[1];
    const to = Date.now();
    return { from: to - opt.ms, to };
  }, [rangeKey]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows: fetched, truncated: t } = await fetchRows(range.from, range.to);
      setRows(fetched);
      setTruncated(t);
    } catch (err: any) {
      setError(err?.message || "Failed to load session data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const byHour = useMemo(() => bucketByHour(rows.map((r) => ({ ts: r.ts })), tz), [rows, tz]);
  const byDow = useMemo(() => bucketByDow(rows.map((r) => ({ ts: r.ts })), tz), [rows, tz]);
  const byMonth = useMemo(() => bucketByMonth(rows.map((r) => ({ ts: r.ts })), tz), [rows, tz]);
  const byCountry = useMemo(
    () => bucketByCountry(rows.map((r) => ({ ts: r.ts, country: r.country }))),
    [rows],
  );
  const byDay = useMemo(() => bucketByDay(rows, tz), [rows, tz]);
  const uniqueCount = useMemo(() => new Set(rows.map(identityKey)).size, [rows, identityKey]);
  const countryCount = useMemo(
    () => new Set(rows.map((r) => r.country).filter(Boolean)).size,
    [rows],
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRangeKey(opt.key)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                rangeKey === opt.key
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="px-2 py-1 rounded-md bg-background border border-border text-xs text-foreground/80 focus:outline-none"
          >
            <option value={browserTz()}>{browserTz()} (browser)</option>
            {COMMON_TZS.filter((t) => t !== browserTz()).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => void load()}
          className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {truncated && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Truncated at 5,000 rows — narrow the date range for a complete view.
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No {title.toLowerCase()} in this range</p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-lg font-semibold">{rows.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase">In view</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-lg font-semibold flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" /> {uniqueCount}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Unique</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-lg font-semibold flex items-center justify-center gap-1">
                <Globe className="w-3.5 h-3.5" /> {countryCount}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Countries</p>
            </div>
          </div>

          {/* Hour of day */}
          <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <h4 className="text-xs font-semibold">By hour of day ({tz})</h4>
            </div>
            <div className="p-1">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={byHour} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day of week */}
          <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <h4 className="text-xs font-semibold">By day of week</h4>
            </div>
            <div className="p-1">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={byDow} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly trend, only if range spans >1 month bucket */}
          {byMonth.length > 1 && (
            <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <h4 className="text-xs font-semibold">Monthly trend</h4>
              </div>
              <div className="p-1">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={byMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top countries */}
          <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <h4 className="text-xs font-semibold">Top countries</h4>
            </div>
            {byCountry.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">No geolocated sessions in view.</p>
            ) : (
              <div className="p-1">
                <ResponsiveContainer width="100%" height={Math.max(120, byCountry.length * 26)}>
                  <BarChart data={byCountry} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="country"
                      tick={{ fontSize: 10 }}
                      width={40}
                      tickFormatter={(c: string) => `${isoCountryToFlag(c === "??" ? null : c)} ${c}`}
                    />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 2, 2, 0]}>
                      {byCountry.map((entry, i) => (
                        <Cell key={i} fill={entry.country === "??" ? "#94a3b8" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Per-day drill-down */}
          <div className="rounded-lg bg-muted/20 border border-border overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <h4 className="text-xs font-semibold">By day — click to expand</h4>
            </div>
            <div className="divide-y divide-border/50">
              {byDay.map((day) => {
                const isOpen = expandedDay === day.date;
                return (
                  <div key={day.date}>
                    <button
                      onClick={() => setExpandedDay(isOpen ? null : day.date)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors text-left"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs font-mono">{day.date}</span>
                      <span className="text-xs font-semibold ml-auto">{day.total}</span>
                    </button>
                    {isOpen && (
                      <div className="bg-background/50 px-3 py-2 overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-muted-foreground text-left">
                              <th className="py-1 pr-3 font-medium">Time</th>
                              <th className="py-1 pr-3 font-medium">Who / what</th>
                              <th className="py-1 font-medium">Location</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {day.rows
                              .slice()
                              .sort((a, b) => (b.ts > a.ts ? 1 : -1))
                              .map((r, i) => (
                                <tr key={i}>
                                  <td className="py-1 pr-3 font-mono text-muted-foreground">{fmtTime(r.ts, tz)}</td>
                                  <td className="py-1 pr-3 text-foreground/80 truncate max-w-[240px]">
                                    {identityLabel(r)}
                                  </td>
                                  <td className="py-1 text-muted-foreground">
                                    {r.country
                                      ? `${isoCountryToFlag(r.country)} ${r.city ? `${r.city}, ` : ""}${r.country}`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
