import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { formatDateTime } from "../lib/format";

interface Props {
  generatedAt?: string;
}

export function Header({ generatedAt }: Props) {
  const { theme, toggle } = useTheme();
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            İstoç Geliştirme Kaydı
          </h1>
          {generatedAt && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Son güncelleme: {formatDateTime(generatedAt)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Aydınlık tema" : "Karanlık tema"}
          className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
