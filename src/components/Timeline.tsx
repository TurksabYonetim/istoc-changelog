import type { ChangelogEntry } from "../types/changelog";
import { VersionCard } from "./VersionCard";

interface Props {
  entries: ChangelogEntry[];
}

export function Timeline({ entries }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, idx) => (
        <VersionCard
          key={`${entry.source}-${entry.version}`}
          entry={entry}
          defaultOpen={idx < 2}
        />
      ))}
    </div>
  );
}
