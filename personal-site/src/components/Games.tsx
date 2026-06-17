import { useState } from "react";
import Trivia from "./games/Trivia";
import SybilHunt from "./games/SybilHunt";
import ContainerPacking from "./games/ContainerPacking";
import CloudArchitect from "./games/CloudArchitect";

const TABS = [
  { id: "trivia", name: "Trivia", subtitle: "Things I find delightful", Component: Trivia },
  { id: "sybil", name: "Sybil hunt", subtitle: "Foundation · Verified Human", Component: SybilHunt },
  {
    id: "pack",
    name: "Container packing",
    subtitle: "IBM · Logistics Optimization",
    Component: ContainerPacking,
  },
  {
    id: "arch",
    name: "Cloud architect",
    subtitle: "IBM · OpenStack era",
    Component: CloudArchitect,
  },
] as const;

export default function Games() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("trivia");
  const Active = TABS.find((t) => t.id === active)!.Component;
  return (
    <section id="games" className="border-t border-border py-20">
      <div className="container-wide">
        <p className="text-meta uppercase tracking-[0.18em]">Play with my work</p>
        <h2 className="heading-section mt-2 max-w-2xl">
          Three small toys. Each one is a chapter of the CV in playable form.
        </h2>
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
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
          <Active />
        </div>
      </div>
    </section>
  );
}
