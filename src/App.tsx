import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { FilterMobileBar, FilterSidebar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { Timeline } from "./components/Timeline";
import { useChangelogData } from "./hooks/useChangelogData";
import { useFilters } from "./hooks/useFilters";
import { applyFilters, countMatches } from "./lib/filters";

export default function App() {
  const state = useChangelogData();
  const { filters, setFilters, reset } = useFilters();

  const entries = useMemo(
    () => (state.status === "ready" ? state.data.entries : []),
    [state],
  );
  const filtered = useMemo(() => applyFilters(entries, filters), [entries, filters]);
  const resultCount = filtered.reduce((acc, e) => acc + e.items.length, 0);

  // Vurgulanan kelime sayacı + ▲▼ gezinme (tarayıcı "bul" davranışı gibi).
  const matchCount = useMemo(
    () => countMatches(filtered, filters.query),
    [filtered, filters.query],
  );
  const [currentMatch, setCurrentMatch] = useState(-1);
  // Sorgu değişince aktif eşleşmeyi sıfırla (render sırasında, effect'siz).
  const [prevQuery, setPrevQuery] = useState(filters.query);
  if (filters.query !== prevQuery) {
    setPrevQuery(filters.query);
    setCurrentMatch(-1);
  }

  const goToMatch = (delta: 1 | -1) => {
    const marks = document.querySelectorAll<HTMLElement>(".search-hit");
    if (marks.length === 0) return;
    const base = currentMatch < 0 ? (delta > 0 ? -1 : 0) : currentMatch;
    const idx = (((base + delta) % marks.length) + marks.length) % marks.length;
    marks.forEach((m, i) => m.classList.toggle("search-hit--active", i === idx));
    marks[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    setCurrentMatch(idx);
  };

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
        matchCount={matchCount}
        currentMatch={currentMatch}
        onPrevMatch={() => goToMatch(-1)}
        onNextMatch={() => goToMatch(1)}
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

          {state.status === "ready" && filtered.length > 0 && (
            <Timeline entries={filtered} query={filters.query} />
          )}
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
