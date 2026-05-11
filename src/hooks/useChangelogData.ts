import { useEffect, useState } from "react";
import type { ChangelogData } from "../types/changelog";

type State =
  | { status: "loading" }
  | { status: "ready"; data: ChangelogData }
  | { status: "error"; message: string };

export function useChangelogData(): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/changelog.json`;
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ChangelogData>;
      })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Bilinmeyen hata",
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
