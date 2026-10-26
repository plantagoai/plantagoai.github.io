import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImageUp,
  LayoutList,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  useHomepage,
  saveSectionOrder,
  saveSectionContent,
  DEFAULT_CONTENT,
  SECTION_FIELDS,
  SECTION_LABELS,
  SECTION_NOTES,
  type FieldDef,
} from "../../lib/homeSections";
import { usePersonalHome, savePersonalOrder, savePersonalContent } from "../../lib/personalHome";
import {
  PERSONAL_DEFAULTS,
  PERSONAL_FIELDS,
  PERSONAL_SECTION_LABELS,
  PERSONAL_SECTION_NOTES,
} from "../../../../personal-site/src/data/homeContent";

type Draft = Record<string, unknown>;
type Entry = { id: string; visible: boolean };

/** One site's sections: where they load from and save to, and how each
 *  one is labelled and edited. */
export interface SectionsSite {
  title: string;
  subtitle: string;
  useData: () => { sections: Entry[]; content: Record<string, unknown>; loading: boolean };
  saveOrder: (sections: Entry[]) => Promise<void>;
  saveContent: (id: string, value: Draft) => Promise<void>;
  defaults: Record<string, unknown>;
  fields: Record<string, FieldDef[]>;
  labels: Record<string, string>;
  notes: Record<string, string | undefined>;
}

export const PLANTAGOAI_SECTIONS: SectionsSite = {
  title: "Homepage Sections",
  subtitle: "plantagoai.com · edit, reorder and show/hide",
  useData: () => {
    const { homepage, loading } = useHomepage();
    return { ...homepage, content: homepage.content as unknown as Record<string, unknown>, loading };
  },
  saveOrder: (sections) => saveSectionOrder(sections as Parameters<typeof saveSectionOrder>[0]),
  saveContent: (id, value) => saveSectionContent(id as never, value as never),
  defaults: DEFAULT_CONTENT as unknown as Record<string, unknown>,
  fields: SECTION_FIELDS,
  labels: SECTION_LABELS,
  notes: SECTION_NOTES,
};

export const DAGANGILAT_SECTIONS: SectionsSite = {
  title: "dagangilat.com Sections",
  subtitle: "edit, reorder and show/hide · goes live on save",
  useData: () => {
    const { home, loading } = usePersonalHome();
    return { ...home, content: home.content as unknown as Record<string, unknown>, loading };
  },
  saveOrder: (sections) => savePersonalOrder(sections as Parameters<typeof savePersonalOrder>[0]),
  saveContent: (id, value) => savePersonalContent(id as never, value),
  defaults: PERSONAL_DEFAULTS as unknown as Record<string, unknown>,
  fields: PERSONAL_FIELDS as unknown as Record<string, FieldDef[]>,
  labels: PERSONAL_SECTION_LABELS,
  notes: PERSONAL_SECTION_NOTES,
};

