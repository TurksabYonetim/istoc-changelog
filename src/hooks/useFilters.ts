import { useCallback, useEffect, useState } from "react";
import {
  defaultFilters,
  filtersFromQuery,
  filtersToQuery,
  type FilterState,
} from "../lib/filters";

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return defaultFilters();
    return filtersFromQuery(window.location.search.slice(1));
  });

  useEffect(() => {
    const qs = filtersToQuery(filters);
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [filters]);

  const reset = useCallback(() => setFilters(defaultFilters()), []);

  return { filters, setFilters, reset };
}
