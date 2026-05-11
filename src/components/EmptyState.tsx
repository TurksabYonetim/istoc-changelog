import { Inbox } from "lucide-react";

interface Props {
  onReset: () => void;
}

export function EmptyState({ onReset }: Props) {
  return (
    <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
      <Inbox size={32} className="mx-auto mb-2 opacity-50" />
      <p className="text-sm mb-3">Bu kriterlere uyan kayıt yok.</p>
      <button
        type="button"
        onClick={onReset}
        className="px-3 py-1.5 text-xs rounded-lg bg-brand-500 text-white hover:bg-brand-600"
      >
        Filtreleri Sıfırla
      </button>
    </div>
  );
}
