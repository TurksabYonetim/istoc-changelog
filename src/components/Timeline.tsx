import type { ChangelogEntry } from "../types/changelog";
import { VersionCard } from "./VersionCard";

interface Props {
  entries: ChangelogEntry[];
}

export function Timeline({ entries }: Props) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-800"
      />
      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <VersionCard key={`${entry.source}-${entry.version}`} entry={entry} defaultOpen={idx < 3} />
        ))}
      </div>
    </div>
  );
}