export function HomepageSectionsEditor({ site = PLANTAGOAI_SECTIONS }: { site?: SectionsSite }) {
  const { sections, content, loading } = site.useData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const writeSections = async (next: Entry[], id: string) => {
    setBusy(id);
    try {
      await site.saveOrder(next);
    } finally {
      setBusy(null);
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    return writeSections(next, sections[index].id);
  };

  const toggleVisible = (index: number) => {
    const next = sections.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s));
    return writeSections(next, sections[index].id);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <LayoutList className="w-4 h-4 text-emerald-700" />
        <h2 className="font-semibold text-sm">{site.title}</h2>
        <span className="text-xs text-muted-foreground">{site.subtitle}</span>
      </div>

      <div className="divide-y divide-border">
        {sections.map((section, i) => {
          const isOpen = expanded === section.id;
          return (
            <div key={section.id}>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMove(i, -1)}
                    disabled={i === 0 || busy !== null}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMove(i, 1)}
                    disabled={i === sections.length - 1 || busy !== null}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{site.labels[section.id] ?? section.id}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        section.visible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {section.visible ? "VISIBLE" : "HIDDEN"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {summary(content[section.id])}
                  </p>
                </div>

                <button
                  onClick={() => toggleVisible(i)}
                  disabled={busy !== null}
                  className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                    section.visible
                      ? "text-emerald-700 hover:bg-emerald-50"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  title={section.visible ? "Hide on public site" : "Show on public site"}
                >
                  {busy === section.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : section.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setExpanded(isOpen ? null : section.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                  title={isOpen ? "Close" : "Edit"}
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border bg-muted/20">
                  <SectionForm
                    site={site}
                    id={section.id}
                    value={content[section.id] as Draft}
                    onClose={() => setExpanded(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A one-line hint of what a section says, for the collapsed row. */
function summary(value: unknown): string {
  const c = (value ?? {}) as Record<string, unknown>;
  if (Array.isArray(c.words) && typeof c.lead === "string") {
    return [c.lead, ...(c.words as { text?: string }[]).map((w) => w.text ?? "")].join(" ");
  }
  if (Array.isArray(c.titleWords) && c.titleWords.every((w) => typeof w === "string")) {
    return (c.titleWords as string[]).join(", ");
  }
  const text = [c.title, c.name, c.caption, c.badge, c.lead, c.titleLead, c.eyebrow, c.copyright, c.body].find(
    (v) => typeof v === "string" && v,
  );
  return (text as string | undefined) ?? "";
}

function SectionForm({
  site,
  id,
  value,
  onClose,
}: {
  site: SectionsSite;
  id: string;
  value: Draft;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await site.saveContent(id, draft);
      onClose();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm(`Put back the original ${site.labels[id] ?? id} copy? Click Save to keep it.`)) return;
    setDraft(structuredClone(site.defaults[id]) as Draft);
  };

  return (
    <div className="p-4 space-y-4">
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </p>
      )}
      {site.notes[id] && <p className="text-xs text-muted-foreground">{site.notes[id]}</p>}

      <Fields fields={site.fields[id] ?? []} value={draft} onChange={setDraft} />

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <button
          onClick={handleReset}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Fill the form with the original copy"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Original copy
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Fields({
  fields,
  value,
  onChange,
}: {
  fields: FieldDef[];
  value: Draft;
  onChange: (next: Draft) => void;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <>
      {fields.map((field) => {
        const current = value[field.key];
        switch (field.kind) {
          case "text":
          case "url":
            return (
              <Field key={field.key} label={field.label} hint={field.hint}>
                <input
                  type={field.kind}
                  value={(current as string) ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className={inputClass}
                />
              </Field>
            );
          case "image":
            return (
              <ImageField
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={(current as string) ?? ""}
                onChange={(v) => set(field.key, v)}
              />
            );
          case "textarea":
            return (
              <Field key={field.key} label={field.label} hint={field.hint}>
                <textarea
                  rows={3}
                  value={(current as string) ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className={`${inputClass} resize-y`}
                />
              </Field>
            );
          case "paragraphs":
          case "lines":
            return (
              <ParagraphsField
                key={field.key}
                label={field.label}
                hint={field.hint}
                separator={field.kind === "lines" ? "line" : "blank"}
                value={(current as string[]) ?? []}
                onChange={(v) => set(field.key, v)}
              />
            );
          case "select":
            return (
              <Field key={field.key} label={field.label} hint={field.hint}>
                <select
                  value={(current as string) ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  className={inputClass}
                >
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
            );
          case "list":
            return (
              <ListField
                key={field.key}
                field={field}
                items={(current as Draft[]) ?? []}
                onChange={(v) => set(field.key, v)}
              />
            );
        }
      })}
    </>
  );
}

/* A picture: shown as a preview, replaced by uploading a file or pasting a
   link. An upload is shrunk in the browser to a JPEG and kept in the section
   itself as a data: URL, so it goes live on Save with no Storage bucket or
   extra deploy. Firestore caps a document near 1 MB, hence the size steps. */
const MAX_IMAGE_SIDE = 800;
const MAX_IMAGE_CHARS = 350_000;

async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  let w = Math.round(bitmap.width * scale);
  let h = Math.round(bitmap.height * scale);
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't resize images");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    const url = canvas.toDataURL("image/jpeg", 0.85);
    if (url.length <= MAX_IMAGE_CHARS) return url;
    w = Math.round(w * 0.8);
    h = Math.round(h * 0.8);
  }
  throw new Error("That image is too large even after resizing");
}

function ImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUpload = value.startsWith("data:");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await shrinkImage(file));
    } catch (e: any) {
      setError(e.message || "Couldn't read that image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <div className="flex items-start gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-[11px] text-muted-foreground">No photo</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageUp className="w-3.5 h-3.5" />}
            {value ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
          <input
            type="text"
            value={isUpload ? "" : value}
            placeholder={isUpload ? "Uploaded photo (paste a link to use one instead)" : "or paste an image link"}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-[11px] text-red-700">{error}</p>}
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

/* A list of strings edited as one text box: paragraphs with blank lines
   between them, or one item per line. The raw text is kept while typing so
   a half-typed separator isn't eaten. */
function ParagraphsField({
  label,
  hint,
  separator,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  separator: "blank" | "line";
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(value.join(separator === "line" ? "\n" : "\n\n"));
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            separator === "line"
              ? e.target.value.split("\n").map((l) => l.trim()).filter(Boolean)
              : e.target.value
                  .split(/\n\s*\n/)
                  .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
                  .filter(Boolean),
          );
        }}
        className={`${inputClass} resize-y`}
      />
    </Field>
  );
}

function ListField({
  field,
  items,
  onChange,
}: {
  field: Extract<FieldDef, { kind: "list" }>;
  items: Draft[];
  onChange: (v: Draft[]) => void;
}) {
  const move = (i: number, d: -1 | 1) => {
    const t = i + d;
    if (t < 0 || t >= items.length) return;
    const next = [...items];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</span>
      {field.hint && <p className="text-[11px] text-muted-foreground mb-1.5">{field.hint}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background/60 p-3 space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-muted-foreground flex-1">
                {field.itemLabel} {i + 1}
              </span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Move up"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Move down"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="p-1 text-red-700 hover:bg-red-50 rounded"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <Fields
                fields={field.fields}
                value={item}
                onChange={(next) => onChange(items.map((it, j) => (j === i ? next : it)))}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { ...field.blank }])}
        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border hover:text-foreground transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-200 transition-colors";
