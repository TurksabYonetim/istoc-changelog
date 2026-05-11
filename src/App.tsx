import { useMemo } from "react";
import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { Timeline } from "./components/Timeline";
import { EmptyState } from "./components/EmptyState";
import { useChangelogData } from "./hooks/useChangelogData";
import { useFilters } from "./hooks/useFilters";
import { applyFilters } from "./lib/filters";

export default function App() {
  const state = useChangelogData();
  const { filters, setFilters, reset } = useFilters();

  const entries = state.status === "ready" ? state.data.entries : [];
  const filtered = useMemo(() => applyFilters(entries, filters), [entries, filters]);

  return (
    <div className="min-h-dvh text-zinc-900 dark:text-zinc-100">
      <Header generatedAt={state.status === "ready" ? state.data.generatedAt : undefined} />
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        reset={reset}
        entries={entries}
        resultCount={filtered.reduce((acc, e) => acc + e.items.length, 0)}
      />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {state.status === "loading" && (
          <p className="text-center text-sm text-zinc-500 py-12">Yükleniyor…</p>
        )}
        {state.status === "error" && (
          <p className="text-center text-sm text-red-600 py-12">
            Veri yüklenemedi: {state.message}
          </p>
        )}
        {state.status === "ready" && filtered.length === 0 && <EmptyState onReset={reset} />}
        {state.status === "ready" && filtered.length > 0 && <Timeline entries={filtered} />}
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
        İstoç · Geliştirme Kaydı · Otomatik üretilir
      </footer>
    </div>
  );
}
