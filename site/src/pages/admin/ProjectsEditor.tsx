import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import {
  useProjects,
  saveProject,
  deleteProject,
  reorderProjects,
  COLORS,
  COLOR_KEYS,
  ICON_KEYS,
  STATUS_KINDS,
  STATUS_LABELS,
  getIconComponent,
  type Project,
  type ColorKey,
  type IconKey,
  type StatusKind,
} from "../../lib/projects";

const KNOWN_PACKAGES = [
  "firebase-core",
  "auth",
  "payments",
  "ai",
  "messaging",
  "db",
  "i18n",
  "legal",
  "flows",
  "seeders",
  "testing",
  "e2e",
];

function emptyProject(): Project {
  return {
    slug: "",
    name: "",
    subtitle: "",
    description: "",
    iconKey: "rocket",
    colorKey: "emerald",
    stack: [],
    highlights: [],
    packages: [],
    landingUrl: null,
    liveUrl: null,
    liveLabel: null,
    statusKind: "inprogress",
    statusText: "",
    enabled: true,
    order: 999,
    version: null,
    lastReleaseDate: null,
    releaseNotes: null,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProjectsEditor() {
  const { projects, loading } = useProjects();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState<Project | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const reordered = [...projects];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderProjects(reordered.map((p) => p.slug));
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-sm">Products Configuration</h2>
          <span className="text-xs text-muted-foreground">({projects.length})</span>
        </div>
        <button
          onClick={() => setCreating(emptyProject())}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Product
        </button>
      </div>

      <div className="divide-y divide-border">
        {projects.map((project, i) => (
          <ProjectRow
            key={project.slug}
            project={project}
            expanded={expandedSlug === project.slug}
            canMoveUp={i > 0}
            canMoveDown={i < projects.length - 1}
            onToggle={() =>
              setExpandedSlug(expandedSlug === project.slug ? null : project.slug)
            }
            onMoveUp={() => handleMove(i, -1)}
            onMoveDown={() => handleMove(i, 1)}
            onSaved={() => setExpandedSlug(null)}
            onDeleted={() => setExpandedSlug(null)}
          />
        ))}
      </div>

      {creating && (
        <div className="border-t-2 border-emerald-500/30 bg-emerald-500/[0.03]">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm">New Product</h3>
          </div>
          <ProjectForm
            project={creating}
            isNew
            onCancel={() => setCreating(null)}
            onSaved={() => setCreating(null)}
          />
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  expanded,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMoveUp,
  onMoveDown,
  onSaved,
  onDeleted,
}: {
  project: Project;
  expanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const palette = COLORS[project.colorKey];
  const Icon = getIconComponent(project.iconKey);

  const toggleEnabled = async () => {
    await saveProject({ ...project, enabled: !project.enabled });
  };

  return (
    <div>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-r ${palette.gradient} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{project.name}</span>
            <code className="text-[10px] font-mono text-muted-foreground">{project.slug}</code>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border`}>
              {STATUS_LABELS[project.statusKind]}
            </span>
            {project.statusText && (
              <span className="text-xs text-muted-foreground truncate">
                — {project.statusText}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {project.subtitle}
          </p>
        </div>

        <button
          onClick={toggleEnabled}
          className={`p-1.5 rounded-md transition-colors ${
            project.enabled
              ? "text-emerald-400 hover:bg-emerald-500/10"
              : "text-muted-foreground/50 hover:bg-muted"
          }`}
          title={project.enabled ? "Visible on site" : "Hidden from site"}
        >
          {project.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20">
          <ProjectForm
            project={project}
            onCancel={onToggle}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        </div>
      )}
    </div>
  );
}

function ProjectForm({
  project,
  isNew = false,
  onCancel,
  onSaved,
  onDeleted,
}: {
  project: Project;
  isNew?: boolean;
  onCancel: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}) {
  const [draft, setDraft] = useState<Project>(project);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof Project>(key: K, value: Project[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async () => {
    setError(null);
    const slug = isNew ? slugify(draft.slug || draft.name) : draft.slug;
    if (!slug) {
      setError("Slug required (generated from name)");
      return;
    }
    if (!draft.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await saveProject({ ...draft, slug });
      onSaved();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete product "${draft.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteProject(draft.slug);
      onDeleted?.();
    } catch (e: any) {
      setError(e.message || "Delete failed");
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Name">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={isNew ? "Slug (auto)" : "Slug"}>
          <input
            type="text"
            value={draft.slug}
            disabled={!isNew}
            onChange={(e) => update("slug", slugify(e.target.value))}
            placeholder={isNew ? slugify(draft.name) : undefined}
            className={`${inputClass} ${!isNew ? "opacity-50" : ""}`}
          />
        </Field>
      </div>

      <Field label="Subtitle">
        <input
          type="text"
          value={draft.subtitle}
          onChange={(e) => update("subtitle", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Icon">
          <select
            value={draft.iconKey}
            onChange={(e) => update("iconKey", e.target.value as IconKey)}
            className={inputClass}
          >
            {ICON_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Color">
          <select
            value={draft.colorKey}
            onChange={(e) => update("colorKey", e.target.value as ColorKey)}
            className={inputClass}
          >
            {COLOR_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preview">
          <div
            className={`h-9 rounded-md bg-gradient-to-r ${COLORS[draft.colorKey].gradient} flex items-center justify-center`}
          >
            {(() => {
              const I = getIconComponent(draft.iconKey);
              return <I className="w-4 h-4 text-white" />;
            })()}
          </div>
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Status">
          <select
            value={draft.statusKind}
            onChange={(e) => update("statusKind", e.target.value as StatusKind)}
            className={inputClass}
          >
            {STATUS_KINDS.map((k) => (
              <option key={k} value={k}>
                {STATUS_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status Text (badge label)">
          <input
            type="text"
            value={draft.statusText}
            onChange={(e) => update("statusText", e.target.value)}
            placeholder="e.g. Launching May 2026"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Landing URL">
          <input
            type="url"
            value={draft.landingUrl ?? ""}
            onChange={(e) => update("landingUrl", e.target.value || null)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
        <Field label="Live / Demo URL">
          <input
            type="url"
            value={draft.liveUrl ?? ""}
            onChange={(e) => update("liveUrl", e.target.value || null)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Version (e.g. 1.2.0)">
          <input
            type="text"
            value={draft.version ?? ""}
            onChange={(e) => update("version", e.target.value || null)}
            placeholder="1.0.0"
            className={inputClass}
          />
        </Field>
        <Field label="Last Release Date">
          <input
            type="date"
            value={draft.lastReleaseDate ?? ""}
            onChange={(e) => update("lastReleaseDate", e.target.value || null)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Release Notes (one-line summary)">
        <input
          type="text"
          value={draft.releaseNotes ?? ""}
          onChange={(e) => update("releaseNotes", e.target.value || null)}
          placeholder="Added city filters and radar chart view."
          className={inputClass}
        />
      </Field>

      <Field label="Live Button Label (optional)">
        <input
          type="text"
          value={draft.liveLabel ?? ""}
          onChange={(e) => update("liveLabel", e.target.value || null)}
          placeholder="Try Live Demo"
          className={inputClass}
        />
      </Field>

      <Field label="Tech Stack (comma separated)">
        <input
          type="text"
          value={draft.stack.join(", ")}
          onChange={(e) =>
            update(
              "stack",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="React, TypeScript, Firebase"
          className={inputClass}
        />
      </Field>

      <Field label="Key Features / Highlights (one per line)">
        <textarea
          rows={6}
          value={draft.highlights.join("\n")}
          onChange={(e) =>
            update(
              "highlights",
              e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className={`${inputClass} resize-none font-sans`}
        />
      </Field>

      <Field label="@plantagoai Packages Used">
        <div className="flex flex-wrap gap-1.5">
          {KNOWN_PACKAGES.map((pkg) => {
            const active = draft.packages.includes(pkg);
            return (
              <button
                key={pkg}
                type="button"
                onClick={() =>
                  update(
                    "packages",
                    active
                      ? draft.packages.filter((p) => p !== pkg)
                      : [...draft.packages, pkg],
                  )
                }
                className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {active && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
                {pkg}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="flex items-center gap-2">
        <input
          id={`enabled-${draft.slug}`}
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => update("enabled", e.target.checked)}
          className="rounded border-border"
        />
        <label htmlFor={`enabled-${draft.slug}`} className="text-xs text-muted-foreground">
          Visible on public site
        </label>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          {!isNew && onDeleted && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-colors";
