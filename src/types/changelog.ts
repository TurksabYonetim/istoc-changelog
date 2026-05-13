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
