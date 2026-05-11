import { Search, X, Link as LinkIcon } from "lucide-react";
import { useMemo } from "react";
import type { FilterState } from "../lib/filters";
import type {
  ChangelogEntry,
  ChangeType,
  Environment,
  Source,
} from "../types/changelog";
import { ENV_LABELS, SOURCE_LABELS, TYPE_LABELS } from "../types/changelog";

interface Props {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  reset: () => void;
  entries: ChangelogEntry[];
  resultCount: number;
}

const SOURCES: Source[] = ["backend", "frontend", "admin"];
const TYPES: ChangeType[] = ["added", "fixed", "changed"];
const ENVS: Environment[] = ["PROD", "RC", "BETA"];

export function FilterBar({ filters, setFilters, reset, entries, resultCount }: Props) {
  const counts = useMemo(() => countByDimension(entries), [entries]);

  const toggle = <T,>(set: Set<T>, val: T): Set<T> => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur sticky top-[73px] z-10">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              placeholder="ara: KYB, sepet, v1.1.7..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Bağlantıyı kopyala"
            className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
          >
            <LinkIcon size={16} />
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 inline-flex items-center gap-1"
          >
            <X size={14} /> Sıfırla
          </button>
        </div>

        <ChipRow
          label="Modül"
          values={SOURCES}
          selected={filters.sources}
          counts={counts.sources}
          labelFn={(s) => SOURCE_LABELS[s]}
          onToggle={(s) => setFilters({ ...filters, sources: toggle(filters.sources, s) })}
        />
        <ChipRow
          label="Tip"
          values={TYPES}
          selected={filters.types}
          counts={counts.types}
          labelFn={(t) => TYPE_LABELS[t]}
          onToggle={(t) => setFilters({ ...filters, types: toggle(filters.types, t) })}
        />
        <ChipRow
          label="Ortam"
          values={ENVS}
          selected={filters.environments}
          counts={counts.envs}
          labelFn={(e) => ENV_LABELS[e]}
          onToggle={(e) => setFilters({ ...filters, environments: toggle(filters.environments, e) })}
        />

        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <label className="flex items-center gap-1">
            Tarih:
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
              className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
            <span>→</span>
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
              className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </label>
          <span className="ml-auto" aria-live="polite">
            {resultCount} sonuç
          </span>
        </div>
      </div>
    </div>
  );
}

interface ChipRowProps<T extends string> {
  label: string;
  values: readonly T[];
  selected: Set<T>;
  counts: Record<string, number>;
  labelFn: (v: T) => string;
  onToggle: (v: T) => void;
}

function ChipRow<T extends string>({ label, values, selected, counts, labelFn, onToggle }: ChipRowProps<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-14">{label}:</span>
      {values.map((v) => {
        const active = selected.has(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            className={
              "px-3 py-1 text-xs rounded-full border transition " +
              (active
                ? "bg-brand-500 border-brand-500 text-white"
                : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-brand-500")
            }
          >
            {labelFn(v)} <span className="opacity-70">({counts[v] ?? 0})</span>
          </button>
        );
      })}
    </div>
  );
}

function countByDimension(entries: ChangelogEntry[]) {
  const sources: Record<string, number> = {};
  const types: Record<string, number> = {};
  const envs: Record<string, number> = {};
  for (const e of entries) {
    sources[e.source] = (sources[e.source] ?? 0) + 1;
    envs[e.environment] = (envs[e.environment] ?? 0) + 1;
    for (const i of e.items) types[i.type] = (types[i.type] ?? 0) + 1;
  }
  return { sources, types, envs };
}
