import { useState } from "react";
import { Eye, EyeOff, Loader2, Settings2 } from "lucide-react";
import { useSiteSettings, saveSiteSettings, type SiteSettings } from "../../lib/siteSettings";

type SectionFlag = {
  key: keyof SiteSettings;
  label: string;
  description: string;
};

const SECTION_FLAGS: SectionFlag[] = [
  {
    key: "releasesEnabled",
    label: "Releases",
    description: "Latest Releases section + nav link. Shows products with a version set.",
  },
];

export function SiteSettingsPanel() {
  const { settings, loading } = useSiteSettings();
  const [saving, setSaving] = useState<keyof SiteSettings | null>(null);

  const toggle = async (key: keyof SiteSettings) => {
    setSaving(key);
    try {
      await saveSiteSettings({ [key]: !settings[key] });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-emerald-400" />
        <h2 className="font-semibold text-sm">Site Sections</h2>
        <span className="text-xs text-muted-foreground">show/hide on public site</span>
      </div>

      <div className="divide-y divide-border">
        {SECTION_FLAGS.map((flag) => {
          const enabled = settings[flag.key];
          const isBusy = saving === flag.key;
          return (
            <div key={flag.key} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{flag.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      enabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {enabled ? "VISIBLE" : "HIDDEN"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
              </div>
              <button
                onClick={() => toggle(flag.key)}
                disabled={loading || isBusy}
                className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                  enabled
                    ? "text-emerald-400 hover:bg-emerald-500/10"
                    : "text-muted-foreground/60 hover:bg-muted"
                }`}
                title={enabled ? "Hide on public site" : "Show on public site"}
              >
                {isBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : enabled ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
