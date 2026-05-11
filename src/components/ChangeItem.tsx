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

/** Strip trailing "(@username)" attribution from commit-style entries */
function cleanText(raw: string): string {
  return raw.replace(/\s*\(@[\w-]+\)\s*$/g, "").trim();
}

export function ChangeItem({ item }: Props) {
  return (
    <li className="flex flex-col gap-1.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-3">
      <span className={`${PILL_CLASS[item.type]} self-start shrink-0`}>
        {SHORT_LABEL[item.type]}
      </span>
      <p className="min-w-0 flex-1 text-[13.5px] leading-[1.5] text-ink break-words">
        {cleanText(item.text)}
      </p>
    </li>
  );
}
