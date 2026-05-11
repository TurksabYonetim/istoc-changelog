import type { ChangeItem as Item } from "../types/changelog";
import { TYPE_LABELS } from "../types/changelog";

interface Props {
  item: Item;
}

export function ChangeItem({ item }: Props) {
  const pillClass =
    item.type === "added" ? "pill-ok" : item.type === "fixed" ? "pill-warn" : "pill-info";

  return (
    <li className="flex gap-3 border-b border-border py-2.5 last:border-0">
      <span className={`${pillClass} mt-0.5 shrink-0`}>{TYPE_LABELS[item.type]}</span>
      <p className="text-[14px] leading-[1.55] text-ink">{item.text}</p>
    </li>
  );
}
