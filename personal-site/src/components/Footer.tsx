import { Mail, Linkedin, Github, Shield } from "lucide-react";
import { contact, stats } from "../data/cv";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30 py-12">
      <div className="container-wide flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">Dagan Gilat</p>
          <p className="text-meta mt-1">
            Founder · Architect · Researcher · Distributed Systems & Applied AI
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-muted">
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-1.5 hover:text-ink"
          >
            <Mail size={14} /> {contact.email}
          </a>
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-ink"
          >
            <Linkedin size={14} /> LinkedIn
          </a>
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-ink"
          >
            <Github size={14} /> GitHub
          </a>
        </div>
      </div>
      <div className="container-wide mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-xs text-muted">
          <span>
            <span className="text-ink">{stats.yearsExperience}+</span> years
          </span>
          <span>
            <span className="text-ink">{stats.patents}</span> patents filed
          </span>
          <span>
            <span className="text-ink">{stats.publications}</span> publications
          </span>
          <span>
            <span className="text-ink">{stats.citations}+</span> citations
          </span>
        </div>
        <a
          href="https://foundation-global.com"
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
            Built on <span className="font-semibold text-ink">Foundation</span>
          </span>
        </a>
      </div>
    </footer>
  );
}
