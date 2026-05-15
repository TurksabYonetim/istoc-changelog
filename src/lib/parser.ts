import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Heading, List, ListItem, Root } from "mdast";
import type {
  ChangeItem,
  ChangelogEntry,
  ChangeType,
  Environment,
  ParseError,
  Source,
} from "../types/changelog";
import { SOURCE_LABELS } from "../types/changelog";

const VERSION_HEADING_RE = /^\[(v[^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})\s+(BETA|RC|PROD)\s*$/;

const SECTION_TYPE_MAP: Record<string, ChangeType> = {
  eklendi: "added",
  duzeltildi: "fixed",
  düzeltildi: "fixed",
  degistirildi: "changed",
  değiştirildi: "changed",
};

interface ParseResult {
  entries: ChangelogEntry[];
  errors: ParseError[];
}

export function parseChangelog(markdown: string, source: Source): ParseResult {
  const errors: ParseError[] = [];
  const entries: ChangelogEntry[] = [];

  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdown) as Root;

  const sectionsByVersion: {
    entry: ChangelogEntry;
    pendingType: ChangeType | null;
  }[] = [];

  let current: { entry: ChangelogEntry; pendingType: ChangeType | null } | null = null;

  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 2) {
      const text = headingText(node);
      const match = text.match(VERSION_HEADING_RE);
      if (!match) {
        errors.push({ source, message: `Tanınmayan H2 başlığı: "${text}"` });
        current = null;
        continue;
      }
      const [, version, date, env] = match;
      current = {
        entry: {
          source,
          sourceLabel: SOURCE_LABELS[source],
          version,
          date,
          environment: env as Environment,
          items: [],
        },
        pendingType: null,
      };
      sectionsByVersion.push(current);
      continue;
    }

    if (!current) continue;

    if (node.type === "heading" && node.depth === 3) {
      const key = headingText(node).trim().toLocaleLowerCase("tr");
      const mapped = SECTION_TYPE_MAP[key] ?? null;
      current.pendingType = mapped;
      continue;
    }

    if (node.type === "list" && current.pendingType) {
      const items = extractListItems(node, source, current.entry, current.pendingType);
      current.entry.items.push(...items);
    }
  }

  for (const { entry } of sectionsByVersion) {
    entry.items = dedupeWithinEntry(entry.items);
    entries.push(entry);
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return { entries, errors };
}

/** Drop duplicate items within the same entry (same type + same normalized text). */
function dedupeWithinEntry(items: ChangeItem[]): ChangeItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}|${normalizeItemText(item.text)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function headingText(node: Heading): string {
  return node.children
    .map((c) => (c.type === "text" ? c.value : c.type === "inlineCode" ? c.value : ""))
    .join("")
    .trim();
}

function extractListItems(
  list: List,
  source: Source,
  entry: ChangelogEntry,
  type: ChangeType,
  parentPath = "",
): ChangeItem[] {
  return list.children.map((li, idx) => extractListItem(li, source, entry, type, idx, parentPath));
}

function extractListItem(
  li: ListItem,
  source: Source,
  entry: ChangelogEntry,
  type: ChangeType,
  idx: number,
  parentPath: string,
): ChangeItem {
  // Direct (own) text: every child of the listItem EXCEPT nested lists.
  const ownText = li.children
    .filter((c) => c.type !== "list")
    .map((c) => collectText(c))
    .join(" ")
    .trim();

  const path = parentPath ? `${parentPath}/${idx}` : `${idx}`;
  const item: ChangeItem = {
    id: makeId(source, entry.version, type, path, ownText),
    type,
    text: ownText,
  };

  const nested = li.children.find((c): c is List => c.type === "list");
  if (nested && nested.children.length > 0) {
    item.children = extractListItems(nested, source, entry, type, path);
  }

  return item;
}

function collectText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; value?: string; children?: unknown[] };
  if (typeof n.value === "string") return n.value;
  if (Array.isArray(n.children)) return n.children.map(collectText).join(" ");
  return "";
}

/** Browser-safe stable hash (FNV-1a 32-bit). Not cryptographic — only needs uniqueness. */
function makeId(source: Source, version: string, type: ChangeType, path: string, text: string): string {
  const input = `${source}|${version}|${type}|${path}|${text}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Mix path again to reduce collisions on similar inputs, return 12-char hex
  let pathHash = 0;
  for (let i = 0; i < path.length; i++) {
    pathHash = (Math.imul(pathHash, 31) + path.charCodeAt(i)) >>> 0;
  }
  const mix = (h ^ Math.imul(pathHash + 1, 0x27d4eb2f)) >>> 0;
  return (mix.toString(16) + h.toString(16).padStart(8, "0")).slice(0, 12);
}

function compareVersions(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function itemsSignature(items: ChangeItem[]): string {
  return items
    .map((i) => `${i.type}::${i.text.replace(/\s+/g, " ").trim()}::${childrenSignature(i.children)}`)
    .sort()
    .join("\n");
}

function childrenSignature(children: ChangeItem[] | undefined): string {
  if (!children || children.length === 0) return "";
  return children
    .map((c) => `${c.text.replace(/\s+/g, " ").trim()}::${childrenSignature(c.children)}`)
    .join("|");
}

/**
 * Removes empty entries and collapses entries that share the same source+date and
 * carry identical item content (e.g. successive beta tags pointing at the same diff).
 * Keeps the entry with the highest version per duplicate group.
 */
export function deduplicateEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  const winners = new Map<string, ChangelogEntry>();
  for (const e of entries) {
    if (e.items.length === 0) continue;
    const key = `${e.source}|${e.date}|${itemsSignature(e.items)}`;
    const existing = winners.get(key);
    if (!existing || compareVersions(e.version, existing.version) > 0) {
      winners.set(key, e);
    }
  }
  return Array.from(winners.values());
}

/**
 * Removes duplicate items across entries within the same environment. The same
 * feat carried through BETA → RC → PROD is preserved in all three environments
 * (so users can see it move through the pipeline). Duplicates within the same
 * source+environment (e.g. .10 and .12 beta tags both listing the same commit
 * because of a workflow PREV bug) keep only the FIRST occurrence chronologically.
 *
 * Normalization strips trailing "(@author)" attribution and lowercases for match.
 */
export function deduplicateItems(entries: ChangelogEntry[]): ChangelogEntry[] {
  const sortedAsc = [...entries].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return compareVersions(a.version, b.version);
  });

  const seen = new Set<string>();
  const result = new Map<ChangelogEntry, ChangelogEntry>();

  for (const entry of sortedAsc) {
    const keptItems = entry.items.filter((item) => {
      const key = `${entry.source}|${entry.environment}|${item.type}|${normalizeItemText(item.text)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (keptItems.length > 0) {
      result.set(entry, { ...entry, items: keptItems });
    }
  }

  return entries.map((e) => result.get(e)).filter((e): e is ChangelogEntry => Boolean(e));
}

function normalizeItemText(text: string): string {
  return text
    .replace(/\s*\(@[\w-]+\)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr");
}
