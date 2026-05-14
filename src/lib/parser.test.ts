import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deduplicateItems, parseChangelog } from "./parser";
import type { ChangelogEntry } from "../types/changelog";

const fixturesDir = join(__dirname, "__fixtures__");

describe("parseChangelog", () => {
  it("parses frontend sample with 3 versions", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const { entries, errors } = parseChangelog(md, "frontend");

    expect(errors).toEqual([]);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      source: "frontend",
      sourceLabel: "Müşteri Sitesi",
      version: "v1.1.8-beta.1",
      date: "2026-05-11",
      environment: "BETA",
    });
    expect(entries[0].items).toHaveLength(2);
    expect(entries[0].items[0]).toMatchObject({
      type: "added",
      text: "Header duyuru bandı eklendi.",
    });
  });

  it("maps Turkish section names to ChangeType", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const { entries } = parseChangelog(md, "frontend");
    const prodEntry = entries.find((e) => e.version === "v1.1.8");
    expect(prodEntry).toBeDefined();
    const types = prodEntry!.items.map((i) => i.type);
    expect(types).toContain("added");
    expect(types).toContain("fixed");
    expect(types).toContain("changed");
  });

  it("skips empty sections without error", () => {
    const md = readFileSync(join(fixturesDir, "sample-edge.md"), "utf-8");
    const { entries, errors } = parseChangelog(md, "backend");
    const empty = entries.find((e) => e.version === "v0.1.0");
    expect(empty).toBeDefined();
    expect(empty!.items).toHaveLength(0);
    expect(errors).toEqual([]);
  });

  it("ignores unknown section headings", () => {
    const md = readFileSync(join(fixturesDir, "sample-edge.md"), "utf-8");
    const { entries } = parseChangelog(md, "backend");
    const beta = entries.find((e) => e.version === "v0.0.9");
    expect(beta!.items).toHaveLength(1);
    expect(beta!.items[0].type).toBe("fixed");
  });

  it("generates stable item ids", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const a = parseChangelog(md, "frontend");
    const b = parseChangelog(md, "frontend");
    expect(a.entries[0].items[0].id).toBe(b.entries[0].items[0].id);
  });

  it("sorts entries by date descending", () => {
    const md = readFileSync(join(fixturesDir, "sample-frontend.md"), "utf-8");
    const { entries } = parseChangelog(md, "frontend");
    const dates = entries.map((e) => e.date);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  it("parses nested list items as children, not flattened text", () => {
    const md = [
      "## [v1.0.0] - 2026-05-01 BETA",
      "",
      "### Eklendi",
      "",
      "- feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)",
      "  - Yorum Yaz modal: form + foto + kategori şablon cevapları",
      "  - Şikayet Et modal: sebep dropdown + not",
      "  - Q&A bottom-sheet: mobile-first soru/cevap görüntüleme",
      "- feat(other): standalone item",
      "",
    ].join("\n");

    const { entries, errors } = parseChangelog(md, "frontend");
    expect(errors).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0].items).toHaveLength(2);

    const sprint = entries[0].items[0];
    expect(sprint.text).toBe(
      "feat(reviews): Sprint 1 — review/Q&A storefront entegrasyonu + 4 fix (@boraydeger32)",
    );
    expect(sprint.children).toHaveLength(3);
    expect(sprint.children![0].text).toBe(
      "Yorum Yaz modal: form + foto + kategori şablon cevapları",
    );
    expect(sprint.children![0].type).toBe("added");
    expect(sprint.children![2].text).toBe(
      "Q&A bottom-sheet: mobile-first soru/cevap görüntüleme",
    );

    const standalone = entries[0].items[1];
    expect(standalone.text).toBe("feat(other): standalone item");
    expect(standalone.children).toBeUndefined();
  });
});

describe("deduplicateItems", () => {
  // Helper — admin source'lu basit bir entry oluştur
  function adminEntry(version: string, date: string, texts: string[]): ChangelogEntry {
    return {
      source: "admin",
      sourceLabel: "Yönetim Paneli",
      version,
      date,
      environment: "BETA",
      items: texts.map((text, i) => ({ id: `${version}-${i}`, type: "added", text })),
    };
  }

  it("aynı item iki release'de varsa kronolojik olarak önceki'nde tutar (workflow PREV bug senaryosu)", () => {
    // Gerçek hata: feat(seller) commit'i hem .10 hem .12 release'inde aynı şekilde yazılmış
    const entries: ChangelogEntry[] = [
      adminEntry("v1.1.8-beta.12", "2026-05-14", [
        "feat(seller): kategori navigasyon temizliği (@boraydeger32)",
      ]),
      adminEntry("v1.1.8-beta.10", "2026-05-13", [
        "feat(seller): kategori navigasyon temizliği (@boraydeger32)",
      ]),
    ];
    const result = deduplicateItems(entries);
    // .10 (önceki tarih) item'ı tutmalı, .12'den drop etmeli, .12 boş kaldığı için drop
    expect(result).toHaveLength(1);
    expect(result[0].version).toBe("v1.1.8-beta.10");
    expect(result[0].items).toHaveLength(1);
  });

  it("yeni item'lar olan release'leri korur", () => {
    const entries: ChangelogEntry[] = [
      adminEntry("v1.1.8-beta.10", "2026-05-13", ["feat(a): X"]),
      adminEntry("v1.1.8-beta.12", "2026-05-14", [
        "feat(a): X", // duplicate, drop
        "feat(b): Y", // unique, keep
      ]),
    ];
    const result = deduplicateItems(entries);
    expect(result).toHaveLength(2);
    const v12 = result.find((e) => e.version === "v1.1.8-beta.12")!;
    expect(v12.items).toHaveLength(1);
    expect(v12.items[0].text).toContain("feat(b)");
  });

  it("farklı source'larda aynı text duplicate sayılmaz", () => {
    const adminE = adminEntry("v1.0.0", "2026-05-13", ["feat(x): same text"]);
    const frontendE: ChangelogEntry = {
      ...adminEntry("v1.0.0", "2026-05-13", ["feat(x): same text"]),
      source: "frontend",
      sourceLabel: "Müşteri Sitesi",
    };
    const result = deduplicateItems([adminE, frontendE]);
    expect(result).toHaveLength(2); // ikisi de korunur
  });

  it("(@author) suffix'ini normalize eder", () => {
    const entries: ChangelogEntry[] = [
      adminEntry("v1.1.0", "2026-05-13", ["feat(x): aynı şey"]),
      adminEntry("v1.1.1", "2026-05-14", ["feat(x): aynı şey (@boraydeger32)"]),
    ];
    const result = deduplicateItems(entries);
    expect(result).toHaveLength(1); // duplicate sayılır, .1.1 drop
    expect(result[0].version).toBe("v1.1.0");
  });
});
