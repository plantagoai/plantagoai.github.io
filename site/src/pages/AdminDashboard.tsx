import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  LogOut,
  CheckCircle2,
  Activity,
  Database,
  CreditCard,
  Trash2,
  TestTube,
  ArrowLeft,
  Loader2,
  Lock,
  Clock,
  AlertCircle,
  Package,
  Globe,
  Compass,
  Landmark,
  Heart,
  ShoppingCart,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectsEditor } from "./admin/ProjectsEditor";
import { SiteSettingsPanel } from "./admin/SiteSettingsPanel";
import { seedDefaultsIfEmpty } from "../lib/projects";

// ---------------------------------------------------------------------------
// Data — Integration matrix (static, matches codebase state)
// ---------------------------------------------------------------------------

const PACKAGES = [
  "firebase-core", "auth", "payments", "ai", "messaging",
  "db", "i18n", "legal", "flows", "seeders", "testing", "e2e",
] as const;

type PackageName = typeof PACKAGES[number];

interface ProjectInfo {
  name: string;
  color: string;
  dotColor: string;
  url: string | null;
  firebaseProject: string;
  packages: PackageName[];
  status: string;
  testCount: number;
  collections: string[];
}

const PROJECTS: ProjectInfo[] = [
  {
    name: "Foundation",
    color: "text-violet-400",
    dotColor: "bg-violet-500",
    url: "https://foundation-vote.web.app",
    firebaseProject: "solanavote-devnet",
    packages: ["firebase-core", "auth", "legal", "ai", "messaging", "e2e"],
    status: "Live on Solana Devnet",
    testCount: 14,
    collections: [
      "proposals", "voters", "votes", "supporter_signatures", "voting_rounds",
      "funds", "distributions", "product_requests", "savings_summary",
      "identity_proofs", "deletion_requests", "deletion_audit",
      "legal_consents", "notifications",
    ],
  },
  {
    name: "MarketHub",
    color: "text-amber-400",
    dotColor: "bg-amber-500",
    url: null,
    firebaseProject: "markethub",
    packages: ["firebase-core", "auth", "i18n", "flows", "legal", "seeders", "payments", "e2e"],
    status: "Frontend Complete",
    testCount: 0,
    collections: [
      "users", "orders", "products", "categories", "stores",
      "subscriptions", "savedPaymentMethods", "notifications",
      "transactions", "commissions", "legal_acceptances",
    ],
  },
  {
    name: "HerbPulse",
    color: "text-emerald-400",
    dotColor: "bg-emerald-500",
    url: "https://herbpulse-app.web.app",
    firebaseProject: "herbpulse-app",
    packages: ["firebase-core", "auth", "legal", "seeders", "e2e"],
    status: "In Development",
    testCount: 0,
    collections: [
      "users", "herbs", "formulas", "interactions",
      "invites", "allowedUsers", "waitlist", "_meta",
    ],
  },
  {
    name: "SOHO",
    color: "text-cyan-400",
    dotColor: "bg-cyan-500",
    url: null,
    firebaseProject: "soho-app",
    packages: ["firebase-core", "auth", "legal"],
    status: "In Development",
    testCount: 0,
    collections: [],
  },
];

const SHARED_TEST_COUNTS: Record<string, number> = {
  "firebase-core": 5, auth: 18, payments: 32, ai: 24,
  messaging: 16, db: 28, i18n: 14, legal: 20,
  flows: 22, seeders: 15, testing: 0, e2e: 0,
};

const ADMIN_EMAILS = ["feedmyinfo@gmail.com", "dagan.gilat@gmail.com"];

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------

function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || "") : false;

  return { user, loading, isAdmin };
}

