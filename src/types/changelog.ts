export type Source = "backend" | "frontend" | "admin";

export type Environment = "BETA" | "RC" | "PROD";

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
  frontend: "Müşteri Sitesi",
  admin: "Yönetim Paneli",
};

export const TYPE_LABELS: Record<ChangeType, string> = {
  added: "Yeni Özellik",
  fixed: "Düzeltme",
  changed: "İyileştirme",
};

export const ENV_LABELS: Record<Environment, string> = {
  BETA: "Beta",
  RC: "RC",
  PROD: "PROD",
};

export type Author = "ahmet" | "bora" | "ali";

export const AUTHORS: { id: Author; label: string; handles: string[] }[] = [
  { id: "ahmet", label: "Ahmet", handles: ["ahmeetseker"] },
  { id: "bora", label: "Bora", handles: ["boraydeger32"] },
  { id: "ali", label: "Ali", handles: ["aliiball"] },
];

const HANDLE_TO_AUTHOR: Record<string, Author> = Object.fromEntries(
  AUTHORS.flatMap((a) => a.handles.map((h) => [h.toLocaleLowerCase("tr"), a.id])),
);

const AUTHOR_RE = /\(@([\w-]+)\)\s*$/;

export function extractAuthorHandle(text: string): string | null {
  return text.match(AUTHOR_RE)?.[1] ?? null;
}

export function authorIdFromHandle(handle: string | null): Author | null {
  if (!handle) return null;
  return HANDLE_TO_AUTHOR[handle.toLocaleLowerCase("tr")] ?? null;
}
