import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ChangelogEntry, ChangeType } from "../types/changelog";
import { formatDate, isRecent } from "../lib/format";
import { ChangeItem } from "./ChangeItem";

interface Props {
  entry: ChangelogEntry;
  defaultOpen?: boolean;
}

const COUNT_CONFIG: Record<ChangeType, { label: string; cls: string }> = {
  added: { label: "yeni", cls: "text-ok" },
  fixed: { label: "düzeltme", cls: "text-warn" },
  changed: { label: "iyileştirme", cls: "text-ink-2" },
};

const ENV_PILL: Record<ChangelogEntry["environment"], string> = {
  PROD: "pill-ok",
  RC: "pill-warn",
  BETA: "pill-info",
};

export function VersionCard({ entry, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const counts = countByType(entry);
  const recent = isRecent(entry.date);

  return (
    <article className="card-lift overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 sm:px-5 sm:py-4"
        aria-expanded={open}
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.18 }}
          className="shrink-0 text-muted"
        >
          <ChevronDown size={16} />
        </motion.span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
            {entry.version}
          </span>
          <span className={ENV_PILL[entry.environment]}>{entry.environment}</span>
          <span className="text-[12.5px] text-muted">{formatDate(entry.date)}</span>
          <span className="hidden text-muted sm:inline">·</span>
          <span className="text-[12.5px] font-medium text-ink-2">{entry.sourceLabel}</span>
          {recent && <span className="pill-new">Yeni</span>}
        </div>

        <div className="hidden shrink-0 items-center gap-3 text-[11.5px] font-medium md:flex">
          {(Object.keys(counts) as ChangeType[]).map((type) =>
            counts[type] > 0 ? (
              <span key={type} className={COUNT_CONFIG[type].cls}>
                <span className="font-semibold">{counts[type]}</span>{" "}
                <span className="opacity-80">{COUNT_CONFIG[type].label}</span>
              </span>
            ) : null,
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <ul className="px-4 py-1 sm:px-5">
              {entry.items.length === 0 ? (
                <li className="py-3 text-[13px] italic text-muted">
                  Bu sürümde madde bulunmuyor.
                </li>
              ) : (
                entry.items.map((i) => <ChangeItem key={i.id} item={i} />)
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function countByType(entry: ChangelogEntry): Record<ChangeType, number> {
  const init: Record<ChangeType, number> = { added: 0, fixed: 0, changed: 0 };
  return entry.items.reduce<Record<ChangeType, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, init);
}
