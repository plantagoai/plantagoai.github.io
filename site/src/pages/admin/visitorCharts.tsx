// Small SVG/CSS charts for Admin → Visitors, ported from limorgilat.com's
// src/admin/analytics/charts.tsx and re-skinned onto this site's tokens
// (CTA blue instead of the brand wine). No chart library: the shapes are
// simple and this keeps hover readouts identical to the original.
import { useState, type ReactNode } from "react";

/** Series colours: CTA blue first, then hues that stay apart. */
export const SERIES_COLORS = ["#0071e3", "#7fb8f5", "#34a853", "#e8a33d", "#8e6fb3", "#e07a5f"];
const BLUE_RGB = "0, 113, 227";

export type Series = { key: string; label: string; values: number[]; color: string };

type TimeBarsProps = {
  buckets: Date[];
  series: Series[];
  /** Drawn as a line over the bars (e.g. visitors over page views). */
  line?: Series;
  formatBucket: (d: Date) => string;
  formatValue?: (n: number) => string;
  height?: number;
};

function niceMax(n: number): number {
  if (n <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= n) ?? 10;
  return step * pow;
}

/** Stacked bars over time, with an optional line and a hover readout. */
export function TimeBars({ buckets, series, line, formatBucket, formatValue = String, height = 180 }: TimeBarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const padL = 44;
  const padB = 20;
  const n = Math.max(buckets.length, 1);
  const totals = buckets.map((_, i) => series.reduce((s, x) => s + (x.values[i] || 0), 0));
  const max = niceMax(Math.max(...totals, ...(line ? line.values : [0]), 0));
  const slot = (W - padL) / n;
  const barW = Math.max(1, slot * 0.72);
  const y = (v: number) => (H - padB) - (v / max) * (H - padB - 8);
  const ticks = [0, max / 2, max];
  const labelEvery = Math.ceil(n / 8);

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        className="w-full h-auto block"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={buckets.map((b, i) => `${formatBucket(b)}: ${formatValue(totals[i])}`).join("; ")}
      >
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={padL} x2={W} y1={y(tk)} y2={y(tk)} className="stroke-border" strokeWidth={1} />
            <text x={padL - 6} y={y(tk) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">{formatValue(tk)}</text>
          </g>
        ))}
        {buckets.map((b, i) => {
          let acc = 0;
          const x = padL + i * slot + (slot - barW) / 2;
          return (
            <g key={b.getTime()} onMouseEnter={() => setHover(i)}>
              <rect x={padL + i * slot} y={0} width={slot} height={H - padB} fill="transparent" />
              {series.map((s) => {
                const v = s.values[i] || 0;
                if (!v) return null;
                const top = y(acc + v);
                const h = y(acc) - top;
                acc += v;
                return <rect key={s.key} x={x} y={top} width={barW} height={Math.max(h, 0.5)} fill={s.color} rx={1.5} opacity={hover === null || hover === i ? 1 : 0.55} />;
              })}
              {i % labelEvery === 0 && (
                <text x={padL + i * slot + slot / 2} y={H - 5} textAnchor="middle" className="fill-muted-foreground text-[10px]">{formatBucket(b)}</text>
              )}
            </g>
          );
        })}
        {line && (
          <polyline
            fill="none"
            stroke={line.color}
            strokeWidth={2}
            pointerEvents="none"
            points={line.values.map((v, i) => `${padL + i * slot + slot / 2},${y(v)}`).join(" ")}
          />
        )}
      </svg>
      {hover !== null && buckets[hover] && (
        <div
          className="absolute top-0 -translate-x-1/2 bg-card border border-border rounded-md shadow-elevation-2 px-2.5 py-1.5 text-xs flex flex-col gap-0.5 pointer-events-none whitespace-nowrap z-10"
          style={{ left: `${((padL + hover * slot + slot / 2) / W) * 100}%` }}
        >
          <strong className="font-semibold">{formatBucket(buckets[hover])}</strong>
          {line && <span><Swatch color={line.color} />{line.label}: {formatValue(line.values[hover] || 0)}</span>}
          {series.filter((s) => s.values[hover]).map((s) => (
            <span key={s.key}><Swatch color={s.color} />{s.label}: {formatValue(s.values[hover])}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Swatch({ color, line }: { color: string; line?: boolean }) {
  return (
    <i
      className={`inline-block mr-1.5 rounded-sm ${line ? "w-3.5 h-[3px] align-[3px]" : "w-2.5 h-2.5 align-[-1px]"}`}
      style={{ background: color }}
    />
  );
}

export function Legend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map((it) => (
        <li key={it.label}><Swatch color={it.color} line={it.line} />{it.label}</li>
      ))}
    </ul>
  );
}

/** Ranked horizontal bars (countries, sources, sections…). */
export function RankList({ rows, format = String, empty }: { rows: { key: string; label: ReactNode; value: number }[]; format?: (n: number) => string; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5">
          <span className="truncate">{r.label}</span>
          <span className="text-right text-muted-foreground tabular-nums">{format(r.value)}</span>
          <span className="col-span-2 h-1.5 rounded-full bg-primary/60" style={{ width: `${(r.value / max) * 100}%` }} />
        </li>
      ))}
    </ul>
  );
}

/** Step-by-step drop-off, each bar sized against the first step. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0]?.value || 0;
  return (
    <ol className="flex flex-col gap-2.5 text-sm">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : 0;
        return (
          <li key={s.label} className="grid grid-cols-[110px_minmax(0,1fr)_56px] gap-2 items-center">
            <span className="text-foreground/80">{s.label}</span>
            <span className="h-3.5 bg-muted rounded overflow-hidden">
              <span className="block h-full bg-primary rounded" style={{ width: `${first ? (s.value / first) * 100 : 0}%` }} />
            </span>
            <span className="text-right tabular-nums">
              {s.value}
              {i > 0 && <small className="block text-[11px] text-muted-foreground">{prev ? `${Math.round((s.value / prev) * 100)}%` : "–"}</small>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Weekday × hour grid, darker where there's more activity. */
export function Heatmap({ grid, dayLabels, title }: { grid: number[][]; dayLabels: string[]; title: (day: number, hour: number, value: number) => string }) {
  const max = Math.max(...grid.flat(), 1);
  return (
    <div className="grid gap-0.5 text-[10px] text-muted-foreground" style={{ gridTemplateColumns: "34px repeat(24, minmax(0, 1fr))" }}>
      <span />
      {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center">{h % 3 === 0 ? h : ""}</span>)}
      {grid.map((row, d) => (
        <div key={d} className="contents">
          <span className="self-center">{dayLabels[d]}</span>
          {row.map((v, h) => (
            <span
              key={h}
              className="aspect-square bg-muted rounded-sm"
              title={title(d, h, v)}
              style={{ background: v ? `rgba(${BLUE_RGB}, ${0.12 + 0.88 * (v / max)})` : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
