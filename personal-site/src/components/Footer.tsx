import { Mail, Linkedin, Github, Shield } from "lucide-react";
import type { PersonalContent } from "../data/homeContent";

export default function Footer({ content }: { content: PersonalContent["footer"] }) {
  return (
    <footer className="border-t border-border bg-surface/30 py-12">
      <div className="container-wide flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">{content.name}</p>
          {content.tagline && <p className="text-meta mt-1">{content.tagline}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-muted">
          {content.email && (
            <a
              href={`mailto:${content.email}`}
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <Mail size={14} /> {content.email}
            </a>
          )}
          {content.linkedin && (
            <a
              href={content.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <Linkedin size={14} /> LinkedIn
            </a>
          )}
          {content.github && (
            <a
              href={content.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-ink"
            >
              <Github size={14} /> GitHub
            </a>
          )}
        </div>
      </div>
      <div className="container-wide mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-xs text-muted">
          {content.stats.map((s, i) => (
            <span key={i}>
              <span className="text-ink">{s.value}</span> {s.label}
            </span>
          ))}
        </div>
        {content.badgeName && (
          <a
            href={content.badgeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink"
          >
            <Shield
              size={14}
              style={{
                color: "hsl(var(--pillar-share))",
                fill: "hsl(var(--pillar-share) / 0.15)",
              }}
            />
            <span>
              {content.badgeLead} <span className="font-semibold text-ink">{content.badgeName}</span>
            </span>
          </a>
        )}
      </div>
    </footer>
  );
}
