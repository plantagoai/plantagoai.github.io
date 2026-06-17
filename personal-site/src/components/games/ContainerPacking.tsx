import { useEffect, useMemo, useState } from "react";

const COLS = 12;
const ROWS = 6;

type Container = { id: number; w: number; h: number; placed?: { col: number; row: number } };
type Grid = number[][];

function makeContainers(seed = 1): Container[] {
  let t = seed * 9301 + 49297;
  const rng = () => {
    t = (t * 9301 + 49297) % 233280;
    return t / 233280;
  };
  const dims: [number, number][] = [
    [4, 3],
    [3, 3],
    [2, 4],
    [3, 2],
    [2, 2],
    [4, 2],
    [2, 3],
    [3, 1],
    [2, 1],
    [1, 2],
    [5, 2],
    [3, 4],
  ];
  return dims.map(([a, b], i) => ({
    id: i,
    w: rng() > 0.5 ? a : b,
    h: rng() > 0.5 ? b : a,
  }));
}

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
}

function fits(g: Grid, col: number, row: number, w: number, h: number) {
  if (col + w > COLS || row + h > ROWS) return false;
  for (let r = row; r < row + h; r++)
    for (let c = col; c < col + w; c++) if (g[r][c] !== -1) return false;
  return true;
}

function place(g: Grid, col: number, row: number, w: number, h: number, id: number) {
  for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) g[r][c] = id;
}

function solverScore(containers: Container[]) {
  const sorted = [...containers].sort((a, b) => b.w * b.h - a.w * a.h);
  const g = emptyGrid();
  let placedArea = 0;
  for (const c of sorted) {
    let done = false;
    for (let r = 0; r < ROWS && !done; r++)
      for (let cc = 0; cc < COLS && !done; cc++)
        if (fits(g, cc, r, c.w, c.h)) {
          place(g, cc, r, c.w, c.h, c.id);
          placedArea += c.w * c.h;
          done = true;
        }
  }
  return { grid: g, placed: placedArea };
}

export default function ContainerPacking() {
  const [seed, setSeed] = useState(1);
  const initial = useMemo(() => makeContainers(seed), [seed]);
  const [containers, setContainers] = useState(initial);
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [picked, setPicked] = useState<number | null>(null);
  const [solver, setSolver] = useState<{ pct: number } | null>(null);

  useEffect(() => {
    setContainers(initial);
    setGrid(emptyGrid());
    setPicked(null);
    setSolver(null);
  }, [initial]);

  const placed = grid.flat().filter((v) => v !== -1).length;
  const total = COLS * ROWS;
  const fill = Math.round((placed / total) * 100);
  const remaining = containers.filter((c) => !c.placed);

  function tryPlace(col: number, row: number) {
    if (picked === null) return;
    const c = containers[picked];
    if (c.placed || !fits(grid, col, row, c.w, c.h)) return;
    const next = grid.map((r) => [...r]);
    place(next, col, row, c.w, c.h, c.id);
    setGrid(next);
    setContainers(
      containers.map((x) => (x.id === c.id ? { ...x, placed: { col, row } } : x)),
    );
    setPicked(null);
  }

  function runSolver() {
    const r = solverScore(initial);
    setSolver({ pct: Math.round((r.placed / total) * 100) });
  }
  function reset() {
    setContainers(initial);
    setGrid(emptyGrid());
    setPicked(null);
    setSolver(null);
  }

  return (
    <div>
      <p className="text-sm text-muted">
        Pack the ship's hold. Click a container, click a cell, and it lands top-left there if
        it fits. Inspired by container logistics work I shipped to Maersk and Hapag-Lloyd at
        IBM.
      </p>
      <div className="mt-4 flex items-baseline gap-3 text-sm">
        <span>
          Fill: <span className="font-mono text-ink">{fill}%</span>
        </span>
        {solver && (
          <span className="text-muted">
            · Solver: <span className="font-mono">{solver.pct}%</span>
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface p-2">
          <div
            className="grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              aspectRatio: `${COLS}/${ROWS}`,
            }}
          >
            {grid.flat().map((id, i) => {
              const r = Math.floor(i / COLS);
              const c = i % COLS;
              return (
                <button
                  key={i}
                  onClick={() => tryPlace(c, r)}
                  className="rounded-sm transition"
                  style={{
                    background:
                      id === -1 ? "hsl(var(--bg))" : `hsl(${(id * 47) % 360} 70% 60% / 0.85)`,
                    cursor: picked !== null && id === -1 ? "pointer" : "default",
                  }}
                />
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-meta uppercase tracking-[0.18em]">Containers</p>
          <div className="mt-2 grid grid-cols-3 gap-2 lg:grid-cols-2">
            {remaining.map((c) => (
              <button
                key={c.id}
                onClick={() => setPicked(c.id)}
                className={`flex h-12 items-center justify-center rounded-md border text-xs font-mono transition ${
                  picked === c.id
                    ? "border-ink bg-ink/5"
                    : "border-border hover:border-ink"
                }`}
              >
                {c.w}×{c.h}
              </button>
            ))}
            {remaining.length === 0 && (
              <p className="col-span-3 text-xs text-muted">All placed.</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={runSolver} className="btn-ghost">
          Show solver score
        </button>
        <button onClick={reset} className="btn-ghost">
          Reset
        </button>
        <button onClick={() => setSeed((s) => s + 1)} className="btn-primary">
          New shipment
        </button>
      </div>
    </div>
  );
}
