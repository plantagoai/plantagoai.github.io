import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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
  type SectionEntry,
  type SectionId,
  type SectionContent,
} from "../../lib/homeSections";

type Draft = Record<string, unknown>;

export function HomepageSectionsEditor() {
  const { homepage, loading } = useHomepage();
  const [expanded, setExpanded] = useState<SectionId | null>(null);
  const [busy, setBusy] = useState<SectionId | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { sections, content } = homepage;

  const writeSections = async (next: SectionEntry[], id: SectionId) => {
    setBusy(id);
    try {
      await saveSectionOrder(next);
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
        <h2 className="font-semibold text-sm">Homepage Sections</h2>
        <span className="text-xs text-muted-foreground">edit, reorder and show/hide on the public site</span>
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
                    <span className="font-semibold text-sm">{SECTION_LABELS[section.id]}</span>
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
                    {summary(section.id, content)}
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
                    id={section.id}
                    value={content[section.id] as unknown as Draft}
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

function summary(id: SectionId, content: SectionContent): string {
  const c = content[id] as unknown as Record<string, unknown>;
  const text = [c.title, c.name, c.badge, c.lead].find((v) => typeof v === "string" && v);
  if (id === "hero") {
    return [content.hero.lead, ...content.hero.words.map((w) => w.text)].join(" ");
  }
  return (text as string | undefined) ?? "";
}

function SectionForm({ id, value, onClose }: { id: SectionId; value: Draft; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await saveSectionContent(id, draft as unknown as SectionContent[typeof id]);
      onClose();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm(`Put back the original ${SECTION_LABELS[id]} copy? Click Save to keep it.`)) return;
    setDraft(structuredClone(DEFAULT_CONTENT[id]) as unknown as Draft);
  };

  return (
    <div className="p-4 space-y-4">
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {error}
        </p>
      )}
      {SECTION_NOTES[id] && <p className="text-xs text-muted-foreground">{SECTION_NOTES[id]}</p>}

      <Fields fields={SECTION_FIELDS[id]} value={draft} onChange={setDraft} />

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
            return (
              <ParagraphsField
                key={field.key}
                label={field.label}
                hint={field.hint}
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

/* Paragraphs are edited as one text box with blank lines between them; the
   raw text is kept while typing so a half-typed blank line isn't eaten. */
function ParagraphsField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(value.join("\n\n"));
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
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
