import { Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { formatDateTime } from "../lib/format";

interface Props {
  generatedAt?: string;
  totalEntries?: number;
}

export function Header({ generatedAt, totalEntries }: Props) {
  const { theme, cycle } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : theme === "brand" ? Palette : Moon;
  const themeLabel =
    theme === "dark" ? "Aydınlık tema" : theme === "brand" ? "Marka teması" : "Karanlık tema";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
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
            <h1 className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink sm:text-[18px]">
              İstoç Geliştirme Kaydı
            </h1>
            {totalEntries !== undefined && (
              <span className="hidden shrink-0 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium text-muted sm:inline-block">
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
