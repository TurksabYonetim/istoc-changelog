import type {
  ChangeType,
  ChangelogEntry,
  Environment,
  Source,
} from "../types/changelog";

const ALL_SOURCES: Source[] = ["backend", "frontend", "admin"];
const ALL_TYPES: ChangeType[] = ["added", "fixed", "changed"];
const ALL_ENVS: Environment[] = ["BETA", "RC", "PROD"];

export interface FilterState {
  sources: Set<Source>;
  types: Set<ChangeType>;
  environments: Set<Environment>;
  dateFrom: string | null;
  dateTo: string | null;
  query: string;
}

export function defaultFilters(): FilterState {
  return {
    sources: new Set(ALL_SOURCES),
    types: new Set(ALL_TYPES),
    environments: new Set(ALL_ENVS),
    dateFrom: null,
    dateTo: null,
    query: "",
  };
}

export function applyFilters(
  entries: ChangelogEntry[],
  filters: FilterState,
): ChangelogEntry[] {
  const q = filters.query.trim().toLocaleLowerCase("tr");
  return entries
    .filter((e) => filters.sources.has(e.source))
    .filter((e) => filters.environments.has(e.environment))
    .filter((e) => (filters.dateFrom ? e.date >= filters.dateFrom : true))
    .filter((e) => (filters.dateTo ? e.date <= filters.dateTo : true))
    .map((e) => ({
      ...e,
      items: e.items.filter((i) => filters.types.has(i.type)),
    }))
    .filter((e) => e.items.length > 0 || filters.types.size === ALL_TYPES.length)
    .filter((e) => {
      if (!q) return true;
      const haystack = [
        e.version,
        e.sourceLabel,
        e.environment,
        ...e.items.map((i) => i.text),
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      return haystack.includes(q);
    });
}

export function filtersToQuery(f: FilterState): string {
  const params = new URLSearchParams();
  if (f.sources.size < ALL_SOURCES.length) params.set("modul", [...f.sources].sort().join(","));
  if (f.types.size < ALL_TYPES.length) params.set("tip", [...f.types].sort().join(","));
  if (f.environments.size < ALL_ENVS.length) params.set("ortam", [...f.environments].sort().join(","));
  if (f.dateFrom) params.set("dan", f.dateFrom);
  if (f.dateTo) params.set("kadar", f.dateTo);
  if (f.query) params.set("q", f.query);
  return params.toString();
}

export function filtersFromQuery(qs: string): FilterState {
  const params = new URLSearchParams(qs);
  const f = defaultFilters();
  const modul = params.get("modul");
  if (modul) f.sources = new Set(modul.split(",").filter(isSource));
  const tip = params.get("tip");
  if (tip) f.types = new Set(tip.split(",").filter(isType));
  const ortam = params.get("ortam");
  if (ortam) f.environments = new Set(ortam.split(",").filter(isEnv));
  f.dateFrom = params.get("dan");
  f.dateTo = params.get("kadar");
  f.query = params.get("q") ?? "";
  return f;
}

function isSource(s: string): s is Source {
  return (ALL_SOURCES as string[]).includes(s);
}
function isType(s: string): s is ChangeType {
  return (ALL_TYPES as string[]).includes(s);
}
function isEnv(s: string): s is Environment {
  return (ALL_ENVS as string[]).includes(s);
}
