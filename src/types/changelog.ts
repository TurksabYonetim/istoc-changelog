export type Source = "backend" | "frontend" | "admin";

export type Environment = "ALPHA" | "BETA" | "RC" | "PROD";

export type ChangeType = "added" | "fixed" | "changed";

export interface ChangeItem {
  id: string;
  type: ChangeType;
  text: string;
  children?: ChangeItem[];
}

export interface ChangelogEntry {
  source: Source;
  sourceLabel: string;
  version: string;
  date: string;
  environment: Environment;
  items: ChangeItem[];
}

export interface ChangelogData {
  generatedAt: string;
  entries: ChangelogEntry[];
  errors: ParseError[];
}

export interface ParseError {
  source: Source;
  version?: string;
  message: string;
}

export const SOURCE_LABELS: Record<Source, string> = {
  backend: "Backend",
  frontend: "Frontpages",
  admin: "Admin",
};

export const TYPE_LABELS: Record<ChangeType, string> = {
  added: "feature",
  fixed: "Fixed",
  changed: "improvement",
};

export const ENV_LABELS: Record<Environment, string> = {
  ALPHA: "Alpha",
  BETA: "Beta",
  RC: "RC",
  PROD: "PROD",
};

export type Author = "ahmet" | "bora" | "ali" | "aliturgut" | "metin" | "sefa";

export const AUTHORS: { id: Author; label: string; handles: string[] }[] = [
  { id: "ahmet", label: "Ahmet", handles: ["ahmeetseker"] },
  { id: "bora", label: "Bora", handles: ["boraydeger32"] },
  { id: "ali", label: "Ali", handles: ["aliiball"] },
  { id: "aliturgut", label: "Ali Turgut", handles: ["aliturguttursab"] },
  { id: "metin", label: "Metin", handles: ["Metin15978", "Metin Bektemur"] },
  { id: "sefa", label: "Sefa", handles: ["Sefa4444"] },
];

const HANDLE_TO_AUTHOR: Record<string, Author> = Object.fromEntries(
  AUTHORS.flatMap((a) => a.handles.map((h) => [h.toLocaleLowerCase("tr"), a.id])),
);

// Handle (ahmeetseker) veya bosluklu gorunen ad (Metin Bektemur) olabilir.
const AUTHOR_RE = /\(@([\p{L}\p{N}_-]+(?: [\p{L}\p{N}_-]+)*)\)\s*$/u;

export function extractAuthorHandle(text: string): string | null {
  return text.match(AUTHOR_RE)?.[1] ?? null;
}

export function authorIdFromHandle(handle: string | null): Author | null {
  if (!handle) return null;
  return HANDLE_TO_AUTHOR[handle.toLocaleLowerCase("tr")] ?? null;
}
