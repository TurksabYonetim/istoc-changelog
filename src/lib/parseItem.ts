export interface ParsedItem {
  text: string;
  author: string | null;
}

/** `... (@handle)` sonekini metinden ayırır; yoksa author null döner. */
export function parseItem(raw: string): ParsedItem {
  const match = raw.match(/^(.*?)\s*\(@([\w-]+)\)\s*$/);
  if (match) {
    return { text: match[1].trim(), author: match[2] };
  }
  return { text: raw.trim(), author: null };
}
