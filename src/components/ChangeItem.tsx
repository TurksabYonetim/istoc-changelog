import type { ChangeItem as Item } from "../types/changelog";
import { TYPE_LABELS } from "../types/changelog";

const TYPE_CLASSES: Record<Item["type"], string> = {
  added: "bg-[var(--color-type-added)]/10 text-[var(--color-type-added)] border-[var(--color-type-added)]/30",
  fixed: "bg-[var(--color-type-fixed)]/10 text-[var(--color-type-fixed)] border-[var(--color-type-fixed)]/30",
  changed: "bg-[var(--color-type-changed)]/10 text-[var(--color-type-changed)] border-[var(--color-type-changed)]/30",
};

interface Props {
  item: Item;
}

export function ChangeItem({ item }: Props) {
  return (
    <li className="flex gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span
        className={
          "shrink-0 self-start mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border " +
          TYPE_CLASSES[item.type]
        }
      >
        {TYPE_LABELS[item.type]}
      </span>
      <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{item.text}</p>
    </li>
  );
}
