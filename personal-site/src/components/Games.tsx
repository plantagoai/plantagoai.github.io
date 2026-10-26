import { useState, type ComponentType } from "react";
import Trivia from "./games/Trivia";
import SybilHunt from "./games/SybilHunt";
import ContainerPacking from "./games/ContainerPacking";
import CloudArchitect from "./games/CloudArchitect";
import { track } from "../lib/track";

import type { PersonalContent } from "../data/homeContent";

const GAMES: Record<string, ComponentType> = {
  trivia: Trivia,
  sybil: SybilHunt,
  pack: ContainerPacking,
  arch: CloudArchitect,
};

export default function Games({ content }: { content: PersonalContent["games"] }) {
  const TABS = content.tabs
    .filter((t) => GAMES[t.game])
    .map((t) => ({ id: t.game, name: t.name, subtitle: t.subtitle, Component: GAMES[t.game] }));
  const [picked, setActive] = useState<string>(TABS[0]?.id ?? "");
  const active = TABS.some((t) => t.id === picked) ? picked : TABS[0]?.id;
  const Active = TABS.find((t) => t.id === active)?.Component;
  return (
    <section id="games" className="border-t border-border py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">{content.eyebrow}</p>
        <h2 className="heading-section mt-2 max-w-2xl">{content.title}</h2>
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActive(t.id);
                track("game", t.id);
              }}
              className={`flex flex-col items-start border-b-2 px-3 py-3 text-left transition ${
                active === t.id
                  ? "border-primary text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <span className="text-sm font-medium">{t.name}</span>
              <span className="text-[11px] uppercase tracking-wider opacity-70">
                {t.subtitle}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-6">
          {Active && <Active />}
        </div>
      </div>
    </section>
  );
}
