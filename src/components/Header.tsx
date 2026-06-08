import { Moon, Palette, Search, Sun, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTheme } from "../hooks/useTheme";
import { formatDateTime } from "../lib/format";

interface Props {
  generatedAt?: string;
  totalEntries?: number;
  query: string;
  onQueryChange: (q: string) => void;
}

export function Header({ generatedAt, totalEntries, query, onQueryChange }: Props) {
  const { theme, cycle } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);

  // Sayfa açıldığında arama kutusu focus'lu gelsin; mevcut metin varsa tümü seçili
  // gelsin ki kullanıcı doğrudan yazmaya başlayıp üzerine yazabilsin.
  useEffect(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  const ThemeIcon = theme === "dark" ? Sun : theme === "brand" ? Palette : Moon;
  const themeLabel =
    theme === "dark" ? "Aydınlık tema" : theme === "brand" ? "Marka teması" : "Karanlık tema";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-[#1a1a1a] shadow-[var(--shadow-sm)] sm:h-8 sm:w-8">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 sm:h-[18px] sm:w-[18px]">
              <path
                d="M12 2L3 7v10l9 5 9-5V7l-9-5z M12 12L3 7 M12 12l9-5 M12 12v10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink sm:text-[18px]">
                İstoç Geliştirme Kaydı
              </h1>
              {totalEntries !== undefined && (
                <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium text-muted">
                  {totalEntries} kayıt
                </span>
              )}
            </div>
            {generatedAt && (
              <p className="mt-0.5 truncate text-[11.5px] text-muted">
                Son güncelleme · {formatDateTime(generatedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="relative ml-auto w-full max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tüm kayıtlarda ara: KYB, sepet, v1.1.7…"
            aria-label="Tüm kayıtlarda ara"
            className="input-base !py-2 !pl-9 !pr-9 !text-[13px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Aramayı temizle"
              className="icon-btn absolute right-1 top-1/2 -translate-y-1/2 !p-1.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={cycle}
          aria-label={themeLabel}
          className="icon-btn shrink-0"
          title={themeLabel}
        >
          <ThemeIcon size={18} />
        </button>
      </div>
    </header>
  );
}
