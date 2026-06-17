import { useState } from "react";

type TileKey = "lb" | "cdn" | "compute" | "cache" | "db" | "queue" | "storage";
type CellValue = TileKey | "empty";

const TILES: Record<TileKey, { label: string; latency: number; cost: number }> = {
  lb: { label: "Load Balancer", latency: 2, cost: 1 },
  cdn: { label: "CDN", latency: 1, cost: 2 },
  compute: { label: "Compute", latency: 30, cost: 4 },
  cache: { label: "Cache", latency: 1, cost: 2 },
  db: { label: "Database", latency: 18, cost: 5 },
  queue: { label: "Queue", latency: 8, cost: 1 },
  storage: { label: "Storage", latency: 22, cost: 1 },
};

const ROWS = 3;
const COLS = 4;

function emptyGrid(): CellValue[][] {
  return Array.from({ length: ROWS }, () => Array<CellValue>(COLS).fill("empty"));
}

export default function CloudArchitect() {
  const [grid, setGrid] = useState<CellValue[][]>(emptyGrid);
  const [picked, setPicked] = useState<TileKey | null>(null);
  const [trace, setTrace] = useState<{ path: string[]; latency: number; cost: number } | null>(
    null,
  );

  function place(r: number, c: number) {
    if (!picked) return;
    const next = grid.map((row) => [...row]);
    next[r][c] = picked;
    setGrid(next);
  }
  function clearCell(r: number, c: number) {
    const next = grid.map((row) => [...row]);
    next[r][c] = "empty";
    setGrid(next);
  }
  function run() {
    const flat = grid.flat();
    const has = (k: TileKey) => flat.includes(k);
    const path: string[] = [];
    let latency = 0;
    let cost = 0;
    const add = (k: TileKey) => {
      path.push(TILES[k].label);
      latency += TILES[k].latency;
      cost += TILES[k].cost;
    };

    if (has("cdn")) add("cdn");
    if (has("lb")) add("lb");
    if (!has("compute")) {
      setTrace({ path: ["No compute reachable"], latency: 9999, cost: 0 });
      return;
    }
    add("compute");
    if (has("cache")) {
      add("cache");
      latency -= TILES.db.latency * 0.7;
    }
    if (has("db")) add("db");
    if (has("storage")) add("storage");
    if (has("queue")) add("queue");

    setTrace({ path, latency: Math.max(1, Math.round(latency)), cost });
  }

  return (
    <div>
      <p className="text-sm text-muted">
        Drop tiles, then run a workload. The trace runs through your stack and totals latency
        and cost. Echo of OpenStack-era cloud architecture work at IBM.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface p-3">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {grid.flat().map((cell, i) => {
              const r = Math.floor(i / COLS);
              const c = i % COLS;
              return (
                <button
                  key={i}
                  onClick={() => (cell === "empty" ? place(r, c) : clearCell(r, c))}
                  className="aspect-square rounded-lg border-2 border-dashed border-border bg-bg p-2 text-xs transition hover:border-ink"
                  style={{
                    borderStyle: cell === "empty" ? "dashed" : "solid",
                    background: cell === "empty" ? "transparent" : "hsl(var(--bg))",
                  }}
                >
                  {cell === "empty" ? (
                    <span className="text-muted">+</span>
                  ) : (
                    <div>
                      <p className="font-semibold">{TILES[cell].label}</p>
                      <p className="font-mono text-[10px] text-muted">
                        {TILES[cell].latency}ms
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-meta uppercase tracking-[0.18em]">Palette</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(TILES) as TileKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setPicked(k)}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                  picked === k ? "border-ink bg-ink/5" : "border-border hover:border-ink"
                }`}
              >
                {TILES[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={run} className="btn-primary">
          Run workload
        </button>
        <button
          onClick={() => {
            setGrid(emptyGrid());
            setTrace(null);
          }}
          className="btn-ghost"
        >
          Clear
        </button>
      </div>
      {trace && (
        <div className="mt-4 rounded-xl border border-border bg-bg p-4 text-sm">
          <p className="font-mono text-xs text-muted">Request path:</p>
          <p className="mt-1">{trace.path.join(" → ")}</p>
          <p className="mt-3">
            Latency <span className="font-mono text-ink">{trace.latency}ms</span> · Cost{" "}
            <span className="font-mono text-ink">{trace.cost}</span>
          </p>
        </div>
      )}
    </div>
  );
}
