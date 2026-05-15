import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

// Tek seferlik backfill aracı — CHANGELOG.md'de bulunan beta entry'lerini parse edip
// son PROD'dan bu yana biriken feat/fix/refactor'ları aggregate eder, sonra
// belirtilen RC ve PROD versiyonu için yeni entry'ler oluşturup CHANGELOG.md'nin
// başına ekler. Workflow empty-guard'ı promote-only release'lerde CHANGELOG'a
// yazmadığı için bu entry'ler eksikti.
//
// Örnek:
//   tsx scripts/backfill-promote-entries.ts \
//     --changelog ../tradehubfront/CHANGELOG.md \
//     --last-prod v1.1.8 \
//     --rc-version v1.1.8-rc.1 \
//     --prod-version v1.1.9 \
//     --date 2026-05-15

const { values } = parseArgs({
  options: {
    changelog: { type: "string" },
    "last-prod": { type: "string" },
    "rc-version": { type: "string" },
    "prod-version": { type: "string" },
    date: { type: "string" },
  },
  strict: true,
});

const required = ["changelog", "last-prod", "rc-version", "prod-version", "date"] as const;
for (const key of required) {
  if (!values[key]) {
    console.error(`Missing required arg: --${key}`);
    process.exit(1);
  }
}

const changelogPath = values.changelog!;
const lastProd = values["last-prod"]!;
const rcVersion = values["rc-version"]!;
const prodVersion = values["prod-version"]!;
const date = values.date!;

const md = readFileSync(changelogPath, "utf-8");

// H2 başlıklara göre blok blok ayır; her blok `## [...` ile başlar.
const blocks = md.split(/(?=^## \[)/m);

const aggregated: { Eklendi: string[]; Duzeltildi: string[]; Degistirildi: string[] } = {
  Eklendi: [],
  Duzeltildi: [],
  Degistirildi: [],
};

const betaPrefix = `${lastProd}-beta.`;

for (const block of blocks) {
  const headingMatch = block.match(/^## \[([^\]]+)\] - \d{4}-\d{2}-\d{2} (BETA|RC|PROD)/);
  if (!headingMatch) continue;
  const [, ver, env] = headingMatch;
  if (env !== "BETA") continue;
  if (!ver.startsWith(betaPrefix)) continue;

  // Bu blok içindeki section'ları çıkar: ### Eklendi / Duzeltildi / Degistirildi
  const sectionRe = /^### (Eklendi|Duzeltildi|Degistirildi)\s*$([\s\S]*?)(?=^### |^---|^## |\Z)/gm;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(block)) !== null) {
    const sectionType = m[1] as keyof typeof aggregated;
    const sectionBody = m[2];

    // Top-level bullet'ları (ve nested child'lerini) çıkar.
    // "- " ile başlayan satır yeni bir item, "  - " ile başlayan satır o item'in alt bullet'ı.
    const lines = sectionBody.split("\n");
    let current = "";
    const flush = () => {
      if (current.trim()) aggregated[sectionType].push(current.trimEnd());
      current = "";
    };

    for (const line of lines) {
      if (/^- /.test(line)) {
        flush();
        current = line;
      } else if (/^\s+\S/.test(line) && current) {
        current += "\n" + line;
      } else if (line.trim() === "") {
        // Blank — eğer current açıksa devam et (kapatma)
      } else {
        flush();
      }
    }
    flush();
  }
}

// Dedupe: aynı feat farklı beta'larda tekrarlanmış olabilir.
// Normalize: trailing "(@author)" suffix'i + whitespace + lowercase.
function normalize(text: string): string {
  return text
    .replace(/\s*\(@[\w-]+\)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr");
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const firstLine = item.split("\n")[0].replace(/^- /, "");
    const key = normalize(firstLine);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

aggregated.Eklendi = dedupe(aggregated.Eklendi);
aggregated.Duzeltildi = dedupe(aggregated.Duzeltildi);
aggregated.Degistirildi = dedupe(aggregated.Degistirildi);

function buildEntry(version: string, env: "RC" | "PROD"): string {
  const intro =
    env === "RC"
      ? `Bu surum onay asamasindadir. ${lastProd} PROD'dan bu yana beta tag'lerinde test edilen tum feat/fix bu RC entry'sinde toplanmistir.`
      : `Bu surum canliya alindi. ${lastProd} PROD'dan bu yana beta + RC asamasinda test edilen tum feat/fix dahildir.`;

  let out = `## [${version}] - ${date} ${env}\n\n${intro}\n\n`;
  if (aggregated.Eklendi.length > 0) out += `### Eklendi\n${aggregated.Eklendi.join("\n")}\n\n`;
  if (aggregated.Duzeltildi.length > 0) out += `### Duzeltildi\n${aggregated.Duzeltildi.join("\n")}\n\n`;
  if (aggregated.Degistirildi.length > 0)
    out += `### Degistirildi\n${aggregated.Degistirildi.join("\n")}\n\n`;
  out += "---\n";
  return out;
}

const prodEntry = buildEntry(prodVersion, "PROD");
const rcEntry = buildEntry(rcVersion, "RC");

writeFileSync(changelogPath, prodEntry + rcEntry + md, "utf-8");

console.warn(`Backfilled ${changelogPath}:`);
console.warn(
  `  ${rcVersion} RC + ${prodVersion} PROD eklendi (${aggregated.Eklendi.length} feat, ${aggregated.Duzeltildi.length} fix, ${aggregated.Degistirildi.length} refactor)`,
);
