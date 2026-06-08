import type {
  Author,
  ChangeItem,
  ChangeType,
  ChangelogEntry,
  Environment,
  Source,
} from "../types/changelog";
import { authorIdFromHandle, extractAuthorHandle } from "../types/changelog";
import { parseItem } from "./parseItem";

const ALL_SOURCES: Source[] = ["backend", "frontend", "admin"];
const ALL_TYPES: ChangeType[] = ["added", "fixed", "changed"];
const ALL_ENVS: Environment[] = ["BETA", "RC", "PROD"];
const ALL_AUTHORS: Author[] = ["ahmet", "bora", "ali", "aliturgut"];

export interface FilterState {
  sources: Set<Source>;
  types: Set<ChangeType>;
  environments: Set<Environment>;
  authors: Set<Author>;
  dateFrom: string | null;
  dateTo: string | null;
  query: string;
}

/**
 * Filter semantics: an empty Set means "no filter on this dimension"
 * (include everything). A non-empty Set means "only include items matching one of these".
 */
export function defaultFilters(): FilterState {
  return {
    sources: new Set<Source>(),
    types: new Set<ChangeType>(),
    environments: new Set<Environment>(),
    authors: new Set<Author>(),
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
  const sourceFilter = filters.sources.size > 0;
  const envFilter = filters.environments.size > 0;
  const typeFilter = filters.types.size > 0;
  const authorFilter = filters.authors.size > 0;

  return entries
    .filter((e) => !sourceFilter || filters.sources.has(e.source))
    .filter((e) => !envFilter || filters.environments.has(e.environment))
    .filter((e) => (filters.dateFrom ? e.date >= filters.dateFrom : true))
    .filter((e) => (filters.dateTo ? e.date <= filters.dateTo : true))
    .map((e) => {
      let items = e.items;
      if (typeFilter) items = items.filter((i) => filters.types.has(i.type));
      if (authorFilter) items = items.filter((i) => itemMatchesAuthors(i, filters.authors));
      return { ...e, items };
    })
    .filter((e) => e.items.length > 0)
    .filter((e) => {
      if (!q) return true;
      const haystack = [
        e.version,
        e.sourceLabel,
        e.environment,
        ...e.items.flatMap(collectItemText),
      ]
        .join(" ")
        .toLocaleLowerCase("tr");
      return haystack.includes(q);
    });
}

/** Tek bir metin parçası, serbest arama sorgusu ile eşleşiyor mu? */
export function textMatchesQuery(text: string, query: string): boolean {
  const q = query.trim();
  return q ? text.toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")) : false;
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) {
    count++;
  }
  return count;
}

/**
 * Toplam vurgulanabilir eşleşme sayısı — HighlightedText ile aynı `parseItem`
 * metnini ve Türkçe locale'i kullandığı için DOM'daki `.search-hit` sayısına
 * birebir eşittir; gezinme sayacı bu değere dayanır.
 */
export function countMatches(entries: ChangelogEntry[], query: string): number {
  const q = query.trim().toLocaleLowerCase("tr");
  if (!q) return 0;
  let total = 0;
  const walk = (items: ChangeItem[]) => {
    for (const it of items) {
      total += countOccurrences(parseItem(it.text).text.toLocaleLowerCase("tr"), q);
      if (it.children) walk(it.children);
    }
  };
  for (const e of entries) walk(e.items);
  return total;
}

function collectItemText(item: ChangeItem): string[] {
  const own = [item.text];
  if (item.children && item.children.length > 0) {
    return own.concat(item.children.flatMap(collectItemText));
  }
  return own;
}

/**
 * An item matches the author filter if its top-level text carries a `(@handle)`
 * mapping to one of the selected author ids. Children inherit attribution from
 * the parent, so we only check the top-level text.
 */
export function itemMatchesAuthors(item: ChangeItem, authors: Set<Author>): boolean {
  const id = authorIdFromHandle(extractAuthorHandle(item.text));
  return id !== null && authors.has(id);
}

export function filtersToQuery(f: FilterState): string {
  const params = new URLSearchParams();
  if (f.sources.size > 0) params.set("modul", [...f.sources].sort().join(","));
  if (f.types.size > 0) params.set("tip", [...f.types].sort().join(","));
  if (f.environments.size > 0) params.set("ortam", [...f.environments].sort().join(","));
  if (f.authors.size > 0) params.set("kisi", [...f.authors].sort().join(","));
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
  const kisi = params.get("kisi");
  if (kisi) f.authors = new Set(kisi.split(",").filter(isAuthor));
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
function isAuthor(s: string): s is Author {
  return (ALL_AUTHORS as string[]).includes(s);
}
