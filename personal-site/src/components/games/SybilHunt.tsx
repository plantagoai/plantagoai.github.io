import { useMemo, useState } from "react";

type Node = { id: number; x: number; y: number; sybil: boolean };
type Edge = { a: number; b: number };
type Graph = { nodes: Node[]; edges: Edge[]; sybilIds: Set<number> };

function seededRng(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(seed: number): Graph {
  const rng = seededRng(seed);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const sybilIds = new Set<number>();
  const honestCount = 18 + Math.floor(rng() * 10);

  for (let i = 0; i < honestCount; i++) {
    nodes.push({ id: nodes.length, x: 40 + rng() * 280, y: 30 + rng() * 230, sybil: false });
  }
  for (let i = 0; i < honestCount; i++) {
    if (rng() > 0.55) {
      const j = Math.floor(rng() * honestCount);
      if (i !== j) edges.push({ a: i, b: j });
    }
  }

  const ringCount = 1 + Math.floor(rng() * 3);
  const placedRings: { x: number; y: number }[] = [];

  for (let r = 0; r < ringCount; r++) {
    const ringSize = 3 + Math.floor(rng() * 5);
    let cx = 0;
    let cy = 0;
    for (
      let attempt = 0;
      attempt < 10 &&
      ((cx = 60 + rng() * 240),
      (cy = 50 + rng() * 200),
      placedRings.some((p) => Math.hypot(p.x - cx, p.y - cy) < 90));
      attempt++
    );
    placedRings.push({ x: cx, y: cy });

    const radius = 14 + rng() * 12;
    const startId = nodes.length;
    const ringNodeIds: number[] = [];
    for (let k = 0; k < ringSize; k++) {
      const angle = (k / ringSize) * Math.PI * 2 + rng() * 0.4;
      nodes.push({
        id: nodes.length,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        sybil: true,
      });
      ringNodeIds.push(startId + k);
      sybilIds.add(startId + k);
    }
    for (let i = 0; i < ringNodeIds.length; i++)
      for (let j = i + 1; j < ringNodeIds.length; j++)
        edges.push({ a: ringNodeIds[i], b: ringNodeIds[j] });

    if (rng() > 0.5) {
      const bridges = 1 + Math.floor(rng() * 2);
      for (let b = 0; b < bridges; b++) {
        const honestNode = Math.floor(rng() * honestCount);
        const sybilNode = ringNodeIds[Math.floor(rng() * ringNodeIds.length)];
        edges.push({ a: honestNode, b: sybilNode });
      }
    }
  }

  return { nodes, edges, sybilIds };
}

export default function SybilHunt() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e5));
  const graph = useMemo(() => generate(seed), [seed]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);

  function toggle(id: number) {
    if (revealed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function newGraph() {
    setSeed(Math.floor(Math.random() * 1e5));
    setSelected(new Set());
    setRevealed(false);
  }

  const caught = [...selected].filter((id) => graph.sybilIds.has(id)).length;
  const falsePositives = [...selected].filter((id) => !graph.sybilIds.has(id)).length;
  const missed = graph.sybilIds.size - caught;

  return (
    <div>
      <div className="rounded-xl border border-border bg-bg/60 p-4 text-sm text-ink/85">
        <p className="font-semibold text-ink">What's a sybil attack?</p>
        <p className="mt-1.5 leading-relaxed">
          A single bad actor creates many fake identities to overwhelm a network's voting,
          reputation, or trust mechanism. The signal: clusters of accounts that connect{" "}
          <em>densely to each other</em> but barely to the rest of the network. Real users form
          sparser, more varied graphs.
        </p>
        <p className="mt-2 leading-relaxed">
          <strong>Foundation</strong> resists sybils with on-chain identity attestations plus
          off-chain verification — making each verified human expensive to fake. Click the
          rings you suspect, then reveal.
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-ink/85">
        <span>
          Selected: <span className="font-mono text-ink">{selected.size}</span>
        </span>
        <span>·</span>
        <span>
          Sybils in graph: <span className="font-mono text-ink">{graph.sybilIds.size}</span>{" "}
          across{" "}
          <span className="font-mono text-ink">
            {Math.max(
              1,
              [...graph.sybilIds].length > 0
                ? new Set([...graph.sybilIds].map((id) => Math.floor(id / 100))).size
                : 0,
            ) || "?"}
          </span>{" "}
          rings
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <svg viewBox="0 0 360 280" className="h-[300px] w-full">
          {graph.edges.map((e, i) => {
            const a = graph.nodes[e.a];
            const b = graph.nodes[e.b];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="hsl(var(--border))"
                strokeWidth={0.6}
              />
            );
          })}
          {graph.nodes.map((n) => {
            const isSelected = selected.has(n.id);
            let fill = "hsl(var(--muted))";
            if (revealed) {
              fill = n.sybil ? "hsl(var(--pillar-voice))" : "hsl(var(--pillar-share))";
            } else if (isSelected) {
              fill = "hsl(var(--ink))";
            }
            return (
              <g
                key={n.id}
                onClick={() => toggle(n.id)}
                style={{ cursor: revealed ? "default" : "pointer" }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={isSelected || revealed ? 7 : 5}
                  fill={fill}
                  stroke="hsl(var(--bg))"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {revealed ? (
          <button onClick={newGraph} className="btn-primary">
            New graph
          </button>
        ) : (
          <button onClick={() => setRevealed(true)} className="btn-primary">
            Reveal sybils
          </button>
        )}
        <button
          onClick={() => {
            setSelected(new Set());
            setRevealed(false);
          }}
          className="btn-ghost"
        >
          Reset selection
        </button>
        {!revealed && (
          <button onClick={newGraph} className="btn-ghost">
            Different topology
          </button>
        )}
      </div>
      {revealed && (
        <div className="mt-4 rounded-xl border border-border bg-bg p-4 text-sm">
          <p>
            <span className="font-semibold">
              Caught: {caught} / {graph.sybilIds.size} sybils
            </span>
            {falsePositives > 0 && (
              <>
                {" · "}
                <span className="text-red-500">
                  {falsePositives} false positive{falsePositives > 1 ? "s" : ""}
                </span>
              </>
            )}
            {missed > 0 && <> · {missed} missed</>}
          </p>
          <p className="mt-2 text-ink/80">
            Notice how sybil rings over-connect to each other (the dense little clusters) but
            plant just a couple of bridges into the honest graph to look legitimate. Production
            sybil detection uses similar structural signals — combined with identity
            attestations off-chain.
          </p>
        </div>
      )}
    </div>
  );
}
