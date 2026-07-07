import { Check, Link as LinkIcon, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { applyFilters, type FilterState } from "../lib/filters";
import type {
  Author,
  ChangelogEntry,
  ChangeType,
  Environment,
  Source,
} from "../types/changelog";
import {
  AUTHORS,
  ENV_LABELS,
  SOURCE_LABELS,
  TYPE_LABELS,
  authorIdFromHandle,
  extractAuthorHandle,
} from "../types/changelog";

interface CommonProps {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  reset: () => void;
  entries: ChangelogEntry[];
  resultCount: number;
}

const SOURCES: Source[] = ["backend", "frontend", "admin"];
const TYPES: ChangeType[] = ["added", "fixed", "changed"];
const ENVS: Environment[] = ["PROD", "RC", "BETA", "ALPHA"];
const AUTHOR_IDS: Author[] = AUTHORS.map((a) => a.id);
const AUTHOR_LABEL: Record<Author, string> = Object.fromEntries(
  AUTHORS.map((a) => [a.id, a.label]),
) as Record<Author, string>;

const DATE_PRESETS: { key: string; label: string; days: number | null }[] = [
  { key: "week", label: "Bu hafta", days: 7 },
  { key: "month", label: "Bu ay", days: 30 },
  { key: "quarter", label: "Son 3 ay", days: 90 },
  { key: "all", label: "Tümü", days: null },
];

/** Shared content panel — used both in mobile drawer and desktop sidebar */
function FilterPanel({ filters, setFilters, reset, entries, resultCount }: CommonProps) {
  const counts = useMemo(() => countByDimension(entries, filters), [entries, filters]);

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
    setFilters({ ...filters, dateFrom: computePastDate(days), dateTo: null });
  };

  const handleReset = () => {
    setActivePresetKey("all");
    reset();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  const activeFilterCount =
    (filters.sources.size > 0 ? 1 : 0) +
    (filters.types.size > 0 ? 1 : 0) +
    (filters.environments.size > 0 ? 1 : 0) +
    (filters.authors.size > 0 ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0) +
    (filters.query ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <DimensionGroup
        label="Modül"
        values={SOURCES}
        selected={filters.sources}
        counts={counts.sources}
        labelFn={(s) => SOURCE_LABELS[s]}
        onToggle={(s) => setFilters({ ...filters, sources: toggleSet(filters.sources, s) })}
      />
      <DimensionGroup
        label="Tip"
        values={TYPES}
        selected={filters.types}
        counts={counts.types}
        labelFn={(t) => TYPE_LABELS[t]}
        onToggle={(t) => setFilters({ ...filters, types: toggleSet(filters.types, t) })}
      />
      <DimensionGroup
        label="Ortam"
        values={ENVS}
        selected={filters.environments}
        counts={counts.envs}
        labelFn={(e) => ENV_LABELS[e]}
        onToggle={(e) =>
          setFilters({ ...filters, environments: toggleSet(filters.environments, e) })
        }
      />
      <DimensionGroup
        label="Geliştirici"
        values={AUTHOR_IDS}
        selected={filters.authors}
        counts={counts.authors}
        labelFn={(a) => AUTHOR_LABEL[a]}
        onToggle={(a) => setFilters({ ...filters, authors: toggleSet(filters.authors, a) })}
      />

      <div className="flex flex-col gap-2">
        <span className="mini-label">Tarih</span>
        <div className="grid grid-cols-2 gap-1.5">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key, p.days)}
              className={
                activePresetKey === p.key ? "preset-btn preset-btn-active" : "preset-btn"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-baseline justify-between text-[12.5px]">
          <span aria-live="polite">
            <span className="font-semibold text-ink tabular-nums">{resultCount}</span>{" "}
            <span className="text-muted">kayıt</span>
          </span>
          {activeFilterCount > 0 && (
            <span className="text-[11px] text-muted">{activeFilterCount} filtre aktif</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={copyLink} className="btn-ghost !justify-center !py-2">
            <LinkIcon size={13} />
            <span>Paylaş</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
            className="btn-ghost !justify-center !py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={13} />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mobile/tablet trigger bar (sticky, lg:hidden) — wraps FilterPanel in a collapsible drawer */
export function FilterMobileBar(props: CommonProps) {
  const [open, setOpen] = useState(false);
  const activeFilterCount =
    (props.filters.sources.size > 0 ? 1 : 0) +
    (props.filters.types.size > 0 ? 1 : 0) +
    (props.filters.environments.size > 0 ? 1 : 0) +
    (props.filters.authors.size > 0 ? 1 : 0) +
    (props.filters.dateFrom || props.filters.dateTo ? 1 : 0) +
    (props.filters.query ? 1 : 0);

  return (
    <div className="sticky top-[57px] z-20 border-b border-border bg-canvas/85 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-ghost flex-1 justify-center !py-2 !text-[12.5px]"
          aria-expanded={open}
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
          {props.resultCount}
        </span>
      </div>
      {open && (
        <div className="max-h-[70vh] overflow-y-auto border-t border-border bg-surface px-4 py-4">
          <FilterPanel {...props} />
        </div>
      )}
    </div>
  );
}

/** Desktop sidebar (hidden on mobile/tablet, sticky, scrolls independently) */
export function FilterSidebar(props: CommonProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[88px] max-h-[calc(100dvh-104px)] overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)]">
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}

interface DimGroupProps<T extends string> {
  label: string;
  values: readonly T[];
  selected: Set<T>;
  counts: Record<string, number>;
  labelFn: (v: T) => string;
  onToggle: (v: T) => void;
}

function DimensionGroup<T extends string>({
  label,
  values,
  selected,
  counts,
  labelFn,
  onToggle,
}: DimGroupProps<T>) {
  const isFiltered = selected.size > 0;
  const allSelected = selected.size === 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="mini-label">{label}</span>
        {isFiltered ? (
          <span className="text-[10px] font-medium text-brand-700">
            {selected.size} seçili
          </span>
        ) : (
          <span className="text-[10px] text-muted">tümü</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {values.map((v) => {
          const explicitlyOn = selected.has(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              aria-pressed={explicitlyOn}
              className={
                explicitlyOn
                  ? "filter-row filter-row-on"
                  : allSelected
                    ? "filter-row filter-row-all"
                    : "filter-row filter-row-off"
              }
            >
              <span
                className={
                  explicitlyOn
                    ? "checkbox checkbox-on"
                    : allSelected
                      ? "checkbox checkbox-dim"
                      : "checkbox"
                }
              >
                {explicitlyOn && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="filter-row-label">{labelFn(v)}</span>
              <span className="filter-row-count tabular-nums">{counts[v] ?? 0}</span>
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

/**
 * Faceted sayım: her boyutun değerleri, o boyutun KENDİ filtresi hariç diğer tüm
 * aktif filtreler uygulanmış halde sayılır. Böylece bir boyutta seçim yapmak o
 * boyuttaki diğer seçeneklerin sayısını yok etmez, ama diğer boyutlardaki
 * seçimler bu sayıları daraltır. Sayım birimi `resultCount` ile aynı: kayıt
 * (item) adedi — yani "bunu seçersem kaç kayıt kalır".
 */
function countByDimension(entries: ChangelogEntry[], filters: FilterState) {
  const sourceBase = applyFilters(entries, { ...filters, sources: new Set() });
  const typeBase = applyFilters(entries, { ...filters, types: new Set() });
  const envBase = applyFilters(entries, { ...filters, environments: new Set() });
  const authorBase = applyFilters(entries, { ...filters, authors: new Set() });

  const sources: Record<string, number> = {};
  for (const e of sourceBase) sources[e.source] = (sources[e.source] ?? 0) + e.items.length;

  const envs: Record<string, number> = {};
  for (const e of envBase) envs[e.environment] = (envs[e.environment] ?? 0) + e.items.length;

  const types: Record<string, number> = {};
  for (const e of typeBase) {
    for (const i of e.items) types[i.type] = (types[i.type] ?? 0) + 1;
  }

  const authors: Record<string, number> = {};
  for (const e of authorBase) {
    for (const i of e.items) {
      const id = authorIdFromHandle(extractAuthorHandle(i.text));
      if (id) authors[id] = (authors[id] ?? 0) + 1;
    }
  }

  return { sources, types, envs, authors };
}
