import { AtSign } from "lucide-react";
import type { ChangeItem as Item } from "../types/changelog";

interface Props {
  item: Item;
}

const SHORT_LABEL: Record<Item["type"], string> = {
  added: "Yeni",
  fixed: "Düzelt",
  changed: "İyileş",
};

const PILL_CLASS: Record<Item["type"], string> = {
  added: "pill-ok",
  fixed: "pill-warn",
  changed: "pill-info",
};

interface ParsedItem {
  text: string;
  author: string | null;
}

function parseItem(raw: string): ParsedItem {
  const match = raw.match(/^(.*?)\s*\(@([\w-]+)\)\s*$/);
  if (match) {
    return { text: match[1].trim(), author: match[2] };
  }
  return { text: raw.trim(), author: null };
}

export function ChangeItem({ item }: Props) {
  const { text, author } = parseItem(item.text);

  return (
    <li className="flex flex-col gap-1.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-3">
      <span className={`${PILL_CLASS[item.type]} self-start shrink-0`}>
        {SHORT_LABEL[item.type]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-[1.5] text-ink break-words">{text}</p>
        {author && (
          <a
            href={`https://github.com/${author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="author-chip mt-1"
            title={`GitHub: @${author}`}
          >
            <AtSign size={10} strokeWidth={2.5} />
            <span>{author}</span>
          </a>
        )}
      </div>
    </li>
  );
}
