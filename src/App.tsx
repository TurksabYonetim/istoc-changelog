import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "./components/EmptyState";
import { FilterMobileBar, FilterSidebar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { Timeline } from "./components/Timeline";
import { useChangelogData } from "./hooks/useChangelogData";
import { useFilters } from "./hooks/useFilters";
import { applyFilters } from "./lib/filters";

export default function App() {
  const state = useChangelogData();
  const { filters, setFilters, reset } = useFilters();

  const entries = useMemo(
    () => (state.status === "ready" ? state.data.entries : []),
    [state],
  );
  const filtered = useMemo(() => applyFilters(entries, filters), [entries, filters]);
  const resultCount = filtered.reduce((acc, e) => acc + e.items.length, 0);

  const filterProps = {
    filters,
    setFilters,
    reset,
    entries,
    resultCount,
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <Header
        generatedAt={state.status === "ready" ? state.data.generatedAt : undefined}
        totalEntries={state.status === "ready" ? state.data.entries.length : undefined}
        query={filters.query}
        onQueryChange={(q) => setFilters({ ...filters, query: q })}
      />

      {state.status === "ready" && <FilterMobileBar {...filterProps} />}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        {state.status === "ready" && <FilterSidebar {...filterProps} />}

        <main className="min-w-0">
          {state.status === "loading" && (
            <div className="flex flex-col items-center justify-center py-20 text-muted">
              <Loader2 size={20} className="mb-3 animate-spin text-brand-700" />
              <p className="text-[13px]">Geliştirme kaydı yükleniyor…</p>
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-xl border border-warn-bg bg-warn-bg px-6 py-8 text-center">
              <p className="text-[14px] font-semibold text-danger">Veri yüklenemedi</p>
              <p className="mt-1 text-[12.5px] text-ink-2">{state.message}</p>
            </div>
          )}

          {state.status === "ready" && filtered.length === 0 && <EmptyState onReset={reset} />}

          {state.status === "ready" && filtered.length > 0 && <Timeline entries={filtered} />}
        </main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6">
        <div className="border-t border-border pt-6">
          <p className="text-[12.5px] text-muted">
            <span className="font-semibold text-ink-2">İstoç</span> · Geliştirme Kaydı · Otomatik
            üretilir
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted">
            © tradehub-tr · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
