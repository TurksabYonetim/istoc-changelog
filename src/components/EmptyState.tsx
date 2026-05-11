import { Inbox, RotateCcw } from "lucide-react";

interface Props {
  onReset: () => void;
}

export function EmptyState({ onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Inbox size={22} />
      </div>
      <h2 className="mb-1 text-[16px] font-semibold text-ink">Bu kriterlere uyan kayıt yok</h2>
      <p className="mb-5 max-w-sm text-[13px] text-muted">
        Filtre kombinasyonu çok dar. Bir veya birkaç filtreyi gevşetmeyi veya tümünü sıfırlamayı
        deneyin.
      </p>
      <button type="button" onClick={onReset} className="btn-primary">
        <RotateCcw size={14} />
        Filtreleri Sıfırla
      </button>
    </div>
  );
}
