import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "brand";

const STORAGE_KEY = "istoc-changelog-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "brand") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const cycle = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "brand" : "light"));
  }, []);

  return { theme, setTheme, toggle, cycle };
}
