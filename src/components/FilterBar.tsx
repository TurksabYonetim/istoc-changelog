import { Link as LinkIcon, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
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

const DATE_PRESETS: { key: string; label: string; days: number | null }[] = [
  { key: "week", label: "Bu hafta", days: 7 },
  { key: "month", label: "Bu ay", days: 30 },
  { key: "quarter", label: "Son 3 ay", days: 90 },
  { key: "all", label: "Tümü", days: null },
];

export function FilterBar({ filters, setFilters, reset, entries, resultCount }: Props) {
  const [openMobile, setOpenMobile] = useState(false);
  const counts = useMemo(() => countByDimension(entries), [entries]);

  const toggleSet = <T,>(set: Set<T>, val: T): Set<T> => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  };

  const [activePresetKey, setActivePresetKey] = useState<string | null>(() =>
    !filters.dateFrom && !filters.dateTo ? "all" : null,
  );

  const applyPreset = (key: string, days: number | null) => {
    setActivePresetKey(key);
    if (days === null) {
      setFilters({ ...filters, dateFrom: null, dateTo: null });
      return;
    }
    setFilters({
      ...filters,
      dateFrom: computePastDate(days),
      dateTo: null,
    });
  };

  const handleReset = () => {
    setActivePresetKey("all");
    reset();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  const activeFilterCount =
    (filters.sources.size < SOURCES.length ? 1 : 0) +
    (filters.types.size < TYPES.length ? 1 : 0) +
    (filters.environments.size < ENVS.length ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0) +
    (filters.query ? 1 : 0);

  const content = (
    <div className="flex flex-col gap-3">
      {/* Search + count + actions — single horizontal row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="ara: KYB, sepet, v1.1.7…"
            className="input-base !py-2 !pl-9 !pr-9 !text-[13px]"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, query: "" })}
              aria-label="Aramayı temizle"
              className="icon-btn absolute right-1 top-1/2 -translate-y-1/2 !p-1.5"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[12.5px] text-ink-2 tabular-nums whitespace-nowrap"
            aria-live="polite"
          >
            <span className="font-semibold text-ink">{resultCount}</span>{" "}
            <span className="text-muted">kayıt</span>
            {activeFilterCount > 0 && (
              <span className="ml-1.5 text-muted">· {activeFilterCount} filtre</span>
            )}
          </span>
          <button
            type="button"
            onClick={copyLink}
            className="icon-btn"
            title="Bağlantıyı kopyala"
            aria-label="Bağlantıyı kopyala"
          >
            <LinkIcon size={14} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
            className="icon-btn disabled:cursor-not-allowed disabled:opacity-40"
            title="Filtreleri sıfırla"
            aria-label="Filtreleri sıfırla"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Compact filter rows */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <DimensionRow
          label="Modül"
          values={SOURCES}
          selected={filters.sources}
          counts={counts.sources}
          allCount={SOURCES.length}
          labelFn={(s) => SOURCE_LABELS[s]}
          onToggle={(s) => setFilters({ ...filters, sources: toggleSet(filters.sources, s) })}
        />
        <DimensionRow
          label="Tip"
          values={TYPES}
          selected={filters.types}
          counts={counts.types}
          allCount={TYPES.length}
          labelFn={(t) => TYPE_LABELS[t]}
          onToggle={(t) => setFilters({ ...filters, types: toggleSet(filters.types, t) })}
        />
        <DimensionRow
          label="Ortam"
          values={ENVS}
          selected={filters.environments}
          counts={counts.envs}
          allCount={ENVS.length}
          labelFn={(e) => ENV_LABELS[e]}
          onToggle={(e) =>
            setFilters({ ...filters, environments: toggleSet(filters.environments, e) })
          }
        />

        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mini-label">Tarih</span>
          <div className="flex flex-wrap gap-1">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key, p.days)}
                className={
                  activePresetKey === p.key
                    ? "mini-chip mini-chip-active"
                    : "mini-chip mini-chip-neutral"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile collapsed bar */}
      <div className="sticky top-[57px] z-20 border-b border-border bg-canvas/85 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setOpenMobile((o) => !o)}
            className="btn-ghost flex-1 justify-center !py-2 !text-[12.5px]"
            aria-expanded={openMobile}
          >
            <SlidersHorizontal size={13} />
            <span>Filtreler</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-[#1a1a1a]">
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="rounded-md bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] font-medium text-ink tabular-nums">
            {resultCount}
          </span>
        </div>
        {openMobile && (
          <div className="border-t border-border bg-surface px-4 py-3">{content}</div>
        )}
      </div>

      {/* Desktop sticky bar */}
      <aside className="sticky top-[73px] z-20 hidden border-b border-border bg-canvas/85 backdrop-blur-md sm:block">
        <div className="mx-auto max-w-6xl px-6 py-3">{content}</div>
      </aside>
    </>
  );
}

interface DimRowProps<T extends string> {
  label: string;
  values: readonly T[];
  selected: Set<T>;
  counts: Record<string, number>;
  allCount: number;
  labelFn: (v: T) => string;
  onToggle: (v: T) => void;
}

function DimensionRow<T extends string>({
  label,
  values,
  selected,
  counts,
  allCount,
  labelFn,
  onToggle,
}: DimRowProps<T>) {
  const isFiltered = selected.size > 0 && selected.size < allCount;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mini-label">{label}</span>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => {
          const included = selected.has(v);
          const cls = !isFiltered
            ? "mini-chip mini-chip-neutral"
            : included
              ? "mini-chip mini-chip-active"
              : "mini-chip mini-chip-muted";
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              aria-pressed={included}
              className={cls}
            >
              <span>{labelFn(v)}</span>
              <span className="opacity-60 tabular-nums text-[10.5px]">{counts[v] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function computePastDate(daysAgo: number): string {
  const ms = Date.now() - daysAgo * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
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
