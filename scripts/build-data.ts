import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAllChangelogs, type FetchedChangelog } from "./fetch-changelogs";
import { parseChangelog } from "../src/lib/parser";
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
  allEntries.sort((a, b) => b.date.localeCompare(a.date));

  const data: ChangelogData = {
    generatedAt: new Date().toISOString(),
    entries: allEntries,
    errors: allErrors,
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(data, null, 2), "utf-8");
  console.warn(
    `Wrote ${allEntries.length} entries from ${sources.length} source(s) to ${outFile} (${allErrors.length} errors)`,
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
