import { useEffect, useState } from "react";
import { LogIn, Users as UsersIcon, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  fetchAdminLoginRows,
  fetchGuestVisitRows,
  summarizeAdminLogins,
  summarizeGuestVisits,
  type AdminLoginSummary,
  type GuestVisitSummary,
  type AdminLoginRow,
  type GuestVisitRow,
} from "../../lib/analytics";
import { SessionDrilldown } from "./SessionDrilldown";

type AdminLoginRowWithTs = AdminLoginRow & { ts: string };
type GuestVisitRowWithTs = GuestVisitRow & { ts: string };

const SUMMARY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30d, independent of the drill-down's own range picker

function fmtWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 14) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AdminLoginsCard({ summary, loading }: { summary: AdminLoginSummary | null; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <LogIn className="w-4 h-4 text-violet-400" />
        <h2 className="font-semibold text-sm">Admin Logins</h2>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Details {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-4">
        {!summary || summary.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No login history yet</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-center mb-4">
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <p className="text-xl font-semibold text-violet-400">{summary.total}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Logins (30d)</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <p className="text-xl font-semibold text-violet-400">
                  {summary.lastLogin ? fmtWhen(summary.lastLogin) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Last Login</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {Object.entries(summary.byAdmin)
                .sort(([, a], [, b]) => b - a)
                .map(([email, count]) => (
                  <div key={email} className="flex items-center gap-2 text-xs">
                    <span className="text-foreground/80 truncate flex-1">{email}</span>
                    <span className="font-mono text-muted-foreground">{count}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
      {expanded && (
        <div className="p-4 border-t border-border">
          <SessionDrilldown<AdminLoginRowWithTs>
            title="Admin Logins"
            fetchRows={async (from, to) => {
              const { rows, truncated } = await fetchAdminLoginRows(from, to);
              return { rows: rows.map((r) => ({ ...r, ts: r.loggedInAt })), truncated };
            }}
            identityLabel={(r) => r.email}
            identityKey={(r) => r.uid || r.email}
          />
        </div>
      )}
    </div>
  );
}

function GuestVisitsCard({ summary, loading }: { summary: GuestVisitSummary | null; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <UsersIcon className="w-4 h-4 text-cyan-400" />
        <h2 className="font-semibold text-sm">Guest Visits</h2>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Details {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-4">
        {!summary || summary.total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No visits recorded yet</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xl font-semibold text-cyan-400">{summary.total}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Visits (30d)</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xl font-semibold text-cyan-400">{summary.last24h}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Last 24h</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-xl font-semibold text-cyan-400">
                  {Object.values(summary.bySite).filter((count) => count > 0).length}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">Sites</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {Object.entries(summary.bySite)
                .sort(([, a], [, b]) => b - a)
                .map(([site, count]) => (
                  <div key={site} className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground w-24">{site}</code>
                    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500/60 rounded-full"
                        style={{ width: `${summary.total ? (count / summary.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
      {expanded && (
        <div className="p-4 border-t border-border">
          <SessionDrilldown<GuestVisitRowWithTs>
            title="Guest Visits"
            fetchRows={async (from, to) => {
              const { rows, truncated } = await fetchGuestVisitRows(from, to);
              return { rows: rows.map((r) => ({ ...r, ts: r.visitedAt })), truncated };
            }}
            identityLabel={(r) => `${r.site} · ${r.path}`}
            identityKey={(r) => `${r.site}:${r.path}`}
          />
        </div>
      )}
    </div>
  );
}

export function AnalyticsPanel() {
  const [loginSummary, setLoginSummary] = useState<AdminLoginSummary | null>(null);
  const [visitSummary, setVisitSummary] = useState<GuestVisitSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const to = Date.now();
        const from = to - SUMMARY_WINDOW_MS;
        const [logins, visits] = await Promise.all([
          fetchAdminLoginRows(from, to),
          fetchGuestVisitRows(from, to),
        ]);
        if (cancelled) return;
        setLoginSummary(summarizeAdminLogins(logins.rows));
        setVisitSummary(summarizeGuestVisits(visits.rows));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <AdminLoginsCard summary={loginSummary} loading={loading} />
      <GuestVisitsCard summary={visitSummary} loading={loading} />
    </div>
  );
}
