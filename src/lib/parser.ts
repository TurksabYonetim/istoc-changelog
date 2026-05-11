import { createHash } from "node:crypto";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { Heading, List, Root } from "mdast";
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
    entries.push(entry);
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  return { entries, errors };
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
): ChangeItem[] {
  return list.children.map((li, idx) => {
    const text = collectText(li).trim();
    return {
      id: makeId(source, entry.version, type, idx, text),
      type,
      text,
    };
  });
}

function collectText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; value?: string; children?: unknown[] };
  if (typeof n.value === "string") return n.value;
  if (Array.isArray(n.children)) return n.children.map(collectText).join(" ");
  return "";
}

function makeId(source: Source, version: string, type: ChangeType, idx: number, text: string): string {
  return createHash("sha1")
    .update(`${source}|${version}|${type}|${idx}|${text}`)
    .digest("hex")
    .slice(0, 12);
}
