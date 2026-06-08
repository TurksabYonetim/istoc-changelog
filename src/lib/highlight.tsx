import type { ReactNode } from "react";

const lower = (s: string) => s.toLocaleLowerCase("tr");

/** Aramada eşleşen metin parçasını sarı `<mark>` ile vurgular. */
export function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const haystack = lower(text);
  const needle = lower(q);
  if (!haystack.includes(needle)) return <>{text}</>;

  const parts: ReactNode[] = [];
  let from = 0;
  let key = 0;
  // Türkçe locale lowercase 1:1 uzunluk koruduğu için slice offset'leri orijinal
  // metinde de geçerli; haystack üzerinden bulup text üzerinden kesiyoruz.
  for (let idx = haystack.indexOf(needle); idx !== -1; idx = haystack.indexOf(needle, from)) {
    if (idx > from) parts.push(text.slice(from, idx));
    parts.push(
      <mark key={key++} className="search-hit">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    from = idx + needle.length;
  }
  if (from < text.length) parts.push(text.slice(from));

  return <>{parts}</>;
}
