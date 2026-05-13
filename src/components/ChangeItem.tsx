import { AtSign, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ChangeItem as Item } from "../types/changelog";

interface Props {
  item: Item;
  /** Visual nesting depth — 0 for top-level, >0 for sub-items. */
  depth?: number;
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

export function ChangeItem({ item, depth = 0 }: Props) {
  const { text, author } = parseItem(item.text);
  const hasChildren = !!item.children && item.children.length > 0;
  const [open, setOpen] = useState(false);
  const isSub = depth > 0;

  const toggle = () => setOpen((o) => !o);
  const onRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };
  const stopBubble = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <li className="border-b border-border last:border-0">
      {isSub ? (
        <div className="flex items-baseline gap-2 py-1.5 pl-3 sm:pl-4">
          <span className="text-muted">•</span>
          <div className="min-w-0 flex-1">
            <p className="break-words text-[12.5px] leading-[1.5] text-ink-2">{text}</p>
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
        </div>
      ) : (
        <div
          {...(hasChildren && {
            role: "button" as const,
            tabIndex: 0,
            onClick: toggle,
            onKeyDown: onRowKeyDown,
            "aria-expanded": open,
            "aria-label": open ? "Detayları gizle" : "Detayları göster",
          })}
          className={`flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3 ${
            hasChildren
              ? "cursor-pointer transition-colors hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2 -mx-4 px-4 sm:-mx-5 sm:px-5"
              : ""
          }`}
        >
          {hasChildren ? (
            <motion.span
              animate={{ rotate: open ? 0 : -90 }}
              transition={{ duration: 0.15 }}
              className="shrink-0 self-start p-0.5 text-muted"
              aria-hidden="true"
            >
              <ChevronDown size={14} />
            </motion.span>
          ) : (
            <span className="hidden w-[22px] shrink-0 sm:block" aria-hidden="true" />
          )}

          <span className={`${PILL_CLASS[item.type]} self-start shrink-0`}>
            {SHORT_LABEL[item.type]}
          </span>

          <div className="min-w-0 flex-1">
            <p className="break-words text-[13.5px] leading-[1.5] text-ink">{text}</p>
            {author && (
              <a
                href={`https://github.com/${author}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopBubble}
                className="author-chip mt-1"
                title={`GitHub: @${author}`}
              >
                <AtSign size={10} strokeWidth={2.5} />
                <span>{author}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {hasChildren && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <ul className="mb-2 ml-7 border-l-2 border-border/60 pl-2 sm:ml-9 sm:pl-3">
                {item.children!.map((c) => (
                  <ChangeItem key={c.id} item={c} depth={depth + 1} />
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}