function AdminLogin() {
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!ADMIN_EMAILS.includes(result.user.email || "")) {
        await signOut(auth);
        setError("Access denied. This panel is restricted to PlantagoAI admins.");
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Login failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Brand */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 hover:opacity-80 transition-opacity">
          <img src="/plantago-logo.png" alt="PlantagoAI" className="h-8 w-auto" />
          <span className="font-semibold text-lg tracking-wide">PlantagoAI</span>
        </Link>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">
                  Restricted
                </p>
                <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in with an authorized PlantagoAI admin account to manage
              products, site settings, contacts, and subscribers.
            </p>

            <div className="grid grid-cols-5 gap-2">
              {[
                { icon: Landmark, gradient: "from-violet-500 to-indigo-500", label: "Foundation" },
                { icon: Compass, gradient: "from-sky-500 to-cyan-500", label: "Nomadex" },
                { icon: Heart, gradient: "from-emerald-500 to-teal-500", label: "HerbPulse" },
                { icon: ShoppingCart, gradient: "from-amber-500 to-orange-500", label: "MarketHub" },
                { icon: Building2, gradient: "from-cyan-500 to-blue-500", label: "SOHO" },
              ].map(({ icon: Icon, gradient, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shadow-black/20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/70 tracking-wide truncate w-full text-center">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2.5"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Sign in with Google
            </button>

            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to site
            </Link>
          </div>
        </div>

        <p className="text-center text-xs font-mono text-muted-foreground/60 mt-6 tracking-wider">
          Access restricted · Protected by App Check &amp; reCAPTCHA Enterprise
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard sections
// ---------------------------------------------------------------------------

function IntegrationMatrix() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Package className="w-4 h-4 text-emerald-400" />
        <h2 className="font-semibold text-sm">Integration Matrix</h2>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[36rem]">
          <thead>
            <tr>
              <th className="text-left font-mono text-xs uppercase tracking-wider text-muted-foreground pb-2 pr-3">
                Package
              </th>
              {PROJECTS.map((p) => (
                <th key={p.name} className={`text-xs uppercase tracking-wider pb-2 px-2 text-center ${p.color}`}>
                  {p.name}
                </th>
              ))}
              <th className="text-xs uppercase tracking-wider pb-2 px-2 text-center text-muted-foreground">Tests</th>
            </tr>
          </thead>
          <tbody>
            {PACKAGES
              .filter((pkg) => PROJECTS.some((p) => p.packages.includes(pkg)))
              .map((pkg) => (
                <tr key={pkg} className="border-t border-border/50">
                  <td className="py-2 pr-3 font-mono text-xs text-foreground/80">{pkg}</td>
                  {PROJECTS.map((p) => (
                    <td key={p.name} className="py-2 px-2 text-center">
                      {p.packages.includes(pkg) ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 inline ${p.color}`} />
                      ) : (
                        <span className="text-muted-foreground/20">-</span>
                      )}
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center font-mono text-xs text-muted-foreground">
                    {SHARED_TEST_COUNTS[pkg] || "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <p className="mt-4 pt-3 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
          Unintegrated packages hidden:{" "}
          {PACKAGES
            .filter((pkg) => !PROJECTS.some((p) => p.packages.includes(pkg)))
            .map((pkg) => (
              <code key={pkg} className="font-mono text-foreground/70 mr-1.5">
                {pkg}
              </code>
            ))}
          — will appear when consumed by a product.
        </p>
      </div>
    </div>
  );
}

function ProjectStatusCards() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {PROJECTS.map((p) => (
        <div key={p.name} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${p.dotColor}`} />
            <h3 className={`font-semibold text-sm ${p.color}`}>{p.name}</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border ml-auto">
              {p.status}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">{p.packages.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Packages</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{p.collections.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Collections</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{p.testCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">E2E Specs</p>
            </div>
          </div>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Globe className="w-3 h-3" /> {p.url.replace("https://", "")}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function TestSummary() {
  const totalTests = Object.values(SHARED_TEST_COUNTS).reduce((a, b) => a + b, 0);
  const totalE2E = PROJECTS.reduce((a, p) => a + p.testCount, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <TestTube className="w-4 h-4 text-emerald-400" />
        <h2 className="font-semibold text-sm">Test Summary</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-2xl font-semibold text-emerald-400">{totalTests}</p>
            <p className="text-xs text-muted-foreground">Unit Tests</p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
            <p className="text-2xl font-semibold text-violet-400">{totalE2E}</p>
            <p className="text-xs text-muted-foreground">E2E Specs</p>
          </div>
          <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <p className="text-2xl font-semibold text-cyan-400">10</p>
            <p className="text-xs text-muted-foreground">Packages Tested</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {Object.entries(SHARED_TEST_COUNTS)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([pkg, count]) => (
              <div key={pkg} className="flex items-center gap-2">
                <code className="text-xs font-mono text-muted-foreground w-24">{pkg}</code>
                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/60 rounded-full"
                    style={{ width: `${(count / 32) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live data hooks
// ---------------------------------------------------------------------------

const ADMIN_API_KEY = "4402964dac8cc1b3e5723b5ae4e81855b453fe6d3987dc85";

const STATUS_ENDPOINTS: Record<string, string> = {
  Foundation: "https://adminstatus-xhhhnzagqq-ue.a.run.app",
  MarketHub: "https://us-central1-markethub-aecfe.cloudfunctions.net/adminStatus",
  HerbPulse: "https://us-central1-herbpulse-app.cloudfunctions.net/adminStatus",
};

interface ProjectStatus {
  project: string;
  timestamp: string;
  collections: Record<string, number>;
  totalDocs: number;
  deletionQueue: { pending: number; requests: Array<{ userId: string; scheduledAt: string }> };
  paymentStats?: { totalOrders: number; activeSubscriptions: number; totalStores: number };
  recentActivity?: Array<{ id: string; title: string; createdAt: string }>;
  inviteStats?: { total: number; pending: number };
  dataVersion?: number;
}

function useProjectStatuses() {
  const [statuses, setStatuses] = useState<Record<string, ProjectStatus | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results: Record<string, ProjectStatus | null> = {};

    await Promise.all(
      Object.entries(STATUS_ENDPOINTS).map(async ([name, url]) => {
        try {
          const res = await fetch(url, {
            headers: { "X-Admin-Key": ADMIN_API_KEY },
          });
          if (res.ok) {
            results[name] = await res.json();
          } else {
            results[name] = null;
          }
        } catch {
          results[name] = null;
        }
      })
    );

    setStatuses(results);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { statuses, loading, error, refresh };
}

// ---------------------------------------------------------------------------
// Live data panels
// ---------------------------------------------------------------------------

function DBOverview({ statuses }: { statuses: Record<string, ProjectStatus | null> }) {
  const projectEntries = Object.entries(statuses).filter(([, s]) => s !== null) as [string, ProjectStatus][];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Database className="w-4 h-4 text-cyan-400" />
        <h2 className="font-semibold text-sm">DB Overview</h2>
        {projectEntries.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-auto">
            LIVE
          </span>
        )}
      </div>
      <div className="p-4">
        {projectEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No live data — deploy adminStatus Cloud Functions and set ADMIN_API_KEY
          </p>
        ) : (
          <div className="space-y-4">
            {projectEntries.map(([name, status]) => {
              const project = PROJECTS.find((p) => p.name === name);
              const topCollections = Object.entries(status.collections)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

              return (
                <div key={name}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${project?.dotColor || "bg-gray-500"}`} />
                    <span className={`text-xs font-semibold ${project?.color || ""}`}>{name}</span>
                    <span className="text-xs font-mono text-muted-foreground ml-auto">
                      {status.totalDocs.toLocaleString()} docs
                    </span>
                  </div>
                  <div className="space-y-1">
                    {topCollections.map(([col, count]) => (
                      <div key={col} className="flex items-center gap-2">
                        <code className="text-[10px] font-mono text-muted-foreground w-32 truncate">{col}</code>
                        <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${project?.dotColor || "bg-gray-500"} opacity-60`}
                            style={{ width: `${Math.min((count / Math.max(...topCollections.map(([, c]) => c))) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentStatus({ statuses }: { statuses: Record<string, ProjectStatus | null> }) {
  const markethub = statuses.MarketHub;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-amber-400" />
        <h2 className="font-semibold text-sm">Payments</h2>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">MarketHub</span>
      </div>
      <div className="p-4">
        {!markethub?.paymentStats ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No live data — deploy MarketHub adminStatus
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-xl font-semibold text-amber-400">{markethub.paymentStats.totalOrders}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Orders</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-xl font-semibold text-amber-400">{markethub.paymentStats.activeSubscriptions}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Active Subs</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-xl font-semibold text-amber-400">{markethub.paymentStats.totalStores}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Stores</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeletionQueue({ statuses }: { statuses: Record<string, ProjectStatus | null> }) {
  const allPending = Object.entries(statuses)
    .filter(([, s]) => s !== null)
    .flatMap(([name, s]) =>
      (s as ProjectStatus).deletionQueue.requests.map((r) => ({ ...r, project: name }))
    );

  const totalPending = Object.values(statuses)
    .filter((s) => s !== null)
    .reduce((a, s) => a + (s as ProjectStatus).deletionQueue.pending, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Trash2 className="w-4 h-4 text-red-400" />
        <h2 className="font-semibold text-sm">Deletion Queue</h2>
        {totalPending > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 ml-auto">
            {totalPending} pending
          </span>
        )}
      </div>
      <div className="p-4">
        {allPending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {Object.values(statuses).some((s) => s !== null)
              ? "No pending deletion requests"
              : "No live data — deploy adminStatus Cloud Functions"}
          </p>
        ) : (
          <div className="space-y-2">
            {allPending.map((r, i) => {
              const project = PROJECTS.find((p) => p.name === r.project);
              const daysLeft = r.scheduledAt
                ? Math.max(0, Math.ceil((new Date(r.scheduledAt).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${project?.dotColor || "bg-gray-500"}`} />
                  <span className={`${project?.color || ""} font-medium w-20`}>{r.project}</span>
                  <span className="font-mono text-muted-foreground truncate flex-1">{r.userId?.slice(0, 12)}...</span>
                  {daysLeft !== null && (
                    <span className={`font-mono ${daysLeft < 7 ? "text-red-400" : "text-muted-foreground"}`}>
                      {daysLeft}d left
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

function TestRunner() {
  const [results, setResults] = useState<Record<string, { pass: number; fail: number; time: string }> | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  // Load last results from Firestore
  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      import("../lib/firebase").then(({ db }) => {
        getDoc(doc(db, "admin", "testResults")).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setResults(data.packages || null);
            setLastRun(data.lastRun || null);
          }
        }).catch(() => {});
      });
    });
  }, []);

  const totalPass = results ? Object.values(results).reduce((a, r) => a + r.pass, 0) : 0;
  const totalFail = results ? Object.values(results).reduce((a, r) => a + r.fail, 0) : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <TestTube className="w-4 h-4 text-emerald-400" />
        <h2 className="font-semibold text-sm">Test Runner</h2>
        {lastRun && (
          <span className="text-[10px] font-mono text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(lastRun).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="p-4">
        {!results ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No test results yet. Run tests and push results:
            </p>
            <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded text-foreground/80">
              node scripts/push-test-results.js
            </code>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-center mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xl font-semibold text-emerald-400">{totalPass}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Passed</p>
              </div>
              <div className={`p-2 rounded-lg ${totalFail > 0 ? "bg-red-500/5 border-red-500/10" : "bg-muted/30 border-border"} border`}>
                <p className={`text-xl font-semibold ${totalFail > 0 ? "text-red-400" : "text-muted-foreground"}`}>{totalFail}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Failed</p>
              </div>
            </div>
            <div className="space-y-1">
              {Object.entries(results)
                .sort(([, a], [, b]) => (b.pass + b.fail) - (a.pass + a.fail))
                .map(([pkg, r]) => (
                  <div key={pkg} className="flex items-center gap-2 text-xs">
                    {r.fail > 0 ? (
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                    <code className="font-mono text-muted-foreground w-24 truncate">{pkg}</code>
                    <span className="text-emerald-400 font-mono">{r.pass}</span>
                    {r.fail > 0 && <span className="text-red-400 font-mono">/ {r.fail} fail</span>}
                    <span className="text-muted-foreground/50 font-mono ml-auto">{r.time}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAdmin();
  const { statuses, loading: statusLoading, refresh } = useProjectStatuses();

  useEffect(() => {
    if (isAdmin) {
      seedDefaultsIfEmpty().catch(() => {});
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/plantago-logo.png"
                alt="PlantagoAI"
                className="h-7 w-auto"
              />
            </Link>
            <span className="text-sm font-medium text-muted-foreground">/</span>
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              Refresh
            </button>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-project visibility — 5 products, 12 shared packages
          </p>
        </div>

        {/* Site-level section toggles */}
        <SiteSettingsPanel />

        {/* Projects configuration (CMS) */}
        <ProjectsEditor />

        {/* Project status */}
        <ProjectStatusCards />

        {/* Integration + Tests side by side */}
        <div className="grid lg:grid-cols-2 gap-6">
          <IntegrationMatrix />
          <TestSummary />
        </div>

        {/* Live data panels */}
        <div className="grid md:grid-cols-3 gap-4">
          <DBOverview statuses={statuses} />
          <PaymentStatus statuses={statuses} />
          <DeletionQueue statuses={statuses} />
        </div>

        {/* Test Runner */}
        <TestRunner />
      </main>
    </div>
  );
}
