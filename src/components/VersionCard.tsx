import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { ChangelogEntry } from "../types/changelog";
import { formatDate, isRecent } from "../lib/format";
import { ChangeItem } from "./ChangeItem";

const ENV_DOT: Record<ChangelogEntry["environment"], string> = {
  PROD: "bg-[var(--color-env-prod)]",
  RC: "bg-[var(--color-env-rc)]",
  BETA: "bg-[var(--color-env-beta)]",
};

const ENV_TEXT: Record<ChangelogEntry["environment"], string> = {
  PROD: "text-[var(--color-env-prod)]",
  RC: "text-[var(--color-env-rc)]",
  BETA: "text-[var(--color-env-beta)]",
};

interface Props {
  entry: ChangelogEntry;
  defaultOpen?: boolean;
}

export function VersionCard({ entry, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const counts = countByType(entry);
  return (
    <div className="relative pl-8">
      <span
        className={`absolute left-2 top-2 w-3 h-3 rounded-full ring-4 ring-white dark:ring-zinc-950 ${ENV_DOT[entry.environment]}`}
        aria-hidden
      />
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
          aria-expanded={open}
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-mono font-medium text-zinc-900 dark:text-zinc-100">
              {entry.version}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(entry.date)}</span>
            <span className={`text-xs font-semibold ${ENV_TEXT[entry.environment]}`}>
              {entry.environment}
            </span>
            <span className="text-xs text-zinc-500">·</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">{entry.sourceLabel}</span>
            {isRecent(entry.date) && (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-500">
                Yeni
              </span>
            )}
          </div>
          <CountChips counts={counts} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
            >
              <ul className="px-4 py-2">
                {entry.items.length === 0 ? (
                  <li className="py-2 text-xs italic text-zinc-400">Bu sürümde madde yok.</li>
                ) : (
                  entry.items.map((i) => <ChangeItem key={i.id} item={i} />)
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function countByType(entry: ChangelogEntry) {
  return entry.items.reduce(
    (acc, i) => ({ ...acc, [i.type]: (acc[i.type] ?? 0) + 1 }),
    {} as Record<string, number>,
  );
}

interface CountChipsProps {
  counts: Record<string, number>;
}
function CountChips({ counts }: CountChipsProps) {
  const labels: Record<string, { text: string; cls: string }> = {
    added: { text: "Yeni", cls: "text-[var(--color-type-added)]" },
    fixed: { text: "Düzeltme", cls: "text-[var(--color-type-fixed)]" },
    changed: { text: "İyileştirme", cls: "text-[var(--color-type-changed)]" },
  };
  return (
    <div className="hidden sm:flex items-center gap-2 text-[11px]">
      {Object.entries(counts).map(([type, n]) => (
        <span key={type} className={labels[type]?.cls}>
          {n} {labels[type]?.text ?? type}
        </span>
      ))}
    </div>
  );
}
