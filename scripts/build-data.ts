import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAllChangelogs, type FetchedChangelog } from "./fetch-changelogs";
import { deduplicateEntries, deduplicateItems, parseChangelog } from "../src/lib/parser";
import type { ChangelogData, ParseError, Source } from "../src/types/changelog";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");
const outDir = join(root, "public", "data");
const outFile = join(outDir, "changelog.json");
const localFixturesDir = join(root, "src", "lib", "__fixtures__");

async function run(): Promise<void> {
  const token = process.env.SOURCE_REPO_PAT;
  const useLocal = process.env.USE_LOCAL_FIXTURES === "1" || !token;

  let sources: FetchedChangelog[];
  const fetchErrors: ParseError[] = [];

  if (useLocal) {
    sources = loadLocalFixtures();
  } else {
    const fetched = await fetchAllChangelogs(token!);
    sources = fetched.results;
    for (const err of fetched.errors) {
      fetchErrors.push({ source: err.source, message: `fetch: ${err.message}` });
    }
  }

  const allEntries = [];
  const allErrors: ParseError[] = [...fetchErrors];
  for (const { source, markdown } of sources) {
    const { entries, errors } = parseChangelog(markdown, source);
    allEntries.push(...entries);
    allErrors.push(...errors);
  }
  // 2 katmanli dedupe:
  // 1) deduplicateEntries: ayni source+date+icerik tasiyan release'leri (ornegin
  //    art arda atilmis beta tag'leri) tek release'e indirger, en yuksek
  //    surumdekini tutar.
  // 2) deduplicateItems: ayni item'in birden fazla release'de tekrar gorunmesini
  //    engeller (ornegin .10'daki bir feat workflow PREV bug'i nedeniyle .12'ye
  //    de yazildiysa), kronolojik olarak ilk release'de tutar.
  const deduped = deduplicateItems(deduplicateEntries(allEntries));
  deduped.sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.version.localeCompare(a.version, undefined, { numeric: true });
  });

  const data: ChangelogData = {
    generatedAt: new Date().toISOString(),
    entries: deduped,
    errors: allErrors,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(data, null, 2), "utf-8");
  console.warn(
    `Wrote ${deduped.length} entries (from ${allEntries.length} parsed) from ${sources.length} source(s) to ${outFile} (${allErrors.length} errors)`,
  );
}

function loadLocalFixtures(): FetchedChangelog[] {
  const files: { source: Source; file: string }[] = [
    { source: "frontend", file: "sample-frontend.md" },
    { source: "backend", file: "sample-edge.md" },
  ];
  return files
    .filter((f) => existsSync(join(localFixturesDir, f.file)))
    .map((f) => ({
      source: f.source,
      markdown: readFileSync(join(localFixturesDir, f.file), "utf-8"),
    }));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
